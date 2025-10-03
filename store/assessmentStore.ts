import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface RiskAssessment {
  id: string;
  building_id: string;
  user_id: string;
  assessment_date: string;
  status: string;
  total_score: number | null;
  risk_level: string | null;
  notes: string | null;
  completed_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AssessmentAnswer {
  id: string;
  assessment_id: string;
  question_id: string;
  option_id: string | null;
  answer_text: string | null;
  answer_numeric: number | null;
  score: number | null;
  answered_at: string;
}

interface AssessmentStore {
  assessments: RiskAssessment[];
  currentAssessment: RiskAssessment | null;
  answers: Map<string, AssessmentAnswer>;
  loading: boolean;
  error: string | null;

  // Assessments
  fetchAssessments: (buildingId?: string) => Promise<void>;
  createAssessment: (buildingId: string, notes?: string) => Promise<string>;
  updateAssessment: (
    id: string,
    data: Partial<RiskAssessment>
  ) => Promise<void>;
  completeAssessment: (id: string) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;

  // Answers
  fetchAnswers: (assessmentId: string) => Promise<void>;
  saveAnswer: (
    assessmentId: string,
    questionId: string,
    answerData: {
      option_id?: string;
      answer_text?: string;
      answer_numeric?: number;
      score: number;
    }
  ) => Promise<void>;

  // Utils
  calculateTotalScore: (assessmentId: string) => Promise<number>;
  setCurrentAssessment: (assessment: RiskAssessment | null) => void;
}

export const useAssessmentStore = create<AssessmentStore>((set, get) => ({
  assessments: [],
  currentAssessment: null,
  answers: new Map(),
  loading: false,
  error: null,

  fetchAssessments: async (buildingId?: string) => {
    set({ loading: true, error: null });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      let query = supabase
        .from("risk_assessments")
        .select("*")
        .eq("user_id", user.id)
        .order("assessment_date", { ascending: false });

      if (buildingId) {
        query = query.eq("building_id", buildingId);
      }

      const { data, error } = await query;

      if (error) throw error;
      set({ assessments: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createAssessment: async (buildingId: string, notes?: string) => {
    set({ loading: true, error: null });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase
        .from("risk_assessments")
        .insert([
          {
            building_id: buildingId,
            user_id: user.id,
            notes: notes || null,
            status: "in_progress",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      await get().fetchAssessments(buildingId);
      set({ loading: false, currentAssessment: data });
      return data.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateAssessment: async (id: string, assessmentData) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from("risk_assessments")
        .update(assessmentData)
        .eq("id", id);

      if (error) throw error;

      await get().fetchAssessments();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  completeAssessment: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const totalScore = await get().calculateTotalScore(id);

      // Calcular o risco baseado no score
      const { data: answers } = await supabase
        .from("assessment_answers")
        .select("score")
        .eq("assessment_id", id);

      const maxPossibleScore = answers?.reduce((sum, a) => sum + 10, 0) || 100; // Exemplo
      const percentage = (totalScore / maxPossibleScore) * 100;

      let riskLevel = "critical";
      if (percentage >= 80) riskLevel = "low";
      else if (percentage >= 60) riskLevel = "medium";
      else if (percentage >= 40) riskLevel = "high";

      const { error } = await supabase
        .from("risk_assessments")
        .update({
          status: "completed",
          total_score: totalScore,
          risk_level: riskLevel,
          completed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      await get().fetchAssessments();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteAssessment: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from("risk_assessments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await get().fetchAssessments();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchAnswers: async (assessmentId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("assessment_answers")
        .select("*")
        .eq("assessment_id", assessmentId);

      if (error) throw error;

      const answersMap = new Map<string, AssessmentAnswer>();
      data?.forEach((answer) => {
        answersMap.set(answer.question_id, answer);
      });

      set({ answers: answersMap, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  saveAnswer: async (assessmentId: string, questionId: string, answerData) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("assessment_answers")
        .upsert([
          {
            assessment_id: assessmentId,
            question_id: questionId,
            option_id: answerData.option_id || null,
            answer_text: answerData.answer_text || null,
            answer_numeric: answerData.answer_numeric || null,
            score: answerData.score,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Atualizar o mapa local
      const answersMap = new Map(get().answers);
      answersMap.set(questionId, data);
      set({ answers: answersMap, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  calculateTotalScore: async (assessmentId: string) => {
    try {
      const { data, error } = await supabase
        .from("assessment_answers")
        .select("score")
        .eq("assessment_id", assessmentId);

      if (error) throw error;

      const total =
        data?.reduce((sum, answer) => sum + (answer.score || 0), 0) || 0;
      return total;
    } catch (error: any) {
      console.error("Erro ao calcular pontuação:", error);
      return 0;
    }
  },

  setCurrentAssessment: (assessment: RiskAssessment | null) => {
    set({ currentAssessment: assessment });
  },
}));
