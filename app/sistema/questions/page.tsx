"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useQuestionStore,
  type QuestionTopic,
  type Question,
} from "@/store/questionStore";
import {
  Plus,
  Search,
  BookOpen,
  Building,
  Building2,
  Factory,
  Home,
  School,
  ArrowRight,
  Edit,
  Trash2,
} from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  Textarea,
  Chip,
  Divider,
  Badge,
} from "@heroui/react";
import toast from "react-hot-toast";

const buildingTypes = [
  { value: "Residencial", label: "Residencial", icon: Home },
  { value: "Comercial", label: "Comercial", icon: Building2 },
  { value: "Industrial", label: "Industrial", icon: Factory },
  { value: "Escola", label: "Escola", icon: School },
  { value: "Misto", label: "Misto", icon: Building },
];

export default function QuestionsPage() {
  const router = useRouter();
  const { topics, loading, fetchTopics } = useQuestionStore();

  const [selectedBuildingType, setSelectedBuildingType] = useState("Comercial");
  const [searchTerm, setSearchTerm] = useState("");
  const [topicQuestionCounts, setTopicQuestionCounts] = useState<
    Map<string, number>
  >(new Map());

  const {
    isOpen: isTopicModalOpen,
    onOpen: onTopicModalOpen,
    onClose: onTopicModalClose,
  } = useDisclosure();

  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<QuestionTopic | null>(null);

  const [topicFormData, setTopicFormData] = useState({
    name: "",
    description: "",
    building_type: "Comercial",
    display_order: 0,
  });

  useEffect(() => {
    fetchTopics(selectedBuildingType);
  }, [selectedBuildingType, fetchTopics]);

  useEffect(() => {
    loadQuestionCounts();
  }, [topics]);

  const loadQuestionCounts = async () => {
    const counts = new Map<string, number>();
    const { fetchQuestionTree } = useQuestionStore.getState();

    for (const topic of topics) {
      const tree = await fetchQuestionTree(topic.id);
      const countQuestions = (questions: Question[]): number => {
        return questions.reduce((total, q) => {
          return (
            total + 1 + (q.subquestions ? countQuestions(q.subquestions) : 0)
          );
        }, 0);
      };
      counts.set(topic.id, countQuestions(tree));
    }

    setTopicQuestionCounts(counts);
  };

  const handleOpenTopicModal = (topic?: QuestionTopic) => {
    if (topic) {
      setIsEditMode(true);
      setCurrentTopic(topic);
      setTopicFormData({
        name: topic.name,
        description: topic.description || "",
        building_type: topic.building_type,
        display_order: topic.display_order,
      });
    } else {
      setIsEditMode(false);
      setCurrentTopic(null);
      setTopicFormData({
        name: "",
        description: "",
        building_type: selectedBuildingType,
        display_order: topics.length,
      });
    }
    onTopicModalOpen();
  };

  const handleSubmitTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { createTopic, updateTopic } = useQuestionStore.getState();

      if (isEditMode && currentTopic) {
        await updateTopic(currentTopic.id, topicFormData);
        toast.success("Tópico atualizado com sucesso!");
      } else {
        await createTopic(topicFormData);
        toast.success("Tópico criado com sucesso!");
      }
      onTopicModalClose();
      await loadQuestionCounts();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar tópico");
    }
  };

  const handleDeleteTopic = async (id: string, name: string) => {
    if (
      confirm(
        `Tem certeza que deseja excluir o tópico "${name}"? Todas as perguntas associadas serão excluídas.`
      )
    ) {
      try {
        const { deleteTopic } = useQuestionStore.getState();
        await deleteTopic(id);
        toast.success("Tópico excluído com sucesso!");
        await loadQuestionCounts();
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir tópico");
      }
    }
  };

  const handleNavigateToTopic = (topicId: string) => {
    router.push(`/sistema/questions/${topicId}`);
  };

  const filteredTopics = topics.filter(
    (topic) =>
      topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const buildingTypeIcons = {
    Residencial: Home,
    Comercial: Building2,
    Industrial: Factory,
    Escola: School,
    Misto: Building,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-blue-50/30 to-zinc-50 dark:from-zinc-950 dark:via-blue-950/10 dark:to-zinc-950 p-4 md:p-8">
      <div className="">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-2">
                Questionários de Avaliação
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Configure tópicos e perguntas para avaliação de risco dos
                edifícios
              </p>
            </div>
          </div>
        </div>

        {/* Filtros e Ações */}
        <Card className="mb-8 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 shadow-xl">
          <CardBody className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Select
                label="Tipo de Edifício"
                selectedKeys={[selectedBuildingType]}
                onChange={(e) => setSelectedBuildingType(e.target.value)}
                variant="bordered"
                size="lg"
                startContent={(() => {
                  const type = buildingTypes.find(
                    (t) => t.value === selectedBuildingType
                  );
                  const IconComponent = type?.icon;
                  return IconComponent ? (
                    <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  ) : null;
                })()}
                classNames={{
                  label: "font-semibold",
                  trigger: "border-2",
                }}
              >
                {buildingTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <SelectItem key={type.value} textValue={type.label}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </Select>

              <Input
                placeholder="Buscar tópicos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startContent={<Search className="h-5 w-5 text-zinc-400" />}
                variant="bordered"
                size="lg"
                classNames={{
                  inputWrapper: "border-2",
                }}
              />

              <Button
                color="primary"
                size="lg"
                startContent={<Plus className="h-5 w-5" />}
                onClick={() => handleOpenTopicModal()}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-lg"
              >
                Novo Tópico
              </Button>
            </div>

            <Divider className="my-4" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Chip
                  size="lg"
                  variant="flat"
                  className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{filteredTopics.length} Tópicos</span>
                  </div>
                </Chip>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Grid de Tópicos */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.length === 0 ? (
            <div className="col-span-full">
              <Card className="bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-300 dark:border-zinc-700">
                <CardBody className="p-16 text-center flex flex-col items-center">
                  <div className="inline-block p-6 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-6">
                    <BookOpen className="h-16 w-16 text-zinc-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
                    {searchTerm
                      ? "Nenhum tópico encontrado"
                      : "Nenhum tópico cadastrado"}
                  </h3>
                  <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">
                    {searchTerm
                      ? "Tente buscar com outros termos"
                      : "Comece criando seu primeiro tópico de avaliação"}
                  </p>
                  {!searchTerm && (
                    <Button
                      color="primary"
                      size="lg"
                      startContent={<Plus className="h-5 w-5" />}
                      onClick={() => handleOpenTopicModal()}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      Criar Primeiro Tópico
                    </Button>
                  )}
                </CardBody>
              </Card>
            </div>
          ) : (
            filteredTopics.map((topic) => {
              const BuildingIcon =
                buildingTypeIcons[
                  topic.building_type as keyof typeof buildingTypeIcons
                ] || Building;
              const questionCount = topicQuestionCounts.get(topic.id) || 0;

              return (
                <Card
                  key={topic.id}
                  className="group bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-2xl transition-all duration-300"
                >
                  <CardBody className="p-6">
                    <div className="flex flex-col h-full">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {topic.display_order + 1}
                          </div>
                          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                            <BuildingIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                            onPress={() => handleOpenTopicModal(topic)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                            onPress={() => handleDeleteTopic(topic.id, topic.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>  
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {topic.name}
                        </h3>

                        {topic.description && (
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
                            {topic.description}
                          </p>
                        )}

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Chip
                            size="sm"
                            variant="flat"
                            className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                          >
                            {topic.building_type}
                          </Chip>

                          <Badge
                            content={questionCount}
                            classNames={{
                              badge: "bg-blue-600 dark:bg-blue-500 text-white",
                            }}
                          >
                            <Chip
                              size="sm"
                              variant="flat"
                              className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                            >
                              Perguntas
                            </Chip>
                          </Badge>
                        </div>
                      </div>

                      {/* Footer - Botão para navegar */}
                      <Button
                        fullWidth
                        variant="flat"
                        className="mt-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold border-2 border-blue-200 dark:border-blue-800"
                        endContent={<ArrowRight className="h-4 w-4" />}
                        onPress={() => handleNavigateToTopic(topic.id)}
                      >
                        Ver detalhes
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Topic Modal */}
      <Modal isOpen={isTopicModalOpen} onClose={onTopicModalClose} size="2xl">
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleSubmitTopic}>
              <ModalHeader className="border-b-2 border-zinc-200 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {isEditMode ? "Editar Tópico" : "Novo Tópico"}
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 font-normal">
                      {isEditMode
                        ? "Atualize as informações"
                        : "Crie um novo tópico"}
                    </p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody className="py-6">
                <div className="grid gap-6">
                  <Input
                    label="Nome do Tópico"
                    placeholder="Ex: Estrutura do Edifício"
                    value={topicFormData.name}
                    onChange={(e) =>
                      setTopicFormData({
                        ...topicFormData,
                        name: e.target.value,
                      })
                    }
                    isRequired
                    variant="bordered"
                    size="lg"
                    classNames={{
                      label: "font-semibold",
                      inputWrapper: "border-2",
                    }}
                  />
                  <Textarea
                    label="Descrição"
                    placeholder="Descreva o objetivo deste tópico..."
                    value={topicFormData.description}
                    onChange={(e) =>
                      setTopicFormData({
                        ...topicFormData,
                        description: e.target.value,
                      })
                    }
                    variant="bordered"
                    size="lg"
                    minRows={3}
                    classNames={{
                      label: "font-semibold",
                      inputWrapper: "border-2",
                    }}
                  />
                  <Select
                    label="Tipo de Edifício"
                    selectedKeys={[topicFormData.building_type]}
                    onChange={(e) =>
                      setTopicFormData({
                        ...topicFormData,
                        building_type: e.target.value,
                      })
                    }
                    isRequired
                    variant="bordered"
                    size="lg"
                    classNames={{ label: "font-semibold", trigger: "border-2" }}
                  >
                    {buildingTypes.map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <SelectItem key={type.value} textValue={type.label}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </Select>
                  <Input
                    label="Ordem de Exibição"
                    type="number"
                    value={topicFormData.display_order.toString()}
                    onChange={(e) =>
                      setTopicFormData({
                        ...topicFormData,
                        display_order: parseInt(e.target.value) || 0,
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
              </ModalBody>
              <ModalFooter className="border-t-2 border-zinc-200 dark:border-zinc-800 pt-4">
                <Button variant="flat" onPress={onClose} size="lg">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  isLoading={loading}
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
