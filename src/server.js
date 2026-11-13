
import "dotenv/config";
import app from "./app.js";
import redisConnection from "./config/redis.js";
import healthCheckWorker from "./workers/healthCheckWorker.js";

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {
    await redisConnection.ping();
    console.log("Redis connection verified");

    server = app.listen(PORT, () => {
      console.log(`PulseOps server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

const shutdown = async () => {
  console.log("Shutting down PulseOps server...");

  if (server) {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  }

  await healthCheckWorker.close();
  await redisConnection.quit();

  console.log("PulseOps server shut down successfully");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();
