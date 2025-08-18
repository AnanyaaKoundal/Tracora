import { z } from "zod";

export const registerCompanySchema = z.object({
    company_name: z.string().nonempty("Company name is required"),
    company_email: z.email("Invalid email"),
    company_phone: z.string().nonempty("Mobile required"),
    password: z.string().min(6, "Password must be atleast 6 characters"),
    confirm_password: z.string().min(6, "Confirm password must be atleast 6 characters"),
    otp: z.string().length(6, "OTP must be 6 digits"),
}).refine(
    (data) => {
      return data.password === data.confirm_password;
    },
    {
      message: "passwords do not match",
      path: ["confirmpassword"],
    }
  );
  