"use client";

import React from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { logout, loading, profile } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/auth");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-600">
            Bem-vindo ao painel de controle do sistema.
          </p>
          {profile && (
            <p className="text-sm text-gray-500 mt-2">
              Olá, {profile.name}! ({profile.email})
            </p>
          )}
        </div>

        <button
          onClick={handleLogout}
          disabled={loading}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Saindo..." : "Logout"}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Conteúdo do Dashboard</h2>
        <p>Aqui você pode adicionar o conteúdo principal do seu dashboard.</p>
      </div>
    </main>
  );
}
