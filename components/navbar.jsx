"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";

const TITLES = {
  "/dashboard": "Dashboard",
  "/leads": "Leads",
  "/websites": "Websites",
  "/services": "Services",
  "/preview": "Email Preview",
};

function titleFor(pathname) {
  if (pathname.startsWith("/leads/")) return "Lead Details";
  return TITLES[pathname] || "Lead Management System";
}

function breadcrumbsFor(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length <= 1) return null;
  const main = TITLES["/" + parts[0]];
  if (parts[0] === "leads" && parts[1]) {
    return (
      <span className="text-xs text-muted-foreground">
        {main} <span className="mx-1 text-muted-foreground/40">/</span>{" "}
        <span className="text-foreground/60">Details</span>
      </span>
    );
  }
  return null;
}

export function Navbar() {
  const pathname = usePathname();
  const breadcrumbs = breadcrumbsFor(pathname);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex flex-col">
        <h1 className="text-sm font-semibold text-foreground">
          {titleFor(pathname)}
        </h1>
        {breadcrumbs}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
          A
        </div>
        <span className="text-sm text-muted-foreground">Admin</span>
      </div>
    </header>
  );
}

export { Sidebar };
