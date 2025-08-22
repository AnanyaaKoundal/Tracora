import { Request, Response } from "express";
import { companyExists, createCompany } from "../../services/company.service";
import { sendOtp } from "../../services/otp.service";

export const registerCompanyController = async( req: Request, res:Response): Promise<any>  => {
    try{
        const { company_name, company_email, company_phone, password } = req.body;
        console.log(company_name, company_email, company_phone, password);
        if(!company_name || !company_email || !company_phone || !password){
            console.log("Error");
            return res.status(400).json({
                success: false,
                message: "All fields are requied"
            })
        }
        const company = await createCompany({ company_name, company_email, company_phone, password});
        if(!company){
            return res.status(400).json({
                success: false,
                message: "Error while creating the company",
            })
        }
        return res.status(200).json({
            success: true,
            message: "Company created successfully",
            company
        })
    }catch(error: any){
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }
}

export const checkCompnayExists = async( req: Request, res:Response): Promise<any>  => {
    try{
        const { company_name, company_email, company_phone, password } = req.body;
        const result = await companyExists({ company_name, company_email, company_phone, password});
        if(result.exists === false){
            const otp = sendOtp(company_email, company_phone);
            return res.status(200).json({
                success: true,
                message: "OTP sent successfully",
            })
        }
    }catch(error: any){
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }
} 