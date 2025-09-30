"use client";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { resetPassword, loading } = useAuthStore();
  const router = useRouter();

  // Verificar e processar o token do reset quando a página carrega
  useEffect(() => {
    const handleAuthStateChange = async () => {
      try {
        // Verificar se há um hash na URL (token de reset)
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        if (type === "recovery" && accessToken && refreshToken) {
          // Definir a sessão com os tokens do reset
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("Erro ao definir sessão:", error);
            setError(
              "Link inválido ou expirado. Solicite um novo link de recuperação."
            );
          } else {
            console.log("Sessão definida para reset:", data);
            setIsReady(true);
          }
        } else {
          setError(
            "Link inválido ou expirado. Solicite um novo link de recuperação."
          );
        }
      } catch (err) {
        console.error("Erro no processamento do reset:", err);
        setError("Erro ao processar link de recuperação.");
      }
    };

    handleAuthStateChange();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      setError(null);
      await resetPassword(password);
      setSuccess(true);

      // Limpar hash da URL
      window.history.replaceState(null, "", window.location.pathname);

      setTimeout(() => {
        router.push("/auth");
      }, 2000);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Erro ao redefinir senha"
      );
    }
  };

  // Mostrar loading enquanto processa o token
  if (!isReady && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-primary animate-spin rounded-full mx-auto"></div>
          <p>Processando link de recuperação...</p>
        </div>
      </div>
    );
  }

  // Mostrar erro se o token for inválido
  if (error && !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">❌ Link Inválido</h1>
          <p className="text-gray-600">{error}</p>
          <Button color="primary" onClick={() => router.push("/auth")}>
            Voltar ao Login
          </Button>
        </div>
      </div>
    );
  }

  // Mostrar sucesso
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-green-600">
            ✅ Senha redefinida!
          </h1>
          <p>Redirecionando para o login...</p>
        </div>
      </div>
    );
  }

  // Formulário de nova senha
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Nova Senha</h1>
          <p className="text-gray-600 mt-2">Digite sua nova senha</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nova Senha"
            placeholder="Digite sua nova senha"
            type={isPasswordVisible ? "text" : "password"}
            variant="bordered"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            startContent={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
            endContent={
              <button
                type="button"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                {isPasswordVisible ? (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            }
            isRequired
            minLength={6}
          />

          <Input
            label="Confirmar Senha"
            placeholder="Confirme sua nova senha"
            type={isPasswordVisible ? "text" : "password"}
            variant="bordered"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            startContent={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
            isInvalid={
              confirmPassword.length > 0 && password !== confirmPassword
            }
            errorMessage={
              confirmPassword.length > 0 && password !== confirmPassword
                ? "As senhas não coincidem"
                : undefined
            }
            isRequired
          />

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button
            type="submit"
            color="primary"
            className="w-full"
            size="lg"
            isLoading={loading}
            isDisabled={
              !password || !confirmPassword || password !== confirmPassword
            }
          >
            {loading ? "Redefinindo..." : "Redefinir Senha"}
          </Button>
        </form>
      </div>
    </div>
  );
}
