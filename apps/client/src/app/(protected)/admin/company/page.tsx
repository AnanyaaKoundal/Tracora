"use client";

import { useEffect, useState } from "react";
import { Company } from "@/schemas/admin.schema";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getCompany } from "@/actions/companyAction";
import { Pencil } from "lucide-react";

export default function CompanyDetailsPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [editField, setEditField] = useState<"name" | "email" | "phone" | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

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
    if (!otp) {
      toast.error("Enter OTP first");
      return;
    }
    // Normally verify OTP via API
    toast.success(`${editField} updated successfully`);
    setCompany((prev) => prev && { ...prev, [`company_${editField}`]: tempValue });
    setEditField(null);
    setOtp("");
    setOtpSent(false);
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
        {/* Company ID (Read-only) */}
        <DetailRow label="Company ID" value={company.company_id} />

        {/* Editable Name */}
        <EditableRow
          label="Company Name"
          value={company.company_name}
          isEditing={editField === "name"}
          onEdit={() => {
            setEditField("name");
            setTempValue(company.company_name);
          }}
          onCancel={() => setEditField(null)}
          tempValue={tempValue}
          setTempValue={setTempValue}
          showOtp={false} // no OTP for name, just extra process if needed
          onSave={() => {
            toast.success("Company name updated successfully!");
            setCompany((prev) => prev && { ...prev, company_name: tempValue });
            setEditField(null);
          }}
        />

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

        {/* Created / Updated */}
        <DetailRow
          label="Created At"
          value={new Date(company.createdAt ?? "").toLocaleString()}
        />
        <DetailRow
          label="Updated At"
          value={new Date(company.updatedAt ?? "").toLocaleString()}
        />
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 text-center py-4 text-sm text-gray-600 border-t">
        © {new Date().getFullYear()} TechNova Solutions. All Rights Reserved.
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
  onSave,
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
          ) : (
            <Button onClick={onSave}>Save</Button>
          )}
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
