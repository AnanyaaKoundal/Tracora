import { Request, Response } from "express";
import { companyExists, createCompany } from "@services/company.service";
import { createAdminEmployee } from "@services/employee.service";
import { sendOtp } from "@services/otp.service";
import {generateToken} from "@services/auth.service";

export const registerCompanyController = async (req: Request, res: Response): Promise<any> => {
    try {
        const { company_name, company_email, company_phone, password } = req.body;

        if (!company_name || !company_email || !company_phone || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // ✅ Step 1: check duplicates
        const check = await companyExists({ company_name, company_email, company_phone });
        if (check.exists) {
            return res.status(400).json({
                success: false,
                message: check.reason,
            });
        }
        // ✅ Step 3: send OTP to email
        await sendOtp(company_email, company_phone);

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully. Please verify to complete registration.",
        });

    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "Something went wrong",
        });
    }
};



export const verifyOtpAndRegisterCompanyController = async (req: Request, res: Response): Promise<any> => {
    try {
      const { company_name, company_email, company_phone, password, otp } = req.body;
  
      if (!otp) {
        return res.status(400).json({
          success: false,
          message: "OTP is required",
        });
      }
  
    //   const savedOtp = otpStore[c1ompany_email];
    //   if (!savedOtp) {
    //     return res.status(400).json({
    //       success: false,
    //       message: "No OTP request found for this email",
    //     });
    //   }
  
      // for now: allow fixed dummy OTP or savedOtp
    //   if (otp !== savedOtp && otp !== "123456") {
        if (otp !== "123456") {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });
      }
  
      // 2. Create company
      const company = await createCompany({ company_name, company_email, company_phone, password });
      if (!company) {
        return res.status(400).json({ success: false, message: "Error while creating company" });
      }

      // 3. Create admin employee corresponding to company
      const adminEmployee = await createAdminEmployee({
        company_id : company.company_id,
        user_name : "Admin",
        email : company_email,
        contact_number : company_phone
      })

      // 4. Create JWT
    const token = generateToken({
      company_id: company.company_id,
      employee_id: adminEmployee.employee_id,
      role: "admin"
    });

    // 5. Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
  
      return res.status(200).json({
        success: true,
        message: "Company created successfully",
        company_id: company.company_id,
        employee_id: adminEmployee.employee_id,
        role: "admin"
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };