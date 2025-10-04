"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  useQuestionStore,
  type QuestionTopic,
  type Question,
  type QuestionFormData,
  type QuestionOption,
} from "@/store/questionStore";
import {
  ArrowLeft,
  Plus,
  Eye,
  EyeOff,
  Building,
  Building2,
  Factory,
  Home,
  School,
  CheckCircle,
  List as ListIcon,
  Hash,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Badge,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Select,
  SelectItem,
  Textarea,
  Switch,
} from "@heroui/react";
import toast from "react-hot-toast";
import { QuestionItem } from "@/components/questions/QuestionItem";

const buildingTypeIcons = {
  Residencial: Home,
  Comercial: Building2,
  Industrial: Factory,
  Escola: School,
  Misto: Building,
};


const questionTypes = [
  { value: "yes_no", label: "Sim/Não", icon: CheckCircle },
  { value: "single_choice", label: "Escolha Única", icon: ListIcon },  // ✅ Adicionar
  { value: "multiple_choice", label: "Múltipla Escolha", icon: ListIcon },
  { value: "numeric", label: "Numérica", icon: Hash },
  { value: "text", label: "Texto Livre", icon: FileText },
] as const;

type QuestionType = (typeof questionTypes)[number]["value"];

export default function TopicDetailPage() {
  const router = useRouter();
  const params = useParams();
  const topicId = params.topicId as string;

  const { topics, loading, fetchTopics, fetchQuestionTree } =
    useQuestionStore();
  const [topic, setTopic] = useState<QuestionTopic | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set()
  );

  const {
    isOpen: isQuestionModalOpen,
    onOpen: onQuestionModalOpen,
    onClose: onQuestionModalClose,
  } = useDisclosure();

  const [isEditMode, setIsEditMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [parentQuestion, setParentQuestion] = useState<Question | null>(null);

  const [questionFormData, setQuestionFormData] = useState<QuestionFormData>({
    topic_id: topicId,
    parent_question_id: null,
    question_text: "",
    question_type: "yes_no",
    max_score: 10,
    weight: 1,
    is_critical: false,
    help_text: null,
    display_order: 0,
    condition_parent_answer: null,
    condition_parent_option_id: null,
  });

  const [optionsData, setOptionsData] = useState<
    Omit<QuestionOption, "id" | "created_at">[] // ✅ Remover "question_id" do Omit
  >([]);

  useEffect(() => {
    loadTopicData();
  }, [topicId]);

  const loadTopicData = async () => {
    try {
      // Buscar tópicos se ainda não foram carregados
      const { topics: currentTopics } = useQuestionStore.getState();
      if (currentTopics.length === 0) {
        await fetchTopics();
      }

      // Encontrar o tópico atual
      const currentTopic = useQuestionStore
        .getState()
        .topics.find((t) => t.id === topicId);
      if (currentTopic) {
        setTopic(currentTopic);
      } else {
        toast.error("Tópico não encontrado");
        router.push("/sistema/questions");
        return;
      }

      // Carregar perguntas
      await loadQuestions();
    } catch (error: any) {
      console.error("Erro ao carregar dados do tópico:", error);
      toast.error(
        `Erro ao carregar tópico: ${error?.message || "Erro desconhecido"}`
      );
    }
  };

  const loadQuestions = async () => {
    try {
      const tree = await fetchQuestionTree(topicId);
      setQuestions(tree);
    } catch (error: any) {
      console.error("Erro ao carregar perguntas:", error);
      toast.error(
        `Erro ao carregar perguntas: ${error?.message || "Erro desconhecido"}`
      );
    }
  };

  // ✅ ATUALIZADO: Agora aceita parent como segundo parâmetro
    const handleOpenQuestionModal = (
    questionOrParent?: Question | null,
    isEditingQuestion?: boolean
  ) => {
    try {
      if (isEditingQuestion && questionOrParent) {
        const question = questionOrParent;

        // Buscar o parent da pergunta
        const findParent = (
          qs: Question[],
          targetId: string,
          parentId?: string
        ): Question | null => {
          for (const q of qs) {
            // Se encontrou o parent pelo ID
            if (parentId && q.id === parentId) {
              console.log("✅ Parent encontrado por ID:", q);
              return q;
            }
            
            // Verifica se alguma subquestion é a pergunta alvo
            if (q.subquestions && q.subquestions.length > 0) {
              const isDirectParent = q.subquestions.some(sub => sub.id === targetId);
              if (isDirectParent) {
                console.log("✅ Parent encontrado como parent direto:", q);
                return q;
              }
              
              // Busca recursiva nas subquestions
              const found = findParent(q.subquestions, targetId, parentId);
              if (found) return found;
            }
          }
          return null;
        };

        const parent = question.parent_question_id 
          ? findParent(questions, question.id, question.parent_question_id)
          : null;

        console.log("🔍 Debug completo:", {
          questionId: question.id,
          questionText: question.question_text,
          parentQuestionId: question.parent_question_id,
          parentFound: parent,
          parentType: parent?.question_type,
          parentOptions: parent?.options,
          condition_parent_answer: question.condition_parent_answer,
          condition_parent_option_id: question.condition_parent_option_id,
        });

        setIsEditMode(true);
        setCurrentQuestion(question);
        setParentQuestion(parent);
        setQuestionFormData({
          topic_id: question.topic_id,
          parent_question_id: question.parent_question_id,
          question_text: question.question_text,
          question_type: question.question_type,
          max_score: question.max_score,
          weight: question.weight,
          is_critical: question.is_critical,
          help_text: question.help_text,
          display_order: question.display_order,
          condition_parent_answer: question.condition_parent_answer || null,
          condition_parent_option_id: question.condition_parent_option_id || null,
        });
        setOptionsData(question.options || []);
      } else {
        // Modo de criação
        const parent = questionOrParent || null;
        setIsEditMode(false);
        setCurrentQuestion(null);
        setParentQuestion(parent);

        setQuestionFormData({
          topic_id: topicId,
          parent_question_id: parent?.id || null,
          question_text: "",
          question_type: "yes_no",
          max_score: parent ? parent.max_score / 2 : 10,
          weight: 1,
          is_critical: false,
          help_text: null,
          display_order: 0,
          condition_parent_answer: null,
          condition_parent_option_id: null,
        });
        setOptionsData([]);
      }
      onQuestionModalOpen();
    } catch (error: any) {
      console.error("❌ Erro ao abrir modal:", error);
      toast.error(`Erro ao abrir modal: ${error?.message || "Erro desconhecido"}`);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!questionFormData.question_text.trim()) {
        toast.error("Digite o texto da pergunta");
        return;
      }

      if (
        questionFormData.question_type === "multiple_choice" &&
        optionsData.length < 2
      ) {
        toast.error("Adicione pelo menos 2 opções");
        return;
      }

      // Validar opções para multiple_choice
      if (questionFormData.question_type === "multiple_choice") {
        const invalidOptions = optionsData.filter(
          (opt) => !opt.option_text.trim()
        );
        if (invalidOptions.length > 0) {
          toast.error("Todas as opções devem ter texto");
          return;
        }
      }

      const { createQuestion, updateQuestion } = useQuestionStore.getState();

      console.log("Salvando pergunta:", {
        formData: questionFormData,
        options: optionsData,
        isEditMode,
      });

      if (isEditMode && currentQuestion) {
        await updateQuestion(currentQuestion.id, questionFormData);
        toast.success("Pergunta atualizada!");
      } else {
        await createQuestion(questionFormData, optionsData);
        toast.success("Pergunta criada!");
      }

      await loadQuestions();
      onQuestionModalClose();
    } catch (error: any) {
      console.error("Erro detalhado ao salvar pergunta:", error);

      // Tratamento específico de erros do Supabase
      if (error?.code) {
        toast.error(`Erro no banco: ${error.code} - ${error.message}`);
      } else if (error?.message) {
        toast.error(`Erro: ${error.message}`);
      } else {
        toast.error("Erro desconhecido ao salvar pergunta");
      }
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta pergunta?")) {
      return;
    }

    try {
      const { deleteQuestion } = useQuestionStore.getState();
      await deleteQuestion(id);
      toast.success("Pergunta excluída!");
      await loadQuestions();
    } catch (error: any) {
      console.error("Erro ao excluir pergunta:", error);
      toast.error(`Erro ao excluir: ${error?.message || "Erro desconhecido"}`);
    }
  };

  const addOption = () => {
    setOptionsData([
      ...optionsData,
      {
        question_id: "", // ✅ Será preenchido ao salvar
        option_text: "",
        score_value: 0,
        triggers_subquestion: false,
        display_order: optionsData.length,
      },
    ]);
  };

  const updateOption = (
    index: number,
    field: keyof QuestionOption,
    value: any
  ) => {
    const newOptions = [...optionsData];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptionsData(newOptions);
  };

  const removeOption = (index: number) => {
    setOptionsData(optionsData.filter((_, i) => i !== index));
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const addIds = (qs: Question[]) => {
      qs.forEach((q) => {
        if (q.subquestions && q.subquestions.length > 0) {
          allIds.add(q.id);
          addIds(q.subquestions);
        }
      });
    };
    addIds(questions);
    setExpandedQuestions(allIds);
  };

  const collapseAll = () => {
    setExpandedQuestions(new Set());
  };

  if (!topic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  const BuildingIcon =
    buildingTypeIcons[topic.building_type as keyof typeof buildingTypeIcons] ||
    Building;
  const countQuestions = (qs: Question[]): number => {
    return qs.reduce(
      (total, q) =>
        total + 1 + (q.subquestions ? countQuestions(q.subquestions) : 0),
      0
    );
  };
  const totalQuestions = countQuestions(questions);
  const criticalQuestions = questions.filter((q) => q.is_critical).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-blue-50/30 to-zinc-50 dark:from-zinc-950 dark:via-blue-950/10 dark:to-zinc-950 p-4 md:p-8">
      <div className="">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="flat"
            startContent={<ArrowLeft className="h-5 w-5" />}
            onClick={() => router.push("/sistema/questions")}
            className="mb-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
          >
            Voltar para Tópicos
          </Button>

          <Card className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 shadow-xl">
            <CardBody className="p-8">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-6 flex-1">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center text-white font-bold text-3xl shadow-lg flex-shrink-0">
                    {topic.display_order + 1}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                        <BuildingIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">
                        {topic.name}
                      </h1>
                    </div>

                    {topic.description && (
                      <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
                        {topic.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <Chip
                        size="lg"
                        variant="flat"
                        className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        startContent={<BuildingIcon className="h-4 w-4" />}
                      >
                        {topic.building_type}
                      </Chip>

                      <Badge
                        content={totalQuestions}
                        classNames={{
                          badge: "bg-blue-600 dark:bg-blue-500 text-white",
                        }}
                      >
                        <Chip
                          size="lg"
                          variant="flat"
                          className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                        >
                          Perguntas
                        </Chip>
                      </Badge>

                      {criticalQuestions > 0 && (
                        <Badge
                          content={criticalQuestions}
                          classNames={{
                            badge: "bg-blue-600 dark:bg-blue-500 text-white",
                          }}
                        >
                          <Chip
                            size="lg"
                            variant="flat"
                            className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            startContent={<AlertTriangle className="h-4 w-4" />}
                          >
                            Críticas
                          </Chip>
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Actions Bar */}
        <Card className="mb-6 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {questions.length > 0 && (
                  <>
                    <Button
                      size="sm"
                      variant="flat"
                      startContent={<Eye className="h-4 w-4" />}
                      onClick={expandAll}
                      className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    >
                      Expandir Tudo
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      startContent={<EyeOff className="h-4 w-4" />}
                      onClick={collapseAll}
                      className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    >
                      Recolher Tudo
                    </Button>
                  </>
                )}
              </div>
              <Button
                color="primary"
                size="lg"
                startContent={<Plus className="h-5 w-5" />}
                onClick={() => handleOpenQuestionModal()}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-lg"
              >
                Nova Pergunta
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Questions List */}
        <div className="space-y-4">
          {questions.length === 0 ? (
            <Card className="bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-300 dark:border-zinc-700">
              <CardBody className="p-16 text-center">
                <div className="inline-block p-6 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-6">
                  <FileText className="h-16 w-16 text-zinc-400" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
                  Nenhuma pergunta cadastrada
                </h3>
                <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">
                  Comece adicionando perguntas para este tópico
                </p>
                <Button
                  color="primary"
                  size="lg"
                  startContent={<Plus className="h-5 w-5" />}
                  onClick={() => handleOpenQuestionModal()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Adicionar Primeira Pergunta
                </Button>
              </CardBody>
            </Card>
          ) : (
            questions.map((question) => (
              <QuestionItem
                key={question.id}
                question={question}
                onEdit={(q, parent) => handleOpenQuestionModal(q, true)} // ✅ ATUALIZADO
                onDelete={handleDeleteQuestion}
                onAddSubQuestion={(parent) => handleOpenQuestionModal(parent)}
                level={0}
                expandedQuestions={expandedQuestions}
                onToggleExpand={(id) => {
                  const newExpanded = new Set(expandedQuestions);
                  if (newExpanded.has(id)) {
                    newExpanded.delete(id);
                  } else {
                    newExpanded.add(id);
                  }
                  setExpandedQuestions(newExpanded);
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Question Modal */}
      <Modal
        isOpen={isQuestionModalOpen}
        onClose={onQuestionModalClose}
        size="4xl"
        scrollBehavior="outside"
      >
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleSubmitQuestion}>
              <ModalHeader className="border-b-2 border-zinc-200 dark:border-zinc-800 pb-4">
                <div className="w-full">
                  <h2 className="text-2xl font-bold">
                    {isEditMode ? "Editar Pergunta" : "Nova Pergunta"}
                  </h2>
                  {parentQuestion && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        Sub-pergunta de:{" "}
                        <strong>{parentQuestion.question_text}</strong>
                      </p>
                    </div>
                  )}
                </div>
              </ModalHeader>
              <ModalBody className="py-6">
                <div className="grid gap-6">
                  <Textarea
                    label="Texto da Pergunta"
                    placeholder="Digite a pergunta..."
                    value={questionFormData.question_text}
                    onChange={(e) =>
                      setQuestionFormData({
                        ...questionFormData,
                        question_text: e.target.value,
                      })
                    }
                    isRequired
                    variant="bordered"
                    size="lg"
                    minRows={2}
                    classNames={{
                      label: "font-semibold",
                      inputWrapper: "border-2",
                    }}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <Select
                      label="Tipo de Pergunta"
                      selectedKeys={[questionFormData.question_type]}
                      onChange={(e) => {
                        const value = e.target.value as QuestionType;
                        setQuestionFormData({
                          ...questionFormData,
                          question_type: value,
                        });
                      }}
                      isRequired
                      variant="bordered"
                      size="lg"
                      classNames={{
                        label: "font-semibold",
                        trigger: "border-2",
                      }}
                    >
                      {questionTypes.map((type) => {
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
                      label="Pontuação Máxima"
                      type="number"
                      min={0}
                      step="0.01"
                      value={questionFormData.max_score.toString()}
                      onChange={(e) =>
                        setQuestionFormData({
                          ...questionFormData,
                          max_score: parseFloat(e.target.value) || 0,
                        })
                      }
                      isRequired
                      variant="bordered"
                      size="lg"
                      startContent={<Hash className="h-5 w-5 text-zinc-400" />}
                      classNames={{
                        label: "font-semibold",
                        inputWrapper: "border-2",
                      }}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Peso (0-1)"
                      type="number"
                      min={0}
                      max={1}
                      step="0.01"
                      value={questionFormData.weight.toString()}
                      onChange={(e) =>
                        setQuestionFormData({
                          ...questionFormData,
                          weight: parseFloat(e.target.value) || 1,
                        })
                      }
                      variant="bordered"
                      size="lg"
                      classNames={{
                        label: "font-semibold",
                        inputWrapper: "border-2",
                      }}
                    />

                    <Input
                      label="Ordem de Exibição"
                      type="number"
                      value={questionFormData.display_order.toString()}
                      onChange={(e) =>
                        setQuestionFormData({
                          ...questionFormData,
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

                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-zinc-200 dark:border-zinc-700">
                    <Switch
                      isSelected={questionFormData.is_critical}
                      onValueChange={(value) =>
                        setQuestionFormData({
                          ...questionFormData,
                          is_critical: value,
                        })
                      }
                      size="lg"
                      classNames={{
                        wrapper: "group-data-[selected=true]:bg-blue-600",
                      }}
                    >
                      <div>
                        <span className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Pergunta Crítica
                        </span>
                        <span className="text-xs text-zinc-600 dark:text-zinc-400 block mt-1">
                          Perguntas críticas têm maior impacto na avaliação
                        </span>
                      </div>
                    </Switch>
                  </div>

                  <Textarea
                    label="Texto de Ajuda (Opcional)"
                    placeholder="Orientações para responder..."
                    value={questionFormData.help_text || ""}
                    onChange={(e) =>
                      setQuestionFormData({
                        ...questionFormData,
                        help_text: e.target.value || null,
                      })
                    }
                    variant="bordered"
                    size="lg"
                    minRows={2}
                    classNames={{
                      label: "font-semibold",
                      inputWrapper: "border-2",
                    }}
                  />

                  {/* Condições - apenas para sub-perguntas */}
                  {parentQuestion && (
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 rounded-xl border-2 border-blue-300 dark:border-blue-800">
                      <h3 className="font-bold text-lg flex items-center gap-2 mb-4 text-blue-900 dark:text-blue-100">
                        <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Condição de Exibição
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                        Esta sub-pergunta será exibida apenas quando a condição for atendida
                      </p>

                      {/* ✅ REMOVIDO: Box de debug */}

                      {/* ✅ ADICIONADO: Verificação para single_choice e multiple_choice */}
                      {(parentQuestion.question_type === "multiple_choice" || 
                        parentQuestion.question_type === "single_choice") ? (
                        <Select
                          label="Exibir quando a opção selecionada for"
                          selectedKeys={
                            questionFormData.condition_parent_option_id
                              ? [questionFormData.condition_parent_option_id]
                              : []
                          }
                          onChange={(e) => {
                            console.log("Selecionou opção:", e.target.value);
                            setQuestionFormData({
                              ...questionFormData,
                              condition_parent_option_id: e.target.value || null,
                              condition_parent_answer: null,
                            });
                          }}
                          variant="bordered"
                          size="lg"
                          placeholder="Selecione uma opção"
                          classNames={{
                            label: "font-semibold",
                            trigger: "border-2",
                          }}
                        >
                          {parentQuestion.options?.map((option) => (
                            <SelectItem
                              key={option.id}
                              textValue={option.option_text}
                            >
                              {option.option_text}
                            </SelectItem>
                          )) || []}
                        </Select>
                      ) : parentQuestion.question_type === "yes_no" ? (
                        <Select
                          label="Exibir quando a resposta for"
                          selectedKeys={
                            questionFormData.condition_parent_answer
                              ? [questionFormData.condition_parent_answer]
                              : []
                          }
                          onChange={(e) => {
                            console.log("Selecionou yes/no:", e.target.value);
                            setQuestionFormData({
                              ...questionFormData,
                              condition_parent_answer: e.target.value || null,
                              condition_parent_option_id: null,
                            });
                          }}
                          variant="bordered"
                          size="lg"
                          placeholder="Selecione Sim ou Não"
                          classNames={{
                            label: "font-semibold",
                            trigger: "border-2",
                          }}
                        >
                          <SelectItem key="true" textValue="Sim">
                            Sim
                          </SelectItem>
                          <SelectItem key="false" textValue="Não">
                            Não
                          </SelectItem>
                        </Select>
                      ) : (
                        <Input
                          label="Exibir quando o valor for"
                          placeholder="Digite o valor exato..."
                          value={questionFormData.condition_parent_answer || ""}
                          onChange={(e) => {
                            console.log("Digitou valor:", e.target.value);
                            setQuestionFormData({
                              ...questionFormData,
                              condition_parent_answer: e.target.value || null,
                              condition_parent_option_id: null,
                            });
                          }}
                          variant="bordered"
                          size="lg"
                          classNames={{
                            label: "font-semibold",
                            inputWrapper: "border-2",
                          }}
                        />
                      )}
                    </div>
                  )}

                  {/* Opções de Resposta - para single_choice e multiple_choice */}
                  {(questionFormData.question_type === "multiple_choice" ||
                    questionFormData.question_type === "single_choice") && (
                    <div className="p-6 bg-blue-50 dark:bg-blue-950/30 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          <ListIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          Opções de Resposta
                        </h3>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          startContent={<Plus className="h-4 w-4" />}
                          onClick={addOption}
                          type="button"
                        >
                          Adicionar
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {optionsData.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-zinc-500 dark:text-zinc-400 mb-3">
                              Nenhuma opção adicionada
                            </p>
                            <Button
                              size="sm"
                              variant="flat"
                              onClick={addOption}
                              type="button"
                              className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                            >
                              Adicionar primeira opção
                            </Button>
                          </div>
                        ) : (
                          optionsData.map((option, index) => (
                            <Card
                              key={index}
                              className="bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700"
                            >
                              <CardBody className="p-4">
                                <div className="space-y-3">
                                  <Input
                                    placeholder="Texto da opção"
                                    value={option.option_text}
                                    onChange={(e) =>
                                      updateOption(
                                        index,
                                        "option_text",
                                        e.target.value
                                      )
                                    }
                                    variant="bordered"
                                    startContent={
                                      <span className="font-bold text-blue-600 dark:text-blue-400">
                                        {index + 1}
                                      </span>
                                    }
                                  />
                                  <div className="grid grid-cols-2 gap-3">
                                    <Input
                                      label="Pontuação"
                                      type="number"
                                      step="0.01"
                                      value={option.score_value.toString()}
                                      onChange={(e) =>
                                        updateOption(
                                          index,
                                          "score_value",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      variant="bordered"
                                      size="sm"
                                    />
                                    <Switch
                                      isSelected={option.triggers_subquestion}
                                      onValueChange={(value) =>
                                        updateOption(
                                          index,
                                          "triggers_subquestion",
                                          value
                                        )
                                      }
                                      size="sm"
                                    >
                                      Ativa sub-perguntas
                                    </Switch>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="flat"
                                    onClick={() => removeOption(index)}
                                    fullWidth
                                    type="button"
                                    className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                                  >
                                    Remover
                                  </Button>
                                </div>
                              </CardBody>
                            </Card>
                          ))
                        )}
                      </div>
                    </div>
                  )}
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
