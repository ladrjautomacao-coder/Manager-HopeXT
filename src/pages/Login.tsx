import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const HOPEXT_LOGO_URL = "https://emzqlctomlsjwmgthbkv.supabase.co/storage/v1/object/public/tenant-logos/hopext-default.png";

export default function Login() {
  const { user, isSuperAdmin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user && isSuperAdmin) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      toast.error("Não foi possível entrar", { description: error.message });
    }
    setSubmitting(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-hopeDark px-4 font-['Plus_Jakarta_Sans',sans-serif] text-gray-100">
      {/* Iluminação ambiente — mesmo padrão da página pública */}
      <div className="pointer-events-none absolute -left-[10%] -top-[10%] h-[500px] w-[500px] rounded-full blur-[100px]"
        style={{ background: "radial-gradient(circle, rgba(157,78,221,0.20) 0%, rgba(0,0,0,0) 70%)" }} />
      <div className="pointer-events-none absolute -right-[10%] bottom-[-10%] h-[500px] w-[500px] rounded-full blur-[100px]"
        style={{ background: "radial-gradient(circle, rgba(0,229,255,0.16) 0%, rgba(0,0,0,0) 70%)" }} />
      <div className="pointer-events-none absolute inset-0"
        style={{
          backgroundSize: "40px 40px",
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)",
        }} />

      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-hopeCard p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={HOPEXT_LOGO_URL} alt="HopeXT" className="mb-3 h-16 w-16 rounded-full object-cover"
            style={{ filter: "drop-shadow(0 0 25px rgba(0,229,255,0.28)) drop-shadow(0 0 40px rgba(157,78,221,0.22))" }} />
          <span className="font-brand text-2xl font-black tracking-tight"
            style={{ background: "linear-gradient(135deg,#00E5FF 0%,#a855f7 50%,#ec4899 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Portal HopeXT
          </span>
          <p className="mt-1 text-sm text-gray-400">Console interno de gestão de clientes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-300">E-mail</label>
            <input
              id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0d0d1a]/80 px-4 py-3 text-sm text-white placeholder-gray-500 transition-all focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-300">Senha</label>
            <input
              id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0d0d1a]/80 px-4 py-3 text-sm text-white placeholder-gray-500 transition-all focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full rounded-xl px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-white shadow-lg shadow-purple-600/30 transition-all hover:brightness-110 disabled:opacity-60"
            style={{ background: "linear-gradient(90deg,#00b4d8 0%,#8338ec 50%,#d946ef 100%)" }}>
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
