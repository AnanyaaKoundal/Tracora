let URL = "http://localhost:5000";

import { registerCompanySchema } from "@/schemas/register.schema";
import z from "zod";
  
export const registerCompanyService = async (values: z.Infer<typeof registerCompanySchema>) => {
  const response = await fetch(`${URL}/auth/registerCompany`, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-Type": "application/json",
    },

    body: JSON.stringify(values),
  });

  const res = await response.json();
  return res;
};

