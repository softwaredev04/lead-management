"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Globe, CheckCircle } from "lucide-react";

export default function WebsitesPage() {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setWebsites(await api.getWebsites());
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
        <h1 className="text-xl font-bold tracking-tight text-foreground">Websites</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          ClickMasters sites sending leads to this system.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell><Skeleton className="h-4 w-40 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-56 rounded" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="ml-auto h-5 w-16 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : websites.length === 0 ? (
                <TableRow className="border-border hover:bg-transparent">
                  <TableCell colSpan={3} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="size-8 text-muted-foreground/40" />
                      <p className="font-medium">No websites found</p>
                      <p>Add websites to start receiving leads.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                websites.map((w) => (
                  <TableRow key={w._id} className="border-border transition-colors hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Globe className="size-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{w.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {w.domain}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                        <CheckCircle className="size-3" />
                        {w.status || "Active"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
