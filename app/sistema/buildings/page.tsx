"use client";

import { useEffect, useState } from "react";
import {
  useBuildingStore,
  type Building,
  type BuildingFormData,
} from "@/store/buildingStore";
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  Building2,
  MapPin,
  ClipboardCheck,
} from "lucide-react";
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
  Select,
  SelectItem,
  Textarea,
  Switch,
  Chip,
} from "@heroui/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const buildingTypes = [
  { value: "Residencial", label: "Residencial" },
  { value: "Comercial", label: "Comercial" },
  { value: "Industrial", label: "Industrial" },
  { value: "Misto", label: "Misto" },
];

const structureTypes = [
  { value: "Concreto", label: "Concreto" },
  { value: "Aço", label: "Aço" },
  { value: "Alvenaria", label: "Alvenaria" },
  { value: "Misto", label: "Misto" },
];

const statusTypes = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: "under_construction", label: "Em Construção" },
];

const brazilianStates = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

export default function EdificiosPage() {
  const {
    buildings,
    loading,
    error,
    fetchBuildings,
    createBuilding,
    updateBuilding,
    deleteBuilding,
  } = useBuildingStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentBuilding, setCurrentBuilding] = useState<Building | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const [formData, setFormData] = useState<BuildingFormData>({
    name: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "Brasil",
    total_floors: 1,
    total_area: null,
    construction_year: null,
    building_type: "Comercial",
    occupancy_type: null,
    structure_type: "Concreto",
    has_basement: false,
    has_elevator: false,
    has_fire_system: false,
    has_sprinkler: false,
    has_alarm: false,
    has_emergency_exit: false,
    has_generator: false,
    notes: null,
    status: "active",
  });

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  const maskCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{3})\d+?$/, "$1");
  };

  const handleCEPChange = (value: string) => {
    const masked = maskCEP(value);
    setFormData({ ...formData, zip_code: masked });
  };

  const removeMask = (value: string) => {
    return value.replace(/\D/g, "");
  };

  const handleOpenDialog = (building?: Building) => {
    if (building) {
      setIsEditMode(true);
      setCurrentBuilding(building);
      setFormData({
        name: building.name,
        address: building.address,
        city: building.city,
        state: building.state,
        zip_code: maskCEP(building.zip_code),
        country: building.country,
        total_floors: building.total_floors,
        total_area: building.total_area,
        construction_year: building.construction_year,
        building_type: building.building_type,
        occupancy_type: building.occupancy_type,
        structure_type: building.structure_type,
        has_basement: building.has_basement,
        has_elevator: building.has_elevator,
        has_fire_system: building.has_fire_system,
        has_sprinkler: building.has_sprinkler,
        has_alarm: building.has_alarm,
        has_emergency_exit: building.has_emergency_exit,
        has_generator: building.has_generator,
        notes: building.notes,
        status: building.status,
      });
    } else {
      setIsEditMode(false);
      setCurrentBuilding(null);
      setFormData({
        name: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        country: "Brasil",
        total_floors: 1,
        total_area: null,
        construction_year: null,
        building_type: "Comercial",
        occupancy_type: null,
        structure_type: "Concreto",
        has_basement: false,
        has_elevator: false,
        has_fire_system: false,
        has_sprinkler: false,
        has_alarm: false,
        has_emergency_exit: false,
        has_generator: false,
        notes: null,
        status: "active",
      });
    }
    onOpen();
  };

  const handleCloseDialog = () => {
    onClose();
    setIsEditMode(false);
    setCurrentBuilding(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanData = {
        ...formData,
        zip_code: removeMask(formData.zip_code),
      };

      if (isEditMode && currentBuilding) {
        await updateBuilding(currentBuilding.id, cleanData);
        toast.success("Edifício atualizado com sucesso!");
      } else {
        await createBuilding(cleanData);
        toast.success("Edifício cadastrado com sucesso!");
      }
      handleCloseDialog();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar edifício");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o edifício ${name}?`)) {
      try {
        await deleteBuilding(id);
        toast.success("Edifício excluído com sucesso!");
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir edifício");
      }
    }
  };

  const filteredBuildings = buildings.filter(
    (building) =>
      building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "danger";
      case "under_construction":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Ativo";
      case "inactive":
        return "Inativo";
      case "under_construction":
        return "Em Construção";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white">
                  Meus Edifícios
                </h1>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">
                Gerencie todos os edifícios cadastrados
              </p>
            </div>
            <Button
              color="primary"
              startContent={<Plus className="h-4 w-4" />}
              onClick={() => handleOpenDialog()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/30"
              size="lg"
            >
              Novo Edifício
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardBody className="p-4">
            <Input
              placeholder="Buscar por nome, endereço ou cidade..."
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
              aria-label="Tabela de edifícios"
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
                <TableColumn>ENDEREÇO</TableColumn>
                <TableColumn>TIPO</TableColumn>
                <TableColumn>ANDARES</TableColumn>
                <TableColumn>ANO</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn align="end">AÇÕES</TableColumn>
              </TableHeader>
              <TableBody
                items={filteredBuildings}
                isLoading={loading}
                loadingContent={
                  <Spinner label="Carregando..." color="primary" />
                }
                emptyContent={
                  <div className="text-center py-12">
                    <Building2 className="h-16 w-16 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-500 dark:text-zinc-400 text-lg">
                      Nenhum edifício cadastrado
                    </p>
                  </div>
                }
              >
                {(building) => (
                  <TableRow key={building.id}>
                    <TableCell className="font-medium">
                      {building.name}
                    </TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <div>
                          <div>{building.address}</div>
                          <div className="text-sm">
                            {building.city}/{building.state}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{building.building_type}</TableCell>
                    <TableCell>{building.total_floors}</TableCell>
                    <TableCell>{building.construction_year || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        color={getStatusColor(building.status)}
                        size="sm"
                        variant="flat"
                      >
                        {getStatusLabel(building.status)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          isIconOnly
                          variant="flat"
                          size="sm"
                          onClick={() => handleOpenDialog(building)}
                          className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          isIconOnly
                          variant="flat"
                          size="sm"
                          onClick={() =>
                            handleDelete(building.id, building.name)
                          }
                          className="bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          isIconOnly
                          variant="flat"
                          size="sm"
                          onPress={() =>
                            router.push(`/sistema/assessments/${building.id}`)
                          }
                          className="bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50 text-green-600 dark:text-green-400"
                        >
                          <ClipboardCheck className="h-4 w-4" />
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
        scrollBehavior="outside"
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleSubmit}>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {isEditMode ? "Editar Edifício" : "Novo Edifício"}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-normal">
                  {isEditMode
                    ? "Atualize as informações do edifício"
                    : "Preencha os dados do edifício"}
                </p>
              </ModalHeader>
              <ModalBody>
                <div className="grid gap-6">
                  {/* Informações Básicas */}
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                      Informações Básicas
                    </h3>
                    <div className="grid gap-4">
                      <Input
                        label="Nome do Edifício"
                        placeholder="Ex: Edifício Central"
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                          label="Tipo de Edifício"
                          placeholder="Selecione o tipo"
                          selectedKeys={[formData.building_type]}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              building_type: e.target.value,
                            })
                          }
                          isRequired
                          variant="bordered"
                          classNames={{
                            label:
                              "text-zinc-700 dark:text-zinc-300 font-medium",
                            trigger:
                              "border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 data-[focus=true]:border-blue-600 dark:data-[focus=true]:border-blue-500",
                          }}
                        >
                          {buildingTypes.map((type) => (
                            <SelectItem key={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </Select>
                        <Select
                          label="Status"
                          placeholder="Selecione o status"
                          selectedKeys={[formData.status]}
                          onChange={(e) =>
                            setFormData({ ...formData, status: e.target.value })
                          }
                          isRequired
                          variant="bordered"
                          classNames={{
                            label:
                              "text-zinc-700 dark:text-zinc-300 font-medium",
                            trigger:
                              "border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 data-[focus=true]:border-blue-600 dark:data-[focus=true]:border-blue-500",
                          }}
                        >
                          {statusTypes.map((status) => (
                            <SelectItem key={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Localização */}
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                      Localização
                    </h3>
                    <div className="grid gap-4">
                      <Input
                        label="Endereço"
                        placeholder="Rua, número"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          label="Cidade"
                          placeholder="Digite a cidade"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          isRequired
                          variant="bordered"
                          classNames={{
                            label:
                              "text-zinc-700 dark:text-zinc-300 font-medium",
                            input: "text-zinc-900 dark:text-white",
                            inputWrapper:
                              "border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 group-data-[focus=true]:border-blue-600 dark:group-data-[focus=true]:border-blue-500",
                          }}
                        />
                        <Select
                          label="Estado"
                          placeholder="UF"
                          selectedKeys={formData.state ? [formData.state] : []}
                          onChange={(e) =>
                            setFormData({ ...formData, state: e.target.value })
                          }
                          isRequired
                          variant="bordered"
                          classNames={{
                            label:
                              "text-zinc-700 dark:text-zinc-300 font-medium",
                            trigger:
                              "border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 data-[focus=true]:border-blue-600 dark:data-[focus=true]:border-blue-500",
                          }}
                        >
                          {brazilianStates.map((state) => (
                            <SelectItem key={state}>{state}</SelectItem>
                          ))}
                        </Select>
                        <Input
                          label="CEP"
                          placeholder="00000-000"
                          value={formData.zip_code}
                          onChange={(e) => handleCEPChange(e.target.value)}
                          maxLength={9}
                          isRequired
                          variant="bordered"
                          classNames={{
                            label:
                              "text-zinc-700 dark:text-zinc-300 font-medium",
                            input: "text-zinc-900 dark:text-white",
                            inputWrapper:
                              "border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 group-data-[focus=true]:border-blue-600 dark:group-data-[focus=true]:border-blue-500",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Características */}
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                      Características
                    </h3>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          label="Número de Andares"
                          type="number"
                          min={1}
                          value={formData.total_floors.toString()}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              total_floors: parseInt(e.target.value) || 1,
                            })
                          }
                          isRequired
                          variant="bordered"
                          classNames={{
                            label:
                              "text-zinc-700 dark:text-zinc-300 font-medium",
                            input: "text-zinc-900 dark:text-white",
                            inputWrapper:
                              "border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 group-data-[focus=true]:border-blue-600 dark:group-data-[focus=true]:border-blue-500",
                          }}
                        />
                        <Input
                          label="Área Total (m²)"
                          type="number"
                          min={0}
                          step="0.01"
                          value={formData.total_area?.toString() || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              total_area: e.target.value
                                ? parseFloat(e.target.value)
                                : null,
                            })
                          }
                          variant="bordered"
                          classNames={{
                            label:
                              "text-zinc-700 dark:text-zinc-300 font-medium",
                            input: "text-zinc-900 dark:text-white",
                            inputWrapper:
                              "border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 group-data-[focus=true]:border-blue-600 dark:group-data-[focus=true]:border-blue-500",
                          }}
                        />
                        <Input
                          label="Ano de Construção"
                          type="number"
                          min={1900}
                          max={new Date().getFullYear()}
                          value={formData.construction_year?.toString() || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              construction_year: e.target.value
                                ? parseInt(e.target.value)
                                : null,
                            })
                          }
                          variant="bordered"
                          classNames={{
                            label:
                              "text-zinc-700 dark:text-zinc-300 font-medium",
                            input: "text-zinc-900 dark:text-white",
                            inputWrapper:
                              "border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 group-data-[focus=true]:border-blue-600 dark:group-data-[focus=true]:border-blue-500",
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                          label="Tipo de Estrutura"
                          placeholder="Selecione a estrutura"
                          selectedKeys={
                            formData.structure_type
                              ? [formData.structure_type]
                              : []
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              structure_type: e.target.value,
                            })
                          }
                          variant="bordered"
                          classNames={{
                            label:
                              "text-zinc-700 dark:text-zinc-300 font-medium",
                            trigger:
                              "border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 data-[focus=true]:border-blue-600 dark:data-[focus=true]:border-blue-500",
                          }}
                        >
                          {structureTypes.map((type) => (
                            <SelectItem key={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </Select>
                        <Input
                          label="Tipo de Ocupação"
                          placeholder="Ex: Escritórios, Apartamentos"
                          value={formData.occupancy_type || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              occupancy_type: e.target.value || null,
                            })
                          }
                          variant="bordered"
                          classNames={{
                            label:
                              "text-zinc-700 dark:text-zinc-300 font-medium",
                            input: "text-zinc-900 dark:text-white",
                            inputWrapper:
                              "border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 group-data-[focus=true]:border-blue-600 dark:group-data-[focus=true]:border-blue-500",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sistemas de Segurança */}
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                      Sistemas de Segurança e Infraestrutura
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Switch
                        isSelected={formData.has_basement}
                        onValueChange={(value) =>
                          setFormData({ ...formData, has_basement: value })
                        }
                        classNames={{
                          wrapper: "group-data-[selected=true]:bg-blue-600",
                        }}
                      >
                        <span className="text-zinc-700 dark:text-zinc-300">
                          Possui Subsolo
                        </span>
                      </Switch>
                      <Switch
                        isSelected={formData.has_elevator}
                        onValueChange={(value) =>
                          setFormData({ ...formData, has_elevator: value })
                        }
                        classNames={{
                          wrapper: "group-data-[selected=true]:bg-blue-600",
                        }}
                      >
                        <span className="text-zinc-700 dark:text-zinc-300">
                          Possui Elevador
                        </span>
                      </Switch>
                      <Switch
                        isSelected={formData.has_fire_system}
                        onValueChange={(value) =>
                          setFormData({ ...formData, has_fire_system: value })
                        }
                        classNames={{
                          wrapper: "group-data-[selected=true]:bg-blue-600",
                        }}
                      >
                        <span className="text-zinc-700 dark:text-zinc-300">
                          Sistema de Incêndio
                        </span>
                      </Switch>
                      <Switch
                        isSelected={formData.has_sprinkler}
                        onValueChange={(value) =>
                          setFormData({ ...formData, has_sprinkler: value })
                        }
                        classNames={{
                          wrapper: "group-data-[selected=true]:bg-blue-600",
                        }}
                      >
                        <span className="text-zinc-700 dark:text-zinc-300">
                          Sprinklers
                        </span>
                      </Switch>
                      <Switch
                        isSelected={formData.has_alarm}
                        onValueChange={(value) =>
                          setFormData({ ...formData, has_alarm: value })
                        }
                        classNames={{
                          wrapper: "group-data-[selected=true]:bg-blue-600",
                        }}
                      >
                        <span className="text-zinc-700 dark:text-zinc-300">
                          Sistema de Alarme
                        </span>
                      </Switch>
                      <Switch
                        isSelected={formData.has_emergency_exit}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            has_emergency_exit: value,
                          })
                        }
                        classNames={{
                          wrapper: "group-data-[selected=true]:bg-blue-600",
                        }}
                      >
                        <span className="text-zinc-700 dark:text-zinc-300">
                          Saída de Emergência
                        </span>
                      </Switch>
                      <Switch
                        isSelected={formData.has_generator}
                        onValueChange={(value) =>
                          setFormData({ ...formData, has_generator: value })
                        }
                        classNames={{
                          wrapper: "group-data-[selected=true]:bg-blue-600",
                        }}
                      >
                        <span className="text-zinc-700 dark:text-zinc-300">
                          Gerador de Emergência
                        </span>
                      </Switch>
                    </div>
                  </div>

                  {/* Observações */}
                  <Textarea
                    label="Observações"
                    placeholder="Informações adicionais sobre o edifício..."
                    value={formData.notes || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notes: e.target.value || null,
                      })
                    }
                    variant="bordered"
                    minRows={3}
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
                  {isEditMode ? "Atualizar" : "Cadastrar"}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
