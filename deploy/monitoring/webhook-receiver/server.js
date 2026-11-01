const http = require("node:http");
const pino = require("pino");

const logger = pino({
  level: process.env.LOG_LEVEL || "info"
});

const PORT = Number(process.env.PORT || 8080);

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ status: "ok" }));
  }

  if (req.method !== "POST" || req.url !== "/alerts") {
    res.writeHead(404);
    return res.end("Not Found");
  }

  let body = "";
  let bytes = 0;
  const maxBytes = 1024 * 1024;

  req.on("data", (chunk) => {
    bytes += chunk.length;

    if (bytes > maxBytes) {
      req.destroy();
      return;
    }

    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      const payload = JSON.parse(body);

      if (
        !["firing", "resolved"].includes(payload.status) ||
        !Array.isArray(payload.alerts)
      ) {
        res.writeHead(400);
        return res.end("Invalid Alertmanager payload");
      }

      logger.info({
        event: "alertmanager_notification",
        status: payload.status,
        receiver: payload.receiver,
        groupKey: payload.groupKey,
        alerts: payload.alerts.map((alert) => ({
          status: alert.status,
          labels: alert.labels,
          summary: alert.annotations?.summary
        }))
      }, "Alertmanager webhook received");

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ received: true }));

    } catch (error) {
      logger.error({
        error: error.message
      }, "Invalid webhook payload");

      res.writeHead(400);
      res.end("Invalid JSON");
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  logger.info({ port: PORT }, "Webhook receiver started");
});