import { Link, useLocation } from "react-router-dom";

/* Shared GRAFT navbar: strictly matches the user reference images */

const LINKS = [
  { label: "Uploadation", to: "/upload", match: ["/upload", "/analysis", "/uploadation"] },
  { label: "Investigation", to: "/investigation", match: ["/investigation"] },
  { label: "Analytics", to: "/ai-report", match: ["/analytics", "/ai-report"] },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <header
      className="h-16 w-full shrink-0 select-none bg-[#EEF3FF] border-b"
      style={{ borderColor: "rgba(21, 26, 86, 0.14)" }}
    >
      <div className="mx-auto flex h-full max-w-[1520px] items-center justify-between px-6 sm:px-10 lg:px-14">
        {/* Brand Logo */}
        <Link
          to="/"
          className="text-[20px] font-black tracking-tight transition-opacity hover:opacity-85"
          style={{ color: "#1E3A8A", letterSpacing: "-0.01em" }}
        >
          GRAFT
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex h-full items-center gap-6 sm:gap-9">
          {LINKS.map((l) => {
            const active = l.match.some((m) => pathname === m || pathname.startsWith(m + "/"));
            return (
              <Link
                key={l.label}
                to={l.to}
                aria-current={active ? "page" : undefined}
                className="relative flex h-full items-center text-[13.5px] font-semibold transition-colors duration-200"
                style={{
                  color: active ? "#1E3A8A" : "#4B5563",
                }}
              >
                {l.label}
                {active && (
                  <span
                    className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-sm"
                    style={{ background: "#1E3A8A" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

