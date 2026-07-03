"use client";

import { useEffect } from "react";
import { Users, Shield, Activity, BarChart3 } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAnalyticsStore } from "@/store/useAnalyticsStore";
import { useUserStore } from "@/store/useUserStore";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SuperAdminDashboard() {
  const { analytics, auditLogs, permissions, isLoading, fetchAnalytics, fetchAuditLogs, fetchPermissions } = useAnalyticsStore();
  const { users, fetchUsers } = useUserStore();

  useEffect(() => {
    fetchAnalytics();
    fetchAuditLogs();
    fetchPermissions();
    fetchUsers();
  }, [fetchAnalytics, fetchAuditLogs, fetchPermissions, fetchUsers]);

  if (isLoading || !analytics) return <DashboardSkeleton />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Super Administrator Dashboard</h1>
          <p className="text-muted-foreground">System overview and user management</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/users">Manage Users</Link>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={analytics.dashboard.users.total} icon={Users} />
        <StatCard title="Active Users" value={users.filter((u) => u.status === "active").length} icon={Activity} />
        <StatCard title="Roles Defined" value={4} icon={Shield} />
        <StatCard title="Participants Registered" value={analytics.dashboard.registrations.total} icon={BarChart3} />
      </div>

      <Card>
        <CardHeader><CardTitle>Permission Matrix</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permission</TableHead>
                <TableHead>Base User</TableHead>
                <TableHead>Moderator</TableHead>
                <TableHead>Event Admin</TableHead>
                <TableHead>Super Admin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((perm) => (
                <TableRow key={perm.id}>
                  <TableCell className="font-medium">{perm.name}</TableCell>
                  {(["base_user", "moderator", "event_administrator", "super_administrator"] as const).map((role) => (
                    <TableCell key={role}>
                      <Badge variant={perm.roles[role] ? "success" : "secondary"}>
                        {perm.roles[role] ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Audit Logs</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.userName}</TableCell>
                  <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                  <TableCell>{log.resource}</TableCell>
                  <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDateTime(log.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
