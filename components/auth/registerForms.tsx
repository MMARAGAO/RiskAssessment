"use client";

import {
  CalendarDaysIcon,
  EnvelopeIcon,
  IdentificationIcon,
  LockClosedIcon,
  PhoneIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { Button } from "@heroui/button";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { Progress } from "@heroui/progress";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { FaCircleXmark, FaCircleCheck } from "react-icons/fa6";

interface RegisterFormProps {
  onSubmit?: (data: { name: string; email: string; password: string }) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickName, setNickName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [showMoreInputs, setShowMoreInputs] = useState(false);

  // Estados de validação
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [nicknameExists, setNicknameExists] = useState<boolean | null>(null);
  const [cpfExists, setCpfExists] = useState<boolean | null>(null);
  const [phoneExists, setPhoneExists] = useState<boolean | null>(null);

  // Estados de loading
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [isCheckingCpf, setIsCheckingCpf] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  // Timeouts para debounce
  const [emailTimeout, setEmailTimeout] = useState<NodeJS.Timeout | null>(null);
  const [nicknameTimeout, setNicknameTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [cpfTimeout, setCpfTimeout] = useState<NodeJS.Timeout | null>(null);
  const [phoneTimeout, setPhoneTimeout] = useState<NodeJS.Timeout | null>(null);

  const { register, loading, error, clearError } = useAuthStore();

  // Função para verificar se email existe
  const checkEmailExists = async (emailToCheck: string) => {
    if (!emailToCheck || !emailToCheck.includes("@")) {
      setEmailExists(null);
      return;
    }

    setIsCheckingEmail(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("email")
        .eq("email", emailToCheck)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao verificar email:", error);
        setEmailExists(null);
      } else {
        setEmailExists(!!data);
      }
    } catch (error) {
      console.error("Erro ao verificar email:", error);
      setEmailExists(null);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Função para verificar se nickname existe
  const checkNicknameExists = async (nicknameToCheck: string) => {
    if (!nicknameToCheck.trim()) {
      setNicknameExists(null);
      return;
    }

    setIsCheckingNickname(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("nickname")
        .eq("nickname", nicknameToCheck)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao verificar nickname:", error);
        setNicknameExists(null);
      } else {
        setNicknameExists(!!data);
      }
    } catch (error) {
      console.error("Erro ao verificar nickname:", error);
      setNicknameExists(null);
    } finally {
      setIsCheckingNickname(false);
    }
  };

  // Função para verificar se CPF existe
  const checkCpfExists = async (cpfToCheck: string) => {
    const cleanCpf = cpfToCheck.replace(/\D/g, "");
    if (!cleanCpf || cleanCpf.length !== 11) {
      setCpfExists(null);
      return;
    }

    setIsCheckingCpf(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("cpf")
        .eq("cpf", cleanCpf)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao verificar CPF:", error);
        setCpfExists(null);
      } else {
        setCpfExists(!!data);
      }
    } catch (error) {
      console.error("Erro ao verificar CPF:", error);
      setCpfExists(null);
    } finally {
      setIsCheckingCpf(false);
    }
  };

  // Função para verificar se telefone existe
  const checkPhoneExists = async (phoneToCheck: string) => {
    const cleanPhone = phoneToCheck.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setPhoneExists(null);
      return;
    }

    setIsCheckingPhone(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("phone")
        .eq("phone", cleanPhone)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao verificar telefone:", error);
        setPhoneExists(null);
      } else {
        setPhoneExists(!!data);
      }
    } catch (error) {
      console.error("Erro ao verificar telefone:", error);
      setPhoneExists(null);
    } finally {
      setIsCheckingPhone(false);
    }
  };

  // Effect para verificar email
  useEffect(() => {
    if (emailTimeout) clearTimeout(emailTimeout);

    if (email.trim()) {
      const timeout = setTimeout(() => {
        checkEmailExists(email.trim());
      }, 800);
      setEmailTimeout(timeout);
    } else {
      setEmailExists(null);
    }

    return () => {
      if (emailTimeout) clearTimeout(emailTimeout);
    };
  }, [email]);

  // Effect para verificar nickname
  useEffect(() => {
    if (nicknameTimeout) clearTimeout(nicknameTimeout);

    if (nickName.trim()) {
      const timeout = setTimeout(() => {
        checkNicknameExists(nickName.trim());
      }, 800);
      setNicknameTimeout(timeout);
    } else {
      setNicknameExists(null);
    }

    return () => {
      if (nicknameTimeout) clearTimeout(nicknameTimeout);
    };
  }, [nickName]);

  // Effect para verificar CPF
  useEffect(() => {
    if (cpfTimeout) clearTimeout(cpfTimeout);

    if (cpf.trim()) {
      const timeout = setTimeout(() => {
        checkCpfExists(cpf.trim());
      }, 800);
      setCpfTimeout(timeout);
    } else {
      setCpfExists(null);
    }

    return () => {
      if (cpfTimeout) clearTimeout(cpfTimeout);
    };
  }, [cpf]);

  // Effect para verificar telefone
  useEffect(() => {
    if (phoneTimeout) clearTimeout(phoneTimeout);

    if (phone.trim()) {
      const timeout = setTimeout(() => {
        checkPhoneExists(phone.trim());
      }, 800);
      setPhoneTimeout(timeout);
    } else {
      setPhoneExists(null);
    }

    return () => {
      if (phoneTimeout) clearTimeout(phoneTimeout);
    };
  }, [phone]);

  // Função para calcular a força da senha
  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength += 1;
    if (/[A-Z]/.test(pwd)) strength += 1;
    if (/[0-9]/.test(pwd)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 1;
    return strength;
  };

  const passwordStrength = calculatePasswordStrength(password);
  const getPasswordStrengthColor = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return "danger";
      case 2:
        return "warning";
      case 3:
        return "primary";
      case 4:
        return "success";
      default:
        return "default";
    }
  };

  // Verifica se os campos básicos estão preenchidos e válidos
  const canContinue =
    name &&
    email &&
    password &&
    confirmPassword &&
    password === confirmPassword &&
    passwordStrength >= 2 &&
    emailExists === false; // Email não deve existir

  // Verifica se todos os campos obrigatórios estão preenchidos e válidos
  const canSubmit =
    canContinue &&
    cpf &&
    phone &&
    birthDate &&
    cpfExists === false && // CPF não deve existir
    phoneExists === false && // Telefone não deve existir
    (nickName.trim() === "" || nicknameExists === false) && // Nickname opcional, mas se preenchido não deve existir
    !isCheckingEmail &&
    !isCheckingNickname &&
    !isCheckingCpf &&
    !isCheckingPhone;

  const handleContinue = () => {
    if (canContinue) {
      clearError();
      setShowMoreInputs(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) return;

    // Limpar formatação do CPF e telefone antes de enviar
    const cleanCPF = cpf.replace(/\D/g, "");
    const cleanPhone = phone.replace(/\D/g, "");

    try {
      await register({
        email: email.trim(),
        password,
        name: name.trim(),
        nickname: nickName.trim() || undefined,
        cpf: cleanCPF,
        phone: cleanPhone,
        birthDate,
      });

      console.log("Usuário cadastrado com sucesso!");
    } catch (error) {
      console.error("Erro no cadastro:", error);
    }
  };

  // Função para formatar CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  // Função para formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  // Funções para gerar endContent
  const getEmailEndContent = () => {
    if (isCheckingEmail) {
      return (
        <div className="w-5 h-5 border-2 border-gray-300 border-t-primary animate-spin rounded-full"></div>
      );
    }
    if (email.trim() && emailExists === true) {
      return <FaCircleXmark className="h-6 w-6 text-red-500" />;
    }
    if (email.trim() && emailExists === false) {
      return <FaCircleCheck className="h-6 w-6 text-green-500" />;
    }
    return null;
  };

  const getNicknameEndContent = () => {
    if (isCheckingNickname) {
      return (
        <div className="w-5 h-5 border-2 border-gray-300 border-t-primary animate-spin rounded-full"></div>
      );
    }
    if (nickName.trim() && nicknameExists === true) {
      return <FaCircleXmark className="h-6 w-6 text-red-500" />;
    }
    if (nickName.trim() && nicknameExists === false) {
      return <FaCircleCheck className="h-6 w-6 text-green-500" />;
    }
    return null;
  };

  const getCpfEndContent = () => {
    if (isCheckingCpf) {
      return (
        <div className="w-5 h-5 border-2 border-gray-300 border-t-primary animate-spin rounded-full"></div>
      );
    }
    if (cpf.trim() && cpfExists === true) {
      return <FaCircleXmark className="h-6 w-6 text-red-500" />;
    }
    if (
      cpf.trim() &&
      cpfExists === false &&
      cpf.replace(/\D/g, "").length === 11
    ) {
      return <FaCircleCheck className="h-6 w-6 text-green-500" />;
    }
    return null;
  };

  const getPhoneEndContent = () => {
    if (isCheckingPhone) {
      return (
        <div className="w-5 h-5 border-2 border-gray-300 border-t-primary animate-spin rounded-full"></div>
      );
    }
    if (phone.trim() && phoneExists === true) {
      return <FaCircleXmark className="h-6 w-6 text-red-500" />;
    }
    if (
      phone.trim() &&
      phoneExists === false &&
      phone.replace(/\D/g, "").length >= 10
    ) {
      return <FaCircleCheck className="h-6 w-6 text-green-500" />;
    }
    return null;
  };

  return (
    <Form className="gap-6 w-full overflow-hidden" onSubmit={handleSubmit}>
      <div
        className={`w-[200%] flex transition-transform duration-500 ease-in-out ${
          showMoreInputs ? "-translate-x-1/2" : "translate-x-0"
        }`}
      >
        {/* Primeira etapa - Dados básicos */}
        <div className="w-1/2 flex flex-col gap-2">
          <Input
            label="Nome"
            isRequired
            placeholder="Digite seu nome"
            variant="bordered"
            classNames={{ label: "ml-12", input: "ml-0.5" }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            startContent={
              <UserIcon className="h-full text-gray-400 border-r-[1.5px] pr-2 border-zinc-300 dark:border-zinc-600" />
            }
            isInvalid={!name && showMoreInputs}
          />

          <Input
            label="Email"
            isRequired
            placeholder="Digite seu email"
            type="email"
            variant="bordered"
            classNames={{
              label: "ml-12",
              input: "ml-0.5",
              inputWrapper: emailExists === true ? "border-red-500" : "",
            }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            startContent={
              <EnvelopeIcon className="h-full text-gray-400 border-r-[1.5px] pr-2 border-zinc-300 dark:border-zinc-600" />
            }
            endContent={getEmailEndContent()}
            isInvalid={emailExists === true}
            errorMessage={
              emailExists === true ? "Este email já está em uso" : undefined
            }
          />

          <Input
            label="Senha"
            isRequired
            placeholder="Digite sua senha"
            type={isPasswordVisible ? "text" : "password"}
            variant="bordered"
            classNames={{ label: "ml-12", input: "ml-0.5" }}
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
            isInvalid={passwordStrength < 2 && password.length > 0}
            errorMessage={
              passwordStrength < 2 && password.length > 0
                ? "Senha muito fraca"
                : undefined
            }
          />

          <Progress
            value={passwordStrength * 25}
            color={getPasswordStrengthColor(passwordStrength)}
            className="w-full"
            size="sm"
          />

          <Input
            label="Confirmar Senha"
            isRequired
            placeholder="Confirme sua senha"
            type={isPasswordVisible ? "text" : "password"}
            variant="bordered"
            classNames={{ label: "ml-12", input: "ml-0.5" }}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            startContent={
              <LockClosedIcon className="h-full text-gray-400 border-r-[1.5px] pr-2 border-zinc-300 dark:border-zinc-600" />
            }
            color={
              confirmPassword && password !== confirmPassword
                ? "danger"
                : "default"
            }
            isInvalid={
              confirmPassword.length > 0 && password !== confirmPassword
            }
            errorMessage={
              confirmPassword.length > 0 && password !== confirmPassword
                ? "As senhas não coincidem"
                : undefined
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
          />

          {!showMoreInputs && (
            <>
              <Button
                type="button"
                variant="flat"
                color="primary"
                className="w-full"
                size="lg"
                onClick={handleContinue}
                isDisabled={!canContinue || isCheckingEmail}
              >
                {isCheckingEmail ? "Verificando..." : "Continuar"}
              </Button>
            </>
          )}
        </div>

        {/* Segunda etapa - Dados adicionais */}
        <div className="w-1/2 flex flex-col gap-2">
          <Input
            label="Apelido/Nome de usuário"
            placeholder="Digite seu apelido (opcional)"
            variant="bordered"
            classNames={{
              label: "ml-12",
              input: "ml-0.5",
              inputWrapper: nicknameExists === true ? "border-red-500" : "",
            }}
            value={nickName}
            onChange={(e) => setNickName(e.target.value)}
            startContent={
              <UserIcon className="h-full text-gray-400 border-r-[1.5px] pr-2 border-zinc-300 dark:border-zinc-600" />
            }
            endContent={getNicknameEndContent()}
            isInvalid={nicknameExists === true}
            errorMessage={
              nicknameExists === true
                ? "Este apelido já está em uso"
                : undefined
            }
          />

          <Input
            label="CPF"
            isRequired
            placeholder="Digite seu CPF"
            variant="bordered"
            classNames={{
              label: "ml-12",
              input: "ml-0.5",
              inputWrapper: cpfExists === true ? "border-red-500" : "",
            }}
            value={cpf}
            onChange={(e) => setCpf(formatCPF(e.target.value))}
            startContent={
              <IdentificationIcon className="h-full text-gray-400 border-r-[1.5px] pr-2 border-zinc-300 dark:border-zinc-600" />
            }
            endContent={getCpfEndContent()}
            maxLength={14}
            isInvalid={
              (cpf.length > 0 && cpf.replace(/\D/g, "").length !== 11) ||
              cpfExists === true
            }
            errorMessage={
              cpfExists === true
                ? "Este CPF já está cadastrado"
                : cpf.length > 0 && cpf.replace(/\D/g, "").length !== 11
                  ? "CPF deve ter 11 dígitos"
                  : undefined
            }
          />

          <Input
            label="Telefone"
            isRequired
            placeholder="Digite seu telefone"
            type="tel"
            variant="bordered"
            classNames={{
              label: "ml-12",
              input: "ml-0.5",
              inputWrapper: phoneExists === true ? "border-red-500" : "",
            }}
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            startContent={
              <PhoneIcon className="h-full text-gray-400 border-r-[1.5px] pr-2 border-zinc-300 dark:border-zinc-600" />
            }
            endContent={getPhoneEndContent()}
            maxLength={15}
            isInvalid={
              (phone.length > 0 && phone.replace(/\D/g, "").length < 10) ||
              phoneExists === true
            }
            errorMessage={
              phoneExists === true
                ? "Este telefone já está cadastrado"
                : phone.length > 0 && phone.replace(/\D/g, "").length < 10
                  ? "Telefone deve ter pelo menos 10 dígitos"
                  : undefined
            }
          />

          <Input
            label="Data de Nascimento"
            isRequired
            placeholder="DD/MM/AAAA"
            type="date"
            variant="bordered"
            classNames={{ label: "ml-12", input: "ml-0.5" }}
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            startContent={
              <CalendarDaysIcon className="h-full text-gray-400 border-r-[1.5px] pr-2 border-zinc-300 dark:border-zinc-600" />
            }
            isInvalid={false}
          />

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="bordered"
              color="default"
              className="w-full rounded-full"
              size="lg"
              onClick={() => setShowMoreInputs(false)}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              variant="flat"
              color="primary"
              className="w-full rounded-full"
              size="lg"
              isDisabled={!canSubmit}
              isLoading={loading}
            >
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </div>
        </div>
      </div>
    </Form>
  );
};

export default RegisterForm;
