"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { verifyUser, verifyOtp } from "@/actions/loginAction";
import { z } from "zod";
import { registerCompanySchema } from "@/schemas/register.schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { registerCompany, verifyCompanyOtp } from "@/actions/registerCompany";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, ArrowRight, Mail, Phone, Lock, Building2, User, Check } from "lucide-react";

export default function RegisterCompanyForm() {
    const [step, setStep] = useState<"details" | "otp">("details");
    const [serverError, setServerError] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<z.infer<typeof registerCompanySchema>>>({});
    const router = useRouter();

    const form = useForm<z.infer<typeof registerCompanySchema>>({
        resolver: zodResolver(registerCompanySchema),
        defaultValues: {
            company_name: "",
            company_email: "",
            company_phone: "",
            password: "",
            confirm_password: "",
            otp: "",
        },
    });

    const onSubmit = async (data: z.infer<typeof registerCompanySchema>) => {
        if (step === "details") {
            const result = await registerCompany(data);
            if (result?.error) {
                setServerError(result.message || "Something went wrong");
                return;
            }
            setFormData(data);
            setServerError("");
            setStep("otp");
            return;
        }

        if (step === "otp") {
            const payload = { ...formData, ...data };
            const result = await verifyCompanyOtp(payload);
            if (result?.error) {
                setServerError(result.message || "Something went wrong");
                return;
            }
            router.push("/admin/dashboard");
        }
    };

    const benefits = [
        "Unlimited projects",
        "Real-time notifications",
        "Role-based access control",
        "Analytics dashboard",
        "Team collaboration",
    ];

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
                        <h1 className="text-5xl font-bold mb-4">Join Tracora</h1>
                        <p className="text-xl opacity-90 max-w-md mb-8">
                            Start tracking bugs smarter, not harder. Get started for free.
                        </p>
                        
                        <div className="text-left bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-md">
                            <p className="font-semibold mb-4">What's included:</p>
                            <div className="space-y-3">
                                {benefits.map((benefit, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>{benefit}</span>
                                    </div>
                                ))}
                            </div>
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
                            <h2 className="text-2xl font-bold mb-2">
                                {step === "details" ? "Create Your Company" : "Verify OTP"}
                            </h2>
                            <p className="text-muted-foreground">
                                {step === "details" 
                                    ? "Set up your company account to get started" 
                                    : "Enter the OTP sent to your mobile number"}
                            </p>
                        </div>

                        {/* Progress Dots */}
                        <div className="flex gap-2 mb-8">
                            {["details", "otp"].map((s, i) => (
                                <div
                                    key={s}
                                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                                        s === step 
                                            ? "bg-primary" 
                                            : ["details", "otp"].indexOf(step) > i 
                                                ? "bg-primary/50" 
                                                : "bg-gray-200"
                                    }`}
                                />
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            <form key={step} onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                {step === "details" && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Company Name</Label>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                <Input 
                                                    {...form.register("company_name")} 
                                                    placeholder="Enter company name"
                                                    className="h-12 pl-10" 
                                                />
                                            </div>
                                            {form.formState.errors.company_name && (
                                                <p className="text-red-500 text-sm">
                                                    {form.formState.errors.company_name.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Company Email</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                <Input 
                                                    {...form.register("company_email")} 
                                                    placeholder="you@company.com"
                                                    className="h-12 pl-10" 
                                                />
                                            </div>
                                            {form.formState.errors.company_email && (
                                                <p className="text-red-500 text-sm">
                                                    {form.formState.errors.company_email.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Phone Number</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                <Input 
                                                    {...form.register("company_phone")} 
                                                    placeholder="9876543210"
                                                    className="h-12 pl-10" 
                                                />
                                            </div>
                                            {form.formState.errors.company_phone && (
                                                <p className="text-red-500 text-sm">
                                                    {form.formState.errors.company_phone.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                <Input 
                                                    type="password" 
                                                    {...form.register("password")} 
                                                    placeholder="Create a password"
                                                    className="h-12 pl-10" 
                                                />
                                            </div>
                                            {form.formState.errors.password && (
                                                <p className="text-red-500 text-sm">
                                                    {form.formState.errors.password.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Confirm Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                <Input 
                                                    type="password" 
                                                    {...form.register("confirm_password")} 
                                                    placeholder="Confirm your password"
                                                    className="h-12 pl-10" 
                                                />
                                            </div>
                                            {form.formState.errors.confirm_password && (
                                                <p className="text-red-500 text-sm">
                                                    {form.formState.errors.confirm_password.message}
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {step === "otp" && (
                                    <motion.div
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

                                {serverError && (
                                    <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
                                        {serverError}
                                    </div>
                                )}

                                <Button type="submit" className="w-full h-12 text-base">
                                    {step === "details" ? "Send OTP" : "Verify & Create Account"}
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </form>
                        </AnimatePresence>
                    </div>

                    <p className="text-center text-sm text-muted-foreground mt-6">
                        Already have an account?{" "}
                        <Link href="/auth/login" className="text-primary font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
