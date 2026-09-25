import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Clock, AlertTriangle, ShieldOff } from "lucide-react";
import { STATUS_LABELS, STATUS_BADGE_VARIANT, type TenantStatus } from "@/lib/tenantStatus";

interface TenantRow {
  id: string;
  name: string;
  status: TenantStatus;
  created_at: string;
}

export default function Dashboard() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("tenants")
      .select("id, name, status, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTenants((data as any) || []);
        setLoading(false);
      });
  }, []);

  const counts = {
    total: tenants.length,
    active: tenants.filter((t) => t.status === "active").length,
    trial: tenants.filter((t) => t.status === "trial").length,
    issue: tenants.filter((t) => t.status === "past_due" || t.status === "blocked").length,
  };

  const kpis = [
    { label: "Total de clientes", value: counts.total, icon: Building2 },
    { label: "Ativos", value: counts.active, icon: ShieldOff },
    { label: "Em trial", value: counts.trial, icon: Clock },
    { label: "Inadimplentes / bloqueados", value: counts.issue, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Visão geral</h1>
        <p className="text-sm text-muted-foreground">Status comercial de todos os clientes da HopeXT.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-l-4 border-l-accent">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">{k.label}</p>
                <p className="text-3xl font-bold tabular-nums">{loading ? "—" : k.value}</p>
              </div>
              <k.icon className="h-8 w-8 text-muted-foreground/40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clientes recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tenants.slice(0, 8).map((t) => (
            <Link
              key={t.id}
              to={`/clientes/${t.id}`}
              className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-secondary"
            >
              <span className="font-medium">{t.name}</span>
              <Badge variant={STATUS_BADGE_VARIANT[t.status]}>{STATUS_LABELS[t.status]}</Badge>
            </Link>
          ))}
          {!loading && tenants.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum cliente cadastrado ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
