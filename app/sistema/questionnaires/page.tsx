"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBuildingStore, type Building } from "@/store/buildingStore";
import { useQuestionStore } from "@/store/questionStore";
import { useAssessmentStore } from "@/store/assessmentStore";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Spinner,
  Progress,
  Input,
} from "@heroui/react";
import {
  Building2,
  MapPin,
  CheckCircle,
  Clock,
  Search,
  ClipboardCheck,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

export default function QuestionnairesPage() {
  const router = useRouter();
  const { buildings, loading: buildingsLoading, fetchBuildings } = useBuildingStore();
  const { fetchTopics } = useQuestionStore();
  const { fetchAssessment } = useAssessmentStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [buildingsWithStatus, setBuildingsWithStatus] = useState<
    Array<Building & { 
      hasQuestionnaire: boolean; 
      progress: number;
      totalQuestions: number;
      answeredQuestions: number;
      assessmentStatus: string | null;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Buscar todos os edifícios
      const fetchedBuildings = await fetchBuildings();

      // Para cada edifício, verificar se tem questionário disponível
      const buildingsWithInfo = await Promise.all(
        fetchedBuildings.map(async (building) => {
          try {
            // Buscar tópicos para o tipo do edifício
            await fetchTopics(building.building_type);
            const { topics } = useQuestionStore.getState();
            
            const buildingTopics = topics.filter(
              (t) => t.building_type === building.building_type
            );

            const hasQuestionnaire = buildingTopics.length > 0;

            // Se tem questionário, buscar o assessment
            let progress = 0;
            let totalQuestions = 0;
            let answeredQuestions = 0;
            let assessmentStatus = null;

            if (hasQuestionnaire) {
              try {
                await fetchAssessment(building.id);
                const { currentAssessment } = useAssessmentStore.getState();
                
                if (currentAssessment) {
                  assessmentStatus = currentAssessment.status;
                  
                  // ✅ IMPORTANTE: Buscar as respostas do assessment
                  const { fetchAnswers } = useAssessmentStore.getState();
                  await fetchAnswers(currentAssessment.id);
                  
                  // ✅ Agora pegar o answers atualizado
                  const { answers } = useAssessmentStore.getState();
                  
                  // ✅ DEBUG: Verificar respostas
                  console.log(`🔍 Assessment ${currentAssessment.id}:`, {
                    status: assessmentStatus,
                    answersCount: answers.size,
                    answers: Array.from(answers.entries()).map(([id, ans]) => ({
                      questionId: id,
                      answer: ans,
                    })),
                  });
                  
                  // Carregar perguntas dos tópicos
                  const { fetchQuestionTree } = useQuestionStore.getState();
                  
                  // ✅ Função para contar apenas perguntas VISÍVEIS (para total)
                  const countVisibleQuestions = (questions: any[]): number => {
                    let count = 0;
                    
                    questions.forEach(q => {
                      // Sempre contar a pergunta principal
                      count++;
                      
                      // Para subperguntas, verificar se tem condição ou não
                      if (q.subquestions && q.subquestions.length > 0) {
                        // Verificar se a pergunta pai foi respondida
                        if (answers.has(q.id)) {
                          const answer = answers.get(q.id);
                          
                          // Contar apenas subperguntas que estão visíveis
                          q.subquestions.forEach((subq: any) => {
                            if (subq.condition_parent_option_id) {
                              // Só conta se a opção escolhida bate com a condição
                              if (answer?.option_id === subq.condition_parent_option_id) {
                                count += countVisibleQuestions([subq]);
                              }
                            } else {
                              // Se não tem condição, sempre aparece (quando a pai for respondida)
                              count += countVisibleQuestions([subq]);
                            }
                          });
                        }
                        // Se a pergunta pai NÃO foi respondida, não contar as subperguntas ainda
                      }
                    });
                    
                    return count;
                  };

                  // ✅ Função para contar perguntas VISÍVEIS respondidas
                  const countAnsweredVisibleQuestions = (questions: any[]): number => {
                    let count = 0;
                    
                    questions.forEach(q => {
                      // Se respondeu esta pergunta
                      if (answers.has(q.id)) {
                        count++;
                        
                        const answer = answers.get(q.id);
                        
                        // Verificar subperguntas visíveis
                        if (q.subquestions && q.subquestions.length > 0) {
                          q.subquestions.forEach((subq: any) => {
                            if (subq.condition_parent_option_id) {
                              // Só conta se a opção escolhida bate com a condição
                              if (answer?.option_id === subq.condition_parent_option_id) {
                                count += countAnsweredVisibleQuestions([subq]);
                              }
                            } else {
                              // Se não tem condição, sempre aparece
                              count += countAnsweredVisibleQuestions([subq]);
                            }
                          });
                        }
                      }
                    });
                    
                    return count;
                  };
                  
                  // Contar total e respondidas
                  for (const topic of buildingTopics) {
                    const questions = await fetchQuestionTree(topic.id);
                    const topicTotal = countVisibleQuestions(questions);
                    const topicAnswered = countAnsweredVisibleQuestions(questions);
                    
                    totalQuestions += topicTotal;
                    answeredQuestions += topicAnswered;
                    
                    console.log(`  📋 Tópico ${topic.name}:`, {
                      topicTotal,
                      topicAnswered,
                    });
                  }
                  
                  progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

                  console.log(`📊 Building ${building.name}:`, {
                    totalQuestions,
                    answeredQuestions,
                    progress: progress.toFixed(1) + '%',
                    assessmentStatus,
                    answersSize: answers.size,
                  });
                }
              } catch (error) {
                console.error("Erro ao buscar assessment:", error);
              }
            }

            return {
              ...building,
              hasQuestionnaire,
              progress,
              totalQuestions,
              answeredQuestions,
              assessmentStatus,
            };
          } catch (error) {
            console.error(`Erro ao processar edifício ${building.name}:`, error);
            return {
              ...building,
              hasQuestionnaire: false,  
              progress: 0,
              totalQuestions: 0,
              answeredQuestions: 0,
              assessmentStatus: null,
            };
          }
        })
      );

      setBuildingsWithStatus(buildingsWithInfo);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar questionários");
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuestionnaire = (buildingId: string) => {
    router.push(`/sistema/assessments/${buildingId}`);
  };

  const filteredBuildings = buildingsWithStatus.filter(
    (building) =>
      building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusInfo = (building: typeof buildingsWithStatus[0]) => {
    if (!building.hasQuestionnaire) {
      return {
        label: "Sem Questionário",
        color: "default" as const,
        icon: AlertCircle,
      };
    }

    if (building.assessmentStatus === "completed" || building.progress === 100) {
      return {
        label: "Concluído",
        color: "success" as const,
        icon: CheckCircle,
      };
    }

    if (building.progress > 0) {
      return {
        label: "Em Andamento",
        color: "primary" as const,
        icon: Clock,
      };
    }

    return {
      label: "Não Iniciado",
      color: "warning" as const,
      icon: ClipboardCheck,
    };
  };

  if (loading || buildingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            Carregando questionários...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white">
              Questionários Disponíveis
            </h1>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Selecione um edifício para responder ou continuar o questionário de avaliação de risco
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border border-zinc-200 dark:border-zinc-800">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-950/30 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {buildingsWithStatus.length}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Total de Edifícios
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-zinc-200 dark:border-zinc-800">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-950/30 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {buildingsWithStatus.filter((b) => b.assessmentStatus === "completed").length}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Concluídos
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-zinc-200 dark:border-zinc-800">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-950/30 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {buildingsWithStatus.filter((b) => b.progress > 0 && b.progress < 100).length}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Em Andamento
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-zinc-200 dark:border-zinc-800">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-950/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {buildingsWithStatus.filter((b) => !b.hasQuestionnaire).length}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Sem Questionário
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardBody className="p-4">
            <Input
              placeholder="Buscar edifício por nome, endereço ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={
                <Search className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
              }
              classNames={{
                base: "w-full",
                inputWrapper:
                  "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
                input: "text-zinc-900 dark:text-white",
              }}
              size="lg"
            />
          </CardBody>
        </Card>

        {/* Buildings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBuildings.map((building) => {
            const statusInfo = getStatusInfo(building);
            const StatusIcon = statusInfo.icon;

            return (
              <Card
                key={building.id}
                className="border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              >
                <CardBody className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                        {building.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {building.city}/{building.state}
                        </span>
                      </div>
                      <Chip size="sm" variant="flat" color="secondary">
                        {building.building_type}
                      </Chip>
                    </div>
                    <div className="flex-shrink-0">
                      <div
                        className={`p-3 rounded-lg ${
                          statusInfo.color === "success"
                            ? "bg-green-100 dark:bg-green-950/30"
                            : statusInfo.color === "primary"
                            ? "bg-blue-100 dark:bg-blue-950/30"
                            : statusInfo.color === "warning"
                            ? "bg-yellow-100 dark:bg-yellow-950/30"
                            : "bg-zinc-100 dark:bg-zinc-800"
                        }`}
                      >
                        <StatusIcon
                          className={`h-6 w-6 ${
                            statusInfo.color === "success"
                              ? "text-green-600 dark:text-green-400"
                              : statusInfo.color === "primary"
                              ? "text-blue-600 dark:text-blue-400"
                              : statusInfo.color === "warning"
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-zinc-400 dark:text-zinc-600"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Chip
                      size="sm"
                      variant="flat"
                      color={statusInfo.color}
                      startContent={<StatusIcon className="h-3 w-3" />}
                    >
                      {statusInfo.label}
                    </Chip>

                    {building.hasQuestionnaire && (
                      <>
                        {building.totalQuestions > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-zinc-600 dark:text-zinc-400">
                                Progresso
                              </span>
                              <span className="font-bold text-zinc-900 dark:text-white">
                                {building.progress.toFixed(0)}%
                              </span>
                            </div>
                            <Progress
                              value={building.progress}
                              color={building.progress === 100 ? "success" : "primary"}
                              className="h-2"
                            />
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {building.answeredQuestions} de {building.totalQuestions} perguntas respondidas
                            </p>
                          </div>
                        )}

                        <Button
                          color="primary"
                          variant="flat"
                          className="w-full"
                          endContent={<ChevronRight className="h-4 w-4" />}
                          onPress={() => handleStartQuestionnaire(building.id)}
                        >
                          {building.progress > 0 ? "Continuar" : "Iniciar"} Questionário
                        </Button>
                      </>
                    )}

                    {!building.hasQuestionnaire && (
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          ⚠️ Nenhum questionário disponível para o tipo "{building.building_type}"
                        </p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {filteredBuildings.length === 0 && (
          <Card className="border border-zinc-200 dark:border-zinc-800">
            <CardBody className="p-12 text-center">
              <ClipboardCheck className="h-16 w-16 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                Nenhum edifício encontrado
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Ajuste sua busca ou cadastre um novo edifício
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}