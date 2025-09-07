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

export const loginService = async (company_id:string, employee_email: string, mobile: string) => {
  const emp = await User.findOne({ company_id, employee_email });
  if (!emp) {
    throw new Error("Invalid credentials");
  }
  return emp.employee_id;
};

export const verifyLoginOtp = async(otp: string) => {
  return otp === "123456";
}