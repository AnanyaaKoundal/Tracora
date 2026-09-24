import z from "zod";
import { companySchema } from "@/schemas/admin.schema";
import { editCompanyEmailService, editCompanyPasswordService, editCompanyPhoneService, getCompanyDetails } from "@/services/adminService";

export const getCompany = async () => {
    const res = await getCompanyDetails();
  
    if (res.status === 403) {
      return { error: "Forbidden", status: 403, success: false };
    }
  
    if (!res.success) {
      return { error: res.error ?? "Failed to fetch company", success: false };
    }
  
    return { success: true, company: res.company };
  };
  

export const editCompanyEmail = async (data: any)=> {
  const res = await editCompanyEmailService(data);
  if (res.status === 403) {
    return { error: "Forbidden", status: 403, success: false };
  }

  if (!res.success) {
    return { error: res.error ?? "Failed to edit company phone", success: false };
  }

  return { success: true, company: res.company };
}

export const editCompanyPhone = async (data: any)=> {
  const res = await editCompanyPhoneService(data);
  if (res.status === 403) {
    return { error: "Forbidden", status: 403, success: false };
  }
  console.log(res);
  if (!res.success) {
    return { error: res.data ?? "Failed to edit company phone", success: false };
  }

  return { success: true, company: res.company };
}

export const editCompanyPassword = async (data: any)=> {
  const res = await editCompanyPasswordService(data);
  if (res.status === 403) {
    return { error: "Forbidden", status: 403, success: false };
  }

  if (!res.success) {
    return { error: res.data ?? "Failed to edit password", success: false };
  }

  return { success: true, company: res.company };
}