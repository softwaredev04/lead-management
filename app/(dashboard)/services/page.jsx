"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setServices(await api.getServices());
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []);

  if (error) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {services.length === 0 && (
          <p className="text-sm text-muted-foreground">No services found.</p>
        )}
        {services.map((s) => (
          <div
            key={s._id}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium"
          >
            {s.name}
          </div>
        ))}
      </div>
    </div>
  );
}
