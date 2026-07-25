"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Layers, Wrench } from "lucide-react";

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setServices(await api.getServices());
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Services</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Service categories offered across ClickMasters websites.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))
        ) : services.length === 0 ? (
          <div className="col-span-full flex flex-col items-center gap-3 py-16 text-sm text-muted-foreground">
            <Wrench className="size-10 text-muted-foreground/40" />
            <p>No services found.</p>
          </div>
        ) : (
          services.map((s, i) => (
            <Card key={s._id} className="animate-fade-in transition-all duration-200 hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Layers className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Service #{i + 1}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
