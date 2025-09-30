"use client";

import { Button } from "@heroui/button";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import React, { useState, useEffect } from "react";
import {
  FaApple,
  FaCheck,
  FaCircleCheck,
  FaCircleXmark,
  FaFacebook,
  FaGoogle,
} from "react-icons/fa6";
import {
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

import ForgotPasswordModal from "./ForgotPasswordModal";

const LoginForm: React.FC = () => {
  const [emailOrNickname, setEmailOrNickname] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [showPasswordStep, setShowPasswordStep] = useState(false);
  const [isCheckingEmailOrNickname, setIsCheckingEmailOrNickname] =
    useState(false);
  const [emailOrNicknameExists, setEmailOrNicknameExists] = useState<
    boolean | null
  >(null);
  const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { login, loading, error } = useAuthStore();
  const router = useRouter();

  // Função para verificar se email ou nickname existe
  const checkEmailOrNicknameExists = async (valueToCheck: string) => {
    if (!valueToCheck.trim()) {
      setEmailOrNicknameExists(null);
      return;
    }

    setIsCheckingEmailOrNickname(true);

    try {
      let data = null;
      let error = null;

      // Verificar se é um email (contém @) ou nickname
      if (valueToCheck.includes("@")) {
        // É um email - verificar na coluna email
        const result = await supabase
          .from("users")
          .select("email")
          .eq("email", valueToCheck)
          .single();
        data = result.data;
        error = result.error;
      } else {
        // É um nickname - verificar na coluna nickname
        const result = await supabase
          .from("users")
          .select("nickname")
          .eq("nickname", valueToCheck)
          .single();
        data = result.data;
        error = result.error;
      }

      if (error && error.code !== "PGRST116") {
        // PGRST116 = not found
        console.error("Erro ao verificar email/nickname:", error);
        setEmailOrNicknameExists(null);
      } else {
        setEmailOrNicknameExists(!!data);
      }
    } catch (error) {
      console.error("Erro ao verificar email/nickname:", error);
      setEmailOrNicknameExists(null);
    } finally {
      setIsCheckingEmailOrNickname(false);
    }
  };

  // Debounce para verificar email ou nickname
  useEffect(() => {
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }

    if (emailOrNickname.trim()) {
      const timeout = setTimeout(() => {
        checkEmailOrNicknameExists(emailOrNickname.trim());
      }, 800); // Aguarda 800ms após parar de digitar

      setCheckTimeout(timeout);
    } else {
      setEmailOrNicknameExists(null);
    }

    return () => {
      if (checkTimeout) {
        clearTimeout(checkTimeout);
      }
    };
  }, [emailOrNickname]);

  // Verifica se pode mostrar a senha
  const canShowPassword =
    emailOrNickname.trim().length > 0 && emailOrNicknameExists === true;

  const handleContinue = () => {
    if (canShowPassword) {
      setShowPasswordStep(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canShowPassword || !password.trim()) return;

    try {
      await login({ emailOrNickname: emailOrNickname.trim(), password });
      // Redirecionar após login bem-sucedido
      console.log("Login realizado com sucesso! Redirecionando...");
      router.push("/");
    } catch (error) {
      // Erro já é tratado na store
      console.error("Erro no login:", error);
    }
  };

  // Determinar ícone do endContent

  return (
    <>
      <Form className="gap-6 w-full overflow-hidden" onSubmit={handleSubmit}>
        <div
          className={`w-[200%] flex transition-transform duration-500 ease-in-out ${
            showPasswordStep ? "-translate-x-1/2" : "translate-x-0"
          }`}
        >
          {/* Primeira etapa - Email */}
          <div className="w-1/2 flex flex-col gap-6">
            <Input
              label="Email ou Nickname"
              placeholder="Digite seu email ou nickname"
              type="text"
              variant="bordered"
              classNames={{
                label: "ml-12",
                input: "ml-0.5",
                inputWrapper:
                  emailOrNicknameExists === false ? "border-red-500" : "",
              }}
              value={emailOrNickname}
              onChange={(e) => setEmailOrNickname(e.target.value)}
              startContent={
                <EnvelopeIcon className="h-full text-gray-400 border-r-[1.5px] pr-2 border-zinc-300 dark:border-zinc-600" />
              }
              endContent={
                emailOrNicknameExists === false ? (
                  <FaCircleXmark className="h-6 w-6 mb-1 text-red-500" />
                ) : emailOrNicknameExists === true ? (
                  <FaCircleCheck className="h-6 w-6 mb-1 text-green-500" />
                ) : null
              }
              isInvalid={emailOrNicknameExists === false}
            />

            {!showPasswordStep && (
              <>
                <Button
                  type="button"
                  variant="flat"
                  color="primary"
                  className="w-full"
                  size="lg"
                  onPress={handleContinue}
                  isDisabled={!canShowPassword || isCheckingEmailOrNickname}
                >
                  Continuar
                </Button>

                {/* Divisor "ou" */}
              </>
            )}
          </div>

          {/* Segunda etapa - Senha */}
          <div className="w-1/2 flex flex-col gap-6">
            <Input
              label="Senha"
              placeholder="Digite sua senha"
              type={isPasswordVisible ? "text" : "password"}
              variant="bordered"
              classNames={{ label: "ml-11", input: "ml-0.5" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              startContent={
                <LockClosedIcon className="h-full text-gray-400 border-r-[1.5px] pr-2 border-zinc-300 dark:border-zinc-600" />
              }
              endContent={
                <button
                  type="button"
                  className="h-full pr-3"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  {isPasswordVisible ? (
                    <EyeIcon className="h-6 text-gray-400" />
                  ) : (
                    <EyeSlashIcon className="h-6 text-gray-400" />
                  )}
                </button>
              }
              errorMessage={error}
              isInvalid={!!error}
            />
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => setShowForgotPassword(true)}
              >
                Esqueci minha senha
              </button>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="bordered"
                color="default"
                className="w-full rounded-xl"
                size="lg"
                onClick={() => setShowPasswordStep(false)}
              >
                Voltar
              </Button>
              <Button
                type="submit"
                variant="flat"
                color="primary"
                className="w-full rounded-xl"
                size="lg"
                isDisabled={!password.trim()}
                isLoading={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex w-full items-center gap-2">
          <div className="bg-gray-300 dark:bg-gray-700 h-[1px] flex-grow"></div>
          <h1 className="text-gray-500 dark:text-gray-400">ou</h1>
          <div className="bg-gray-300 dark:bg-gray-700 h-[1px] flex-grow"></div>
        </div>

        {/* Botões sociais */}
        <div className="flex justify-center w-full gap-2">
          <Button
            type="button"
            isIconOnly
            startContent={<FaGoogle className="w-6 h-6" />}
            variant="flat"
            color="default"
            size="lg"
            className="rounded-xl"
          />
          <Button
            type="button"
            isIconOnly
            startContent={<FaApple className="w-6 h-6" />}
            variant="flat"
            color="default"
            size="lg"
            className="rounded-xl"
          />
          <Button
            type="button"
            isIconOnly
            startContent={<FaFacebook className="w-6 h-6" />}
            variant="flat"
            color="default"
            size="lg"
            className="rounded-xl"
          />
        </div>
      </Form>
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </>
  );
};

export default LoginForm;
