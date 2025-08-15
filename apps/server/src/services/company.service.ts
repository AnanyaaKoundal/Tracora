import Company from "../models/company.model";
import Role from "../models/role.model";
import { generateCompanyId } from "./id.service";

import bcrypt from "bcrypt";

export const createCompany = async(data: any) => {
    const { company_name, company_email, company_phone, password} = data;
    const company_id = generateCompanyId();
    const hashedPassword = await bcrypt.hash(password, 10);

    const roleId = Role.findOne({ role_name: "admin" });

    const company = Company.create({
        company_id,
        company_name,
        company_email,
        company_phone, 
        password: hashedPassword,
        roleId
    })
    return company;
 }