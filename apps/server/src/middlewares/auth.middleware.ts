import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@/services/auth.service";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token || req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decoded = verifyToken(token);
    (req as any).user = decoded; // attach decoded payload (company_id, emp_id, role, etc.)
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid/Expired token" });
  }
};
