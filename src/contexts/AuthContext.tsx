import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const requestIdRef = useRef(0);

  const checkSuperAdmin = async (userId: string) => {
    const requestId = ++requestIdRef.current;
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (requestId !== requestIdRef.current) return;

    const roles = (data ?? []).map((r) => r.role);
    if (roles.includes("super_admin")) {
      setIsSuperAdmin(true);
    } else {
      setIsSuperAdmin(false);
      toast.error("Acesso restrito ao Portal HopeXT.", {
        description: "Sua conta não tem permissão de operador da plataforma.",
      });
      await supabase.auth.signOut();
    }
  };

  useEffect(() => {
    let isMounted = true;
    let initialized = false;

    const applySession = async (session: Session | null) => {
      if (!isMounted) return;

      setLoading(true);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await checkSuperAdmin(session.user.id);
      } else {
        requestIdRef.current += 1;
        setIsSuperAdmin(false);
      }

      if (isMounted) setLoading(false);
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      initialized = true;
      await applySession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!initialized) return;
      void applySession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, isSuperAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
