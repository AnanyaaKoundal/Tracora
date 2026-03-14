"use client";

import { useEffect, useState } from "react";
import { Company } from "@/schemas/admin.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getCompany, editCompanyEmail, editCompanyPhone, editCompanyPassword } from "@/actions/companyAction";
import { Building2, Mail, Phone, Lock, Calendar, Shield, Save, X, Send, Eye, EyeOff, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CompanyDetailsPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [editField, setEditField] = useState<"email" | "phone" | "password" | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});

  async function refreshCompany() {
    const data = await getCompany();
    if (data.success) {
      setCompany(data.company);
    } else if (data.status === 403) {
      window.location.href = "/forbidden";
    } else {
      toast.error(data.error);
    }
  }

  useEffect(() => {
    refreshCompany();
  }, []);

  async function handleSendOtp() {
    toast.success(`OTP sent to your ${editField === "email" ? "email" : "phone"}`);
    setOtpSent(true);
  }

  async function handleVerifyAndSave() {
    if (!otp) return toast.error("Enter OTP first");

    try {
      let res;
      switch (editField) {
        case "email":
          res = await editCompanyEmail({ email: tempValue, otp });
          break;
        case "phone":
          res = await editCompanyPhone({ phone: tempValue, otp });
          break;
        case "password":
          res = await editCompanyPassword({ newPassword: tempValue, otp });
          break;
        default:
          return toast.error("Invalid field selected");
      }

      if (res.success) {
        toast.success(`${editField} updated successfully`);
        await refreshCompany();
        setFieldError(null);
      } else {
        setFieldError(res.error || "Unknown error");
        toast.error(res.error || "Update failed");
      }
    } catch (err: any) {
      setFieldError("Something went wrong");
      toast.error("Update failed, please try again.");
    }

    setOtp("");
    setOtpSent(false);
    setEditField(null);
  }

  async function handlePasswordChange() {
    if (!currentPassword) return toast.error("Enter current password");
    if (!newPassword) return toast.error("Enter new password");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");

    try {
      const res = await editCompanyPassword({ currentPassword, newPassword });
      if (res.success) {
        toast.success("Password updated successfully");
        setEditField(null);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.error || "Failed to update password");
      }
    } catch {
      toast.error("Failed to update password");
    }
  }

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
          <div className="h-4 w-48 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white p-8 shadow-xl shadow-primary/20"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{company.company_name}</h1>
            <p className="text-white/80 mt-1">Company Profile & Settings</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-white/70">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Created {new Date(company.createdAt ?? "").toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Admin Access
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Information Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-lg shadow-gray-200/50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b pb-4">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                Company Information
              </CardTitle>
              <CardDescription>View and manage your company details</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                <InfoRow 
                  label="Company ID" 
                  value={company.company_id} 
                  icon={<KeyRound className="w-4 h-4" />}
                />
                
                <InfoRow 
                  label="Company Name" 
                  value={company.company_name}
                  editable={false}
                  onEdit={() => toast.info("To change company name, please contact support")}
                  icon={<Building2 className="w-4 h-4" />}
                />

                <AnimatePresence mode="wait">
                  {editField === "email" ? (
                    <EditRow
                      label="Email"
                      value={company.company_email}
                      tempValue={tempValue}
                      setTempValue={setTempValue}
                      otp={otp}
                      setOtp={setOtp}
                      otpSent={otpSent}
                      onSendOtp={handleSendOtp}
                      onVerify={handleVerifyAndSave}
                      onCancel={() => { setEditField(null); setFieldError(null); }}
                      error={fieldError}
                      icon={<Mail className="w-4 h-4" />}
                    />
                  ) : (
                    <InfoRow 
                      label="Email" 
                      value={company.company_email || "Not set"}
                      editable
                      onEdit={() => { setEditField("email"); setTempValue(company.company_email); setFieldError(null); }}
                      icon={<Mail className="w-4 h-4" />}
                    />
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {editField === "phone" ? (
                    <EditRow
                      label="Phone"
                      value={company.company_phone}
                      tempValue={tempValue}
                      setTempValue={setTempValue}
                      otp={otp}
                      setOtp={setOtp}
                      otpSent={otpSent}
                      onSendOtp={handleSendOtp}
                      onVerify={handleVerifyAndSave}
                      onCancel={() => { setEditField(null); setFieldError(null); }}
                      error={fieldError}
                      icon={<Phone className="w-4 h-4" />}
                    />
                  ) : (
                    <InfoRow 
                      label="Phone" 
                      value={company.company_phone || "Not set"}
                      editable
                      onEdit={() => { setEditField("phone"); setTempValue(company.company_phone); setFieldError(null); }}
                      icon={<Phone className="w-4 h-4" />}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Quick Actions - Moved under Company Information */}
              <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-t">
                <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="justify-start gap-3 h-11" onClick={() => toast.info("Feature coming soon")}>
                    <Mail className="w-4 h-4" />
                    Update Logo
                  </Button>
                  <Button variant="outline" className="justify-start gap-3 h-11" onClick={() => toast.info("Feature coming soon")}>
                    <Building2 className="w-4 h-4" />
                    Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Password Card Only */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg shadow-gray-200/50 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b pb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-amber-600" />
                  </div>
                  Security
                </CardTitle>
                <CardDescription>Manage your password</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <AnimatePresence mode="wait">
                  {editField === "password" ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Current Password</Label>
                          <div className="relative">
                            <Input
                              type={showPasswords.current ? "text" : "password"}
                              placeholder="Enter current password"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="h-10 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility("current")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">New Password</Label>
                          <div className="relative">
                            <Input
                              type={showPasswords.new ? "text" : "password"}
                              placeholder="Enter new password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="h-10 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility("new")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Confirm Password</Label>
                          <div className="relative">
                            <Input
                              type={showPasswords.confirm ? "text" : "password"}
                              placeholder="Confirm new password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="h-10 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility("confirm")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        {newPassword && confirmPassword && newPassword !== confirmPassword && (
                          <p className="text-sm text-destructive">Passwords do not match</p>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button 
                            onClick={handlePasswordChange} 
                            disabled={!currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                            className="flex-1 gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Change Password
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setEditField(null);
                              setCurrentPassword("");
                              setNewPassword("");
                              setConfirmPassword("");
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-muted-foreground mb-4">••••••••</p>
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => {
                          setEditField("password");
                          setCurrentPassword(""); 
                          setNewPassword("");    
                          setConfirmPassword("");
                          setFieldError(null);
                        }}
                      >
                        <KeyRound className="w-4 h-4" />
                        Change Password
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ 
  label, 
  value, 
  editable = false, 
  onEdit, 
  icon 
}: { 
  label: string; 
  value: string; 
  editable?: boolean;
  onEdit?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-4 px-6 hover:bg-slate-50/50 transition-colors">
      <div className="flex items-center gap-3">
        {icon && <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-muted-foreground">{icon}</div>}
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-foreground font-medium">{value}</p>
        </div>
      </div>
      {editable && (
        <Button variant="ghost" size="sm" onClick={onEdit} className="gap-1 text-muted-foreground hover:text-foreground">
          Edit
        </Button>
      )}
    </div>
  );
}

function EditRow({
  label,
  value,
  tempValue,
  setTempValue,
  otp,
  setOtp,
  otpSent,
  onSendOtp,
  onVerify,
  onCancel,
  error,
  icon,
}: {
  label: string;
  value: string;
  tempValue: string;
  setTempValue: (v: string) => void;
  otp: string;
  setOtp: (v: string) => void;
  otpSent: boolean;
  onSendOtp: () => void;
  onVerify: () => void;
  onCancel: () => void;
  error: string | null;
  icon?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="p-4 px-6 bg-primary/5 border-l-4 border-primary"
    >
      <div className="flex items-center gap-3 mb-4">
        {icon && <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>}
        <div>
          <p className="text-sm font-medium text-muted-foreground">Editing {label}</p>
          <p className="text-foreground font-medium">Current: {value}</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <Input
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          placeholder={`Enter new ${label.toLowerCase()}`}
          className="h-10"
        />
        
        {otpSent && (
          <div className="flex gap-2">
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="h-10 flex-1"
            />
            <Button onClick={onVerify} className="gap-1">
              <Save className="w-4 h-4" />
              Save
            </Button>
          </div>
        )}
        
        {!otpSent && (
          <Button onClick={onSendOtp} variant="outline" className="gap-1">
            <Send className="w-4 h-4" />
            Send OTP
          </Button>
        )}
        
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-lg">
            {error}
          </p>
        )}
        
        <Button variant="ghost" onClick={onCancel} className="gap-1 text-muted-foreground">
          <X className="w-4 h-4" />
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}
