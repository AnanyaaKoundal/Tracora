// middlewares/auth.middleware.ts
import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import User from "../models/employee.model";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// ✅ Step 1: Authenticate user
export const authenticate: RequestHandler = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Unauthorized: No token provided" });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id).populate("role");

    if (!user) {
      res.status(401).json({ message: "Unauthorized: Invalid token" });
      return;
    }

    (req as any).user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
};

// ✅ Step 2: Authorize by role
export const authorizeRole = (allowedRoles: string[]): RequestHandler => {
  return (req, res, next) => {
    const user = (req as any).user;

    if (!user || !allowedRoles.includes(user.role.name)) {
      res.status(403).json({ message: "Forbidden: Insufficient role" });
      return;
    }

    next();
  };
};
