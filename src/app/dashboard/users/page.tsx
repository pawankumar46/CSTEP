"use client";

import { useEffect, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2, UserX } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/useUserStore";
import type { User } from "@/types";

export default function UsersPage() {
  return (
    <RouteGuard allowedRoles={["super_administrator"]}>
      <UsersContent />
    </RouteGuard>
  );
}

function UsersContent() {
  const { users, isLoading, fetchUsers, updateUserStatus, deleteUser } = useUserStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone" },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "active" ? "success" : row.original.status === "suspended" ? "destructive" : "warning"} className="capitalize">
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Eye className="h-3 w-3" /></Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Pencil className="h-3 w-3" /></Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => updateUserStatus(row.original.id, "suspended")}>
            <UserX className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteUser(row.original.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ], [updateUserStatus, deleteUser]);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage users, roles, and permissions</p>
      </div>
      <DataTable columns={columns} data={users} searchKey="email" searchPlaceholder="Search users..." pageSize={10} />
    </div>
  );
}
