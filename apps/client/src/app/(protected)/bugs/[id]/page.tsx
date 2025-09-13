"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBugById, updateBug } from "@/actions/bugAction";
import { Bug } from "@/schemas/bug.schema";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function BugInfoPage() {
  const { id } = useParams();
  const idParam = Array.isArray(id) ? id[0] : id;

  const router = useRouter();

  const [bug, setBug] = useState<Bug | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch bug details
  useEffect(() => {
    async function fetchBug() {
      if (!idParam) return;
      try {
        const res = await getBugById(idParam);
        if (res.success) setBug(res.data);
        else toast.error(res.message || "Failed to fetch bug");
      } catch {
        toast.error("Failed to fetch bug.");
      } finally {
        setLoading(false);
      }
    }
    fetchBug();
  }, [id]);

  if (loading) return <div className="p-4">Loading bug details...</div>;
  if (!bug) return <div className="p-4 text-red-600">Bug not found.</div>;

  const statusOptions: Bug["bug_status"][] = [
    "Open",
    "Under Review",
    "Fixed",
    "Closed",
  ];

  // Save changes
  async function handleSave() {
    if (!bug) return;
    setSaving(true);
    try {
      const res = await updateBug(bug);
      if (res.success) {
        toast.success("Bug updated successfully!");
        router.push("/bugs");
      } else {
        toast.error(res.message || "Failed to update bug.");
      }
    } catch {
      toast.error("Failed to update bug.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl p-12 space-b-6">
      <h1 className="text-2xl font-bold">Edit Bug</h1>

      <div className="space-y-4">
        {/* Bug Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Bug Name</label>
          <input
            type="text"
            className="border rounded p-2 w-full"
            value={bug.bug_name}
            onChange={(e) =>
              setBug((prev) => prev && { ...prev, bug_name: e.target.value })
            }
          />
        </div>

        {/* Bug Status */}
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            className="border rounded p-2 w-full"
            value={bug.bug_status}
            onChange={(e) =>
              setBug((prev) =>
                prev
                  ? {
                      ...prev,
                      bug_status: e.target.value as Bug["bug_status"],
                    }
                  : prev
              )
            }
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Assigned To */}
        <div>
          <label className="block text-sm font-medium mb-1">Assigned To</label>
          <input
            type="text"
            className="border rounded p-2 w-full"
            value={bug.assigned_to || ""}
            onChange={(e) =>
              setBug((prev) =>
                prev ? { ...prev, assigned_to: e.target.value } : prev
              )
            }
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="border rounded p-2 w-full"
            value={bug.bug_description}
            onChange={(e) =>
              setBug((prev) =>
                prev ? { ...prev, bug_description: e.target.value } : prev
              )
            }
            rows={4}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/bugs")}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
