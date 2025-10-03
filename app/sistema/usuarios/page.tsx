"use client";

import { useEffect, useState } from "react";
import { useUserStore, type User } from "@/store/userStore";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Card,
  CardBody,
} from "@heroui/react";
import toast from "react-hot-toast";

export default function UsuariosPage() {
  const {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  } = useUserStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    nickname: "",
    cpf: "",
    phone: "",
    birth_date: "",
  });

  // Funções de máscara
  const maskCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const maskPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const removeMask = (value: string) => {
    return value.replace(/\D/g, "");
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setIsEditMode(true);
      setCurrentUser(user);
      setFormData({
        email: user.email,
        password: "",
        name: user.name,
        nickname: user.nickname || "",
        cpf: maskCPF(user.cpf),
        phone: maskPhone(user.phone),
        birth_date: user.birth_date,
      });
    } else {
      setIsEditMode(false);
      setCurrentUser(null);
      setFormData({
        email: "",
        password: "",
        name: "",
        nickname: "",
        cpf: "",
        phone: "",
        birth_date: "",
      });
    }
    onOpen();
  };

  const handleCloseDialog = () => {
    onClose();
    setIsEditMode(false);
    setCurrentUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Remover máscaras antes de enviar
      const cleanData = {
        ...formData,
        cpf: removeMask(formData.cpf),
        phone: removeMask(formData.phone),
      };

      if (isEditMode && currentUser) {
        const { password, email, ...updateData } = cleanData;
        await updateUser(currentUser.id, updateData);
        toast.success("Usuário atualizado com sucesso!");
      } else {
        if (!cleanData.password) {
          toast.error("Senha é obrigatória para novo usuário");
          return;
        }
        await createUser(cleanData);
        toast.success("Usuário criado com sucesso!");
      }
      handleCloseDialog();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar usuário");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o usuário ${name}?`)) {
      try {
        await deleteUser(id);
        toast.success("Usuário excluído com sucesso!");
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir usuário");
      }
    }
  };

  const handleCPFChange = (value: string) => {
    const masked = maskCPF(value);
    setFormData({ ...formData, cpf: masked });
  };

  const handlePhoneChange = (value: string) => {
    const masked = maskPhone(value);
    setFormData({ ...formData, phone: masked });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.cpf.includes(searchTerm)
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-2">
                Gerenciamento de Usuários
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Gerencie todos os usuários do sistema
              </p>
            </div>
            <Button
              color="primary"
              startContent={<Plus className="h-4 w-4" />}
              onClick={() => handleOpenDialog()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/30"
              size="lg"
            >
              Novo Usuário
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardBody className="p-4">
            <Input
              placeholder="Buscar por nome, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={
                <Search className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
              }
              classNames={{
                base: "w-full",
                inputWrapper:
                  "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-750 group-data-[focus=true]:bg-white dark:group-data-[focus=true]:bg-zinc-800",
                input:
                  "text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400",
              }}
              size="lg"
            />
          </CardBody>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
            <CardBody className="p-4">
              <p className="text-red-700 dark:text-red-400 font-medium">
                {error}
              </p>
            </CardBody>
          </Card>
        )}

        {/* Table */}
        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg">
          <CardBody className="p-0 overflow-hidden">
            <Table
              aria-label="Tabela de usuários"
              classNames={{
                base: "overflow-x-auto",
                wrapper: "bg-transparent shadow-none",
                th: "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-sm border-b border-zinc-200 dark:border-zinc-700",
                td: "text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 py-4",
                tr: "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors",
              }}
            >
              <TableHeader>
                <TableColumn>NOME</TableColumn>
                <TableColumn>EMAIL</TableColumn>
                <TableColumn>CPF</TableColumn>
                <TableColumn>TELEFONE</TableColumn>
                <TableColumn>DATA NASCIMENTO</TableColumn>
                <TableColumn>CRIADO EM</TableColumn>
                <TableColumn align="end">AÇÕES</TableColumn>
              </TableHeader>
              <TableBody
                items={filteredUsers}
                isLoading={loading}
                loadingContent={
                  <Spinner
                    label="Carregando..."
                    color="primary"
                    className="text-blue-600"
                  />
                }
                emptyContent={
                  <div className="text-center py-12">
                    <p className="text-zinc-500 dark:text-zinc-400 text-lg">
                      Nenhum usuário encontrado
                    </p>
                  </div>
                }
              >
                {(user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400">
                      {user.email}
                    </TableCell>
                    <TableCell>{maskCPF(user.cpf)}</TableCell>
                    <TableCell>{maskPhone(user.phone)}</TableCell>
                    <TableCell>{formatDate(user.birth_date)}</TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400">
                      {user.created_at ? formatDate(user.created_at) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          isIconOnly
                          variant="flat"
                          size="sm"
                          onClick={() => handleOpenDialog(user)}
                          className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          isIconOnly
                          variant="flat"
                          size="sm"
                          onClick={() => handleDelete(user.id, user.name)}
                          className="bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleCloseDialog}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          base: "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800",
          header: "border-b border-zinc-200 dark:border-zinc-800",
          body: "py-6",
          footer: "border-t border-zinc-200 dark:border-zinc-800",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleSubmit}>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {isEditMode ? "Editar Usuário" : "Novo Usuário"}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-normal">
                  {isEditMode
                    ? "Atualize as informações do usuário"
                    : "Preencha os dados para criar um novo usuário"}
                </p>
              </ModalHeader>
              <ModalBody>
                <div className="grid gap-5">
                  <Input
                    label="Nome Completo"
                    placeholder="Digite o nome completo"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    isRequired
                    variant="bordered"
                    classNames={{
                      label: "text-zinc-700 dark:text-zinc-300 font-medium",
                      input: "text-zinc-900 dark:text-white",
                      inputWrapper:
                        "border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 group-data-[focus=true]:border-blue-600 dark:group-data-[focus=true]:border-blue-500",
                    }}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="Digite o email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    isRequired
                    isDisabled={isEditMode}
                    variant="bordered"
                    classNames={{
                      label: "text-zinc-700 dark:text-zinc-300 font-medium",
                      input: "text-zinc-900 dark:text-white",
                      inputWrapper:
                        "border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 group-data-[focus=true]:border-blue-600 dark:group-data-[focus=true]:border-blue-500",
                    }}
                  />
                  {!isEditMode && (
                    <Input
                      label="Senha"
                      type="password"
                      placeholder="Digite a senha"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      isRequired={!isEditMode}
                      variant="bordered"
                      classNames={{
                        label: "text-zinc-700 dark:text-zinc-300 font-medium",
                        input: "text-zinc-900 dark:text-white",
                        inputWrapper:
                          "border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 group-data-[focus=true]:border-blue-600 dark:group-data-[focus=true]:border-blue-500",
                      }}
                    />
                  )}
                  <Input
                    label="Apelido"
                    placeholder="Digite o apelido (opcional)"
                    value={formData.nickname}
                    onChange={(e) =>
                      setFormData({ ...formData, nickname: e.target.value })
                    }
                    variant="bordered"
                    classNames={{
                      label: "text-zinc-700 dark:text-zinc-300 font-medium",
                      input: "text-zinc-900 dark:text-white",
                      inputWrapper:
                        "border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 group-data-[focus=true]:border-blue-600 dark:group-data-[focus=true]:border-blue-500",
                    }}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                      label="CPF"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => handleCPFChange(e.target.value)}
                      maxLength={14}
                      isRequired
                      variant="bordered"
                      classNames={{
                        label: "text-zinc-700 dark:text-zinc-300 font-medium",
                        input: "text-zinc-900 dark:text-white",
                        inputWrapper:
                          "border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 group-data-[focus=true]:border-blue-600 dark:group-data-[focus=true]:border-blue-500",
                      }}
                    />
                    <Input
                      label="Telefone"
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      maxLength={15}
                      isRequired
                      variant="bordered"
                      classNames={{
                        label: "text-zinc-700 dark:text-zinc-300 font-medium",
                        input: "text-zinc-900 dark:text-white",
                        inputWrapper:
                          "border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 group-data-[focus=true]:border-blue-600 dark:group-data-[focus=true]:border-blue-500",
                      }}
                    />
                  </div>
                  <Input
                    label="Data de Nascimento"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) =>
                      setFormData({ ...formData, birth_date: e.target.value })
                    }
                    isRequired
                    variant="bordered"
                    classNames={{
                      label: "text-zinc-700 dark:text-zinc-300 font-medium",
                      input: "text-zinc-900 dark:text-white",
                      inputWrapper:
                        "border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 group-data-[focus=true]:border-blue-600 dark:group-data-[focus=true]:border-blue-500",
                    }}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={handleCloseDialog}
                  className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-medium"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/30"
                >
                  {isEditMode ? "Atualizar" : "Criar"}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
