// import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/employee.model";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"; // keep in .env
const JWT_EXPIRY = "1d"; // adjust as needed

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};

export const loginService = async (company:string, email: string, mobile: string) => {
  const user = await User.findOne({ company, email });
  if (!user) {
    throw new Error("Invalid credentials");
  }
  return "902378";
};
