import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

export function SupportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AfNIA Support</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p>
            Please email issues/questions to{" "}
            <a className="underline" href="mailto:info@afnia.mailab.io">
              info@afnia.mailab.io
            </a>{" "}
            or submit a request below.
          </p>

          <div className="rounded-lg border p-4 space-y-3">
            <label className="block">
              <div className="mb-1 font-medium">Subject</div>
              <input
                className="w-full border rounded-md p-2"
                placeholder="Short summary..."
              />
            </label>

            <label className="block">
              <div className="mb-1 font-medium">Message</div>
              <textarea
                className="w-full border rounded-md p-2 min-h-32"
                placeholder="Describe the issue..."
              />
            </label>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button
                onClick={() =>
                  alert("Wire this to your support backend (Freshdesk/Zendesk/EmailJS).")
                }
              >
                Request Support
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
