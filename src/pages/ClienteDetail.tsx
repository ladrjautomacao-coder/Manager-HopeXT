import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { STATUS_LABELS, STATUS_BADGE_VARIANT, type TenantStatus } from "@/lib/tenantStatus";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  trial_ends_at: string | null;
  activated_at: string | null;
  blocked_reason: string | null;
  created_at: string;
}

interface Branding {
  portal_name: string | null;
  primary_color: string | null;
  sidebar_color: string | null;
  accent_color: string | null;
}

interface Member {
  user_id: string;
  full_name: string | null;
  cargo: string | null;
}

export default function ClienteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branding, setBranding] = useState<Branding>({ portal_name: "", primary_color: "", sidebar_color: "", accent_color: "" });
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: t }, { data: b }, { data: m }] = await Promise.all([
      supabase.from("tenants").select("*").eq("id", id).maybeSingle(),
      supabase.from("tenant_branding").select("portal_name, primary_color, sidebar_color, accent_color").eq("tenant_id", id).maybeSingle(),
      supabase.from("profiles").select("user_id, full_name, cargo").eq("tenant_id", id),
    ]);
    setTenant((t as any) || null);
    if (b) setBranding(b as any);
    setMembers((m as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const setStatus = async (status: TenantStatus, extra: Record<string, any> = {}) => {
    if (!id) return;
    setSaving(true);
    const { error } = await supabase.from("tenants").update({ status, ...extra }).eq("id", id);
    if (error) toast.error("Erro ao atualizar status", { description: error.message });
    else toast.success(`Cliente marcado como "${STATUS_LABELS[status]}"`);
    setSaving(false);
    load();
  };

  const extendTrial = () => {
    const trial_ends_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    setStatus("trial", { trial_ends_at });
  };

  const saveBranding = async () => {
    if (!id) return;
    setSaving(true);
    const { error } = await supabase.from("tenant_branding").upsert({ tenant_id: id, ...branding });
    if (error) toast.error("Erro ao salvar marca", { description: error.message });
    else toast.success("Marca atualizada");
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!id || !tenant) return;
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke("delete-tenant", { body: { tenant_id: id } });
    if (error || (data as any)?.error) {
      toast.error("Erro ao excluir cliente", { description: (data as any)?.error || error?.message });
      setDeleting(false);
      return;
    }
    toast.success(`"${tenant.name}" foi excluído`);
    navigate("/clientes");
  };

  if (loading) {
    return <div className="flex justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }
  if (!tenant) {
    return <p className="py-12 text-center text-muted-foreground">Cliente não encontrado.</p>;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/clientes")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold">
            {tenant.name}
            <Badge variant={STATUS_BADGE_VARIANT[tenant.status]}>{STATUS_LABELS[tenant.status]}</Badge>
          </h1>
          <p className="text-sm text-muted-foreground">slug: {tenant.slug} · cliente desde {new Date(tenant.created_at).toLocaleDateString("pt-BR")}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Status comercial</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={saving || tenant.status === "active"} onClick={() => setStatus("active", { activated_at: new Date().toISOString() })}>Ativar</Button>
          <Button variant="outline" size="sm" disabled={saving || tenant.status === "trial"} onClick={extendTrial}>Estender trial (+7 dias)</Button>
          <Button variant="outline" size="sm" disabled={saving || tenant.status === "past_due"} onClick={() => setStatus("past_due")}>Marcar inadimplente</Button>
          <Button variant="destructive" size="sm" disabled={saving || tenant.status === "blocked"} onClick={() => setStatus("blocked")}>Bloquear</Button>
          <Button variant="destructive" size="sm" disabled={saving || tenant.status === "canceled"} onClick={() => setStatus("canceled")}>Cancelar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Marca (white-label)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do portal</Label>
            <Input value={branding.portal_name || ""} onChange={(e) => setBranding((b) => ({ ...b, portal_name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Cor primária</Label>
              <Input value={branding.primary_color || ""} onChange={(e) => setBranding((b) => ({ ...b, primary_color: e.target.value }))} placeholder="273 70% 32%" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Cor da barra lateral</Label>
              <Input value={branding.sidebar_color || ""} onChange={(e) => setBranding((b) => ({ ...b, sidebar_color: e.target.value }))} placeholder="273 70% 18%" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Cor de destaque</Label>
              <Input value={branding.accent_color || ""} onChange={(e) => setBranding((b) => ({ ...b, accent_color: e.target.value }))} placeholder="17 89% 54%" />
            </div>
          </div>
          <Button size="sm" disabled={saving} onClick={saveBranding}>{saving ? "Salvando..." : "Salvar marca"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Usuários deste cliente</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado ainda.</p>
          ) : (
            members.map((m) => (
              <div key={m.user_id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>{m.full_name || "—"}</span>
                <span className="text-muted-foreground">{m.cargo || "—"}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {tenant.slug !== "transdata" && (
        <Card className="border-destructive/40">
          <CardHeader><CardTitle className="text-base text-destructive">Zona de risco</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Exclui o cliente, os usuários dele, todos os projetos e dados relacionados. Não pode ser desfeito.
            </p>
            <Dialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setConfirmText(""); }}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">Excluir cliente</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Excluir "{tenant.name}"?</DialogTitle>
                  <DialogDescription>
                    Essa ação é permanente. Todos os projetos, usuários, anexos e configurações desse
                    cliente serão apagados. Digite <strong>{tenant.name}</strong> abaixo pra confirmar.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={tenant.name} />
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={deleting || confirmText !== tenant.name}
                    onClick={handleDelete}
                  >
                    {deleting ? "Excluindo..." : "Excluir definitivamente"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
