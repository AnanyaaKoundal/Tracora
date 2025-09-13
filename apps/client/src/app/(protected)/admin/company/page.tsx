"use client";

import { useEffect, useState } from "react";
import { companySchema, Company } from "@/schemas/admin.schema";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getCompany } from "@/actions/companyAction";

export default function CompanyDetailsPage() {
  const [company, setCompany] = useState<Company | null>(null);

  
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
      <main className="flex-1 px-12 py-10">
        <div className="bg-white shadow-sm rounded-xl border">
          <div className="divide-y">
            <DetailRow label="Company ID" value={company.company_id} />
            <DetailRow label="Email" value={company.company_email} />
            <DetailRow label="Phone" value={company.company_phone} />
            <DetailRow
              label="Created At"
              value={new Date(company.createdAt ?? "").toLocaleString()}
            />
            <DetailRow
              label="Updated At"
              value={new Date(company.updatedAt ?? "").toLocaleString()}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Button
            className="px-6"
            onClick={() => toast.info("Edit feature coming soon!")}
          >
            Edit Company
          </Button>
          <Button
            variant="outline"
            className="px-6"
            onClick={() => toast.info("Navigating back...")}
          >
            Back
          </Button>
        </div>
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
    <div className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 transition">
      <span className="text-gray-600 font-medium">{label}</span>
      <span className="text-gray-900 font-semibold">{value}</span>
    </div>
  );
}
