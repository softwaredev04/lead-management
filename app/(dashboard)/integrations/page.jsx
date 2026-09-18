"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Link2,
  Unplug,
  RefreshCw,
  Building2,
  Shield,
  Loader2,
} from "lucide-react";
import { api, getCurrentUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function IntegrationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disconnectingId, setDisconnectingId] = useState(null);

  const me = getCurrentUser();
  const isAdmin = !me || me.role === "admin";

  const load = useCallback(async () => {
    try {
      const res = await api.getIntegrations();
      setItems(res.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (searchParams.get("connected") === "1") {
      toast.success("ERP connected successfully");
      router.replace("/integrations");
    } else if (searchParams.get("cancelled") === "1") {
      toast.message("Authorization cancelled");
      router.replace("/integrations");
    }
  }, [searchParams, router]);

  async function handleDisconnect(id, companyName) {
    if (!isAdmin) {
      toast.error("Admin access required to disconnect");
      return;
    }
    if (
      !window.confirm(
        `Disconnect ${companyName || "this app"}? ERP will no longer be trusted by CRM until reconnect.`
      )
    ) {
      return;
    }

    setDisconnectingId(id);
    try {
      await api.disconnectIntegration(id);
      toast.success("Connection revoked");
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDisconnectingId(null);
    }
  }

  const active = items.filter((i) => i.status === "active");
  const revoked = items.filter((i) => i.status === "revoked");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Connected Apps</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage ERP links authorized from Project Connectors.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true);
            load();
          }}
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      ) : active.length === 0 && revoked.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Link2 className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No connected apps yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Start from ERP → Configurations → Project Connectors → Connect
                Lead CRM. You will land here after authorizing.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {active.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">Active</h2>
              {active.map((item) => (
                <IntegrationCard
                  key={item.id}
                  item={item}
                  isAdmin={isAdmin}
                  disconnecting={disconnectingId === item.id}
                  onDisconnect={() =>
                    handleDisconnect(item.id, item.companyName)
                  }
                />
              ))}
            </section>
          )}

          {revoked.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                Revoked
              </h2>
              {revoked.map((item) => (
                <IntegrationCard
                  key={item.id}
                  item={item}
                  isAdmin={isAdmin}
                  disconnecting={false}
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function IntegrationCard({ item, isAdmin, disconnecting, onDisconnect }) {
  const isActive = item.status === "active";

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shield className="size-4" />
            </div>
            <div>
              <p className="font-medium">ClickMasters ERP</p>
              <p className="text-xs text-muted-foreground">{item.provider}</p>
            </div>
            <Badge variant={isActive ? "default" : "outline"}>
              {isActive ? "Connected" : "Revoked"}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="size-3.5 shrink-0" />
            <span className="truncate">
              {item.companyName || "Unknown company"}
            </span>
          </div>

          {(item.scopes || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {item.scopes.map((scope) => (
                <Badge key={scope} variant="secondary">
                  {scope}
                </Badge>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {isActive ? "Connected" : "Revoked"}{" "}
            {item.connectedAt
              ? new Date(
                  isActive ? item.connectedAt : item.revokedAt || item.connectedAt
                ).toLocaleString()
              : ""}
            {item.connectedByName ? ` · by ${item.connectedByName}` : ""}
          </p>
        </div>

        {isActive && isAdmin && onDisconnect && (
          <Button
            variant="outline"
            size="sm"
            disabled={disconnecting}
            onClick={onDisconnect}
            className="shrink-0 text-destructive hover:text-destructive"
          >
            {disconnecting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Unplug className="size-3.5" />
            )}
            Disconnect
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      }
    >
      <IntegrationsContent />
    </Suspense>
  );
}
