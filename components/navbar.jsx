import { Sidebar } from "@/components/sidebar";

export function Navbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <span className="text-sm text-muted-foreground">Lead Management System</span>
      <span className="text-sm font-medium">Admin</span>
    </header>
  );
}

export { Sidebar };
