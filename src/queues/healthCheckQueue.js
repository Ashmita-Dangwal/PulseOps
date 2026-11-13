import { Queue } from "bullmq";
import redisConnection from "../config/redis.js";

const healthCheckQueue = new Queue("health-checks", {
  connection: redisConnection
});

export default healthCheckQueue;