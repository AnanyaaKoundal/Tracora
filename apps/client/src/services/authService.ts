let URL = "http://localhost:5000";

import { loginSchema } from "@/schemas/login.schema";
import z from "zod";
  
export const loginUser = async (values: z.Infer<typeof loginSchema>) => {
  const response = await fetch(`${URL}/auth/login`, {
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

  