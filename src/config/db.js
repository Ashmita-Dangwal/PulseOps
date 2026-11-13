import mongoose from "mongoose";

let connectionPromise;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error("MONGODB_URI is missing. Add your MongoDB Atlas URI to backend/.env");

  connectionPromise = mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    maxPoolSize: 10,
    autoIndex: process.env.NODE_ENV !== "production"
  });

  try {
    await connectionPromise;
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (error) {
    connectionPromise = undefined;
    throw error;
  }
};

export const disconnectDB = async () => {
  connectionPromise = undefined;
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
};

export default connectDB;
