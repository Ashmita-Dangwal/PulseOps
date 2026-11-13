import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";
const registerSchema=z.object({name:z.string().trim().min(2).max(80),email:z.string().trim().email().max(254),password:z.string().min(8).max(128)});
const loginSchema=z.object({email:z.string().trim().email(),password:z.string().min(1).max(128)});
const tokenFor=(user)=>jwt.sign({sub:user._id.toString()},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||"7d"});
const publicUser=(u)=>({id:u._id,name:u.name,email:u.email});
export const register=async(req,res,next)=>{try{
 if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32)return res.status(500).json({success:false,message:"Configure a JWT_SECRET of at least 32 characters"});
 const parsed=registerSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({success:false,message:"Invalid registration details",errors:parsed.error.issues});
 const email=parsed.data.email.toLowerCase();if(await User.exists({email}))return res.status(409).json({success:false,message:"An account with this email already exists"});
 const user=await User.create({name:parsed.data.name,email,passwordHash:await bcrypt.hash(parsed.data.password,12)});
 return res.status(201).json({success:true,data:{user:publicUser(user),token:tokenFor(user)}});
}catch(e){if(e.code===11000)return res.status(409).json({success:false,message:"An account with this email already exists"});next(e)}};
export const login=async(req,res,next)=>{try{
 if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32)return res.status(500).json({success:false,message:"Configure a JWT_SECRET of at least 32 characters"});
 const parsed=loginSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({success:false,message:"Enter a valid email and password"});
 const user=await User.findOne({email:parsed.data.email.toLowerCase()}).select("+passwordHash");
 if(!user||!(await bcrypt.compare(parsed.data.password,user.passwordHash)))return res.status(401).json({success:false,message:"Email or password is incorrect"});
 return res.json({success:true,data:{user:publicUser(user),token:tokenFor(user)}});
}catch(e){next(e)}};
export const me=async(req,res)=>res.json({success:true,data:{user:{id:req.user.id,name:req.user.name,email:req.user.email}}});
