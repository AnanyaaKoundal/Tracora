"use client";

import { useEffect, useState } from "react";
import { Company } from "@/schemas/admin.schema";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getCompany, editCompanyEmail, editCompanyPhone, editCompanyPassword } from "@/actions/companyAction";
import { Pencil } from "lucide-react";

export default function CompanyDetailsPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [editField, setEditField] = useState<"email" | "phone" | "password" | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVerified, setPasswordVerified] = useState(false);

  useEffect(() => {
    async function fetchCompany() {
      const data = await getCompany();
      if (data.success) {
        setCompany(data.company);
      } else if (data.status === 403) {
        window.location.href = "/forbidden";
      } else {
        toast.error(data.error);
      }
    }
    fetchCompany();
  }, []);

  async function handleSendOtp() {
    toast.success(`OTP sent to your ${editField === "email" ? "email" : "phone"}`);
    setOtpSent(true);
  }

  async function handleVerifyAndSave() {
    if (!otp) return toast.error("Enter OTP first");

    try {
      if (editField === "email") {
        const res = await editCompanyEmail({email: tempValue, otp});
        if (res.success) {
          toast.success("Email updated successfully");
          setCompany((prev) => prev && { ...prev, company_email: tempValue });
        } else toast.error(res.error);
      }
      if (editField === "phone") {
        const res = await editCompanyPhone( {phone: tempValue, otp});
        if (res.success) {
          toast.success("Phone updated successfully");
          setCompany((prev) => prev && { ...prev, company_phone: tempValue });
        } else toast.error(res.error);
      }
    } catch (err) {
      toast.error("Update failed, please try again.");
    }

    setEditField(null);
    setOtp("");
    setOtpSent(false);
  }

  async function handlePasswordChange() {
    if (!passwordVerified) return toast.error("Verify your current password first");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");

    try {
      const res = await editCompanyPassword({ currentPassword, newPassword });
      if (res.success) {
        toast.success("Password updated successfully");
        setEditField(null);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordVerified(false);
      } else toast.error(res.error);
    } catch {
      toast.error("Failed to update password");
    }
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-600 text-lg">Failed to load company details.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white p-8 shadow-md">
        <h1 className="text-4xl font-bold">{company.company_name}</h1>
        <p className="text-blue-100 text-lg">Company Profile Overview</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-12 py-10 space-y-4">
        <DetailRow label="Company ID" value={company.company_id} />

        {/* Company Name (Static Instruction) */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <span className="text-gray-600 font-medium">Company Name</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-900 font-semibold">{company.company_name}</span>
            <Pencil
              className="h-4 w-4 text-gray-500 hover:text-gray-800 cursor-pointer"
              onClick={() =>
                toast.info(
                  "To change company name, please email helpdesk@tracora.org with subject: 'Change company name'"
                )
              }
            />
          </div>
        </div>

        {/* Editable Email */}
        <EditableRow
          label="Email"
          value={company.company_email}
          isEditing={editField === "email"}
          onEdit={() => {
            setEditField("email");
            setTempValue(company.company_email);
          }}
          onCancel={() => setEditField(null)}
          tempValue={tempValue}
          setTempValue={setTempValue}
          showOtp
          otp={otp}
          setOtp={setOtp}
          otpSent={otpSent}
          onSendOtp={handleSendOtp}
          onVerify={handleVerifyAndSave}
        />

        {/* Editable Phone */}
        <EditableRow
          label="Phone"
          value={company.company_phone}
          isEditing={editField === "phone"}
          onEdit={() => {
            setEditField("phone");
            setTempValue(company.company_phone);
          }}
          onCancel={() => setEditField(null)}
          tempValue={tempValue}
          setTempValue={setTempValue}
          showOtp
          otp={otp}
          setOtp={setOtp}
          otpSent={otpSent}
          onSendOtp={handleSendOtp}
          onVerify={handleVerifyAndSave}
        />

        {/* Change Password */}
        <div className="flex justify-between items-start px-6 py-4 border-b">
          <span className="text-gray-600 font-medium">Password</span>
          {editField === "password" ? (
            <div className="flex flex-col gap-3 w-1/2">
              {!passwordVerified && (
                <>
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="border rounded p-2"
                  />
                  <Button
                    onClick={() => {
                      // Call backend verify endpoint here if needed
                      if (currentPassword.length < 4) return toast.error("Password too short");
                      setPasswordVerified(true);
                      toast.success("Password verified");
                    }}
                  >
                    Verify Password
                  </Button>
                </>
              )}
              {passwordVerified && (
                <>
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border rounded p-2"
                  />
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border rounded p-2"
                  />
                  <Button onClick={handlePasswordChange} disabled={newPassword !== confirmPassword}>
                    Save Password
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setEditField(null)}>Cancel</Button>
            </div>
          ) : (
            <Pencil
              className="h-4 w-4 text-gray-500 hover:text-gray-800 cursor-pointer"
              onClick={() => setEditField("password")}
            />
          )}
        </div>

        <DetailRow label="Created At" value={new Date(company.createdAt ?? "").toLocaleString()} />
        <DetailRow label="Updated At" value={new Date(company.updatedAt ?? "").toLocaleString()} />
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 text-center py-4 text-sm text-gray-600 border-t">
        © {new Date().getFullYear()} Tracora Solutions. All Rights Reserved.
      </footer>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-6 py-4 border-b hover:bg-gray-50 transition">
      <span className="text-gray-600 font-medium">{label}</span>
      <span className="text-gray-900 font-semibold">{value}</span>
    </div>
  );
}

function EditableRow({
  label,
  value,
  isEditing,
  onEdit,
  onCancel,
  tempValue,
  setTempValue,
  showOtp,
  otp,
  setOtp,
  otpSent,
  onSendOtp,
  onVerify,
}: any) {
  return (
    <div className="flex justify-between items-center px-6 py-4 border-b">
      <span className="text-gray-600 font-medium">{label}</span>
      {isEditing ? (
        <div className="flex flex-col gap-2 w-1/2">
          <input
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="border rounded p-2"
          />
          {showOtp ? (
            otpSent ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="border rounded p-2 flex-1"
                />
                <Button onClick={onVerify}>Verify & Save</Button>
              </div>
            ) : (
              <Button onClick={onSendOtp}>Send OTP</Button>
            )
          ) : null}
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-gray-900 font-semibold">{value}</span>
          <Pencil
            className="h-4 w-4 text-gray-500 hover:text-gray-800 cursor-pointer"
            onClick={onEdit}
          />
        </div>
      )}
    </div>
  );
}
