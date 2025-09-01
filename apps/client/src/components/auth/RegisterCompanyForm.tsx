"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { verifyUser, verifyOtp } from "@/actions/login";
import { z } from "zod";
import { registerCompanySchema } from "@/schemas/register.schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { registerCompany, verifyCompanyOtp } from "@/actions/registerCompany";
import { zodResolver } from "@hookform/resolvers/zod";

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

    const onSubmit = async (data: any) => {
        if (step === "details") {
            console.log("Calling....")
            const result = await registerCompany(data);
            console.log("Result: ", result);
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
            // if (!data.otp || data.otp.length !== 6) {
            //     form.setError("otp", { message: "OTP must be 6 digits" });
            //     return;
            // }
            const payload = { ...formData, ...data };
            const result = await verifyCompanyOtp(payload);
            if (result?.error) {
                setServerError(result.message || "Something went wrong");
                return;
            }
            router.push("/admin/dashboard");
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
                            {step === "details" ? "Register Your Company" : "Enter OTP"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {step === "details" && (
                                <>
                                    <div>
                                        <Label>Company Name</Label>
                                        <Input {...form.register("company_name")} placeholder="Enter company name" />
                                        {form.formState.errors.company_name && (
                                            <p className="text-red-500 text-sm">
                                                {form.formState.errors.company_name.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label>Email</Label>
                                        <Input {...form.register("company_email")} placeholder="you@example.com" />
                                        {form.formState.errors.company_email && (
                                            <p className="text-red-500 text-sm">
                                                {form.formState.errors.company_email.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label>Mobile</Label>
                                        <Input {...form.register("company_phone")} placeholder="9876543210" />
                                        {form.formState.errors.company_phone && (
                                            <p className="text-red-500 text-sm">
                                                {form.formState.errors.company_phone.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label>Password</Label>
                                        <Input type="password" {...form.register("password")} placeholder="******" />
                                        {form.formState.errors.password && (
                                            <p className="text-red-500 text-sm">
                                                {form.formState.errors.password.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label>Confirm Password</Label>
                                        <Input type="password" {...form.register("confirm_password")} placeholder="******" />
                                        {form.formState.errors.confirm_password && (
                                            <p className="text-red-500 text-sm">
                                                {form.formState.errors.confirm_password.message}
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
                                {step === "details" ? "Send OTP" : "Verify OTP"}
                            </Button>
                            {serverError && (
                                <p className="text-red-500 text-sm mt-2">{serverError}</p>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
