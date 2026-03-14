import * as React from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { supabase } from "../lib/supabaseClient";

type SignedInUser = {
  id: string;
  email?: string | null;
  isAdmin?: boolean;
} | null;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignedIn?: (u: SignedInUser) => void;
};

function isAdminEmail(email?: string | null) {
  const admins = [
    "haskemailab@gmail.com",
    "admin@afnia.mailab.io",
  ];
  return !!email && admins.includes(email.toLowerCase());
}

export function AuthDialog({ open, onOpenChange, onSignedIn }: Props) {
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setErr(null);
    setInfo(null);
    setLoading(false);
    setMode("signin");
    setEmail("");
    setPassword("");
  }, [open]);

  if (!open) return null;

  const close = () => onOpenChange(false);

  const afterAuth = async () => {
    const { data } = await supabase.auth.getUser();

    const user = data.user
      ? {
          id: data.user.id,
          email: data.user.email ?? null,
          isAdmin: isAdminEmail(data.user.email ?? null),
        }
      : null;

    onSignedIn?.(user);
    close();
  };

  const signInWithEmailPassword = async () => {
    setErr(null);
    setInfo(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      if (!data.session) throw new Error("No session returned");

      await afterAuth();
    } catch (e: any) {
      setErr(e?.message ?? "Email sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmailPassword = async () => {
    setErr(null);
    setInfo(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      // If email confirmations are ON, session may be null until user confirms.
      if (data.session) {
        await afterAuth();
      } else {
        setInfo("Account created. Check your email to confirm, then sign in.");
      }
    } catch (e: any) {
      setErr(e?.message ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const primaryAction = async () => {
    const e = email.trim();

    if (!e || !e.includes("@")) {
      setErr("Enter a valid email.");
      return;
    }

    if (!password || password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }

    if (mode === "signin") {
      await signInWithEmailPassword();
      return;
    }

    await signUpWithEmailPassword();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
    >
      <Card className="w-full max-w-md p-6 relative">
        <button
          onClick={close}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Close"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h3 className="text-lg font-semibold">
            {mode === "signin" ? "Sign in" : "Create account"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Use your AfNIA email and password.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@institution.org"
              autoComplete="email"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
            />
          </div>

          {err && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {err}
            </div>
          )}

          {info && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
              {info}
            </div>
          )}

          <Button className="w-full" onClick={primaryAction} disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "signin"
              ? "Sign in"
              : "Create account"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                Don’t have an account?{" "}
                <button
                  className="text-primary underline"
                  onClick={() => {
                    setErr(null);
                    setInfo(null);
                    setMode("signup");
                  }}
                  type="button"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  className="text-primary underline"
                  onClick={() => {
                    setErr(null);
                    setInfo(null);
                    setMode("signin");
                  }}
                  type="button"
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={close}
              className="text-sm text-muted-foreground hover:text-foreground"
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

