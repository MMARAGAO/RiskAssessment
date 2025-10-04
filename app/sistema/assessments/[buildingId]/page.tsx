"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBuildingStore, type Building } from "@/store/buildingStore";
import { useQuestionStore, type QuestionTopic, type Question } from "@/store/questionStore"; // ✅ Adicionar tipos
import { useAssessmentStore } from "@/store/assessmentStore";
import {
  Button,
  Card,
  CardBody,
  Progress,
  Chip,
  Spinner,
} from "@heroui/react";
import {
  ArrowLeft,
  CheckCircle,
  Building2,
  FileText,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const buildingId = params.buildingId as string;

  const { buildings, fetchBuildings } = useBuildingStore();
  const { fetchTopics } = useQuestionStore();
  const {
    currentAssessment,
    loading,
    createAssessment,
    fetchAnswers,
  } = useAssessmentStore();

  const [building, setBuilding] = useState<Building | null>(null);
  const [topics, setTopics] = useState<(QuestionTopic & { questions: Question[] })[]>([]); // ✅ Tipo correto
  const [isInitialized, setIsInitialized] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  useEffect(() => {
    if (!isInitialized) {
      loadData();
      setIsInitialized(true);
    }
  }, [buildingId, isInitialized]);

  useEffect(() => {
    if (currentAssessment && topics.length > 0) {
      const { answers } = useAssessmentStore.getState();
      console.log("🔄 Respostas atualizadas:", answers.size);
      setProgressKey(prev => prev + 1);
    }
  }, [currentAssessment, topics.length]);

  const loadData = async () => {
    try {
      const fetchedBuildings = await fetchBuildings();
      const foundBuilding = fetchedBuildings.find((b) => b.id === buildingId);

      if (!foundBuilding) {
        toast.error("Edifício não encontrado");
        router.push("/sistema/buildings");
        return;
      }

      setBuilding(foundBuilding);

      console.log("🔍 Buscando tópicos...");
      
      await fetchTopics(foundBuilding.building_type);
      const { topics: fetchedTopics } = useQuestionStore.getState();
      
      const filteredTopics = fetchedTopics.filter(
        (t) => t.building_type === foundBuilding.building_type
      );

      console.log("📋 Tópicos encontrados:", filteredTopics.length);

      if (filteredTopics.length === 0) {
        toast.error(`Nenhum questionário disponível para edifícios do tipo ${foundBuilding.building_type}`);
        router.push("/sistema/buildings");
        return;
      }

      const { fetchAssessment, createAssessment, fetchAnswers } = useAssessmentStore.getState();
      
      await fetchAssessment(buildingId);
      let { currentAssessment: fetchedAssessment } = useAssessmentStore.getState();
      
      if (!fetchedAssessment) {
        console.log("📝 Criando novo assessment...");
        const assessmentId = await createAssessment(buildingId);
        await fetchAnswers(assessmentId);
        const state = useAssessmentStore.getState();
        fetchedAssessment = state.currentAssessment;
      } else {
        console.log("✅ Assessment encontrado:", fetchedAssessment.id);
        await fetchAnswers(fetchedAssessment.id);
      }

      console.log("🔄 Carregando perguntas dos tópicos...");
      const { fetchQuestionTree } = useQuestionStore.getState();
      
      const topicsWithQuestions = await Promise.all(
        filteredTopics.map(async (topic) => {
          console.log(`  📥 Carregando perguntas do tópico: ${topic.name}`);
          const questions = await fetchQuestionTree(topic.id);
          console.log(`  ✅ ${questions.length} perguntas carregadas`);
          return {
            ...topic,
            questions,
          };
        })
      );

      console.log("✅ Todos os tópicos com perguntas carregados");
      setTopics(topicsWithQuestions);

      const { answers } = useAssessmentStore.getState();
      console.log("📊 Total de respostas:", answers.size);

    } catch (error) {
      console.error("❌ Erro ao carregar assessment:", error);
      toast.error("Erro ao carregar avaliação");
    }
  };

  const calculateTopicProgress = (topicId: string): { answered: number; total: number; percentage: number } => {
    if (!currentAssessment) {
      return { answered: 0, total: 0, percentage: 0 };
    }

    const { answers } = useAssessmentStore.getState();
    
    const topicWithQuestions = topics.find(t => t.id === topicId);
    
    if (!topicWithQuestions || !topicWithQuestions.questions || topicWithQuestions.questions.length === 0) {
      return { answered: 0, total: 0, percentage: 0 };
    }

    // ✅ Contar apenas perguntas VISÍVEIS (que o usuário deve responder)
    const countVisibleQuestions = (questions: Question[]): number => {
      let count = 0;
      
      questions.forEach(q => {
        // Contar a pergunta principal
        count++;
        
        // Se a pergunta tem subperguntas E foi respondida
        if (q.subquestions && q.subquestions.length > 0 && answers.has(q.id)) {
          const answer = answers.get(q.id);
          
          // Se tem condition_parent_option_id, verificar se a resposta bate
          q.subquestions.forEach(subq => {
            if (subq.condition_parent_option_id) {
              // Só conta se a opção escolhida bate com a condição
              if (answer?.option_id === subq.condition_parent_option_id) {
                count += countVisibleQuestions([subq]);
              }
            } else {
              // Se não tem condição, sempre aparece
              count += countVisibleQuestions([subq]);
            }
          });
        }
      });
      
      return count;
    };

    // ✅ Contar apenas perguntas VISÍVEIS respondidas
    const countAnsweredVisibleQuestions = (questions: Question[]): number => {
      let count = 0;
      
      questions.forEach(q => {
        // Se respondeu esta pergunta
        if (answers.has(q.id)) {
          count++;
          
          const answer = answers.get(q.id);
          
          // Verificar subperguntas visíveis
          if (q.subquestions && q.subquestions.length > 0) {
            q.subquestions.forEach(subq => {
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

    const total = countVisibleQuestions(topicWithQuestions.questions);
    const answered = countAnsweredVisibleQuestions(topicWithQuestions.questions);
    const percentage = total > 0 ? (answered / total) * 100 : 0;

    console.log(`📊 Progresso do tópico ${topicWithQuestions.name}:`, { answered, total, percentage: percentage.toFixed(1) + '%' });

    return { answered, total, percentage };
  };

  const totalProgress = () => {
    if (!currentAssessment || topics.length === 0) {
      return 0;
    }

    let totalAnswered = 0;
    let totalQuestions = 0;

    topics.forEach(topic => {
      if (topic.questions && topic.questions.length > 0) {
        const progress = calculateTopicProgress(topic.id);
        totalAnswered += progress.answered;
        totalQuestions += progress.total;
      }
    });

    console.log("📊 Total Progress:", { totalAnswered, totalQuestions, percentage: totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0 });

    return totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0;
  };

  const calculateTopicScore = (topicId: string): { score: number; maxScore: number; percentage: number } => {
    if (!currentAssessment) {
      return { score: 0, maxScore: 0, percentage: 0 };
    }

    const { answers } = useAssessmentStore.getState();
    const topicWithQuestions = topics.find(t => t.id === topicId);
    
    if (!topicWithQuestions || !topicWithQuestions.questions || topicWithQuestions.questions.length === 0) {
      return { score: 0, maxScore: 0, percentage: 0 };
    }

    // ✅ Calcular pontuação de perguntas VISÍVEIS
    const calculateVisibleScore = (questions: Question[]): { score: number; maxScore: number } => {
      let totalScore = 0;
      let totalMaxScore = 0;
      
      questions.forEach(q => {
        const answer = answers.get(q.id);
        
        // Se a pergunta foi respondida
        if (answer) {
          totalScore += (answer.score || 0) * q.weight;
          totalMaxScore += q.max_score * q.weight;
          
          // Verificar subperguntas visíveis
          if (q.subquestions && q.subquestions.length > 0) {
            q.subquestions.forEach(subq => {
              if (subq.condition_parent_option_id) {
                // Só conta se a opção escolhida bate com a condição
                if (answer.option_id === subq.condition_parent_option_id) {
                  const subScore = calculateVisibleScore([subq]);
                  totalScore += subScore.score;
                  totalMaxScore += subScore.maxScore;
                }
              } else {
                // Se não tem condição, sempre aparece
                const subScore = calculateVisibleScore([subq]);
                totalScore += subScore.score;
                totalMaxScore += subScore.maxScore;
              }
            });
          }
        } else {
          // Se não respondeu, contar apenas o maxScore (para saber o total possível)
          totalMaxScore += q.max_score * q.weight;
          
          // Subperguntas sem condição também contam no maxScore
          if (q.subquestions && q.subquestions.length > 0) {
            q.subquestions.forEach(subq => {
              if (!subq.condition_parent_option_id) {
                const subScore = calculateVisibleScore([subq]);
                totalMaxScore += subScore.maxScore;
              }
            });
          }
        }
      });
      
      return { score: totalScore, maxScore: totalMaxScore };
    };

    const result = calculateVisibleScore(topicWithQuestions.questions);
    const percentage = result.maxScore > 0 ? (result.score / result.maxScore) * 100 : 0;

    console.log(`📊 Pontuação do tópico ${topicWithQuestions.name}:`, {
      score: result.score.toFixed(2),
      maxScore: result.maxScore.toFixed(2),
      percentage: percentage.toFixed(1) + '%'
    });

    return {
      score: result.score,
      maxScore: result.maxScore,
      percentage
    };
  };

  const totalScore = () => {
    if (!currentAssessment || topics.length === 0) {
      return { score: 0, maxScore: 0, percentage: 0 };
    }

    let totalScore = 0;
    let totalMaxScore = 0;

    topics.forEach(topic => {
      if (topic.questions && topic.questions.length > 0) {
        const scoreResult = calculateTopicScore(topic.id);
        totalScore += scoreResult.score;
        totalMaxScore += scoreResult.maxScore;
      }
    });

    const percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

    console.log("📊 Pontuação Total:", {
      score: totalScore.toFixed(2),
      maxScore: totalMaxScore.toFixed(2),
      percentage: percentage.toFixed(1) + '%'
    });

    return { score: totalScore, maxScore: totalMaxScore, percentage };
  };

  const handleTopicClick = (topicId: string) => {
    router.push(`/sistema/assessments/${buildingId}/topic/${topicId}`);
  };

  if (loading || !building || topics.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Carregando avaliação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="">
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
                    <Chip color="default" variant="flat" className="bg-white/20 text-white">
                      {building.building_type}
                    </Chip>
                  </div>
                </div>
              </div>

              {/* Overall Progress */}
              <div className="mt-6 pt-6 border-t border-white/20" key={progressKey}>
                {/* ✅ Adicionar pontuação geral */}
                <div className="mb-4 p-4 bg-white/10 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-100 font-medium">Pontuação Geral</span>
                    <span className="text-white font-bold text-2xl">
                      {totalScore().percentage.toFixed(1)}/100
                    </span>
                  </div>
                  <div className="text-sm text-blue-200">
                    {totalScore().score.toFixed(1)} de {totalScore().maxScore.toFixed(1)} pontos possíveis
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-100 font-medium">Progresso Geral</span>
                  <span className="text-white font-bold text-lg">{totalProgress().toFixed(1)}%</span>
                </div>
                <Progress
                  value={totalProgress()}
                  color="default"
                  className="h-3"
                  aria-label="Progresso geral da avaliação"
                  classNames={{
                    indicator: "bg-white",
                  }}
                />
                {currentAssessment && (
                  <div className="flex items-center justify-between mt-2 text-sm text-blue-100">
                    <span>
                      {topics.reduce((sum, t) => sum + calculateTopicProgress(t.id).answered, 0)} de {topics.reduce((sum, t) => sum + calculateTopicProgress(t.id).total, 0)} perguntas respondidas
                    </span>
                    {totalProgress() === 100 && (
                      <span className="flex items-center gap-1 text-white font-semibold">
                        <CheckCircle className="h-4 w-4" />
                        Completo!
                      </span>
                    )}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Topic Cards */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            Tópicos da Avaliação
            <Chip size="sm" color="primary" variant="flat">
              {topics.length} {topics.length === 1 ? 'tópico' : 'tópicos'}
            </Chip>
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            Selecione um tópico para responder as perguntas
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {topics.map((topic, index) => {
            const progress = calculateTopicProgress(topic.id);
            const scoreData = calculateTopicScore(topic.id); // ✅ Calcular pontuação

            return (
              <Card
                key={topic.id}
                isPressable
                onPress={() => handleTopicClick(topic.id)}
                className="border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer"
              >
                <CardBody className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        progress.percentage === 100
                          ? "bg-green-100 dark:bg-green-950/30"
                          : progress.percentage > 0
                          ? "bg-blue-100 dark:bg-blue-950/30"
                          : "bg-zinc-100 dark:bg-zinc-800"
                      }`}>
                        {progress.percentage === 100 ? (
                          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        ) : (
                          <FileText className={`h-6 w-6 ${
                            progress.percentage > 0
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-zinc-400 dark:text-zinc-600"
                          }`} />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                            {index + 1}. {topic.name}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Chip
                              size="sm"
                              variant="flat"
                              color="default"
                              className="text-xs"
                            >
                              Ordem: {topic.display_order}
                            </Chip>
                            <Chip
                              size="sm"
                              variant="flat"
                              color="secondary"
                              className="text-xs"
                            >
                              {topic.building_type}
                            </Chip>
                            {progress.total > 0 && (
                              <Chip
                                size="sm"
                                variant="flat"
                                color={progress.percentage === 100 ? "success" : progress.percentage > 0 ? "primary" : "default"}
                              >
                                {progress.answered}/{progress.total} perguntas ({progress.percentage.toFixed(1)}%)
                              </Chip>
                            )}
                            {/* ✅ Chip com pontuação */}
                            {scoreData.maxScore > 0 && (
                              <Chip
                                size="sm"
                                variant="flat"
                                color={
                                  scoreData.percentage >= 80 ? "success" :
                                  scoreData.percentage >= 60 ? "warning" :
                                  scoreData.percentage >= 40 ? "default" : "danger"
                                }
                                className="font-semibold"
                              >
                                📊 {scoreData.percentage.toFixed(1)}/100
                              </Chip>
                            )}
                          </div>
                        </div>
                      </div>

                      {topic.description && (
                        <div className="mb-4">
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {topic.description}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                            Criado em
                          </p>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {new Date(topic.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                            Última atualização
                          </p>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {new Date(topic.updated_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      {progress.total > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                              Progresso do Tópico
                            </span>
                            <span className="font-bold text-zinc-900 dark:text-white">
                              {progress.percentage.toFixed(0)}%
                            </span>
                          </div>
                          <Progress
                            value={progress.percentage}
                            color={progress.percentage === 100 ? "success" : "primary"}
                            className="h-2.5"
                            aria-label={`Progresso do tópico ${topic.name}`}
                          />
                          {progress.percentage === 100 && (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                              <CheckCircle className="h-4 w-4" />
                              <span className="font-medium">Tópico completo!</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            📋 Clique para começar a responder as perguntas deste tópico
                          </p>
                        </div>
                      )}
                    </div>

                    <ChevronRight className="h-5 w-5 text-zinc-400 flex-shrink-0 mt-1" />
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
