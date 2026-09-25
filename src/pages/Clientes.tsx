import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { STATUS_LABELS, STATUS_BADGE_VARIANT, daysUntil, type TenantStatus } from "@/lib/tenantStatus";
import { cn } from "@/lib/utils";

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  trial_ends_at: string | null;
  created_at: string;
}

const FILTERS: { key: "all" | TenantStatus; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Ativos" },
  { key: "trial", label: "Trial" },
  { key: "past_due", label: "Inadimplentes" },
  { key: "blocked", label: "Bloqueados" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function Clientes() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | TenantStatus>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [portalName, setPortalName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [startAsTrial, setStartAsTrial] = useState(true);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tenants")
      .select("id, name, slug, status, trial_ends_at, created_at")
      .order("created_at", { ascending: false });
    setTenants((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return tenants
      .filter((t) => filter === "all" || t.status === filter)
      .filter((t) => query.trim() === "" || t.name.toLowerCase().includes(query.trim().toLowerCase()));
  }, [tenants, filter, query]);

  const resetForm = () => {
    setName(""); setSlug(""); setPortalName(""); setPrimaryColor("");
    setStartAsTrial(true); setAdminName(""); setAdminEmail("");
  };

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim() || !adminEmail.trim()) {
      toast.error("Preencha nome do cliente, slug e e-mail do admin");
      return;
    }
    setSubmitting(true);

    const trialEndsAt = startAsTrial ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null;

    const { data: tenant, error: tenantErr } = await supabase
      .from("tenants")
      .insert({
        name: name.trim(),
        slug: slugify(slug),
        status: startAsTrial ? "trial" : "active",
        trial_ends_at: trialEndsAt,
        activated_at: startAsTrial ? null : new Date().toISOString(),
      })
      .select("id")
      .single();

    if (tenantErr || !tenant) {
      toast.error("Erro ao criar cliente", { description: tenantErr?.message });
      setSubmitting(false);
      return;
    }

    const { error: brandingErr } = await supabase.from("tenant_branding").insert({
      tenant_id: tenant.id,
      portal_name: portalName.trim() || name.trim(),
      primary_color: primaryColor.trim() || null,
    });
    if (brandingErr) {
      toast.error("Cliente criado, mas houve erro na marca", { description: brandingErr.message });
    }

    const { data: fnData, error: fnError } = await supabase.functions.invoke("admin-users?action=create", {
      body: {
        email: adminEmail.trim().toLowerCase(),
        full_name: adminName.trim() || adminEmail.trim(),
        role: "admin",
        tenant_id: tenant.id,
      },
    });

    if (fnError || (fnData as any)?.error) {
      toast.error("Cliente criado, mas houve erro ao criar o admin", {
        description: fnError?.message || (fnData as any)?.error,
      });
    } else {
      toast.success("Cliente e admin criados!", {
        description: 'O admin usa "esqueci minha senha" no login do produto para definir a senha.',
      });
    }

    resetForm();
    setOpen(false);
    setSubmitting(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">Empresas licenciadas, com dados e marca isolados.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo Cliente</Button></DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Cadastrar Cliente</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do cliente *</Label>
                <Input value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(slugify(e.target.value)); }} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} maxLength={60} placeholder="ex: empresa-x" />
              </div>
              <div className="space-y-2">
                <Label>Nome do portal (aparece no menu do produto)</Label>
                <Input value={portalName} onChange={(e) => setPortalName(e.target.value)} maxLength={100} placeholder={name || "ex: Portal Empresa X"} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Cor primária (HSL, ex: 222 47% 30%)</Label>
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="opcional" />
              </div>
              <div className="flex items-center gap-2 rounded-md border p-3">
                <input
                  id="trial"
                  type="checkbox"
                  checked={startAsTrial}
                  onChange={(e) => setStartAsTrial(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="trial" className="cursor-pointer">Começar em trial (7 dias)</Label>
              </div>
              <hr />
              <div className="space-y-2">
                <Label>Nome do admin do cliente *</Label>
                <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>E-mail do admin do cliente *</Label>
                <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} maxLength={200} />
              </div>
              <Button onClick={handleCreate} disabled={submitting} className="w-full">
                {submitting ? "Criando..." : "Criar cliente"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente..." className="pl-9" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trial termina em</TableHead>
                  <TableHead>Cliente desde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => {
                  const trialDays = daysUntil(t.trial_ends_at);
                  return (
                    <TableRow key={t.id} className="cursor-pointer">
                      <TableCell>
                        <Link to={`/clientes/${t.id}`} className="font-medium hover:underline">{t.name}</Link>
                      </TableCell>
                      <TableCell><Badge variant={STATUS_BADGE_VARIANT[t.status]}>{STATUS_LABELS[t.status]}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.status === "trial" && trialDays !== null
                          ? trialDays >= 0 ? `${trialDays} dia(s)` : "expirado"
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
