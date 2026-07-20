"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setServices(await api.getServices());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Service categories offered across ClickMasters websites.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-2xl" />
          ))
        ) : services.length === 0 ? (
          <p className="text-sm text-muted-foreground">No services found.</p>
        ) : (
          services.map((s) => (
            <div
              key={s._id}
              className="flex items-center rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium"
            >
              {s.name}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
