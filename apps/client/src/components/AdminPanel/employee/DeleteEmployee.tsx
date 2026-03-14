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
  import { AlertTriangle, User, Trash2 } from "lucide-react";
  
  export function DeleteEmployeeDialog({
    open,
    onOpenChange,
    employeeId,
    employeeEmail,
    onConfirm,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employeeId: string | null;
    employeeEmail: string | null;
    onConfirm: () => Promise<{ success: boolean; message?: string }>;
  }) {
    const handleDelete = async () => {
      try {
        const res = await onConfirm();
        if (res.success) {
          toast.success("Employee deleted successfully");
          onOpenChange(false);
        } else {
          toast.error(res.message || "Failed to delete employee");
        }
      } catch {
        toast.error("Failed to delete employee");
      }
    };
  
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle className="text-lg">Delete Employee</AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-muted-foreground">
                  This action cannot be undone
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          
          <div className="my-4 p-4 rounded-xl bg-muted/50 border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{employeeEmail || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground font-mono">ID: {employeeId || 'N/A'}</p>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="gap-2">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
