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
    
    const name = await Company.findOne({ company_name });
    if (name) {
        return { exists: true, reason: "Company name already exists" };
    }

    const email = await Company.findOne({ company_email });
    if (email) {
        return { exists: true, reason: "Company email already exists" };
    }

    const phone = await Company.findOne({ company_phone });
    if (phone) {
        return { exists: true, reason: "Company phone already exists" };
    }

    return {
        exists: false,
        message: "Company does not exist",
    };
 }

 export const getAllCompaniesIdAndName = async () => {
   try {
     // Fetch only company_id and company_name fields
     const companies = await Company.find({}, { company_id: 1, company_name: 1, _id: 0 });
     return companies; // e.g. [{ company_id: "C001", company_name: "Company A" }, ...]
   } catch (error) {
     throw new Error("Error fetching companies: " + (error as Error).message);
   }
 };
 