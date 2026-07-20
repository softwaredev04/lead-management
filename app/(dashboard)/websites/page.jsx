"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function WebsitesPage() {
  const [websites, setWebsites] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setWebsites(await api.getWebsites());
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []);

  if (error) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Websites</h1>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Domain</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {websites.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  No websites found.
                </td>
              </tr>
            )}
            {websites.map((w) => (
              <tr key={w._id} className="hover:bg-muted">
                <td className="px-4 py-3 font-medium">{w.name}</td>
                <td className="px-4 py-3">{w.domain}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize">
                    {w.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
