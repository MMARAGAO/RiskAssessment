import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface Answer {
  question_id: string;
  option_id?: string;
  answer_text?: string;
  answer_numeric?: number;
  score?: number;
}

export interface Assessment {
  id: string;
  building_id: string;
  user_id: string;
  assessment_date: string;
  status: string;
  total_score?: number;
  risk_level?: string;
  notes?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

interface AssessmentStore {
  currentAssessment: Assessment | null;
  answers: Map<string, Answer>;
  loading: boolean;
  error: string | null;

  fetchAssessment: (buildingId: string) => Promise<void>;
  createAssessment: (buildingId: string) => Promise<string>;
  saveAnswer: (questionId: string, answer: Answer) => Promise<void>; // ✅ 2 parâmetros apenas
  fetchAnswers: (assessmentId: string) => Promise<void>;
  completeAssessment: (assessmentId: string) => Promise<void>;
  clearCurrentAssessment: () => void;
}

export const useAssessmentStore = create<AssessmentStore>((set, get) => ({
  currentAssessment: null,
  answers: new Map(),
  loading: false,
  error: null,

  fetchAssessment: async (buildingId: string) => {
    set({ loading: true, error: null });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("risk_assessments")
        .select("*")
        .eq("building_id", buildingId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      set({ currentAssessment: data || null, loading: false });
    } catch (error: any) {
      console.error("❌ Erro ao buscar assessment:", error);
      set({ error: error.message, loading: false, currentAssessment: null });
    }
  },

  createAssessment: async (buildingId: string) => {
    set({ loading: true, error: null });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("risk_assessments")
        .insert({
          building_id: buildingId,
          user_id: user.id,
          status: "in_progress",
        })
        .select()
        .single();

      if (error) throw error;

      set({ currentAssessment: data, loading: false });
      return data.id;
    } catch (error: any) {
      console.error("❌ Erro ao criar assessment:", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  saveAnswer: async (questionId: string, answer: Answer) => {
    const { currentAssessment, answers } = get();

    if (!currentAssessment) {
      throw new Error("Nenhum assessment ativo");
    }

    try {
      console.log("💾 Salvando resposta:", {
        assessmentId: currentAssessment.id,
        questionId,
        answer,
      });

      // ✅ VALIDAR SE A PERGUNTA EXISTE ANTES DE SALVAR
      const { data: questionExists, error: questionError } = await supabase
        .from("questions")
        .select("id")
        .eq("id", questionId)
        .maybeSingle();

      if (questionError) {
        console.error("❌ Erro ao validar pergunta:", questionError);
        throw questionError;
      }

      if (!questionExists) {
        const errorMsg = `❌ ERRO: Pergunta ${questionId} não existe no banco de dados!`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      console.log("✅ Pergunta validada:", questionId);

      // ✅ Verificar se já existe uma resposta para esta pergunta
      const { data: existingAnswer, error: fetchError } = await supabase
        .from("assessment_answers")
        .select("id")
        .eq("assessment_id", currentAssessment.id)
        .eq("question_id", questionId)
        .maybeSingle();

      if (fetchError) {
        console.error("❌ Erro ao buscar resposta existente:", fetchError);
        throw fetchError;
      }

      // ✅ Preparar dados para inserção/atualização
      const answerData = {
        assessment_id: currentAssessment.id,
        question_id: questionId,
        option_id: answer.option_id || null,
        answer_text: answer.answer_text || null,
        answer_numeric: answer.answer_numeric || null,
        score: answer.score || null,
      };

      console.log("📝 Dados preparados:", answerData);

      if (existingAnswer) {
        // ✅ Atualizar resposta existente
        console.log("🔄 Atualizando resposta existente:", existingAnswer.id);

        const { error: updateError } = await supabase
          .from("assessment_answers")
          .update(answerData)
          .eq("id", existingAnswer.id);

        if (updateError) {
          console.error("❌ Erro ao atualizar:", updateError);
          throw updateError;
        }

        console.log("✅ Resposta atualizada com sucesso");
      } else {
        // ✅ Inserir nova resposta
        console.log("➕ Inserindo nova resposta");

        const { error: insertError } = await supabase
          .from("assessment_answers")
          .insert(answerData);

        if (insertError) {
          console.error("❌ Erro ao inserir:", insertError);
          throw insertError;
        }

        console.log("✅ Resposta inserida com sucesso");
      }

      // ✅ Atualizar estado local
      const newAnswers = new Map(answers);
      newAnswers.set(questionId, answer);
      set({ answers: newAnswers });

      console.log("✅ Estado local atualizado. Total de respostas:", newAnswers.size);
    } catch (error: any) {
      console.error("❌ Erro ao salvar resposta:", error);
      throw error;
    }
  },

  fetchAnswers: async (assessmentId: string) => {
    set({ loading: true, error: null });
    try {
      console.log("📥 Buscando respostas do assessment:", assessmentId);

      const { data, error } = await supabase
        .from("assessment_answers")
        .select("*")
        .eq("assessment_id", assessmentId);

      if (error) {
        console.error("❌ Erro ao buscar respostas:", error);
        throw error;
      }

      console.log("✅ Respostas encontradas:", data?.length || 0);

      const answersMap = new Map<string, Answer>();

      if (data) {
        data.forEach((row) => {
          answersMap.set(row.question_id, {
            question_id: row.question_id,
            option_id: row.option_id,
            answer_text: row.answer_text,
            answer_numeric: row.answer_numeric,
            score: row.score,
          });
        });
      }

      console.log("📊 Map de respostas criado. Size:", answersMap.size);

      set({ answers: answersMap, loading: false });
    } catch (error: any) {
      console.error("❌ Erro ao buscar respostas:", error);
      set({ error: error.message, loading: false });
    }
  },

  completeAssessment: async (assessmentId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from("risk_assessments")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", assessmentId);

      if (error) throw error;

      const { currentAssessment } = get();
      if (currentAssessment && currentAssessment.id === assessmentId) {
        set({
          currentAssessment: {
            ...currentAssessment,
            status: "completed",
            completed_at: new Date().toISOString(),
          },
          loading: false,
        });
      }
    } catch (error: any) {
      console.error("❌ Erro ao completar assessment:", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  clearCurrentAssessment: () => {
    set({ currentAssessment: null, answers: new Map() });
  },
}));
