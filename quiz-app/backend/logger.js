const pino = require("pino");

// allow only error type & simple error , exclude unwanted deets
function safeError(error) {
  return {
    type: error?.name || "UnknownError",
    code:
      typeof error?.code === "string" ||
      typeof error?.code === "number"
        ? error.code
        : undefined,
  };
}

const logger = pino({
  level: process.env.LOG_LEVEL || "info",

  base: {
    service: "quiz-backend",
  },

  // provide additional safeguard 4 specifically named fields that might appear in other structured log objects
  redact: {
    paths: [
      "password",
      "token",
      "secret",
      "authorization",
      "req.headers.authorization",
    ],
    censor: "[REDACTED]",
  },
});

module.exports = { logger, safeError };