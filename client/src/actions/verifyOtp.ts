import { loginSchema } from "@/schemas/login.schema";
import { loginUser } from "@/services/authService"
import { z } from "zod";


export const verifyOtp = async (values : z.infer<typeof loginSchema>) => {
  const validatedFields = loginSchema.safeParse(values);
  
  console.log("In API regsiter1", values)
  
  if (!validatedFields.success) {
    console.log("In API regsiter2", validatedFields.error)
    return { error: "Invalid fields" };
  }
    
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