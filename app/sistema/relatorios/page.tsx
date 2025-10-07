"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Progress,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Divider,
} from "@heroui/react";
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
  TrendingUp,
  FileBarChart,
  Calendar,
  User,
  MapPin,
  Shield,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useReportStore, type AssessmentReport } from "@/store/reportStore";
import { useAuthStore } from "@/store/authStore";

export default function RelatoriosPage() {
  const { user } = useAuthStore();
  const {
    assessments,
    currentReport,
    loading,
    fetchAssessments,
    generateReport,
    deleteAssessment,
  } = useReportStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(
    null
  );
  const [assessmentScores, setAssessmentScores] = useState<
    Map<
      string,
      {
        totalScore: number;
        maxScore: number;
        percentage: number;
        riskLevel: string;
        isComplete: boolean;
      }
    >
  >(new Map());
  const [loadingScores, setLoadingScores] = useState(false);

  // ✅ useRef para evitar recalcular quando abre modal
  const isCalculatingRef = useRef(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (user) {
      fetchAssessments(user.id);
    }
  }, [user]);

  // ✅ Calcular scores apenas uma vez quando assessments mudam
  useEffect(() => {
    const calculateScores = async () => {
      if (assessments.length === 0) return;
      if (loadingScores) return;
      if (isCalculatingRef.current) return; // ✅ Evita cálculos simultâneos

      const needsCalculation = assessments.filter(
        (a) => !assessmentScores.has(a.id)
      );

      if (needsCalculation.length === 0) return;

      isCalculatingRef.current = true;
      setLoadingScores(true);
      const newScores = new Map(assessmentScores);

      for (const assessment of needsCalculation) {
        try {
          const report = await generateReport(assessment.id);

          const totalScore = report.topicScores.reduce(
            (sum, ts) => sum + ts.total_score,
            0
          );
          const maxScore = report.topicScores.reduce(
            (sum, ts) => sum + ts.max_possible_score,
            0
          );
          const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

          newScores.set(assessment.id, {
            totalScore,
            maxScore,
            percentage,
            riskLevel: report.riskLevel,
            isComplete: report.completionPercentage === 100,
          });
        } catch (error) {
          console.error(
            `Erro ao calcular score do assessment ${assessment.id}`
          );
        }
      }

      setAssessmentScores(newScores);
      setLoadingScores(false);
      isCalculatingRef.current = false;
    };

    calculateScores();
  }, [assessments.length]);

  // ✅ Remover generateReport das dependências
  const handleViewReport = useCallback(
    async (assessmentId: string) => {
      try {
        // ✅ Usar diretamente do store sem adicionar como dependência
        const store = useReportStore.getState();
        await store.generateReport(assessmentId);
        setSelectedAssessment(assessmentId);
        onOpen();
      } catch (error: any) {
        toast.error(error.message || "Erro ao gerar relatório");
      }
    },
    [onOpen]
  );

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta avaliação?")) return;

    try {
      await deleteAssessment(id);

      setAssessmentScores((prev) => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });

      toast.success("Avaliação excluída com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir avaliação");
    }
  };

  const handleExport = async (format: "pdf" | "excel") => {
    if (!selectedAssessment) return;
    toast.success(`Exportando relatório como ${format.toUpperCase()}...`);
  };

  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      const matchesSearch =
        assessment.building?.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        assessment.building?.city
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || assessment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [assessments, searchTerm, statusFilter]);

  const getStatusColor = (
    status: string
  ): "default" | "primary" | "success" | "warning" | "danger" => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "warning";
      case "cancelled":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "completed":
        return "Concluída";
      case "in_progress":
        return "Em Andamento";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  const getRiskLevelColor = (
    level: string | null
  ): "success" | "primary" | "warning" | "danger" => {
    switch (level?.toLowerCase()) {
      case "low":
        return "success";
      case "medium":
        return "primary";
      case "high":
        return "warning";
      case "critical":
        return "danger";
      default:
        return "primary";
    }
  };

  const getRiskLevelLabel = (level: string | null): string => {
    switch (level?.toLowerCase()) {
      case "low":
        return "Baixo";
      case "medium":
        return "Médio";
      case "high":
        return "Alto";
      case "critical":
        return "Crítico";
      default:
        return "N/A";
    }
  };

  const getAssessmentStatus = useCallback(
    (assessment: any): string => {
      const calculated = assessmentScores.get(assessment.id);

      if (calculated?.isComplete && assessment.status === "in_progress") {
        return "completed";
      }

      return assessment.status;
    },
    [assessmentScores]
  );

  const getAssessmentScoreDisplay = useCallback(
    (assessment: any): { score: number; max: number } | null => {
      if (
        assessment.status === "completed" &&
        assessment.total_score !== null
      ) {
        const calculated = assessmentScores.get(assessment.id);
        if (calculated) {
          return { score: calculated.totalScore, max: calculated.maxScore };
        }
      }

      const calculated = assessmentScores.get(assessment.id);
      return calculated
        ? { score: calculated.totalScore, max: calculated.maxScore }
        : null;
    },
    [assessmentScores]
  );

  const getAssessmentRiskLevel = useCallback(
    (assessment: any): string | null => {
      if (assessment.status === "completed" && assessment.risk_level) {
        return assessment.risk_level;
      }

      const calculated = assessmentScores.get(assessment.id);
      return calculated ? calculated.riskLevel : null;
    },
    [assessmentScores]
  );

  const stats = useMemo(
    () => ({
      total: assessments.length,
      completed: assessments.filter((a) => {
        const status = getAssessmentStatus(a);
        return status === "completed";
      }).length,
      inProgress: assessments.filter((a) => {
        const status = getAssessmentStatus(a);
        return status === "in_progress";
      }).length,
      cancelled: assessments.filter((a) => a.status === "cancelled").length,
    }),
    [assessments, getAssessmentStatus]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-blue-50/30 to-zinc-50 dark:from-zinc-950 dark:via-blue-950/10 dark:to-zinc-950 p-4 md:p-8">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 shadow-xl">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">
                Relatórios
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Visualize e analise os resultados das avaliações de risco
              </p>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                    Total
                  </p>
                  <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-1">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                  <FileBarChart className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-2 border-green-200 dark:border-green-800">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Concluídas
                  </p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">
                    {stats.completed}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/30">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-2 border-yellow-200 dark:border-yellow-800">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                    Em Andamento
                  </p>
                  <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100 mt-1">
                    {stats.inProgress}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-950/30">
                  <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-2 border-red-200 dark:border-red-800">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Canceladas
                  </p>
                  <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-1">
                    {stats.cancelled}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30">
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 mb-6">
          <CardBody className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Buscar por edifício ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startContent={<Search className="h-5 w-5 text-zinc-400" />}
                variant="bordered"
                size="lg"
                className="flex-1"
                classNames={{
                  inputWrapper: "border-2",
                }}
              />
              <Select
                placeholder="Status"
                selectedKeys={[statusFilter]}
                onChange={(e) => setStatusFilter(e.target.value)}
                variant="bordered"
                size="lg"
                startContent={<Filter className="h-5 w-5 text-zinc-400" />}
                className="md:w-64"
                classNames={{
                  trigger: "border-2",
                }}
              >
                <SelectItem key="all" textValue="Todos">
                  Todos
                </SelectItem>
                <SelectItem key="completed" textValue="Concluídas">
                  Concluídas
                </SelectItem>
                <SelectItem key="in_progress" textValue="Em Andamento">
                  Em Andamento
                </SelectItem>
                <SelectItem key="cancelled" textValue="Canceladas">
                  Canceladas
                </SelectItem>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Lista de Avaliações */}
        <Card className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="border-b-2 border-zinc-200 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Avaliações Realizadas
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {filteredAssessments.length} avaliações encontradas
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="p-12 text-center">
                <p className="text-zinc-600 dark:text-zinc-400">
                  Carregando...
                </p>
              </div>
            ) : filteredAssessments.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="h-16 w-16 mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
                <p className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                  Nenhuma avaliação encontrada
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Não há avaliações que correspondam aos filtros selecionados.
                </p>
              </div>
            ) : (
              <Table
                removeWrapper
                aria-label="Tabela de avaliações"
                classNames={{
                  th: "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold",
                }}
              >
                <TableHeader>
                  <TableColumn>EDIFÍCIO</TableColumn>
                  <TableColumn>DATA</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>PONTUAÇÃO</TableColumn>
                  <TableColumn>RISCO</TableColumn>
                  <TableColumn>AÇÕES</TableColumn>
                </TableHeader>
                <TableBody>
                  {filteredAssessments.map((assessment) => {
                    const status = getAssessmentStatus(assessment);
                    const scoreDisplay = getAssessmentScoreDisplay(assessment);
                    const riskLevel = getAssessmentRiskLevel(assessment);

                    return (
                      <TableRow key={assessment.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-900 dark:text-white">
                                {assessment.building?.name}
                              </p>
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {assessment.building?.city},{" "}
                                {assessment.building?.state}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-zinc-400" />
                            <span className="text-sm">
                              {new Date(
                                assessment.assessment_date
                              ).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip
                            variant="flat"
                            color={getStatusColor(status)}
                            size="sm"
                          >
                            {getStatusLabel(status)}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          {scoreDisplay ? (
                            <div className="text-center">
                              <span className="font-bold text-lg text-zinc-900 dark:text-white">
                                {scoreDisplay.score.toFixed(1)}
                              </span>
                              <span className="text-zinc-400 mx-1">/</span>
                              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                {scoreDisplay.max.toFixed(1)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-zinc-400">
                              Calculando...
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {riskLevel ? (
                            <Chip
                              variant="flat"
                              color={getRiskLevelColor(riskLevel)}
                              size="sm"
                              startContent={<Shield className="h-3 w-3" />}
                            >
                              {getRiskLevelLabel(riskLevel)}
                            </Chip>
                          ) : (
                            <span className="text-sm text-zinc-400">
                              Calculando...
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="flat"
                              color="primary"
                              startContent={<Eye className="h-4 w-4" />}
                              onPress={() => handleViewReport(assessment.id)}
                            >
                              Ver Relatório
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              color="danger"
                              isIconOnly
                              onClick={() =>
                                handleDeleteAssessment(assessment.id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>

        {/* Modal - mantém o mesmo código anterior */}
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          size="5xl"
          scrollBehavior="inside"
          classNames={{
            base: "bg-white dark:bg-zinc-900",
            header: "border-b-2 border-zinc-200 dark:border-zinc-800",
            body: "p-6",
            footer: "border-t-2 border-zinc-200 dark:border-zinc-800",
          }}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                      <FileBarChart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                        Relatório Detalhado
                      </h3>
                      <p className="text-sm font-normal text-zinc-600 dark:text-zinc-400">
                        {currentReport?.assessment.building?.name}
                      </p>
                    </div>
                  </div>
                </ModalHeader>
                <ModalBody>
                  {currentReport && (
                    <div className="space-y-6">
                      {/* Informações Gerais */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Data da Avaliação
                          </p>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {new Date(
                              currentReport.assessment.assessment_date
                            ).toLocaleDateString("pt-BR")}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Avaliador
                          </p>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {currentReport.assessment.user?.name}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Tipo de Edifício
                          </p>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {currentReport.assessment.building?.building_type}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2 flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Nível de Risco
                          </p>
                          <Chip
                            variant="flat"
                            color={getRiskLevelColor(currentReport.riskLevel)}
                            size="lg"
                          >
                            {getRiskLevelLabel(currentReport.riskLevel)}
                          </Chip>
                        </div>
                      </div>

                      <Divider />

                      {/* Progresso */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-bold text-zinc-900 dark:text-white">
                            Progresso da Avaliação
                          </h4>
                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {currentReport.completionPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={currentReport.completionPercentage}
                          color={
                            currentReport.completionPercentage === 100
                              ? "success"
                              : "primary"
                          }
                          size="lg"
                          className="mb-2"
                        />
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          {currentReport.topicScores.reduce(
                            (sum, ts) => sum + ts.answered_questions,
                            0
                          )}{" "}
                          de{" "}
                          {currentReport.topicScores.reduce(
                            (sum, ts) => sum + ts.total_questions,
                            0
                          )}{" "}
                          perguntas respondidas
                        </p>
                      </div>

                      <Divider />

                      {/* Pontuação por Tópico */}
                      <div>
                        <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
                          Pontuação por Tópico
                        </h4>
                        <div className="space-y-4">
                          {currentReport.topicScores.map((topic) => (
                            <div
                              key={topic.topic_id}
                              className="p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h5 className="font-semibold text-zinc-900 dark:text-white">
                                    {topic.topic_name}
                                  </h5>
                                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                    {topic.answered_questions} de{" "}
                                    {topic.total_questions} perguntas
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                                    {topic.percentage.toFixed(1)}%
                                  </p>
                                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                    {topic.total_score.toFixed(1)} /{" "}
                                    {topic.max_possible_score.toFixed(1)}
                                  </p>
                                </div>
                              </div>
                              <Progress
                                value={topic.percentage}
                                color={
                                  topic.percentage >= 80
                                    ? "success"
                                    : topic.percentage >= 60
                                      ? "primary"
                                      : topic.percentage >= 40
                                        ? "warning"
                                        : "danger"
                                }
                                size="sm"
                              />
                              {topic.critical_issues > 0 && (
                                <div className="mt-2 flex items-center gap-2 text-red-600 dark:text-red-400">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span className="text-xs font-semibold">
                                    {topic.critical_issues} problemas críticos
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Questões Críticas */}
                      {currentReport.criticalIssues.length > 0 && (
                        <>
                          <Divider />
                          <div>
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-red-900 dark:text-red-200">
                                  Questões Críticas Identificadas
                                </h4>
                                <p className="text-sm text-red-700 dark:text-red-400">
                                  {currentReport.criticalIssues.length} itens
                                  requerem atenção imediata
                                </p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {currentReport.criticalIssues.map((issue) => (
                                <div
                                  key={issue.id}
                                  className="p-4 rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
                                >
                                  <p className="font-semibold text-red-900 dark:text-red-200 mb-2">
                                    {issue.question?.question_text}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-red-700 dark:text-red-400">
                                      Resposta:{" "}
                                      {issue.option?.option_text ||
                                        issue.answer_text ||
                                        issue.answer_numeric ||
                                        "N/A"}
                                    </span>
                                    <Chip
                                      size="sm"
                                      variant="flat"
                                      color="danger"
                                    >
                                      Pontuação: {issue.score}
                                    </Chip>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Recomendações */}
                      {currentReport.recommendations.length > 0 && (
                        <>
                          <Divider />
                          <div>
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-zinc-900 dark:text-white">
                                  Recomendações
                                </h4>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                  Sugestões para melhoria
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {currentReport.recommendations.map(
                                (rec, index) => (
                                  <div
                                    key={index}
                                    className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
                                  >
                                    <div className="mt-1">
                                      <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                                    </div>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">
                                      {rec}
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button
                    variant="flat"
                    startContent={<Download className="h-5 w-5" />}
                    onClick={() => handleExport("pdf")}
                  >
                    Exportar PDF
                  </Button>
                  <Button
                    variant="flat"
                    startContent={<Download className="h-5 w-5" />}
                    onClick={() => handleExport("excel")}
                  >
                    Exportar Excel
                  </Button>
                  <Button color="primary" onPress={onClose}>
                    Fechar
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}
