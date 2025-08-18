import { registerCompanySchema } from "@/schemas/register.schema";
import { registerCompanyService } from "@/services/adminService";
import { loginUser } from "@/services/authService"
import { z } from "zod";


export const registerCompany = async (values : z.infer<typeof registerCompanySchema>) => {
  
  console.log("In API regsiter1", values)
    
  const responseData = await registerCompanyService(values);
  console.log("Response", responseData)
  if (responseData?.success === false) {
    console.log("In API regsiter3", responseData.success)
    return { error: true};
  }

  if (responseData?.success === true) {
    return { success: responseData.message, otp: responseData.otp};
  }
};

export const verifyOtp = async (values : z.infer<typeof registerCompanySchema>) => {
  
  console.log("In API regsiter1", values)
    
//   const responseData = await loginUser(values);
//   console.log("Response",responseData)
//   if (responseData?.success === false) {
//     console.log("In API regsiter3", responseData.data)
//     return { error: responseData.data };
//   }

//   if (responseData?.success === true) {
//     return { success: responseData.message, otp: responseData.otp};
//   }
};