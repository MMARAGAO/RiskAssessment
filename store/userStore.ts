import { create } from "zustand";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export interface User {
  id: string;
  email: string;
  name: string;
  nickname: string | null;
  cpf: string;
  phone: string;
  birth_date: string;
  created_at?: string;
  updated_at?: string;
}

interface UserStore {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  createUser: (
    user: Omit<User, "id" | "created_at" | "updated_at"> & { password: string }
  ) => Promise<void>;
  updateUser: (
    id: string,
    user: Partial<Omit<User, "id" | "email" | "created_at" | "updated_at">>
  ) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ users: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createUser: async (userData) => {
    set({ loading: true, error: null });
    try {
      // Criar usuário no auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) throw authError;

      // Criar usuário na tabela users
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: authData.user?.id,
          email: userData.email,
          name: userData.name,
          nickname: userData.nickname || null,
          cpf: userData.cpf,
          phone: userData.phone,
          birth_date: userData.birth_date,
        },
      ]);

      if (insertError) throw insertError;

      // Recarregar lista
      await useUserStore.getState().fetchUsers();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateUser: async (id, userData) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from("users")
        .update({ ...userData, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      // Recarregar lista
      await useUserStore.getState().fetchUsers();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteUser: async (id) => {
    set({ loading: true, error: null });
    try {
      // Tentar usar supabaseAdmin se disponível
      if (supabaseAdmin) {
        const { error: authError } =
          await supabaseAdmin.auth.admin.deleteUser(id);

        if (authError) throw authError;
      } else {
        // Se não tiver admin, deletar apenas da tabela
        const { error } = await supabase.from("users").delete().eq("id", id);

        if (error) throw error;
      }

      // Recarregar lista
      await useUserStore.getState().fetchUsers();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
