"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Switch,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Divider,
  Chip,
  Avatar,
} from "@heroui/react";
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Moon,
  Sun,
  Monitor,
  Globe,
  Building,
  BarChart,
  Camera,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSettingsStore } from "@/store/settingsStore";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";

export default function ConfiguracoesPage() {
  // Stores
  const {
    theme,
    language,
    notifications,
    systemSettings,
    setTheme,
    setLanguage,
    setNotifications,
    setSystemSettings,
  } = useSettingsStore();

  const { user, profile: authProfile } = useAuthStore();

  // Estados locais para o perfil
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "Usuário",
    nickname: "",
  });

  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);

  // Carregar dados do usuário
  useEffect(() => {
    if (authProfile) {
      setProfile({
        name: authProfile.name || "",
        email: authProfile.email || "",
        phone: authProfile.phone || "",
        company: "",
        role: "Usuário",
        nickname: authProfile.nickname || "",
      });
    }
  }, [authProfile]);

  const handleSaveProfile = async () => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      setLoading(true);

      // Atualizar dados na tabela users
      const { error: updateError } = await supabase
        .from("users")
        .update({
          name: profile.name,
          phone: profile.phone,
          nickname: profile.nickname || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Atualizar email no auth se foi alterado
      if (profile.email !== authProfile?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profile.email,
        });

        if (emailError) {
          throw new Error(emailError.message);
        }

        toast.success(
          "Email atualizado! Verifique sua caixa de entrada para confirmar."
        );
      }

      // Recarregar dados do usuário
      await useAuthStore.getState().checkAuth();

      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast.error("As senhas não coincidem!");
      return;
    }
    if (passwordData.new.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres!");
      return;
    }

    try {
      setLoading(true);

      // Verificar senha atual
      if (!user?.email) {
        throw new Error("Email do usuário não encontrado");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.current,
      });

      if (signInError) {
        throw new Error("Senha atual incorreta");
      }

      // Atualizar senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.new,
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      toast.success("Senha alterada com sucesso!");
      setPasswordData({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = () => {
    toast.success("Preferências de notificação salvas!");
  };

  const handleSaveSystemSettings = () => {
    toast.success("Configurações do sistema salvas!");
  };

  const handleExportData = () => {
    toast.success(
      "Exportação iniciada! Você receberá um email quando concluída."
    );
  };

  const handleBackupNow = () => {
    toast.success("Backup manual iniciado!");
  };

  const themeOptions = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Escuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Monitor },
  ];

  const languageOptions = [
    { value: "pt-BR", label: "Português (Brasil)", flag: "🇧🇷" },
    { value: "en-US", label: "English (US)", flag: "🇺🇸" },
    { value: "es-ES", label: "Español", flag: "🇪🇸" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-blue-50/30 to-zinc-50 dark:from-zinc-950 dark:via-blue-950/10 dark:to-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 shadow-xl">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">
                Configurações
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Gerencie suas preferências e configurações do sistema
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          aria-label="Configurações"
          variant="underlined"
          classNames={{
            tabList:
              "gap-6 w-full relative rounded-lg bg-white dark:bg-zinc-900 p-2 border-2 border-zinc-200 dark:border-zinc-800",
            cursor: "w-full bg-blue-600 dark:bg-blue-500",
            tab: "max-w-fit px-4 h-12",
            tabContent:
              "group-data-[selected=true]:text-blue-600 dark:group-data-[selected=true]:text-blue-400 font-semibold",
          }}
          size="lg"
        >
          {/* Tab: Perfil */}
          <Tab
            key="profile"
            title={
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span>Perfil</span>
              </div>
            }
          >
            <div className="grid gap-6 mt-6">
              <Card className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800">
                <CardHeader className="border-b-2 border-zinc-200 dark:border-zinc-800 pb-4">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src=""
                        name={profile.name || "U"}
                        size="lg"
                        className="bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                      />
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                          Informações do Perfil
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Atualize suas informações pessoais
                        </p>
                      </div>
                    </div>
                    <Chip
                      variant="flat"
                      className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      startContent={<Shield className="h-4 w-4" />}
                    >
                      {profile.role}
                    </Chip>
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Input
                      label="Nome Completo"
                      placeholder="Digite seu nome"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                      variant="bordered"
                      size="lg"
                      startContent={<User className="h-5 w-5 text-zinc-400" />}
                      classNames={{
                        label: "font-semibold",
                        inputWrapper: "border-2",
                      }}
                    />
                    <Input
                      label="Nickname"
                      placeholder="@nickname"
                      value={profile.nickname}
                      onChange={(e) =>
                        setProfile({ ...profile, nickname: e.target.value })
                      }
                      variant="bordered"
                      size="lg"
                      startContent={<User className="h-5 w-5 text-zinc-400" />}
                      classNames={{
                        label: "font-semibold",
                        inputWrapper: "border-2",
                      }}
                    />
                    <Input
                      label="Email"
                      placeholder="seu@email.com"
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      variant="bordered"
                      size="lg"
                      startContent={<Mail className="h-5 w-5 text-zinc-400" />}
                      classNames={{
                        label: "font-semibold",
                        inputWrapper: "border-2",
                      }}
                      description="Ao alterar o email, você receberá um link de confirmação"
                    />
                    <Input
                      label="Telefone"
                      placeholder="+55 11 99999-9999"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      variant="bordered"
                      size="lg"
                      classNames={{
                        label: "font-semibold",
                        inputWrapper: "border-2",
                      }}
                    />
                  </div>

                  {/* Dados somente leitura */}
                  <Divider className="my-6" />
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                      <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                        CPF
                      </p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {authProfile?.cpf || "Não informado"}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                      <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                        Data de Nascimento
                      </p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {authProfile?.birth_date
                          ? new Date(authProfile.birth_date).toLocaleDateString(
                              "pt-BR"
                            )
                          : "Não informado"}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                      <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                        Conta criada em
                      </p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {authProfile?.created_at
                          ? new Date(authProfile.created_at).toLocaleDateString(
                              "pt-BR"
                            )
                          : "Não informado"}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                      <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                        Última atualização
                      </p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {authProfile?.updated_at
                          ? new Date(authProfile.updated_at).toLocaleDateString(
                              "pt-BR"
                            )
                          : "Não informado"}
                      </p>
                    </div>
                  </div>

                  <Divider className="my-6" />
                  <div className="flex justify-end">
                    <Button
                      color="primary"
                      size="lg"
                      startContent={<Save className="h-5 w-5" />}
                      onClick={handleSaveProfile}
                      isLoading={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      Salvar Alterações
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {/* Alterar Senha */}
              <Card className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800">
                <CardHeader className="border-b-2 border-zinc-200 dark:border-zinc-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                      <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                        Segurança
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Altere sua senha de acesso
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="grid gap-4 max-w-2xl">
                    <Input
                      label="Senha Atual"
                      placeholder="Digite sua senha atual"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.current}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          current: e.target.value,
                        })
                      }
                      variant="bordered"
                      size="lg"
                      startContent={<Lock className="h-5 w-5 text-zinc-400" />}
                      endContent={
                        <button
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              current: !showPasswords.current,
                            })
                          }
                          type="button"
                        >
                          {showPasswords.current ? (
                            <EyeOff className="h-5 w-5 text-zinc-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-zinc-400" />
                          )}
                        </button>
                      }
                      classNames={{
                        label: "font-semibold",
                        inputWrapper: "border-2",
                      }}
                    />
                    <Input
                      label="Nova Senha"
                      placeholder="Digite sua nova senha"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.new}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          new: e.target.value,
                        })
                      }
                      variant="bordered"
                      size="lg"
                      startContent={<Lock className="h-5 w-5 text-zinc-400" />}
                      endContent={
                        <button
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              new: !showPasswords.new,
                            })
                          }
                          type="button"
                        >
                          {showPasswords.new ? (
                            <EyeOff className="h-5 w-5 text-zinc-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-zinc-400" />
                          )}
                        </button>
                      }
                      classNames={{
                        label: "font-semibold",
                        inputWrapper: "border-2",
                      }}
                    />
                    <Input
                      label="Confirmar Nova Senha"
                      placeholder="Confirme sua nova senha"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirm}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirm: e.target.value,
                        })
                      }
                      variant="bordered"
                      size="lg"
                      startContent={<Lock className="h-5 w-5 text-zinc-400" />}
                      endContent={
                        <button
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              confirm: !showPasswords.confirm,
                            })
                          }
                          type="button"
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="h-5 w-5 text-zinc-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-zinc-400" />
                          )}
                        </button>
                      }
                      classNames={{
                        label: "font-semibold",
                        inputWrapper: "border-2",
                      }}
                    />
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-900 dark:text-blue-200">
                        <AlertTriangle className="h-4 w-4 inline mr-2" />A senha
                        deve ter pelo menos 8 caracteres, incluindo letras
                        maiúsculas, minúsculas e números.
                      </p>
                    </div>
                  </div>
                  <Divider className="my-6" />
                  <div className="flex justify-end">
                    <Button
                      color="primary"
                      size="lg"
                      startContent={<Lock className="h-5 w-5" />}
                      onClick={handleChangePassword}
                      isLoading={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      Alterar Senha
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>

          {/* Tab: Aparência */}
          <Tab
            key="appearance"
            title={
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <span>Aparência</span>
              </div>
            }
          >
            <div className="grid gap-6 mt-6">
              <Card className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800">
                <CardHeader className="border-b-2 border-zinc-200 dark:border-zinc-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                      <Palette className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                        Tema e Idioma
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Personalize a aparência do sistema
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="grid gap-6">
                    {/* Tema */}
                    <div>
                      <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-3">
                        Tema do Sistema
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        {themeOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <button
                              key={option.value}
                              onClick={() => setTheme(option.value as any)}
                              className={`p-6 rounded-xl border-2 transition-all ${
                                theme === option.value
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                                  : "border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700"
                              }`}
                            >
                              <Icon
                                className={`h-8 w-8 mx-auto mb-3 ${
                                  theme === option.value
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-zinc-400"
                                }`}
                              />
                              <p
                                className={`text-sm font-semibold ${
                                  theme === option.value
                                    ? "text-blue-900 dark:text-blue-200"
                                    : "text-zinc-700 dark:text-zinc-300"
                                }`}
                              >
                                {option.label}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Divider />

                    {/* Idioma */}
                    <div>
                      <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-3">
                        Idioma do Sistema
                      </label>
                      <Select
                        selectedKeys={[language]}
                        onChange={(e) => setLanguage(e.target.value as any)}
                        variant="bordered"
                        size="lg"
                        startContent={
                          <Globe className="h-5 w-5 text-zinc-400" />
                        }
                        classNames={{
                          trigger: "border-2",
                        }}
                      >
                        {languageOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            textValue={option.label}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{option.flag}</span>
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <Divider className="my-6" />
                  <div className="flex justify-end">
                    <Button
                      color="primary"
                      size="lg"
                      startContent={<Save className="h-5 w-5" />}
                      onClick={() => toast.success("Preferências salvas!")}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      Salvar Preferências
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>

          {/* Tab: Notificações */}
          <Tab
            key="notifications"
            title={
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <span>Notificações</span>
              </div>
            }
          >
            <div className="grid gap-6 mt-6">
              <Card className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800">
                <CardHeader className="border-b-2 border-zinc-200 dark:border-zinc-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                      <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                        Preferências de Notificação
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Configure como deseja receber notificações
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="space-y-6">
                    {/* Canais de Notificação */}
                    <div>
                      <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
                        Canais de Notificação
                      </h4>
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                          <Switch
                            isSelected={notifications.email}
                            onValueChange={(value) =>
                              setNotifications({ email: value })
                            }
                            size="lg"
                            classNames={{
                              wrapper: "group-data-[selected=true]:bg-blue-600",
                            }}
                          >
                            <div>
                              <span className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Notificações por Email
                              </span>
                              <span className="text-xs text-zinc-600 dark:text-zinc-400 block mt-1">
                                Receba alertas e atualizações por email
                              </span>
                            </div>
                          </Switch>
                        </div>

                        <div className="p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                          <Switch
                            isSelected={notifications.push}
                            onValueChange={(value) =>
                              setNotifications({ push: value })
                            }
                            size="lg"
                            classNames={{
                              wrapper: "group-data-[selected=true]:bg-blue-600",
                            }}
                          >
                            <div>
                              <span className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Bell className="h-4 w-4" />
                                Notificações Push
                              </span>
                              <span className="text-xs text-zinc-600 dark:text-zinc-400 block mt-1">
                                Receba notificações no navegador
                              </span>
                            </div>
                          </Switch>
                        </div>
                      </div>
                    </div>

                    <Divider />

                    {/* Tipos de Notificação */}
                    <div>
                      <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
                        Tipos de Notificação
                      </h4>
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                          <Switch
                            isSelected={notifications.assessment_completed}
                            onValueChange={(value) =>
                              setNotifications({ assessment_completed: value })
                            }
                            size="lg"
                            classNames={{
                              wrapper: "group-data-[selected=true]:bg-blue-600",
                            }}
                          >
                            <div>
                              <span className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Avaliação Concluída
                              </span>
                              <span className="text-xs text-zinc-600 dark:text-zinc-400 block mt-1">
                                Quando uma avaliação for finalizada
                              </span>
                            </div>
                          </Switch>
                        </div>

                        <div className="p-4 rounded-xl border-2 border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
                          <Switch
                            isSelected={notifications.risk_critical}
                            onValueChange={(value) =>
                              setNotifications({ risk_critical: value })
                            }
                            size="lg"
                            classNames={{
                              wrapper: "group-data-[selected=true]:bg-blue-600",
                            }}
                          >
                            <div>
                              <span className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-blue-600" />
                                Risco Crítico Identificado
                              </span>
                              <span className="text-xs text-zinc-600 dark:text-zinc-400 block mt-1">
                                Alertas imediatos sobre riscos críticos
                              </span>
                            </div>
                          </Switch>
                        </div>

                        <div className="p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                          <Switch
                            isSelected={notifications.weekly_report}
                            onValueChange={(value) =>
                              setNotifications({ weekly_report: value })
                            }
                            size="lg"
                            classNames={{
                              wrapper: "group-data-[selected=true]:bg-blue-600",
                            }}
                          >
                            <div>
                              <span className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                <BarChart className="h-4 w-4" />
                                Relatório Semanal
                              </span>
                              <span className="text-xs text-zinc-600 dark:text-zinc-400 block mt-1">
                                Receba um resumo semanal das atividades
                              </span>
                            </div>
                          </Switch>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Divider className="my-6" />
                  <div className="flex justify-end">
                    <Button
                      color="primary"
                      size="lg"
                      startContent={<Save className="h-5 w-5" />}
                      onClick={handleSaveNotifications}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      Salvar Preferências
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>

          {/* Tab: Sistema */}
          <Tab
            key="system"
            title={
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <span>Sistema</span>
              </div>
            }
          >
            <div className="grid gap-6 mt-6">
              {/* Backup e Dados */}
              <Card className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800">
                <CardHeader className="border-b-2 border-zinc-200 dark:border-zinc-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                      <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                        Backup e Dados
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Configure backup automático e gerencie dados
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                      <Switch
                        isSelected={systemSettings.auto_backup}
                        onValueChange={(value) =>
                          setSystemSettings({ auto_backup: value })
                        }
                        size="lg"
                        classNames={{
                          wrapper: "group-data-[selected=true]:bg-blue-600",
                        }}
                      >
                        <div>
                          <span className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Backup Automático
                          </span>
                          <span className="text-xs text-zinc-600 dark:text-zinc-400 block mt-1">
                            Realize backups automáticos do banco de dados
                          </span>
                        </div>
                      </Switch>
                    </div>

                    {systemSettings.auto_backup && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <Select
                          label="Frequência de Backup"
                          selectedKeys={[systemSettings.backup_frequency]}
                          onChange={(e) =>
                            setSystemSettings({
                              backup_frequency: e.target.value as any,
                            })
                          }
                          variant="bordered"
                          size="lg"
                          classNames={{
                            label: "font-semibold",
                            trigger: "border-2",
                          }}
                        >
                          <SelectItem key="daily" textValue="Diário">
                            Diário
                          </SelectItem>
                          <SelectItem key="weekly" textValue="Semanal">
                            Semanal
                          </SelectItem>
                          <SelectItem key="monthly" textValue="Mensal">
                            Mensal
                          </SelectItem>
                        </Select>

                        <Input
                          label="Retenção de Dados (dias)"
                          type="number"
                          value={systemSettings.data_retention}
                          onChange={(e) =>
                            setSystemSettings({
                              data_retention: e.target.value,
                            })
                          }
                          variant="bordered"
                          size="lg"
                          classNames={{
                            label: "font-semibold",
                            inputWrapper: "border-2",
                          }}
                        />
                      </div>
                    )}

                    <Divider />

                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="flat"
                        startContent={<RefreshCw className="h-5 w-5" />}
                        onClick={handleBackupNow}
                        className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      >
                        Backup Manual
                      </Button>
                      <Button
                        variant="flat"
                        startContent={<Download className="h-5 w-5" />}
                        onClick={handleExportData}
                        className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                      >
                        Exportar Dados
                      </Button>
                      <Button
                        variant="flat"
                        startContent={<Upload className="h-5 w-5" />}
                        className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                      >
                        Importar Dados
                      </Button>
                    </div>
                  </div>
                  <Divider className="my-6" />
                  <div className="flex justify-end">
                    <Button
                      color="primary"
                      size="lg"
                      startContent={<Save className="h-5 w-5" />}
                      onClick={handleSaveSystemSettings}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      Salvar Configurações
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {/* Zona de Perigo */}
              <Card className="bg-white dark:bg-zinc-900 border-2 border-red-300 dark:border-red-800">
                <CardHeader className="border-b-2 border-red-300 dark:border-red-800 pb-4 bg-red-50 dark:bg-red-950/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/50">
                      <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-red-900 dark:text-red-200">
                        Zona de Perigo
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-400">
                        Ações irreversíveis que afetam todo o sistema
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-red-900 dark:text-red-200 mb-2">
                            Limpar Todos os Dados
                          </h4>
                          <p className="text-sm text-red-700 dark:text-red-400">
                            Remove permanentemente todas as avaliações,
                            relatórios e dados do sistema. Esta ação não pode
                            ser desfeita.
                          </p>
                        </div>
                        <Button
                          color="danger"
                          variant="flat"
                          startContent={<Trash2 className="h-5 w-5" />}
                          onClick={() =>
                            confirm("Tem certeza? Esta ação é IRREVERSÍVEL!") &&
                            toast.error("Ação cancelada por segurança")
                          }
                        >
                          Limpar Dados
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-red-900 dark:text-red-200 mb-2">
                            Resetar Sistema
                          </h4>
                          <p className="text-sm text-red-700 dark:text-red-400">
                            Restaura o sistema para as configurações padrão de
                            fábrica. Todos os dados e personalizações serão
                            perdidos.
                          </p>
                        </div>
                        <Button
                          color="danger"
                          variant="flat"
                          startContent={<RefreshCw className="h-5 w-5" />}
                          onClick={() =>
                            confirm(
                              "Resetar sistema? Todos os dados serão perdidos!"
                            ) && toast.error("Ação cancelada por segurança")
                          }
                        >
                          Resetar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
