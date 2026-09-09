"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserRound,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Eye,
  EyeOff,
  KeyRound,
  AlertTriangle,
  CircleCheck,
  Briefcase,
  Target,
  Users,
} from "lucide-react";
import { roleLabel } from "@/lib/config";
import { formatRelativeTime } from "@/lib/utils";

const inputCls =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "viewer",
  isActive: true,
};

const ROLE_STYLES = {
  admin: {
    icon: ShieldCheck,
    cls: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  },
  manager: {
    icon: Briefcase,
    cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
  },
  team_lead: {
    icon: Users,
    cls: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400",
  },
  sales_agent: {
    icon: Target,
    cls: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  },
  viewer: {
    icon: Eye,
    cls: "bg-muted text-muted-foreground",
  },
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null); // current user (for self-guards in UI)

  // Add / Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null); // user being edited (null = add)
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Reset password dialog
  const [pwTarget, setPwTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");

  // View dialog
  const [viewTarget, setViewTarget] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api.getUsers();
      setUsers(data.users || []);
      setMe(data.me || null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // --- Add / Edit ---
  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(u) {
    setEditing(u);
    setForm({
      name: u.name || "",
      email: u.email || "",
      password: "", // leave blank = keep current password
      role: u.role || "viewer",
      isActive: u.isActive !== false,
    });
    setFormError("");
    setDialogOpen(true);
  }

  async function saveUser() {
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        const body = {
          name: form.name,
          email: form.email,
          role: form.role,
          isActive: form.isActive,
        };
        if (form.password) body.password = form.password;
        await api.updateUser(editing._id, body);
        toast.success("User updated.");
      } else {
        await api.createUser(form);
        toast.success("User created.");
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // --- Delete ---
  async function confirmDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      await api.deleteUser(deleteTarget._id);
      toast.success(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // --- Reset password ---
  async function resetPassword() {
    setPwSaving(true);
    setPwError("");
    try {
      await api.updateUser(pwTarget._id, { password: newPassword });
      toast.success(`Password updated for ${pwTarget.name}.`);
      setPwTarget(null);
      setNewPassword("");
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  }

  // --- Toggle active ---
  async function toggleActive(u) {
    try {
      await api.updateUser(u._id, { isActive: !u.isActive });
      toast.success(`${u.name} ${u.isActive ? "deactivated" : "activated"}.`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const isSelf = (u) => me && (u._id === me.id || u.email === me.email);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Users</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage who can sign in to the CRM and what they can do.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-1 size-3" />
            Refresh
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-1 size-3" />
            Add User
          </Button>
        </div>
      </div>

      {/* Users table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell>
                      <Skeleton className="h-4 w-44 rounded" />
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 rounded" /></TableCell>
                    <TableCell><Skeleton className="ml-auto h-5 w-24 rounded" /></TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow className="border-border hover:bg-transparent">
                  <TableCell colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                      <UserRound className="size-8 text-muted-foreground/40" />
                      <p className="font-medium">No users found</p>
                      <p>Add users so your team can sign in.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u._id} className="border-border transition-colors hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                          {(u.name || u.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-medium text-foreground">
                            {u.name}
                            {isSelf(u) && (
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                You
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                          (ROLE_STYLES[u.role] || ROLE_STYLES.viewer).cls
                        }`}
                      >
                        {(() => {
                          const RoleIcon = (ROLE_STYLES[u.role] || ROLE_STYLES.viewer).icon;
                          return <RoleIcon className="size-3" />;
                        })()}
                        {roleLabel(u.role)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          u.isActive !== false
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            u.isActive !== false ? "bg-emerald-500" : "bg-muted-foreground/40"
                          }`}
                        />
                        {u.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className="text-muted-foreground"
                        title={u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : ""}
                      >
                        {u.lastLoginAt ? formatRelativeTime(u.lastLoginAt) : "never"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="View details"
                          onClick={() => setViewTarget(u)}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Edit user"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Reset password"
                          onClick={() => {
                            setPwTarget(u);
                            setNewPassword("");
                            setPwError("");
                          }}
                        >
                          <KeyRound className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title={u.isActive !== false ? "Deactivate (blocks login)" : "Activate"}
                          disabled={isSelf(u)}
                          onClick={() => toggleActive(u)}
                        >
                          {u.isActive !== false ? (
                            <EyeOff className="size-3.5" />
                          ) : (
                            <CircleCheck className="size-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
                          title="Delete user"
                          disabled={isSelf(u)}
                          onClick={() => setDeleteTarget(u)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Add / Edit dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDialogOpen(false)}
          />
          <div className="animate-scale-in relative mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <UserRound className="size-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-foreground">
                  {editing ? "Edit User" : "Add User"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {editing
                    ? "Update the user details below."
                    : "Create a new account for the CRM."}
                </p>
                <div className="mt-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="u-name">Name</Label>
                    <Input
                      id="u-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ali Raza"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="u-email">Email</Label>
                    <Input
                      id="u-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="ali@clickmasters.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="u-password">
                      Password {editing && <span className="text-muted-foreground">(leave blank to keep current)</span>}
                    </Label>
                    <Input
                      id="u-password"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder={editing ? "••••••••" : "Min 6 characters"}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="u-role">Role</Label>
                      <select
                        id="u-role"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        className={`${inputCls} w-full`}
                      >
                        <option value="sales_agent">Sales Agent</option>
                        <option value="team_lead">Team Lead</option>
                        <option value="manager">Manager</option>
                        <option value="viewer">Viewer (read-only)</option>
                        <option value="admin">Admin (full access)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="u-active">Status</Label>
                      <select
                        id="u-active"
                        value={form.isActive ? "active" : "inactive"}
                        onChange={(e) => setForm({ ...form, isActive: e.target.value === "active" })}
                        className={`${inputCls} w-full`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  {formError && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                      {formError}
                    </div>
                  )}
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveUser}
                    disabled={saving || !form.name.trim() || !form.email.trim() || (!editing && !form.password)}
                  >
                    {saving ? "Saving…" : editing ? "Save Changes" : "Create User"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

            {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="animate-scale-in relative mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="size-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-foreground">Delete User</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-foreground">{deleteTarget.name}</span>? They will
                  no longer be able to sign in.
                </p>
                {deleteError && (
                  <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {deleteError}
                  </div>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" onClick={confirmDelete} disabled={deleting}>
                    {deleting ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

            {/* Reset password dialog */}
      {pwTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setPwTarget(null)}
          />
          <div className="animate-scale-in relative mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <KeyRound className="size-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-foreground">Reset Password</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Set a new password for{" "}
                  <span className="font-medium text-foreground">{pwTarget.name}</span>.
                </p>
                <div className="mt-4 space-y-1.5">
                  <Label htmlFor="u-new-password">New password</Label>
                  <Input
                    id="u-new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                  {pwError && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                      {pwError}
                    </div>
                  )}
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPwTarget(null)} disabled={pwSaving}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={resetPassword} disabled={pwSaving || newPassword.length < 6}>
                    {pwSaving ? "Updating…" : "Update Password"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

            {/* View details dialog */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setViewTarget(null)}
          />
          <div className="animate-scale-in relative mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                {(viewTarget.name || viewTarget.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-foreground">{viewTarget.name}</h2>
                <p className="text-sm text-muted-foreground">{viewTarget.email}</p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Role</span>
                    <span className="font-medium text-foreground">{roleLabel(viewTarget.role)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium text-foreground">
                      {viewTarget.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Created</span>
                    <span className="text-foreground">
                      {viewTarget.createdAt ? new Date(viewTarget.createdAt).toLocaleDateString() : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Last login</span>
                    <span className="text-foreground">
                      {viewTarget.lastLoginAt
                        ? new Date(viewTarget.lastLoginAt).toLocaleString()
                        : "Never"}
                    </span>
                  </div>
                </div>
                <div className="mt-5 flex justify-end">
                  <Button size="sm" onClick={() => setViewTarget(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}