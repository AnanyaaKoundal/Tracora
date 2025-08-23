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
  
  export function DeleteRoleDialog({
    open,
    onOpenChange,
    roleName,
    onConfirm,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    roleName: string | null;
    onConfirm: () => Promise<{ success: boolean; message?: string }>;
  }) {
    const handleDelete = async () => {
      try {
        await onConfirm();
        toast.success("Role deleted successfully");
        onOpenChange(false);
      } catch {
        toast.error("Failed to delete role");
      }
    };
  
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{roleName}</span>? This action
              cannot be undone.
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
  