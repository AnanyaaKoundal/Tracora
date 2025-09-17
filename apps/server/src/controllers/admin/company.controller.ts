import { Request, Response } from "express";
import { companyExists, createCompany, editCompanyEmailService, editCompanyPasswordService, editCompanyPhoneService, getCompanyById, validateCompanyPassword } from "@services/company.service";
import { createAdminEmployee } from "@services/employee.service";
import { sendOtp, verifyOtp } from "@services/otp.service";
import {generateToken} from "@services/auth.service";
import Company from "@/models/company.model";
import ApiError from "@/utils/ApiError";
import asyncHandler from "@/utils/asyncHandler";

export const registerCompanyController = async (req: Request, res: Response): Promise<any> => {
    try {
        const { company_name, company_email, company_phone, password } = req.body;

        if (!company_name || !company_email || !company_phone || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }
        const check = await companyExists({ company_name, company_email, company_phone });
        if (check.exists) {
            return res.status(400).json({
                success: false,
                message: check.reason, 
            });
        }
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
        employee_name : "Admin",
        employee_email : company_email,
        employee_contact_number : company_phone
      })

      if(!adminEmployee){
        Company.deleteOne({company_id: company.company_id});
        return res.status(400).json(new ApiError(400, "Error while creating admin employee"));
      }

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

export const getCompanyController = asyncHandler(async (req: Request, res: Response) => {
  const id = (req as any).user.company_id;
  const company = await getCompanyById(id);
  res.status(200).json({
      success: true,
      message: "Company fetched successfully",
      company: company,
  });
});

export const editCompanyPhone = asyncHandler(async(req: Request, res: Response): Promise<any> => {
  const id = (req as any).user.company_id;
  const { phone, otp } =req.body;
  const validate = await verifyOtp({otp: otp});
  if(!validate){
    return res.json(new ApiError(401, "Invalid OTP"));
  }
  const company = await editCompanyPhoneService(id, phone);
  res.status(200).json({
      success: true,
      message: "Company phone number updated successfully",
      company: company,
  });
})

export const editCompanyEmail = asyncHandler(async(req: Request, res: Response): Promise<any> => {
  const id = (req as any).user.company_id;
  const { email, otp } =req.body;
  const validate = await verifyOtp({otp: otp});
  console.log(req.body);
  if(!validate){
    return res.json(new ApiError(401, "Invalid OTP"));
  }
  const company = await editCompanyEmailService(id, email);
  res.status(200).json({
      success: true,
      message: "Company phone number updated successfully",
      company: company,
  });
})

export const editCompanyPassowrd = asyncHandler(async(req: Request, res: Response): Promise<any> => {
  const id = (req as any).user.company_id;
  const { currentPassword, newPassword } =req.body;
  const company = await getCompanyById(id);
  const validate = await validateCompanyPassword( currentPassword,  company.password);
  console.log("Validate: ", validate);
  if(!validate){
    return res.json(new ApiError(401, "Invalid current password"));
  }
  const updatedcompany = await editCompanyPasswordService(id, newPassword);
  if(!updatedcompany){
    return res.json(new ApiError(500, "Error updating company password"))
  }
  res.status(200).json({
      success: true,
      message: "Company password updated successfully",
      company: updatedcompany,
  });
})