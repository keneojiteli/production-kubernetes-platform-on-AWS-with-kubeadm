// prom-client can collect Node.js runtime metrics such as memory, garbage collection, event-loop lag, active handles and process information through collectDefaultMetrics()
const client = require("prom-client");

// Use the default Prometheus registry.
const register = client.register;

// Collect default Node.js process/runtime metrics.
client.collectDefaultMetrics({
  prefix: "quiz_backend_",
});

// Count HTTP requests by method, route, and status code.
const httpRequestCounter = new client.Counter({
  name: "quiz_backend_http_requests_total",
  help: "Total number of HTTP requests received by the backend",
  labelNames: ["method", "route", "status_code"],
});

// Measure HTTP request duration.
const httpRequestDuration = new client.Histogram({
  name: "quiz_backend_http_request_duration_seconds",
  help: "Backend HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

// Count failed MongoDB operations or connection errors.
const databaseErrorCounter = new client.Counter({
  name: "quiz_backend_database_errors_total",
  help: "Total number of backend database errors",
  labelNames: ["operation"],
});

module.exports = {
  register,
  httpRequestCounter,
  httpRequestDuration,
  databaseErrorCounter,
};