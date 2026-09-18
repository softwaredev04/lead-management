"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, Building2, User, KeyRound, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, isAuthenticated } from "@/lib/api";

function AuthorizeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("request") || "";
  const target = searchParams.get("target") || "lead-crm";

  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authorizing, setAuthorizing] = useState(false);

  const returnPath = useMemo(() => {
    const qs = new URLSearchParams();
    if (requestId) qs.set("request", requestId);
    if (target) qs.set("target", target);
    return `/connect/authorize?${qs.toString()}`;
  }, [requestId, target]);

  const load = useCallback(async () => {
    if (!requestId) {
      setError("Missing authorization request. Open Connect again from ERP.");
      setLoading(false);
      return;
    }

    if (!isAuthenticated()) {
      const ret = encodeURIComponent(returnPath);
      router.replace(`/login?returnTo=${ret}`);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await api.getIntegrationAuthorizeRequest(requestId);
      setMeta(res.data);
    } catch (err) {
      setError(err.message || "Invalid or expired authorization request");
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [requestId, returnPath, router]);

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  async function handleAuthorize() {
    if (!requestId || authorizing) return;
    setAuthorizing(true);
    try {
      await api.confirmIntegration({ requestId });
      toast.success("ClickMasters ERP connected");
      router.replace("/integrations?connected=1");
    } catch (err) {
      toast.error(err.message || "Authorization failed");
    } finally {
      setAuthorizing(false);
    }
  }

  function handleCancel() {
    toast.message("Connection cancelled — nothing was linked");
    router.replace("/integrations?cancelled=1");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/30 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-sm">
            C
          </div>
          <CardTitle className="text-xl">Connect ClickMasters ERP</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review this request and authorize access to Lead CRM.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm">Loading authorization request…</p>
            </div>
          )}

          {!loading && error && (
            <div className="space-y-4">
              <div className="flex gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">Cannot authorize</p>
                  <p className="mt-1 text-destructive/80">{error}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.replace("/dashboard")}
              >
                Back to dashboard
              </Button>
            </div>
          )}

          {!loading && !error && meta && (
            <>
              <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 size-4 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Company
                    </p>
                    <p className="truncate font-medium text-foreground">
                      {meta.companyName}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="mt-0.5 size-4 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Requested by
                    </p>
                    <p className="truncate font-medium text-foreground">
                      {meta.requesterName}
                      {meta.requesterEmail ? (
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          · {meta.requesterEmail}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <KeyRound className="mt-0.5 size-4 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Permissions
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {(meta.scopes || []).length === 0 ? (
                        <span className="text-sm text-muted-foreground">
                          No scopes listed
                        </span>
                      ) : (
                        meta.scopes.map((scope) => (
                          <Badge key={scope} variant="secondary">
                            {scope}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {meta.expiresAt && (
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Expires
                      </p>
                      <p className="text-sm text-foreground">
                        {new Date(meta.expiresAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Authorizing lets ClickMasters ERP call Lead CRM with the scopes
                above. You can revoke this connection anytime from Connected Apps.
              </p>

              <div className="flex flex-col gap-2 sm:flex-row-reverse">
                <Button
                  className="w-full sm:flex-1"
                  disabled={authorizing}
                  onClick={handleAuthorize}
                >
                  {authorizing ? "Authorizing…" : "Authorize"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:flex-1"
                  disabled={authorizing}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConnectAuthorizePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/30">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AuthorizeContent />
    </Suspense>
  );
}
