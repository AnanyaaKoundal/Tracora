import { RequestHandler } from "express";
import { timingSafeEqual } from "crypto";

// Shared secret for service-to-service calls. These data endpoints exist for the AI
// service, not browsers. The user's own JWT (verified by `authenticate` next) still
// decides what that user may read, so the key proves the *caller* while the token
// proves the *user*. A missing env var falls back to a dev value, matching the
// existing JWT_SECRET precedent, so local runs need no extra setup.
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "dev-internal-key";

const safeEqual = (a: string, b: string): boolean => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
};

export const requireInternalKey: RequestHandler = (req, res, next) => {
  const provided = req.headers["x-internal-key"];
  if (typeof provided !== "string" || !safeEqual(provided, INTERNAL_API_KEY)) {
    res.status(401).json({ message: "Unauthorized: internal caller only" });
    return;
  }
  next();
};
