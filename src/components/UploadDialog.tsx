import * as React from "react";
import { X } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { UploadPage } from "./UploadPage";

type User = {
  id: string;
  email?: string | null;
  isAdmin?: boolean;
} | null;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onOpenAuth: () => void;
  onNavigate: (page: string) => void;
};

export function UploadDialog({
  open,
  onOpenChange,
  user,
  onOpenAuth,
  onNavigate,
}: Props) {
  if (!open) return null;

  const close = () => onOpenChange(false);

  // If user not logged in
  if (!user) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
        role="dialog"
        aria-modal="true"
      >
        <Card className="w-full max-w-md p-6 text-center">
          <h2 className="text-lg font-semibold mb-3">
            Sign in required
          </h2>

          <p className="text-sm text-muted-foreground mb-6">
            You must sign in before uploading a dataset.
          </p>

          <div className="flex justify-center gap-3">
            <Button
              onClick={() => {
                close();
                onOpenAuth();
              }}
            >
              Sign in
            </Button>

            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <Card className="relative w-full max-w-5xl max-h-[90vh] overflow-auto p-0">

        {/* Close button */}
        <button
          onClick={close}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground z-10"
          aria-label="Close"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/40">
          <div>
            <div className="font-semibold text-lg">
              Upload Dataset
            </div>

            <div className="text-xs text-muted-foreground">
              Step 1: Dataset Information → Admin Review → Step 2: Data Upload
            </div>
          </div>

          <Button variant="outline" onClick={close}>
            Close
          </Button>
        </div>

        {/* Body */}
        <div className="p-6">
          <UploadPage
            onNavigate={onNavigate}
            onOpenAuth={onOpenAuth}
            user={user}
          />
        </div>
      </Card>
    </div>
  );
}