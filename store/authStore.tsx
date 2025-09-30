import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  cpf: string;
  phone: string;
  birth_date: string;
  created_at: string;
  updated_at: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  nickname?: string;
  cpf: string;
  phone: string;
  birthDate: string;
}

interface LoginData {
  emailOrNickname: string;
  password: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;

  // Actions
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      session: null,
      loading: false,
      error: null,

      login: async (data: LoginData) => {
        try {
          set({ loading: true, error: null });

          let emailToLogin = data.emailOrNickname;

          // Verificar se é um nickname (não contém @)
          if (!data.emailOrNickname.includes("@")) {
            // Buscar o email correspondente ao nickname
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("email")
              .eq("nickname", data.emailOrNickname)
              .single();

            if (userError || !userData) {
              throw new Error("Nickname não encontrado ou não existe");
            }

            emailToLogin = userData.email;
          }

          const { data: authData, error: authError } =
            await supabase.auth.signInWithPassword({
              email: emailToLogin,
              password: data.password,
            });

          if (authError) {
            throw new Error(authError.message);
          }

          if (authData.user) {
            // Buscar perfil do usuário
            const { data: profileData, error: profileError } = await supabase
              .from("users")
              .select("*")
              .eq("id", authData.user.id)
              .single();

            if (profileError) {
              console.warn("Erro ao buscar perfil:", profileError);
            }

            set({
              user: authData.user,
              session: authData.session,
              profile: profileData || null,
              loading: false,
            });
          }
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Erro ao fazer login",
            loading: false,
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        try {
          set({ loading: true, error: null });

          // Registrar usuário no Supabase Auth
          const { data: authData, error: authError } =
            await supabase.auth.signUp({
              email: data.email,
              password: data.password,
            });

          if (authError) {
            throw new Error(authError.message);
          }

          if (authData.user) {
            console.log("Usuário criado no Auth:", authData.user.id);

            // Criar perfil do usuário na tabela users
            const { data: insertData, error: profileError } = await supabase
              .from("users")
              .insert({
                id: authData.user.id,
                email: data.email,
                password_hash: "managed_by_auth", // Placeholder
                name: data.name,
                nickname: data.nickname || null,
                cpf: data.cpf,
                phone: data.phone,
                birth_date: data.birthDate,
              })
              .select();

            if (profileError) {
              console.error("Erro completo do perfil:", profileError);

              // IMPORTANTE: Deletar o usuário do Auth se não conseguir criar o perfil
              try {
                await supabaseAdmin?.auth.admin.deleteUser(authData.user.id);
                console.log(
                  "Usuário removido do Auth devido ao erro no perfil"
                );
              } catch (deleteError) {
                console.error("Erro ao deletar usuário do Auth:", deleteError);
              }

              throw new Error(`Erro ao criar perfil: ${profileError.message}`);
            }

            console.log("Perfil criado com sucesso:", insertData);

            set({
              user: authData.user,
              session: authData.session,
              loading: false,
            });
          }
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Erro ao criar conta",
            loading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ loading: true });

          const { error } = await supabase.auth.signOut();

          if (error) {
            throw new Error(error.message);
          }

          set({
            user: null,
            profile: null,
            session: null,
            loading: false,
            error: null,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Erro ao fazer logout",
            loading: false,
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      checkAuth: async () => {
        try {
          set({ loading: true });

          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) {
            throw new Error(error.message);
          }

          if (session?.user) {
            // Buscar perfil do usuário
            const { data: profileData, error: profileError } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single();

            if (profileError) {
              console.warn("Erro ao buscar perfil:", profileError);
            }

            set({
              user: session.user,
              session,
              profile: profileData || null,
              loading: false,
            });
          } else {
            set({
              user: null,
              session: null,
              profile: null,
              loading: false,
            });
          }
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Erro ao verificar autenticação",
            loading: false,
            user: null,
            session: null,
            profile: null,
          });
        }
      },
      forgotPassword: async (email: string) => {
        try {
          set({ loading: true, error: null });

          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
          });

          if (error) {
            throw new Error(error.message);
          }

          set({ loading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Erro ao enviar email de recuperação",
            loading: false,
          });
          throw error;
        }
      },
      resetPassword: async (password: string) => {
        try {
          set({ loading: true, error: null });

          const { error } = await supabase.auth.updateUser({
            password: password,
          });

          if (error) {
            throw new Error(error.message);
          }

          set({ loading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Erro ao redefinir senha",
            loading: false,
          });
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        session: state.session,
      }),
    }
  )
);

// Hook para verificar se usuário está autenticado
export const useAuth = () => {
  const { user, profile, session, loading } = useAuthStore();
  return {
    isAuthenticated: !!user && !!session,
    user,
    profile,
    session,
    loading,
  };
};
