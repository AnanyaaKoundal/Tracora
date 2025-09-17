import Company from "../models/company.model";
import Role from "../models/role.model";
import { generateCompanyId } from "./id.service";

import bcrypt from "bcrypt";

export const createCompany = async (data: any) => {
  const { company_name, company_email, company_phone, password } = data;
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

export const companyExists = async (data: any) => {
  const { company_name, company_email, company_phone, password } = data;

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


export const getCompanyById = async (company_id: string) => {
  try {
    const company = await Company.findOne({ company_id: company_id });
    if (!company) {
      throw new Error("Company not found");
    }
    return company;
  } catch (error) {
    throw new Error("Error fetching company: " + (error as Error).message);
  }
}

export const editCompanyPhoneService = async(company_id: string, newPhone: string) => {
  try {
    const company = await Company.findOneAndUpdate({
      company_id},
      { company_phone: newPhone
    });
    if(!company){
      throw new Error("Company not found");
    }
    return company;
  }catch(err){
    throw new Error("Error updating company phone: "+(err as Error).message);
  }
}

export const editCompanyEmailService = async(company_id: string, newEmail: string) => {
  try {
    const company = await Company.findOneAndUpdate({
      company_id},
      { company_email: newEmail
    });
    if(!company){
      throw new Error("Company not found");
    }
    return company;
  }catch(err){
    throw new Error("Error updating company email: "+(err as Error).message);
  }
}

export const editCompanyPasswordService = async(company_id: string, newPassword: string) => {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedCompany = await Company.findOneAndUpdate(
      {company_id: company_id},
      { password: hashedPassword },
    );

    return updatedCompany;
  } catch (err) {
    console.error("Error updating company password:", err);
    return null;
  }
}

export async function validateCompanyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (err) {
    console.error("Error validating password:", err);
    return false;
  }
}
