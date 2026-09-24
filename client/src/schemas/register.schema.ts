import { z } from "zod";

export const registerCompanySchema = z.object({
  company_name: z.string()
  .min(3, "Company name must be at least 3 characters")
  .regex(/^(?=.*[a-zA-Z])[a-zA-Z0-9\s]*$/, "Company name must contain letters and can include numbers and spaces"),
    company_email: z.email("Invalid email").nonempty("Email is required"),
    company_phone: z.string().length(10).nonempty("Mobile required"),
    password: z.string().min(6, "Password must be atleast 6 characters").nonempty("Password is required"),
    confirm_password: z.string().min(6, "Confirm password must be atleast 6 characters"),
    otp: z.string().length(6, "OTP must be 6 digits").or(z.literal("")).optional(),
}).refine(
    (data) => {
      return data.password === data.confirm_password;
    },
    {
      message: "Passwords do not match",
      path: ["confirm_password"],
    }
  );
  