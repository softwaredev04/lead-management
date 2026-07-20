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

export function Navbar() {
  const pathname = usePathname();
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <span className="text-sm font-medium">{titleFor(pathname)}</span>
      <span className="text-sm text-muted-foreground">Admin</span>
    </header>
  );
}

export { Sidebar };
