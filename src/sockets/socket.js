import { Server } from "socket.io";
import jwt from "jsonwebtoken";
let io;
export const initializeSocket=(httpServer)=>{
 io=new Server(httpServer,{cors:{origin:(process.env.CORS_ORIGIN||"http://localhost:5173").split(",").map(x=>x.trim()),methods:["GET","POST"],credentials:true}});
 io.use((socket,next)=>{try{const token=socket.handshake.auth?.token;if(!token) return next(new Error("Authentication required"));const payload=jwt.verify(token,process.env.JWT_SECRET);socket.data.userId=payload.sub;next()}catch{return next(new Error("Invalid or expired token"))}});
 io.on("connection",socket=>{socket.join(`user:${socket.data.userId}`)});
 return io;
};
export const emitToUser=(userId,event,payload)=>{if(io&&userId)io.to(`user:${userId}`).emit(event,payload)};
export const getIO=()=>io;
