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
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

export default function TopicQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const buildingId = params.buildingId as string;
  const topicId = params.topicId as string;

  const { buildings, fetchBuildings } = useBuildingStore();
  const { topics, fetchTopics, fetchQuestionTree } = useQuestionStore();
  const {
    currentAssessment,
    answers,
    loading,
    saveAnswer,
    fetchAnswers,
  } = useAssessmentStore();

  const [building, setBuilding] = useState<Building | null>(null);
  const [topic, setTopic] = useState<any | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [currentAnswers, setCurrentAnswers] = useState<Map<string, { value: any; score: number }>>(new Map());

  useEffect(() => {
    if (buildingId && topicId && !isInitialized) {
      setIsInitialized(true);
      loadData();
    }
  }, [buildingId, topicId]);

  const loadData = async () => {
    const fetchedBuildings = await fetchBuildings();
    const foundBuilding = fetchedBuildings.find((b) => b.id === buildingId);

    if (!foundBuilding) {
      toast.error("Edifício não encontrado");
      router.push("/sistema/buildings");
      return;
    }

    setBuilding(foundBuilding);

    await fetchTopics(foundBuilding.building_type);
    const { topics: fetchedTopics } = useQuestionStore.getState();
    
    const foundTopic = fetchedTopics.find((t) => t.id === topicId);
    
    if (!foundTopic) {
      toast.error("Tópico não encontrado");
      router.push(`/sistema/assessments/${buildingId}`);
      return;
    }

    setTopic(foundTopic);

    const tree = await fetchQuestionTree(topicId);
    setQuestions(tree);

    const expandAll = (qs: Question[]): string[] => {
      const ids: string[] = [];
      qs.forEach(q => {
        if (q.subquestions && q.subquestions.length > 0) {
          ids.push(q.id);
          ids.push(...expandAll(q.subquestions));
        }
      });
      return ids;
    };
    
    const allExpandedIds = expandAll(tree);
    setExpandedQuestions(new Set(allExpandedIds));

    // ✅ Buscar ou criar assessment do usuário logado
    const { fetchAssessment, createAssessment, fetchAnswers } = useAssessmentStore.getState();
    
    try {
      await fetchAssessment(buildingId);
      const { currentAssessment: fetchedAssessment } = useAssessmentStore.getState();
      
      if (!fetchedAssessment) {
        // Criar novo assessment para o usuário
        const assessmentId = await createAssessment(buildingId);
        await fetchAnswers(assessmentId);
      } else {
        // Carregar respostas existentes do usuário
        await fetchAnswers(fetchedAssessment.id);
      }
    } catch (error) {
      console.error("Erro ao carregar assessment:", error);
      toast.error("Erro ao carregar avaliação");
    }
  };

  const calculateProgress = (): { answered: number; total: number; percentage: number } => {
    const countVisibleQuestions = (qs: Question[], parentQuestion?: Question): number => {
      return qs.reduce((count, q) => {
        if (parentQuestion && !shouldShowSubquestion(q, parentQuestion)) {
          return count;
        }
        
        let currentCount = 1;
        
        if (q.subquestions && q.subquestions.length > 0) {
          currentCount += countVisibleQuestions(q.subquestions, q);
        }
        
        return count + currentCount;
      }, 0);
    };

    const countVisibleAnswered = (qs: Question[], parentQuestion?: Question): number => {
      return qs.reduce((count, q) => {
        if (parentQuestion && !shouldShowSubquestion(q, parentQuestion)) {
          return count;
        }
        
        const hasAnswer = answers.has(q.id) || currentAnswers.has(q.id);
        let currentCount = hasAnswer ? 1 : 0;
        
        if (q.subquestions && q.subquestions.length > 0) {
          currentCount += countVisibleAnswered(q.subquestions, q);
        }
        
        return count + currentCount;
      }, 0);
    };

    const total = countVisibleQuestions(questions);
    const answered = countVisibleAnswered(questions);
    const percentage = total > 0 ? (answered / total) * 100 : 0;

    return { answered, total, percentage };
  };

  const handleAnswerChange = async (question: Question, value: any, score: number) => {
    const newAnswers = new Map(currentAnswers);
    newAnswers.set(question.id, { value, score });
    setCurrentAnswers(newAnswers);

    if (question.subquestions && question.subquestions.length > 0) {
      const newExpanded = new Set(expandedQuestions);
      newExpanded.add(question.id);
      setExpandedQuestions(newExpanded);
    }

    if (!currentAssessment) {
      toast.error("Nenhuma avaliação ativa");
      return;
    }

    try {
      let answerData: any = { 
        question_id: question.id, // ✅ Adicionar question_id
        score 
      };

      switch (question.question_type) {
        case "yes_no":
          answerData.option_id = value;
          break;
        case "single_choice":
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

      // ✅ CORRETO: Passar apenas 2 parâmetros
      await saveAnswer(question.id, answerData);
      
      toast.success("Resposta salva!", {
        duration: 1000,
        position: "bottom-right",
      });
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      
      // ✅ Mensagem de erro mais específica
      if (error.message?.includes("not present in table")) {
        toast.error("Erro: Pergunta não encontrada no banco de dados");
      } else {
        toast.error("Erro ao salvar resposta");
      }
      
      const revertAnswers = new Map(currentAnswers);
      revertAnswers.delete(question.id);
      setCurrentAnswers(revertAnswers);
    }
  };

  const shouldShowSubquestion = (subquestion: Question, parentQuestion: Question): boolean => {
    const parentAnswerLocal = currentAnswers.get(parentQuestion.id);
    const parentAnswerStore = answers.get(parentQuestion.id);
    
    if (!parentAnswerLocal && !parentAnswerStore) return false;

    let selectedValue: any = null;

    if (parentAnswerLocal) {
      selectedValue = parentAnswerLocal.value;
    } else if (parentAnswerStore) {
      if (parentAnswerStore.option_id) {
        selectedValue = parentAnswerStore.option_id;
      } else if (parentAnswerStore.answer_text) {
        selectedValue = parentAnswerStore.answer_text;
      } else if (parentAnswerStore.answer_numeric !== null && parentAnswerStore.answer_numeric !== undefined) {
        selectedValue = parentAnswerStore.answer_numeric;
      }
    }

    if (!selectedValue) return false;

    if (subquestion.condition_parent_option_id) {
      return selectedValue === subquestion.condition_parent_option_id;
    }

    if (subquestion.condition_parent_answer) {
      return String(selectedValue) === String(subquestion.condition_parent_answer);
    }

    return true;
  };

  const renderQuestion = (question: Question, level: number = 0) => {
    const answer = answers.get(question.id);
    const currentAnswer = currentAnswers.get(question.id);
    const hasSubquestions = question.subquestions && question.subquestions.length > 0;
    const isExpanded = expandedQuestions.has(question.id);

    return (
      <div key={question.id} className={`${level > 0 ? "ml-8 mt-4" : "mb-6"}`}>
        <Card className="border border-zinc-200 dark:border-zinc-800">
          <CardBody className="p-6">
            <div className="mb-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex-1">
                  {question.question_text}
                </h3>
                <div className="flex gap-2">
                  {level > 0 && (
                    <Chip size="sm" variant="flat" color="secondary">
                      Sub-pergunta
                    </Chip>
                  )}
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

              {(question.question_type === "single_choice" || question.question_type === "multiple_choice") &&
                question.options && (
                  <RadioGroup
                    value={currentAnswer?.value || answer?.option_id || ""}
                    onValueChange={(value) => {
                      const option = question.options?.find((o) => o.id === value);
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
                  value={currentAnswer?.value?.toString() || answer?.answer_numeric?.toString() || ""}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    const score = isNaN(value) ? 0 : question.max_score;
                    handleAnswerChange(question, value, score);
                  }}
                  variant="bordered"
                  classNames={{
                    input: "text-zinc-900 dark:text-white",
                    inputWrapper: "border-zinc-300 dark:border-zinc-700 hover:border-blue-500",
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
                    inputWrapper: "border-zinc-300 dark:border-zinc-700 hover:border-blue-500",
                  }}
                />
              )}
            </div>

            {(currentAnswer || answer) && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg transition-all duration-300">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Resposta salva • Pontuação: {currentAnswer?.score || answer?.score || 0} / {question.max_score}
                </span>
              </div>
            )}
          </CardBody>
        </Card>

        {hasSubquestions && isExpanded && (
          <div className="mt-4 space-y-4 border-l-4 border-blue-300 dark:border-blue-700 pl-4">
            {question.subquestions
              ?.filter((sub) => shouldShowSubquestion(sub, question))
              .map((sub) => renderQuestion(sub, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading || !building || !topic || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Carregando perguntas...</p>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="light"
            startContent={<ArrowLeft className="h-4 w-4" />}
            onClick={() => router.push(`/sistema/assessments/${buildingId}`)}
            className="mb-4 text-zinc-600 dark:text-zinc-400"
          >
            Voltar para Tópicos
          </Button>

          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
            <CardBody className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/10 rounded-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    {topic.name}
                  </h1>
                  {topic.description && (
                    <p className="text-blue-100 mb-3">{topic.description}</p>
                  )}
                  <p className="text-blue-200 text-sm">{building.name}</p>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-100 font-medium">
                    Progresso: {progress.answered} de {progress.total} perguntas
                  </span>
                  <span className="text-white font-bold">{progress.percentage.toFixed(0)}%</span>
                </div>
                <Progress
                  value={progress.percentage}
                  color="default"
                  className="h-2"
                  aria-label="Progresso do tópico"
                  classNames={{
                    indicator: "bg-white",
                  }}
                />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question) => renderQuestion(question))}
        </div>

        {/* Navigation Footer */}
        <Card className="mt-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <CardBody className="p-6">
            <div className="flex justify-between items-center">
              <Button
                variant="flat"
                startContent={<ArrowLeft className="h-4 w-4" />}
                onClick={() => router.push(`/sistema/assessments/${buildingId}`)}
              >
                Voltar para Tópicos
              </Button>
              
              {progress.percentage === 100 && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Tópico Completo!</span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}