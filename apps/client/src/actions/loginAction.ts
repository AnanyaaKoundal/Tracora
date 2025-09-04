import { loginSchema } from "@/schemas/login.schema";
import { fetchCompaniesService, loginUser, verifyLoginOtpService } from "@/services/authService"
import { z } from "zod";


export const verifyUser = async (values : z.infer<typeof loginSchema>) => {
    
  const responseData = await loginUser(values);
  console.log("Response", responseData)

  if (responseData?.success === false) {
    return { error: true};
  }
  console.log("Front: ", { success: responseData.success, employee_id: responseData.employee_id});
  if (responseData?.success === true) {
    return { success: responseData.success, employee_id: responseData.data};
  }
};

export const verifyOtp = async (values : z.infer<typeof loginSchema>) => {
  
  console.log("In API regsiter1", values)
    
  const responseData = await verifyLoginOtpService(values);
  console.log("Response",responseData)
  if (responseData?.success === false) {
    console.log("In API regsiter3", responseData.data)
    return { error: responseData.data };
  }

  if (responseData?.success === true) {
    return { success: responseData.message, role: responseData.role_name};
  }
};

export const fetchCompanies = async () => {
  try {
    const responseData = await fetchCompaniesService();
    if (responseData?.success) {
      return responseData.data; // [{ company_id, company_name }]
    }
    return [];
  } catch (error) {
    console.error("Error fetching companies:", error);
    return [];
  }
};
