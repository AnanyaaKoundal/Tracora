import { Request, Response } from "express";
import { loginService } from "../../services/auth.service";

export const loginController = async (req: Request, res: Response): Promise<any>  => {
  try {
    console.log(req.body);
    const { company, email, mobile } = req.body;
    if (!company || !email || !mobile) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const otp = await loginService(company, email, mobile);
    if (!otp) {
      return res.status(400).json({ success: false, message: "Invalid Credentials" });
    }
    res.status(200).json({
      "success": "true",
      "otp": otp,
      message: "OTP sent successfully"
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

