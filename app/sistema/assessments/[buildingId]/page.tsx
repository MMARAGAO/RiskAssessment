"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBuildingStore, type Building } from "@/store/buildingStore";
import { useQuestionStore, type Question } from "@/store/questionStore";
import { useAssessmentStore } from "@/store/assessmentStore";
import {
  Button,
  Card,
  CardBody,
  Progress,
  RadioGroup,
  Radio,
  Input,
  Textarea,
  Chip,
  Spinner,
} from "@heroui/react";
import {
  ArrowLeft,
  Save,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const buildingId = params.buildingId as string;

  const { buildings, fetchBuildings } = useBuildingStore();
  const { fetchTopics, fetchQuestionTree } = useQuestionStore();
  const {
    currentAssessment,
    answers,
    loading,
    createAssessment,
    saveAnswer,
    completeAssessment,
    fetchAnswers,
    setCurrentAssessment,
  } = useAssessmentStore();

  const [building, setBuilding] = useState<Building | null>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [questionTree, setQuestionTree] = useState<Question[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set()
  );
  const [currentAnswers, setCurrentAnswers] = useState<
    Map<string, { value: any; score: number }>
  >(new Map());

  useEffect(() => {
    loadData();
  }, [buildingId]);

  const loadData = async () => {
    await fetchBuildings();
    const foundBuilding = buildings.find((b) => b.id === buildingId);

    if (!foundBuilding) {
      toast.error("Edifício não encontrado");
      router.push("/sistema/buildings");
      return;
    }

    setBuilding(foundBuilding);

    // Buscar tópicos do tipo de edifício
    const { topics: fetchedTopics } = useQuestionStore.getState();
    await fetchTopics(foundBuilding.building_type);
    const filteredTopics = fetchedTopics.filter(
      (t) => t.building_type === foundBuilding.building_type
    );

    if (filteredTopics.length === 0) {
      toast.error(
        `Nenhum questionário disponível para edifícios do tipo ${foundBuilding.building_type}`
      );
      router.push("/sistema/buildings");
      return;
    }

    setTopics(filteredTopics);

    // Criar avaliação se não existir
    if (!currentAssessment) {
      const assessmentId = await createAssessment(buildingId);
      await fetchAnswers(assessmentId);
    }

    // Carregar árvore de perguntas do primeiro tópico
    if (filteredTopics.length > 0) {
      await loadTopicQuestions(filteredTopics[0].id);
    }
  };

  const loadTopicQuestions = async (topicId: string) => {
    const tree = await fetchQuestionTree(topicId);
    setQuestionTree(tree);
  };

  const handleAnswerChange = async (
    question: Question,
    value: any,
    score: number
  ) => {
    const newAnswers = new Map(currentAnswers);
    newAnswers.set(question.id, { value, score });
    setCurrentAnswers(newAnswers);

    if (!currentAssessment) return;

    try {
      let answerData: any = { score };

      switch (question.question_type) {
        case "yes_no":
          answerData.option_id = value;
          break;
        case "multiple_choice":
          answerData.option_id = value;
          break;
        case "numeric":
          answerData.answer_numeric = parseFloat(value);
          break;
        case "text":
          answerData.answer_text = value;
          break;
      }

      await saveAnswer(currentAssessment.id, question.id, answerData);
      toast.success("Resposta salva!");

      // Se a opção ativa sub-perguntas, expandir
      if (question.options) {
        const selectedOption = question.options.find((o) => o.id === value);
        if (selectedOption?.triggers_subquestion) {
          const newExpanded = new Set(expandedQuestions);
          newExpanded.add(question.id);
          setExpandedQuestions(newExpanded);
        }
      }
    } catch (error: any) {
      toast.error("Erro ao salvar resposta");
    }
  };

  const renderQuestion = (question: Question, level: number = 0) => {
    const answer = answers.get(question.id);
    const currentAnswer = currentAnswers.get(question.id);
    const hasSubquestions =
      question.subquestions && question.subquestions.length > 0;
    const isExpanded = expandedQuestions.has(question.id);

    return (
      <div key={question.id} className={`${level > 0 ? "ml-8 mt-4" : "mb-6"}`}>
        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <CardBody className="p-6">
            {/* Question Header */}
            <div className="mb-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex-1">
                  {question.question_text}
                </h3>
                <div className="flex gap-2">
                  {question.is_critical && (
                    <Chip
                      size="sm"
                      color="danger"
                      variant="flat"
                      startContent={<AlertTriangle className="h-3 w-3" />}
                    >
                      Crítica
                    </Chip>
                  )}
                  <Chip size="sm" variant="flat" color="primary">
                    {question.max_score} pts
                  </Chip>
                </div>
              </div>

              {question.help_text && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {question.help_text}
                  </p>
                </div>
              )}
            </div>

            {/* Answer Input */}
            <div className="mb-4">
              {question.question_type === "yes_no" && (
                <RadioGroup
                  value={currentAnswer?.value || answer?.option_id || ""}
                  onValueChange={(value) => {
                    const score = value === "yes" ? question.max_score : 0;
                    handleAnswerChange(question, value, score);
                  }}
                >
                  <Radio value="yes" className="mb-2">
                    <span className="text-zinc-900 dark:text-white">Sim</span>
                  </Radio>
                  <Radio value="no">
                    <span className="text-zinc-900 dark:text-white">Não</span>
                  </Radio>
                </RadioGroup>
              )}

              {question.question_type === "multiple_choice" &&
                question.options && (
                  <RadioGroup
                    value={currentAnswer?.value || answer?.option_id || ""}
                    onValueChange={(value) => {
                      const option = question.options?.find(
                        (o) => o.id === value
                      );
                      const score = option?.score_value || 0;
                      handleAnswerChange(question, value, score);
                    }}
                  >
                    {question.options.map((option) => (
                      <Radio key={option.id} value={option.id} className="mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-900 dark:text-white">
                            {option.option_text}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            ({option.score_value} pts)
                          </span>
                        </div>
                      </Radio>
                    ))}
                  </RadioGroup>
                )}

              {question.question_type === "numeric" && (
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Digite o valor"
                  value={
                    currentAnswer?.value?.toString() ||
                    answer?.answer_numeric?.toString() ||
                    ""
                  }
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    const score = isNaN(value) ? 0 : question.max_score;
                    handleAnswerChange(question, value, score);
                  }}
                  variant="bordered"
                  classNames={{
                    input: "text-zinc-900 dark:text-white",
                    inputWrapper:
                      "border-zinc-300 dark:border-zinc-700 hover:border-blue-500",
                  }}
                />
              )}

              {question.question_type === "text" && (
                <Textarea
                  placeholder="Digite sua resposta"
                  value={currentAnswer?.value || answer?.answer_text || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    const score = value.length > 0 ? question.max_score : 0;
                    handleAnswerChange(question, value, score);
                  }}
                  variant="bordered"
                  minRows={3}
                  classNames={{
                    input: "text-zinc-900 dark:text-white",
                    inputWrapper:
                      "border-zinc-300 dark:border-zinc-700 hover:border-blue-500",
                  }}
                />
              )}
            </div>

            {/* Score Display */}
            {(currentAnswer || answer) && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Pontuação: {currentAnswer?.score || answer?.score || 0} /{" "}
                  {question.max_score}
                </span>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Sub-questions */}
        {hasSubquestions && isExpanded && (
          <div className="mt-4 space-y-4">
            {question.subquestions?.map((sub) =>
              renderQuestion(sub, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const handleNextTopic = async () => {
    if (currentTopicIndex < topics.length - 1) {
      const nextIndex = currentTopicIndex + 1;
      setCurrentTopicIndex(nextIndex);
      await loadTopicQuestions(topics[nextIndex].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePreviousTopic = async () => {
    if (currentTopicIndex > 0) {
      const prevIndex = currentTopicIndex - 1;
      setCurrentTopicIndex(prevIndex);
      await loadTopicQuestions(topics[prevIndex].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCompleteAssessment = async () => {
    if (!currentAssessment) return;

    if (
      confirm(
        "Tem certeza que deseja finalizar esta avaliação? Não será possível editar depois."
      )
    ) {
      try {
        await completeAssessment(currentAssessment.id);
        toast.success("Avaliação finalizada com sucesso!");
        router.push("/sistema/buildings");
      } catch (error: any) {
        toast.error("Erro ao finalizar avaliação");
      }
    }
  };

  const progress =
    topics.length > 0 ? ((currentTopicIndex + 1) / topics.length) * 100 : 0;

  if (loading || !building || topics.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  const currentTopic = topics[currentTopicIndex];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="light"
            startContent={<ArrowLeft className="h-4 w-4" />}
            onClick={() => router.push("/sistema/buildings")}
            className="mb-4 text-zinc-600 dark:text-zinc-400"
          >
            Voltar para Edifícios
          </Button>

          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
            <CardBody className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/10 rounded-lg">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Avaliação de Risco
                  </h1>
                  <p className="text-blue-100 text-lg">{building.name}</p>
                  <p className="text-blue-200 text-sm">
                    {building.address}, {building.city}/{building.state}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Chip
                      color="default"
                      variant="flat"
                      className="bg-white/20 text-white"
                    >
                      {building.building_type}
                    </Chip>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Progress */}
        <Card className="mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <CardBody className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                {currentTopic.name}
              </h3>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Tópico {currentTopicIndex + 1} de {topics.length}
              </span>
            </div>
            {currentTopic.description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                {currentTopic.description}
              </p>
            )}
            <Progress
              value={progress}
              color="primary"
              className="h-2"
              classNames={{
                indicator: "bg-blue-600",
              }}
            />
          </CardBody>
        </Card>

        {/* Questions */}
        <div className="mb-8">
          {questionTree.length === 0 ? (
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <CardBody className="p-12 text-center">
                <p className="text-zinc-500 dark:text-zinc-400">
                  Nenhuma pergunta cadastrada neste tópico
                </p>
              </CardBody>
            </Card>
          ) : (
            questionTree.map((question) => renderQuestion(question))
          )}
        </div>

        {/* Navigation */}
        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <CardBody className="p-6">
            <div className="flex justify-between items-center gap-4">
              <Button
                variant="bordered"
                onPress={handlePreviousTopic}
                isDisabled={currentTopicIndex === 0}
                className="border-zinc-300 dark:border-zinc-700"
              >
                Tópico Anterior
              </Button>

              <div className="flex gap-3">
                {currentTopicIndex === topics.length - 1 ? (
                  <Button
                    color="success"
                    startContent={<CheckCircle className="h-4 w-4" />}
                    onPress={handleCompleteAssessment}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium"
                  >
                    Finalizar Avaliação
                  </Button>
                ) : (
                  <Button
                    color="primary"
                    onPress={handleNextTopic}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    Próximo Tópico
                  </Button>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
