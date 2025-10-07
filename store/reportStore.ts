import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface AssessmentAnswer {
  id: string;
  assessment_id: string;
  question_id: string;
  option_id: string | null;
  answer_text: string | null;
  answer_numeric: number | null;
  score: number;
  answered_at: string;
  question?: {
    id: string;
    question_text: string;
    question_type: string;
    topic_id: string;
    is_critical: boolean;
    max_score: number;
    weight: number;
  };
  option?: {
    id: string;
    option_text: string;
  };
}

export interface RiskAssessment {
  id: string;
  building_id: string;
  user_id: string;
  assessment_date: string;
  status: "in_progress" | "completed" | "cancelled";
  total_score: number | null;
  risk_level: string | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  building?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    building_type: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
  answers?: AssessmentAnswer[];
}

export interface TopicScore {
  topic_id: string;
  topic_name: string;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  critical_issues: number;
  answered_questions: number;
  total_questions: number;
}

export interface AssessmentReport {
  assessment: RiskAssessment;
  topicScores: TopicScore[];
  criticalIssues: AssessmentAnswer[];
  completionPercentage: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  recommendations: string[];
}

interface ReportStore {
  assessments: RiskAssessment[];
  currentReport: AssessmentReport | null;
  loading: boolean;
  error: string | null;

  fetchAssessments: (userId?: string) => Promise<void>;
  fetchAssessmentById: (id: string) => Promise<RiskAssessment>;
  generateReport: (assessmentId: string) => Promise<AssessmentReport>;
  exportReport: (
    assessmentId: string,
    format: "pdf" | "excel"
  ) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;
}

export const useReportStore = create<ReportStore>((set, get) => ({
  assessments: [],
  currentReport: null,
  loading: false,
  error: null,

  fetchAssessments: async (userId?: string) => {
    set({ loading: true, error: null });
    try {
      let query = supabase
        .from("risk_assessments")
        .select(
          `
          *,
          building:buildings(
            id,
            name,
            address,
            city,
            state,
            building_type
          ),
          user:users(
            id,
            name,
            email
          )
        `
        )
        .order("assessment_date", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      set({ assessments: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchAssessmentById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { data: assessment, error: assessmentError } = await supabase
        .from("risk_assessments")
        .select(
          `
          *,
          building:buildings(
            id,
            name,
            address,
            city,
            state,
            building_type
          ),
          user:users(
            id,
            name,
            email
          )
        `
        )
        .eq("id", id)
        .single();

      if (assessmentError) throw assessmentError;

      const { data: answers, error: answersError } = await supabase
        .from("assessment_answers")
        .select(
          `
          *,
          question:questions(
            id,
            question_text,
            question_type,
            topic_id,
            is_critical,
            max_score,
            weight
          ),
          option:question_options(
            id,
            option_text
          )
        `
        )
        .eq("assessment_id", id);

      if (answersError) throw answersError;

      const assessmentWithAnswers = {
        ...assessment,
        answers: answers || [],
      };

      set({ loading: false });
      return assessmentWithAnswers;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  generateReport: async (assessmentId: string) => {
    set({ loading: true, error: null });
    try {
      const assessment = await get().fetchAssessmentById(assessmentId);

      const { data: topics, error: topicsError } = await supabase
        .from("question_topics")
        .select(
          `
          id,
          name,
          building_type,
          questions(
            id,
            question_text,
            max_score,
            weight,
            is_critical,
            parent_question_id
          )
        `
        )
        .eq("building_type", assessment.building?.building_type || "");

      if (topicsError) throw topicsError;

      // ✅ CALCULAR PONTUAÇÃO NORMALIZADA (0-100)
      const topicScores: TopicScore[] = (topics || []).map((topic: any) => {
        // Filtrar apenas perguntas principais (sem parent)
        const topicQuestions = topic.questions.filter(
          (q: any) => !q.parent_question_id
        );

        // Perguntas respondidas
        const answeredQuestions = topicQuestions.filter((q: any) =>
          assessment.answers?.some((a) => a.question_id === q.id)
        );

        // ✅ NORMALIZAR: Cada pergunta vale max_score (ex: 10)
        // Score do usuário: soma dos scores recebidos
        // Score máximo possível: soma dos max_scores
        const totalScore = answeredQuestions.reduce((sum: number, q: any) => {
          const answer = assessment.answers?.find(
            (a) => a.question_id === q.id
          );
          return sum + (answer?.score || 0);
        }, 0);

        const maxPossibleScore = answeredQuestions.reduce(
          (sum: number, q: any) => sum + q.max_score,
          0
        );

        // ✅ PERCENTUAL: (score obtido / score máximo) * 100
        const percentage =
          maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

        // Contar questões críticas com problema
        const criticalIssues = answeredQuestions.filter((q: any) => {
          const answer = assessment.answers?.find(
            (a) => a.question_id === q.id
          );
          // Se a pontuação for menos de 50% do máximo possível
          return q.is_critical && (answer?.score || 0) < q.max_score * 0.5;
        }).length;

        return {
          topic_id: topic.id,
          topic_name: topic.name,
          total_score: totalScore,
          max_possible_score: maxPossibleScore,
          percentage: Math.min(percentage, 100), // ✅ Garantir que não passe de 100%
          critical_issues: criticalIssues,
          answered_questions: answeredQuestions.length,
          total_questions: topicQuestions.length,
        };
      });

      // Identificar questões críticas com problemas
      const criticalIssues =
        assessment.answers?.filter((answer) => {
          const question = answer.question;
          if (!question) return false;
          return (
            question.is_critical &&
            (answer.score || 0) < question.max_score * 0.5
          );
        }) || [];

      // Calcular porcentagem de conclusão
      const totalQuestions = topicScores.reduce(
        (sum, ts) => sum + ts.total_questions,
        0
      );
      const answeredQuestions = topicScores.reduce(
        (sum, ts) => sum + ts.answered_questions,
        0
      );
      const completionPercentage =
        totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

      // ✅ DETERMINAR NÍVEL DE RISCO BASEADO NA MÉDIA NORMALIZADA
      const averagePercentage =
        topicScores.length > 0
          ? topicScores.reduce((sum, ts) => sum + ts.percentage, 0) /
            topicScores.length
          : 0;

      let riskLevel: "low" | "medium" | "high" | "critical";
      if (averagePercentage >= 80) riskLevel = "low";
      else if (averagePercentage >= 60) riskLevel = "medium";
      else if (averagePercentage >= 40) riskLevel = "high";
      else riskLevel = "critical";

      // Gerar recomendações
      const recommendations: string[] = [];

      if (criticalIssues.length > 0) {
        recommendations.push(
          `Existem ${criticalIssues.length} questões críticas que requerem atenção imediata.`
        );
      }

      topicScores.forEach((ts) => {
        if (ts.percentage < 50 && ts.answered_questions > 0) {
          recommendations.push(
            `O tópico "${ts.topic_name}" apresenta baixa conformidade (${ts.percentage.toFixed(1)}%). Revisar e implementar melhorias.`
          );
        }
        if (ts.critical_issues > 0) {
          recommendations.push(
            `${ts.critical_issues} problemas críticos identificados em "${ts.topic_name}".`
          );
        }
      });

      if (completionPercentage < 100) {
        recommendations.push(
          `Avaliação incompleta. Complete as ${totalQuestions - answeredQuestions} questões restantes para análise completa.`
        );
      }

      const report: AssessmentReport = {
        assessment,
        topicScores,
        criticalIssues,
        completionPercentage,
        riskLevel,
        recommendations,
      };

      set({ currentReport: report, loading: false });
      return report;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  exportReport: async (assessmentId: string, format: "pdf" | "excel") => {
    console.log(`Exportando relatório ${assessmentId} como ${format}`);
    return Promise.resolve();
  },

  deleteAssessment: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from("risk_assessments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      set((state) => ({
        assessments: state.assessments.filter((a) => a.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
