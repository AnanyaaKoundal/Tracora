"use client";

// import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// import { getBugById, updateBug } from "@/actions/bugAction";
// import { Bug } from "@/schemas/bug.schema";
// import { Button } from "@/components/ui/button";

export default function BugInfoPage() {
  const { id } = useParams(); // Capture dynamic bug id
//   const router = useRouter();

//   const [bug, setBug] = useState<Bug | null>(null);
//   const [loading, setLoading] = useState(true);

//   // Fetch bug details on mount
//   useEffect(() => {
//     async function fetchBug() {
//       if (!id) return;
//       const data = await getBugById(id as string);
//       setBug(data);
//       setLoading(false);
//     }
//     fetchBug();
//   }, [id]);

//   if (loading) {
//     return <div className="p-4">Loading bug details...</div>;
//   }

//   if (!bug) {
//     return <div className="p-4 text-red-600">Bug not found.</div>;
//   }

//   async function handleSave() {
//     const res = await updateBug(bug.bug_id, bug);
//     if (res.success) {
//       alert("Bug updated successfully!");
//       router.push("/bugs");
//     } else {
//       alert("Failed to update bug.");
//     }
//   }

  return (
    <>Hi, {id}</>
    // <div className="max-w-2xl mx-auto p-6 space-y-6">
    //   <h1 className="text-2xl font-bold">Bug Details</h1>

    //   {/* Editable fields */}
    //   <div className="space-y-4">
    //     <div>
    //       <label className="block text-sm font-medium mb-1">Bug Name</label>
    //       <input
    //         type="text"
    //         className="border rounded p-2 w-full"
    //         value={bug.bug_name}
    //         onChange={(e) => setBug({ ...bug, bug_name: e.target.value })}
    //       />
    //     </div>

    //     <div>
    //       <label className="block text-sm font-medium mb-1">Status</label>
    //       <select
    //         className="border rounded p-2 w-full"
    //         value={bug.bug_status}
    //         onChange={(e) => setBug({ ...bug, bug_status: e.target.value })}
    //       >
    //         <option value="Open">Open</option>
    //         <option value="In Progress">In Progress</option>
    //         <option value="Resolved">Resolved</option>
    //         <option value="Closed">Closed</option>
    //       </select>
    //     </div>

    //     <div>
    //       <label className="block text-sm font-medium mb-1">Assigned To</label>
    //       <input
    //         type="text"
    //         className="border rounded p-2 w-full"
    //         value={bug.assigned_to || ""}
    //         onChange={(e) => setBug({ ...bug, assigned_to: e.target.value })}
    //       />
    //     </div>

    //     <div className="flex gap-3">
    //       <Button onClick={handleSave}>Save</Button>
    //       <Button
    //         variant="outline"
    //         onClick={() => router.push("/bugs")}
    //       >
    //         Cancel
    //       </Button>
    //     </div>
    //   </div>
    // </div>
  );
}
