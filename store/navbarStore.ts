import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NavbarState {
  isExpanded: boolean;
  toggleNavbar: () => void;
  setExpanded: (expanded: boolean) => void;
}

export const useNavbarStore = create<NavbarState>()(
  persist(
    (set) => ({
      isExpanded: false,

      toggleNavbar: () => set((state) => ({ isExpanded: !state.isExpanded })),

      setExpanded: (expanded: boolean) => set({ isExpanded: expanded }),
    }),
    {
      name: "navbar-storage", // nome da chave no localStorage
      skipHydration: false,
    }
  )
);
