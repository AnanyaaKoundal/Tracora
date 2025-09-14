import z from "zod";
import { companySchema } from "@/schemas/admin.schema";
import { editCompanyPhoneService, getCompanyDetails } from "@/services/adminService";

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
  

export const editCompanyPhone = async (phone: string)=> {
  const res = await editCompanyPhoneService(phone);
  if (res.status === 403) {
    return { error: "Forbidden", status: 403, success: false };
  }

  if (!res.success) {
    return { error: res.error ?? "Failed to edit company phone", success: false };
  }

  return { success: true, company: res.company };
}