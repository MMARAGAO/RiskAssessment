"use client";
import React, { useState, useMemo } from "react";
import {
  Home,
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Building2,
  ClipboardCheck,
} from "lucide-react";
import { Divider } from "@heroui/divider";
import {
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface NavbarProps {
  isExpanded?: boolean;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: Home, label: "Home", href: "/sistema" },
  { icon: LayoutDashboard, label: "Dashboard", href: "/sistema/dashboard" },
  { icon: FileText, label: "Relatórios", href: "/sistema/relatorios" },
  // questionnaires
  { icon: ClipboardCheck, label: "Questionários", href: "/sistema/questionnaires" },
  { icon: Users, label: "Usuários", href: "/sistema/usuarios" },
  { icon: Building2, label: "Edifícios", href: "/sistema/buildings" },
  { icon: ClipboardCheck, label: "Questões", href: "/sistema/questions" },
  { icon: Settings, label: "Configurações", href: "/sistema/configuracoes" },
];

const VectorLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 45 50" className={className} fill="currentColor">
    <path d="M0 3C0 1.34315 1.34315 0 3 0H9C10.6569 0 12 1.34315 12 3V15.9567C12 16.4959 11.7823 17.0123 11.3962 17.3887L0 28.5V3Z" />
    <path d="M16.8547 35.1474C16.2044 34.3521 16.2623 33.1935 16.9887 32.4671L23.6059 25.8499C24.457 24.9988 25.8616 25.0868 26.5998 26.0375L35.5 37.5L44.6197 48.3568C45.1662 49.0074 44.7037 50 43.854 50H29.9481C29.348 50 28.7797 49.7306 28.3998 49.2661L16.8547 35.1474Z" />
    <path d="M0 31.8284C0 31.298 0.210714 30.7893 0.585786 30.4142L29.4142 1.58579C29.7893 1.21071 30.298 1 30.8284 1H43.6101C44.4976 1 44.9453 2.06999 44.3223 2.702L12.0756 35.416C11.7068 35.7902 11.5 36.2946 11.5 36.82V47C11.5 48.6569 10.1569 50 8.5 50H3C1.34315 50 0 48.6569 0 47V31.8284Z" />
  </svg>
);


    
export default function Navbar({ isExpanded = false }: NavbarProps) {
  const [expanded, setExpanded] = useState(isExpanded);
  const [isDark, setIsDark] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Pegar dados do usuário do Zustand
  const { profile, user, logout } = useAuthStore();

  const buttonClasses = useMemo(
    () => ({
      base: "flex items-center rounded-xl transition-all duration-500",
      expanded: "w-full h-12 px-4 py-3 space-x-3",
      collapsed: "w-12 h-12 mx-auto justify-center",
      active: "bg-blue-500 text-white hover:bg-blue-600",
      inactive:
        "text-zinc-400 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
    }),
    []
  );

  const textClasses = useMemo(
    () => ({
      visible: "opacity-100",
      hidden: "w-0 opacity-0",
      base: "overflow-hidden transition-all duration-500",
    }),
    []
  );

  const getButtonClass = (isActive = false) =>
    `${buttonClasses.base} ${expanded ? buttonClasses.expanded : buttonClasses.collapsed} ${isActive ? buttonClasses.active : buttonClasses.inactive}`;

  const getTextClass = (width: string) =>
    `${textClasses.base} ${expanded ? `${width} ${textClasses.visible}` : textClasses.hidden}`;

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/auth");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  // Gerar iniciais do nome para o avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-screen flex items-center sticky top-0 left-0 z-50">
      <div className="relative h-[98%] ml-2">
        <div
          className={`shadow-lg flex flex-col py-6 transition-all duration-500 ease-out relative h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-transparent rounded-2xl z-20 ${
            expanded ? "w-64 px-4" : "w-20 px-0"
          }`}
        >
          {/* Logo */}
          <div
            className={`flex items-center mb-6 transition-all duration-500 ${
              expanded ? "space-x-3 px-0" : "justify-center"
            }`}
          >
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 p-2">
              <VectorLogo className="w-full h-full text-white" />
            </div>
            <div className={getTextClass("w-42")}>
              <span className="font-semibold text-zinc-900 dark:text-white whitespace-nowrap w-full">
                Risk Assessment
              </span>
            </div>
          </div>
          {/* Main Navigation */}
          <nav className="flex-1 flex flex-col space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.href)}
                  className={getButtonClass(isActive)}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  <div className={getTextClass("w-28")}>
                    <span className="font-medium whitespace-nowrap">
                      {item.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
          <Divider className={`my-4 ${expanded ? "" : "mx-auto w-12"}`} />
          {/* User Profile */}
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <div
                className={`flex items-center transition-all duration-500 cursor-pointer ${
                  expanded ? "space-x-3 px-2" : "justify-center"
                }`}
              >
                <Avatar
                  isBordered
                  className="transition-transform"
                  color="primary"
                  name={profile?.name || "User"}
                  size="sm"
                  showFallback
                  fallback={
                    <div className="text-white w-full h-full flex items-center justify-center text-xs font-semibold">
                      {profile?.name ? getInitials(profile.name) : "U"}
                    </div>
                  }
                />
                {expanded && (
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate text-zinc-900 dark:text-white">
                      {profile?.name || "Usuário"}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">
                      @{profile?.nickname || "user"}
                    </p>
                  </div>
                )}
              </div>
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem
                key="profile"
                className="h-14 gap-2"
                textValue="Profile info"
              >
                <p className="font-semibold">Logado como</p>
                <p className="font-semibold text-blue-500">
                  {user?.email || "usuário"}
                </p>
              </DropdownItem>
              <DropdownItem
                key="settings"
                onClick={() => router.push("/sistema/configuracoes")}
                textValue="Settings"
              >
                Configurações
              </DropdownItem>
              <DropdownItem key="help" textValue="Help">
                Ajuda & Suporte
              </DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                onClick={handleLogout}
                textValue="Logout"
              >
                Sair
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`absolute top-1/2 -translate-y-1/2 w-9 h-[100px] transition-all duration-500 cursor-pointer group -right-[32px] select-none z-0 ${
            expanded
              ? "text-white dark:text-zinc-900 hover:text-zinc-100 dark:hover:text-zinc-800"
              : "text-blue-500 hover:text-blue-600"
          }`}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          <svg
            viewBox="0 0 36 107"
            className="w-full h-full"
            style={{ filter: "drop-shadow(2px 0 4px rgba(0, 0, 0, 0.1))" }}
            fill="currentColor"
          >
            <path d="M0.5 0L11.7345 23.9187C14.5202 29.8495 18.941 34.8618 24.4773 38.3665C35.8624 45.5739 36.5496 61.9321 25.809 70.0689L23.5446 71.7844C18.5908 75.5373 14.6351 80.4499 12.0254 86.0902L0.5 111V0Z" />
          </svg>
          {expanded ? (
            <ChevronLeft
              size={20}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 group-hover:text-blue-600 transition"
            />
          ) : (
            <ChevronRight
              size={20}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-100 dark:text-white group-hover:text-zinc-100 dark:group-hover:text-zinc-100 transition"
            />
          )}
        </button>
      </div>
    </div>
  );
}
