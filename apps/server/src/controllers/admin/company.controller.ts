import { Request, Response } from "express";
import { createCompany } from "../../services/company.service";

export const registerCompanyController = async( req: Request, res:Response): Promise<any>  => {
    try{
        const { company_name, company_email, company_phone, password } = req.body;
        if(!company_name || !company_email || !company_phone || !password){
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