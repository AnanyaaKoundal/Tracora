// import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/employee.model";

export const loginService = async (company:string, email: string, mobile: string) => {
  const user = await User.findOne({ company, email });
  if (!user) {
    throw new Error("Invalid credentials");
  }
  return "902378";
};
