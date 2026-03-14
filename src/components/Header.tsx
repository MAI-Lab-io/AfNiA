import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";

type User = {
  id: string;
  email?: string | null;
  isAdmin?: boolean;
} | null;

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenSupport: () => void;
  user: User;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenUpload: () => void;
}

export function Header({
  currentPage,
  onNavigate,
  onOpenSupport,
  user,
  onOpenAuth,
  onSignOut,
  onOpenUpload,
}: HeaderProps) {
  const navItems = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "explore", label: "Explore Datasets" },
    { id: "contribute", label: "Contribute" },

    ...(user
      ? [
          { id: "upload", label: "Upload" },
          { id: "profile", label: "Dashboard" },
        ]
      : []),

    ...(user?.isAdmin ? [{ id: "admin", label: "Admin" }] : []),
  ];

  const [compact, setCompact] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function go(page: string) {
    if (page === "upload") {
      setMobileOpen(false);
      if (!user) return onOpenAuth();
      return onOpenUpload();
    }

    if ((page === "profile" || page === "admin") && !user) {
      setMobileOpen(false);
      onOpenAuth();
      return;
    }

    if (page === "admin" && !user?.isAdmin) {
      setMobileOpen(false);
      return;
    }

    setMobileOpen(false);
    onNavigate(page);
  }

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div
        className={[
          "container mx-auto px-4",
          compact ? "py-1" : "py-2",
          "transition-all duration-200",
        ].join(" ")}
      >
        <div
          className={[
            "flex items-center justify-between",
            compact ? "gap-3" : "gap-4",
          ].join(" ")}
        >
          {/* Logo */}
          <button
            onClick={() => go("home")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            type="button"
          >
            <img
              src="/logo.png"
              alt="AfNIA Logo"
              className={[
                "w-auto",
                compact ? "h-8 sm:h-9 md:h-10" : "h-10 sm:h-11 md:h-12",
                "transition-all duration-200",
              ].join(" ")}
            />

            <div className="hidden sm:flex flex-col leading-tight">
              <span
                className="font-extrabold transition-all duration-200"
                style={{
                  color: "#7C3AED",
                  fontSize: compact ? "1.0rem" : "1.1rem",
                  lineHeight: "1.0",
                }}
              >
                AfNiA
              </span>
              <span
                className="transition-all duration-200"
                style={{
                  color: "#111827",
                  fontWeight: 500,
                  fontSize: compact ? "0.65rem" : "0.72rem",
                  lineHeight: "1.1",
                }}
              >
                African NeuroImaging Archive
              </span>
            </div>
          </button>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <nav className="flex items-center gap-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => go(item.id)}
                  className={[
                    "transition-colors text-sm",
                    currentPage === item.id
                      ? "text-primary"
                      : "text-foreground hover:text-primary",
                  ].join(" ")}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={onOpenSupport}
                className={compact ? "h-8 px-3 text-sm" : "h-9 px-3 text-sm"}
              >
                Support
              </Button>

              {user ? (
                <>
                  <div className="text-xs text-muted-foreground hidden lg:block max-w-[160px] truncate">
                    {user.email}
                  </div>

                  <Button
                    variant="outline"
                    onClick={onSignOut}
                    className={compact ? "h-8 px-3 text-sm" : "h-9 px-3 text-sm"}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <Button
                  onClick={onOpenAuth}
                  className={compact ? "h-8 px-3 text-sm" : "h-9 px-3 text-sm"}
                >
                  Sign in
                </Button>
              )}
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            {user ? (
              <Button
                variant="outline"
                onClick={onSignOut}
                className={compact ? "h-8 px-3 text-sm" : "h-9 px-3 text-sm"}
              >
                Sign out
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={onOpenAuth}
                className={compact ? "h-8 px-3 text-sm" : "h-9 px-3 text-sm"}
              >
                Sign in
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen((v) => !v)}
              className={compact ? "h-8 w-8" : "h-9 w-9"}
              aria-label="Open menu"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden mt-2 border rounded-lg p-3 bg-white shadow-sm">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => go(item.id)}
                  className={[
                    "text-left px-3 py-2 rounded hover:bg-muted transition-colors text-sm",
                    currentPage === item.id ? "text-primary" : "text-foreground",
                  ].join(" ")}
                  type="button"
                >
                  {item.label}
                </button>
              ))}

              <button
                onClick={() => {
                  setMobileOpen(false);
                  onOpenSupport();
                }}
                className="text-left px-3 py-2 rounded hover:bg-muted transition-colors text-sm"
                type="button"
              >
                Support
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}