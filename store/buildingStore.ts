import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface Building {
  id: string;
  user_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  total_floors: number;
  total_area: number | null;
  construction_year: number | null;
  building_type: string;
  occupancy_type: string | null;
  structure_type: string | null;
  has_basement: boolean;
  has_elevator: boolean;
  has_fire_system: boolean;
  has_sprinkler: boolean;
  has_alarm: boolean;
  has_emergency_exit: boolean;
  has_generator: boolean;
  notes: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export type BuildingFormData = Omit<
  Building,
  "id" | "user_id" | "created_at" | "updated_at"
>;

interface BuildingStore {
  buildings: Building[];
  loading: boolean;
  error: string | null;
  fetchBuildings: () => Promise<Building[]>; // ✅ Mudado de void para Building[]
  createBuilding: (building: BuildingFormData) => Promise<void>;
  updateBuilding: (
    id: string,
    building: Partial<BuildingFormData>
  ) => Promise<void>;
  deleteBuilding: (id: string) => Promise<void>;
}

export const useBuildingStore = create<BuildingStore>((set) => ({
  buildings: [],
  loading: false,
  error: null,

  fetchBuildings: async () => {
    set({ loading: true, error: null });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase
        .from("buildings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("🏢 Buildings carregados:", data?.length || 0);
      set({ buildings: data || [], loading: false });
      return data || []; // ✅ Agora retorna os dados corretamente
    } catch (error: any) {
      console.error("❌ Erro ao carregar buildings:", error);
      set({ error: error.message, loading: false, buildings: [] });
      return []; // ✅ Retorna array vazio em caso de erro
    }
  },

  createBuilding: async (buildingData) => {
    set({ loading: true, error: null });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const { error } = await supabase.from("buildings").insert([
        {
          ...buildingData,
          user_id: user.id,
        },
      ]);

      if (error) throw error;

      await useBuildingStore.getState().fetchBuildings();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateBuilding: async (id, buildingData) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from("buildings")
        .update(buildingData)
        .eq("id", id);

      if (error) throw error;

      await useBuildingStore.getState().fetchBuildings();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteBuilding: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.from("buildings").delete().eq("id", id);

      if (error) throw error;

      await useBuildingStore.getState().fetchBuildings();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
