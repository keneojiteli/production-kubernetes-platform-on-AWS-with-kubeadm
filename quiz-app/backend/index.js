require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Question = require("./Question");

const app = express();
const port = Number(process.env.PORT || 3000);

const { register, httpRequestCounter, httpRequestDuration, databaseErrorCounter } = require("./metrics");

let server;
let isShuttingDown = false;

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

const allowedOrigins = process.env.CORS_ORIGINS
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins?.length ? allowedOrigins : false,
    methods: ["GET"],
  })
);

mongoose.connection.on("connected", () => {
  console.log("MongoDB connection established");
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB connection lost");
});

mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

const excludedMetricPaths = new Set([
    "/metrics",
    "/health",
    "/health/live",
    "/health/ready",
]);

app.use((req, res, next) => {

    if (excludedMetricPaths.has(req.path)) {
        return next();
    }

    const endTimer = httpRequestDuration.startTimer();

    res.on("finish", () => {

        const route =
            req.route?.path ||
            req.baseUrl ||
            req.path ||
            "unknown";

        const labels = {
            method: req.method,
            route,
            status_code: String(res.statusCode),
        };

        httpRequestCounter.inc(labels);
        endTimer(labels);

    });

    next();
});

app.get("/health/live", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "quiz-app-backend",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health/ready", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "READY" : "NOT_READY",
    database: databaseConnected ? "CONNECTED" : "DISCONNECTED",
    service: "quiz-app-backend",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "UP" : "DEGRADED",
    database: databaseConnected ? "CONNECTED" : "DISCONNECTED",
    service: "quiz-app-backend",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/questions", async (req, res, next) => {
  try {
    const questions = await Question.find({})
      .lean()
      .maxTimeMS(5_000);

    res.status(200).json(questions);
  } catch (error) {
    next(error);
  }
});

app.get("/metrics", async (req, res) => {
  try {
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).json({
      message: "Unable to collect application metrics",
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, req, res, next) => {
  console.error("Request processing error:", error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    message: "An internal server error occurred",
  });
});


async function startApplication() {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGO_URI environment variable is not configured");
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10_000,
      connectTimeoutMS: 10_000,
    });

    server = app.listen(port, "0.0.0.0", () => {
      console.log(`Quiz API listening on port ${port}`);
    });
  } catch (error) {
    console.error("Application startup failed:", error);
    process.exit(1);
  }
}

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`${signal} received. Shutting down gracefully...`);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    await mongoose.disconnect();

    console.log("HTTP server and MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Graceful shutdown failed:", error);
    process.exit(1);
  }
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));

startApplication();