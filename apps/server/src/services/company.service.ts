import Company from "../models/company.model";
import Role from "../models/role.model";
import { generateCompanyId } from "./id.service";

import bcrypt from "bcrypt";

export const createCompany = async(data: any) => {
    const { company_name, company_email, company_phone, password} = data;
    const company_id = generateCompanyId();
    const hashedPassword = await bcrypt.hash(password, 10);

    const roleId = await Role.findOne({ role_name: "admin" });
    if (!roleId) {
      throw new Error("Admin role not found");
    }

    const company = Company.create({
        company_id,
        company_name,
        company_email,
        company_phone, 
        password: hashedPassword,
        roleId: roleId.role_id
    })
    return company;
 }

 export const companyExists = async(data: any) => {
    const { company_name, company_email, company_phone, password} = data;
    
    const name =  Company.findOne({ company_name });
    if(name != null){
        throw new Error("Company name already exists");
    }

    const email = Company.findOne({company_email});
    if(email != null){
        throw new Error("Company email already exists");
    }

    const phone = Company.findOne({company_phone});
    if(phone!= null){
        throw new Error("Company phone already exists");
    }

    return {
        exists: false,
        message: "Company does not exist",
    };
 }