import z from "zod";
import { companySchema } from "@/schemas/admin.schema";
import { getCompanyDetails } from "@/services/adminService";

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
  