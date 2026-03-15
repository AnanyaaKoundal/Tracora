"use client";

import { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

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
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, ArrowRight, Mail, Phone, Lock, Building2 } from "lucide-react";

export default function LoginForm() {
  const [step, setStep] = useState<"company" | "details" | "otp">("company");
  const [formData, setFormData] = useState<Partial<z.infer<typeof loginSchema>>>(
    {}
  );
  const [companies, setCompanies] = useState<{ company_id: string; company_name: string }[]>([]);
  const [loginError, setLoginError] = useState<string>("");

  const router = useRouter();

  const form = useForm<z.infer<typeof loginSchema>>({
    defaultValues: {
      company_id: "",
      email: "",
      mobile: "",
      otp: "",
    },
  });

  useEffect(() => {
    if (step === "otp") {
      form.setFocus("otp");
    }
  }, [step, form]);  

  useEffect(() => {
    const loadCompanies = async () => {
      const data = await fetchCompanies();
      setCompanies(data);
    };
    loadCompanies();
  }, []);

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    if (step === "company") {
      const selectedCompany = companies.find(c => c.company_id === data.company_id);
      if (!selectedCompany) return;
      setFormData(prev => ({ ...prev, company_id: data.company_id, company_name: selectedCompany.company_name }));
      setStep("details");
      setLoginError("");
      return;
    }

    if (step === "details") {
      const payload = { ...formData, ...data };
      const result = await verifyUser(payload);
      if (result?.error || !result?.employee_id) {
        setLoginError(result?.error || "Please check your credentials and try again");
        return;
      }
      setLoginError("");
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
      if (result?.error || !result?.success) {
        setLoginError(result?.error || "Invalid OTP");
        return;
      }
      setLoginError("");
      const roleName = result?.role;
      if (roleName === "admin") {
        router.push("/admin/dashboard");
        return;
      }
      router.push("/dashboard");
    }
  };

  const stepTitles = {
    company: "Welcome Back",
    details: "Enter Your Details",
    otp: "Verify Your Account"
  };

  const stepDescriptions = {
    company: "Select your company to continue",
    details: "Provide your email and mobile number",
    otp: "Enter the OTP sent to your mobile"
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/10 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-white/5 rounded-full" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full text-white p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
              <Bug className="w-10 h-10" />
            </div>
            <h1 className="text-5xl font-bold mb-4">Tracora</h1>
            <p className="text-xl opacity-90 max-w-md">
              Catch every bug before it catches you. Streamline your development workflow.
            </p>
            
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg">
              {[
                { label: "Bugs Tracked", value: "50K+" },
                { label: "Teams", value: "10K+" },
                { label: "Resolved", value: "99%" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm opacity-70">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Bug className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-primary">Tracora</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">{stepTitles[step]}</h2>
              <p className="text-muted-foreground">{stepDescriptions[step]}</p>
            </div>

            {/* Progress Dots */}
            <div className="flex gap-2 mb-8">
              {["company", "details", "otp"].map((s, i) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    s === step 
                      ? "bg-primary" 
                      : ["company", "details", "otp"].indexOf(step) > i 
                        ? "bg-primary/50" 
                        : "bg-gray-200"
                  }`}
                />
              ))}
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <AnimatePresence mode="wait">
                {step === "company" && (
                  <motion.div
                    key="company"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-2"
                  >
                    <Label className="text-sm font-medium">Company</Label>
                    <Controller
                      name="company_id"
                      control={form.control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select your company" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map(company => (
                              <SelectItem key={company.company_id} value={company.company_id}>
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
                    <p className="text-sm text-center mt-6 text-muted-foreground">
                      New to Tracora?{" "}
                      <Link href="/auth/register/company" className="text-primary font-medium hover:underline">
                        Register your company
                      </Link>
                    </p>
                  </motion.div>
                )}

                {step === "details" && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          {...form.register("email")}
                          placeholder="you@example.com"
                          className="h-12 pl-10"
                        />
                      </div>
                      {form.formState.errors.email && (
                        <p className="text-red-500 text-sm">
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Mobile Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          {...form.register("mobile")}
                          placeholder="9876543210"
                          className="h-12 pl-10"
                        />
                      </div>
                      {form.formState.errors.mobile && (
                        <p className="text-red-500 text-sm">
                          {form.formState.errors.mobile.message}
                        </p>
                      )}
                    </div>
                    {loginError && (
                      <p className="text-red-500 text-sm">{loginError}</p>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      className="p-0 h-auto text-sm text-muted-foreground hover:text-primary"
                      onClick={() => setStep("company")}
                    >
                      ← Back to company selection
                    </Button>
                  </motion.div>
                )}

                {step === "otp" && (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <div className="bg-primary/5 rounded-xl p-4 mb-4">
                      <p className="text-sm text-muted-foreground">
                        We've sent a 6-digit OTP to your registered mobile number.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Enter OTP</Label>
                      <Input
                        {...form.register("otp")}
                        placeholder="------"
                        className="h-12 text-center text-xl tracking-[0.5em]"
                        maxLength={6}
                      />
                      {form.formState.errors.otp && (
                        <p className="text-red-500 text-sm">
                          {form.formState.errors.otp.message}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="p-0 h-auto text-sm text-muted-foreground hover:text-primary"
                      onClick={() => setStep("details")}
                    >
                      ← Back to details
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button type="submit" className="w-full h-12 text-base">
                {step === "company"
                  ? "Continue"
                  : step === "details"
                    ? "Send OTP"
                    : "Verify & Login"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            By signing in, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">Terms</a>
            {" "}and{" "}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
