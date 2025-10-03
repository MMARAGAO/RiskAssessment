import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import Cookies from "js-cookie";

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

// Função para salvar dados nos cookies
const saveAuthToCookies = (
  user: User | null,
  session: Session | null,
  profile: UserProfile | null
) => {
  if (user && session) {
    // Salvar token
    Cookies.set("auth-token", session.access_token, {
      expires: 7, // 7 dias
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    // Salvar dados do usuário (sem informações sensíveis)
    const userData = {
      id: user.id,
      email: user.email,
      profile: profile,
    };

    Cookies.set("auth-user", JSON.stringify(userData), {
      expires: 7,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    console.log("Dados salvos nos cookies:", userData);
  } else {
    // Remover cookies
    Cookies.remove("auth-token");
    Cookies.remove("auth-user");
    console.log("Cookies removidos");
  }
};

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

          // Printar as credenciais no console
          console.log("Dados de login:", {
            emailOrNickname: data.emailOrNickname,
            password: data.password,
          });

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
            console.log("Email encontrado para o nickname:", emailToLogin);
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
            // Printar dados do usuário autenticado
            console.log("Usuário autenticado:", {
              id: authData.user.id,
              email: authData.user.email,
              session: authData.session,
            });

            // Buscar perfil do usuário
            const { data: profileData, error: profileError } = await supabase
              .from("users")
              .select("*")
              .eq("id", authData.user.id)
              .single();

            if (profileError) {
              console.warn("Erro ao buscar perfil:", profileError);
            } else {
              console.log("Perfil do usuário:", profileData);
            }

            // Salvar nos cookies
            saveAuthToCookies(authData.user, authData.session, profileData);

            set({
              user: authData.user,
              session: authData.session,
              profile: profileData || null,
              loading: false,
            });
          }
        } catch (error) {
          console.error("Erro durante o login:", error);
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

            // Salvar nos cookies se houver sessão
            if (authData.session) {
              saveAuthToCookies(
                authData.user,
                authData.session,
                insertData?.[0] || null
              );
            }

            set({
              user: authData.user,
              session: authData.session,
              profile: insertData?.[0] || null,
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

          // Limpar cookies
          saveAuthToCookies(null, null, null);

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

            // Atualizar cookies com dados atuais
            saveAuthToCookies(session.user, session, profileData);

            set({
              user: session.user,
              session,
              profile: profileData || null,
              loading: false,
            });
          } else {
            // Limpar cookies se não houver sessão
            saveAuthToCookies(null, null, null);

            set({
              user: null,
              session: null,
              profile: null,
              loading: false,
            });
          }
        } catch (error) {
          // Limpar cookies em caso de erro
          saveAuthToCookies(null, null, null);

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
