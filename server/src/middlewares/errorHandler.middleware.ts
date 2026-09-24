import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import ApiError from "../utils/ApiError";

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
    });
    return; 
  }

  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
  return; 
};

export default errorHandler;
