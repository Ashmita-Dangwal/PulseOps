import jwt from "jsonwebtoken";
import User from "../models/User.js";
export const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success:false, message:"Authentication required" });
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) return res.status(500).json({success:false,message:"JWT_SECRET must be configured with at least 32 characters"});
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("_id name email");
    if (!user) return res.status(401).json({success:false,message:"Account no longer exists"});
    req.user = { id:user._id.toString(), _id:user._id, name:user.name, email:user.email };
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") return res.status(401).json({success:false,message:"Invalid or expired token"});
    next(error);
  }
};
export default requireAuth;
