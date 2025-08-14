"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { verifyUser, verifyOtp } from "@/actions/login";
import { z } from "zod";
import { loginSchema } from "@/schemas/login.schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [step, setStep] = useState<"company" | "details" | "otp">("company");
  const [formData, setFormData] = useState<Partial<z.infer<typeof loginSchema>>>({});
  const router = useRouter();

  
  
  const form = useForm<z.infer<typeof loginSchema>>({
    defaultValues: {
      company: "",
      email: "",
      mobile: "",
      otp: "",
    },
  });
  

  const onSubmit = async (data: any) => {
    if (step === "company") {
      // Save locally and move to next step
      setFormData(prev => ({ ...prev, ...data }));
      setStep("details");
      return;
    }
  
    if (step === "details") {
      const payload = { ...formData, ...data };
  
      const result = await verifyUser(payload); // imported from actions/login.ts
  
      if (result?.error) {
        console.error("A",result.error);
        return;
      }
  
      setFormData(payload);
      setStep("otp"); // Only move if login success
      return;
    }
  
    if (step === "otp") {
      const payload = { ...formData, ...data };
  
      const result = await verifyOtp(payload); // imported from actions/otp.ts
  
      if (result?.error) {
        console.error(result.error);
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {step === "company" && (
                <div>
                  <Label>Company</Label>
                  <Select
                    onValueChange={value => form.setValue("company", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CompanyA">Company A</SelectItem>
                      <SelectItem value="CompanyB">Company B</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.company && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.company.message}
                    </p>
                  )}
                </div>
              )}

              {step === "details" && (
                <>
                  <div>
                    <Label>Email</Label>
                    <Input {...form.register("email")} placeholder="you@example.com" />
                    {form.formState.errors.email && (
                      <p className="text-red-500 text-sm">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Mobile</Label>
                    <Input {...form.register("mobile")} placeholder="9876543210" />
                    {form.formState.errors.mobile && (
                      <p className="text-red-500 text-sm">
                        {form.formState.errors.mobile.message}
                      </p>
                    )}
                  </div>
                </>
              )}

              {step === "otp" && (
                <div>
                  <Label>OTP</Label>
                  <Input {...form.register("otp")} placeholder="Enter 6-digit OTP" />
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
