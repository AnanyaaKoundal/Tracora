import { registerCompanySchema } from "@/schemas/register.schema";
import { registerCompanyService, verifyOtpAndCreateCompanyService } from "@/services/adminService";
import { loginUser } from "@/services/authService"
import { z } from "zod";


export const registerCompany = async (values : z.infer<typeof registerCompanySchema>) => {
  
  // const validatedFields = registerCompanySchema.safeParse(values);
  //       if (!validatedFields.success) {
  //         console.log(validatedFields.error.format());
  //           return { error: "Invalid form data" };
  //       }

  // console.log("In API regsiter1", values)
    
  const responseData = await registerCompanyService(values);
  // console.log("Response", responseData)
  if (responseData?.success === false) {
    // console.log("In API regsiter3", responseData.success)
    return { error: true, message: responseData.message };
  }

  if (responseData?.success === true) {
    return { success: true, message: responseData.message, otp: responseData.otp};
  }
};

export const verifyCompanyOtp = async (values : z.infer<typeof registerCompanySchema>) => {
  
  console.log("In API regsiter1", values)
    
  const responseData = await verifyOtpAndCreateCompanyService(values);
  console.log("Response",responseData)
  if (responseData?.success === false) {
    // console.log("In API regsiter3", responseData.success)
    return { error: true, message: responseData.message };
  }

  if (responseData?.success === true) {
    return { success: true, message: responseData.message, otp: responseData.otp};
  }
};