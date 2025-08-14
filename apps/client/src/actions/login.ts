import { loginSchema } from "@/schemas/login.schema";
import { loginUser } from "@/services/authService"
import { z } from "zod";


export const verifyUser = async (values : z.infer<typeof loginSchema>) => {
  
  console.log("In API regsiter1", values)
    
  const responseData = await loginUser(values);
  console.log("Response", responseData)
  if (responseData?.success === false) {
    console.log("In API regsiter3", responseData.success)
    return { error: true};
  }

  if (responseData?.success === true) {
    return { success: responseData.message, otp: responseData.otp};
  }
};

export const verifyOtp = async (values : z.infer<typeof loginSchema>) => {
  
  console.log("In API regsiter1", values)
    
  const responseData = await loginUser(values);
  console.log("Response",responseData)
  if (responseData?.success === false) {
    console.log("In API regsiter3", responseData.data)
    return { error: responseData.data };
  }

  if (responseData?.success === true) {
    return { success: responseData.message, otp: responseData.otp};
  }
};