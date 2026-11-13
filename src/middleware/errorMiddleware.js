
import logger from "../utils/logger.js";

const errorMiddleware = (err, req, res, next) => {
  // If the response has already started, let Express handle the error.
  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    Number.isInteger(err.statusCode) &&
    err.statusCode >= 400 &&
    err.statusCode <= 599
      ? err.statusCode
      : 500;

  // Log error details for debugging.
  logger.error("Application error", {
    message: err.message,
    stack: err.stack,
    statusCode,
    method: req.method,
    path: req.originalUrl
  });

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal server error"
        : err.message
  });
};

export default errorMiddleware;
