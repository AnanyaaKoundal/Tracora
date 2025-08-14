import { z } from "zod";

export const loginSchema = z.object({
    company: z.string().nonempty("Company is required"),
    email: z.email("Invalid email"),
    mobile: z.string().nonempty("Mobile required"),
    otp: z.string().length(6, "OTP must be 6 digits"),
});
  