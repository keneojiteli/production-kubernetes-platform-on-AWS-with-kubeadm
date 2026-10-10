require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Question = require("./Question");

const app = express();
const port = Number(process.env.PORT || 3000);

const { register, httpRequestCounter, httpRequestDuration, databaseErrorCounter } = require("./metrics");
const { logger, safeError } = require("./logger");


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
  logger.info(
    { event: "mongodb_connected" },
    "MongoDB connection established"
  );
});

mongoose.connection.on("disconnected", () => {
  logger.warn(
    { event: "mongodb_disconnected" },
    "MongoDB connection lost"
  );
});

mongoose.connection.on("error", (error) => {
  logger.error(
    {
      event: "mongodb_connection_error",
      error: safeError(error),
    },
    "MongoDB connection error"
  );

  databaseErrorCounter.inc({
    operation: "connection",
  });
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
  databaseErrorCounter.inc({
    operation: "find_questions",
  });
  logger.error(
    {
      event: "database_query_error",
      operation: "find_questions",
      error: safeError(error),
    },
    "Failed to retrieve quiz questions"
  );
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
  logger.error(
    {
      event: "request_processing_error",
      method: req.method,
      // path: req.originalUrl, //urls may contain query oarams with sensitive info
      route: req.route?.path || "unmatched",
      error: safeError(error),
    },
    "Request processing failed"
  );

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
    logger.info(
      {
        event: "application_started",
        port,
      },
      "Quiz API started"
    );
});
  } catch (error) {
    logger.fatal(
      {
        event: "application_startup_failed",
        error: safeError(error),
      },
      "Application startup failed"
    );
    process.exit(1);
  }
}

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info(
    {
      event: "application_shutdown_started",
      signal,
    },
    "Graceful shutdown started"
  );

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

    logger.info(
      {
        event: "application_shutdown_completed",
      },
      "HTTP server and MongoDB connection closed"
    );
    process.exit(0);
  } catch (error) {
    logger.error(
      {
        event: "application_shutdown_failed",
        error: safeError(error),
      },
      "Graceful shutdown failed"
    );
    process.exit(1);
  }
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));

startApplication();