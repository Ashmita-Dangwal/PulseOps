import "dotenv/config";
import {createServer} from "node:http";
import app from "./app.js";
import connectDB,{disconnectDB} from "./config/db.js";
import redisConnection from "./config/redis.js";
import {initializeSocket} from "./sockets/socket.js";
import healthCheckQueue from "./queues/healthCheckQueue.js";
const PORT=process.env.PORT||5000;
let server,worker,stopping=false;
const start=async()=>{try{
 await connectDB();await redisConnection.ping();
 const httpServer=createServer(app);initializeSocket(httpServer);
 ({default:worker}=await import("./workers/healthCheckWorker.js"));
 server=httpServer.listen(PORT,()=>console.log(`PulseOps API and Socket.IO running on port ${PORT}`));
}catch(e){console.error("Startup failed:",e);process.exit(1)}};
const shutdown=async(signal)=>{if(stopping)return;stopping=true;console.log(`Shutdown ${signal}`);try{
 if(server)await new Promise(resolve=>server.close(resolve));
 if(worker)await worker.close();await healthCheckQueue.close();await redisConnection.quit();await disconnectDB();process.exit(0);
}catch(e){console.error(e);process.exit(1)}};
process.on("SIGINT",()=>shutdown("SIGINT"));process.on("SIGTERM",()=>shutdown("SIGTERM"));
start();
