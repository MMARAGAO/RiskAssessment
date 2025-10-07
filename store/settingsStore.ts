import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";
export type Language = "pt-BR" | "en-US" | "es-ES";

interface NotificationSettings {
  email: boolean;
  push: boolean;
  assessment_completed: boolean;
  risk_critical: boolean;
  weekly_report: boolean;
}

interface SystemSettings {
  auto_backup: boolean;
  backup_frequency: "daily" | "weekly" | "monthly";
  data_retention: string;
  max_file_size: string;
  enable_api: boolean;
  maintenance_mode: boolean;
}

interface SettingsState {
  // Aparência
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;

  // Notificações
  notifications: NotificationSettings;
  setNotifications: (notifications: Partial<NotificationSettings>) => void;

  // Sistema
  systemSettings: SystemSettings;
  setSystemSettings: (settings: Partial<SystemSettings>) => void;

  // Reset
  resetSettings: () => void;
}

const defaultNotifications: NotificationSettings = {
  email: true,
  push: true,
  assessment_completed: true,
  risk_critical: true,
  weekly_report: false,
};

const defaultSystemSettings: SystemSettings = {
  auto_backup: true,
  backup_frequency: "weekly",
  data_retention: "90",
  max_file_size: "10",
  enable_api: true,
  maintenance_mode: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Estados iniciais
      theme: "system",
      language: "pt-BR",
      notifications: defaultNotifications,
      systemSettings: defaultSystemSettings,

      // Ações
      setTheme: (theme) => {
        set({ theme });

        // Aplicar tema ao documento
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else if (theme === "light") {
          document.documentElement.classList.remove("dark");
        } else {
          // System theme
          const isDark = window.matchMedia(
            "(prefers-color-scheme: dark)"
          ).matches;
          if (isDark) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      },

      setLanguage: (language) => set({ language }),

      setNotifications: (notifications) =>
        set((state) => ({
          notifications: { ...state.notifications, ...notifications },
        })),

      setSystemSettings: (settings) =>
        set((state) => ({
          systemSettings: { ...state.systemSettings, ...settings },
        })),

      resetSettings: () =>
        set({
          theme: "system",
          language: "pt-BR",
          notifications: defaultNotifications,
          systemSettings: defaultSystemSettings,
        }),
    }),
    {
      name: "settings-storage",
    }
  )
);
