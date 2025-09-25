import { Request, Response } from "express";
import { generateToken, loginService, verifyLoginOtp } from "../../services/auth.service";
import { getAllCompaniesIdAndName } from "@/services/company.service";
import asyncHandler from "@/utils/asyncHandler";
import ApiError from "@/utils/ApiError";
import ApiResponse from "@/utils/ApiResponse";
import { getRoleName } from "@/services/employee.service";
import Company from "@/models/company.model";

export const loginController = async (req: Request, res: Response): Promise<any> => {
  try {
    const { company_id, email, mobile } = req.body;
    if (!company_id || !email || !mobile) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const employee_id = await loginService(company_id, email, mobile);
    if (!employee_id) {
      return res.status(400).json({ success: false, message: "Invalid Credentials" });
    }
    res.status(200).json(new ApiResponse(200, "OTP sent successfully", employee_id));
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllCompaniesController = asyncHandler(
  async (req: Request, res: Response) => {
    const companies = await getAllCompaniesIdAndName();
    res.status(200).json({
      success: true,
      data: companies,
    });
  }
);

export const verifyLoginOtpController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { company_id, employee_id, otp } = req.body;
  if (!otp) {
    return res.status(400).json(new ApiError(400, "OTP is required"));
  }
  const isValid = await verifyLoginOtp(otp);
  if (!isValid) {
    return res.status(400).json(new ApiError(400, "Invalid OTP"));
  }

  const role = await getRoleName(employee_id);
  const token = generateToken({
    company_id: company_id,
    employee_id: employee_id,
    role: role.role_name,
  });
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    employee_id,
    company_id,
    role_name: role,
  })
})

export const logout = asyncHandler(async (req: Request, res: Response): Promise<any> => {

  // Clear cookie(s) – adjust names to match how you set them
  res.clearCookie("token", { httpOnly: true, sameSite: "strict" });
  res.clearCookie("refreshToken", { httpOnly: true, sameSite: "strict" });

  return res
    .status(200)
    .json(new ApiResponse(200, "Logged out successfully", {}));
});


export const getCurrentUserRole = async (req: Request, res: Response):Promise<any> => {
  try {

    return res.status(200).json(new ApiResponse(200, "Role fetched", { role: (req as any).user.role }));
  } catch (error) {
    console.error("Error fetching user role:", error);
    return res.status(500).json({ error: "Failed to fetch role" });
  }
};