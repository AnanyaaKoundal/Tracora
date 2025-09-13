import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export function DeleteProjectDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  projectName: string | null;
  onConfirm: () => Promise<{ success: boolean; message?: string }>;
}) {
  const handleDelete = async () => {
    try {
      const res = await onConfirm();
      if (res.success) {
        toast.success("Project deleted successfully ✅");
        onOpenChange(false);
      } else {
        toast.error(res.message || "Failed to delete project ❌");
      }
    } catch {
      toast.error("Unexpected error while deleting project ❌");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Project</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this project? This action cannot be undone.
            <div className="mt-2 p-2 rounded-md bg-gray-100 text-sm">
              <p>
                <span className="font-semibold">ID:</span> {projectId || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Name:</span>{" "}
                {projectName || "N/A"}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
