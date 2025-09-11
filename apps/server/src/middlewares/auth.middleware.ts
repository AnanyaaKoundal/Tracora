import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import Employee from "../models/employee.model";
import Role from "@/models/role.model";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const authenticate: RequestHandler = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token || req.headers["authorization"]?.split(" ")[1];
      
      if (!token) {
        res.status(401).json({ message: "Unauthorized: No token provided" });
        return;
      }
      
      const decoded = jwt.verify(token, JWT_SECRET) as {
        employee_id: string;
        company_id: string;
        role: string;
      };
      
      const user = await Employee.findOne({ employee_id: decoded.employee_id });
      if (!user) {
        res.status(401).json({ message: "Unauthorized: Invalid token" });
        return;
      }
      
      let roleDoc = null;
      if (user.roleId?.length > 0) {
        roleDoc = await Role.findOne({ role_id: user.roleId[0] });
      }
      console.log("Tokennn: ", roleDoc);

    (req as any).user = {
      ...user.toObject(),
      role: roleDoc ? roleDoc.role_name : decoded.role, // fallback to token
    };

    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
};

export const authorizeRole = (allowedRoles: string[]): RequestHandler => {
  return (req, res, next) => {
    const user = (req as any).user;
    // console.log("Auth: ", user);
    // console.log("Checking role:", user.role, "Allowed:", allowedRoles);

    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({ message: "Forbidden: Insufficient role" });
      return;
    }

    next();
  };
};
