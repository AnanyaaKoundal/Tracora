"use client";

import { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { verifyUser, verifyOtp, fetchCompanies } from "@/actions/loginAction";
import { loginSchema } from "@/schemas/login.schema";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [step, setStep] = useState<"company" | "details" | "otp">("company");
  const [formData, setFormData] = useState<Partial<z.infer<typeof loginSchema>>>(
    {}
  );
  const [companies, setCompanies] = useState<{ company_id: string; company_name: string }[]>([]);
  const router = useRouter();

  // React Hook Form with Zod
  const form = useForm<z.infer<typeof loginSchema>>({
    defaultValues: {
      company_id: "",
      // employee_id: "",
      email: "",
      mobile: "",
      otp: "",
    },
  });

  console.log("Errors", form.formState.errors);
console.log("Values", form.getValues());


  // Fetch companies on mount
  useEffect(() => {
    const loadCompanies = async () => {
      const data = await fetchCompanies();
      setCompanies(data);
    };
    loadCompanies();
  }, []);

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    if (step === "company") {
      setFormData(prev => ({ ...prev, ...data }));
      setStep("details");
      return;
    }

    if (step === "details") {
      const payload = { ...formData, ...data };
    
      const result = await verifyUser(payload);
      console.log("Login Result:", result);
      if (!result?.success) {
        console.error("Login failed", result?.error);
        return;
      }
      setFormData(prev => ({
        ...prev,
        ...payload,
        employee_id: result.employee_id,
      }));
      setStep("otp");
      return;
    }
    

    if (step === "otp") {
      const payload = { ...formData, ...data };
      const result = await verifyOtp(payload);
      console.log("OTP result: ", result);
      if (result?.error) {
        console.error(result.error);
        return;
      }
      const roleName = result?.role;
      if(roleName === "admin"){
        router.push("/admin/dashboard");
        return;
      }
    
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* Left Side */}
      <div
        className="w-[65%] bg-primary flex flex-col justify-center items-center text-white relative"
        style={{
          clipPath: "ellipse(95% 100% at 0% 50%)",
        }}
      >
        <h1 className="text-5xl font-bold mb-4">Tracora</h1>
        <p className="text-lg opacity-80">
          Track bugs. Manage features. Deliver better.
        </p>
      </div>

      {/* Right Side */}
      <div className="w-[35%] flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">
              {step === "company"
                ? "Select Company"
                : step === "details"
                  ? "Sign Up"
                  : "Enter OTP"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* Step 1: Company Selection */}
              {step === "company" && (
                <div>
                  <Label>Company</Label>
                  <Controller
                    name="company_id"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map(company => (
                            <SelectItem
                              key={company.company_id}
                              value={company.company_id}
                            >
                              {company.company_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.company_id && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.company_id.message}
                    </p>
                  )}
                </div>
              )}

              {/* Step 2: User Details */}
              {step === "details" && (
                <>
                  <div>
                    <Label>Email</Label>
                    <Input
                      {...form.register("email")}
                      placeholder="you@example.com"
                    />
                    {form.formState.errors.email && (
                      <p className="text-red-500 text-sm">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Mobile</Label>
                    <Input
                      {...form.register("mobile")}
                      placeholder="9876543210"
                    />
                    {form.formState.errors.mobile && (
                      <p className="text-red-500 text-sm">
                        {form.formState.errors.mobile.message}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Step 3: OTP */}
              {step === "otp" && (
                <div>
                  <Label>OTP</Label>
                  <Input
                    {...form.register("otp")}
                    placeholder="Enter 6-digit OTP"
                  />
                  {form.formState.errors.otp && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.otp.message}
                    </p>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full">
                {step === "company"
                  ? "Next"
                  : step === "details"
                    ? "Send OTP"
                    : "Verify OTP"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
