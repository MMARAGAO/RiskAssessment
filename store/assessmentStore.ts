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
  // ✅ Lock para evitar chamadas simultâneas
  isCreating: boolean;

  getOrCreateAssessment: (buildingId: string) => Promise<Assessment>;
  fetchAssessment: (buildingId: string) => Promise<void>;
  createAssessment: (buildingId: string) => Promise<string>;
  saveAnswer: (questionId: string, answer: Answer) => Promise<void>;
  fetchAnswers: (assessmentId: string) => Promise<void>;
  completeAssessment: (assessmentId: string) => Promise<void>;
  clearCurrentAssessment: () => void;
}

export const useAssessmentStore = create<AssessmentStore>((set, get) => ({
  currentAssessment: null,
  answers: new Map(),
  loading: false,
  error: null,
  isCreating: false,

  getOrCreateAssessment: async (buildingId: string) => {
    // ✅ VERIFICAR SE JÁ EXISTE UM ASSESSMENT NO ESTADO
    const { currentAssessment, isCreating } = get();

    // Se já tem um assessment do mesmo building, retornar ele
    if (currentAssessment && currentAssessment.building_id === buildingId) {
      console.log("✅ Assessment já existe no estado:", currentAssessment.id);
      return currentAssessment;
    }

    // ✅ EVITAR CHAMADAS SIMULTÂNEAS
    if (isCreating) {
      console.log("⏳ Já está criando um assessment, aguardando...");
      // Aguardar até que termine
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          const { currentAssessment: current, isCreating: creating } = get();
          if (!creating && current) {
            clearInterval(interval);
            resolve(current);
          }
        }, 100);

        // Timeout de 10 segundos
        setTimeout(() => {
          clearInterval(interval);
          throw new Error("Timeout ao aguardar criação de assessment");
        }, 10000);
      });
    }

    set({ loading: true, error: null, isCreating: true });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      console.log("🔍 Buscando assessment em andamento para:", {
        buildingId,
        userId: user.id,
      });

      // ✅ Buscar avaliação em andamento
      const { data: existingAssessments, error: fetchError } = await supabase
        .from("risk_assessments")
        .select("*")
        .eq("building_id", buildingId)
        .eq("user_id", user.id)
        .eq("status", "in_progress")
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (existingAssessments && existingAssessments.length > 0) {
        const assessment = existingAssessments[0];
        console.log("✅ Avaliação em andamento encontrada:", assessment.id);

        await get().fetchAnswers(assessment.id);

        set({
          currentAssessment: assessment,
          loading: false,
          isCreating: false,
        });

        return assessment;
      }

      // ✅ CRIAR NOVA AVALIAÇÃO COM UNIQUE CONSTRAINT CHECK
      console.log("➕ Criando nova avaliação...");

      // Buscar novamente para garantir (race condition protection)
      const { data: doubleCheck } = await supabase
        .from("risk_assessments")
        .select("*")
        .eq("building_id", buildingId)
        .eq("user_id", user.id)
        .eq("status", "in_progress")
        .maybeSingle();

      if (doubleCheck) {
        console.log("⚠️ Assessment criado em outra thread:", doubleCheck.id);
        await get().fetchAnswers(doubleCheck.id);

        set({
          currentAssessment: doubleCheck,
          loading: false,
          isCreating: false,
        });

        return doubleCheck;
      }

      const { data: newAssessment, error: createError } = await supabase
        .from("risk_assessments")
        .insert({
          building_id: buildingId,
          user_id: user.id,
          status: "in_progress",
          assessment_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        // Se deu erro de unique constraint, buscar o existente
        if (createError.code === "23505") {
          console.log(
            "⚠️ Conflito detectado, buscando assessment existente..."
          );

          const { data: existing } = await supabase
            .from("risk_assessments")
            .select("*")
            .eq("building_id", buildingId)
            .eq("user_id", user.id)
            .eq("status", "in_progress")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (existing) {
            await get().fetchAnswers(existing.id);

            set({
              currentAssessment: existing,
              loading: false,
              isCreating: false,
            });

            return existing;
          }
        }

        throw createError;
      }

      console.log("✅ Nova avaliação criada:", newAssessment.id);

      set({
        currentAssessment: newAssessment,
        answers: new Map(),
        loading: false,
        isCreating: false,
      });

      return newAssessment;
    } catch (error: any) {
      console.error("❌ Erro ao buscar/criar assessment:", error);
      set({ error: error.message, loading: false, isCreating: false });
      throw error;
    }
  },

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
        .eq("status", "in_progress")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        await get().fetchAnswers(data.id);
      }

      set({ currentAssessment: data || null, loading: false });
    } catch (error: any) {
      console.error("❌ Erro ao buscar assessment:", error);
      set({ error: error.message, loading: false, currentAssessment: null });
    }
  },

  createAssessment: async (buildingId: string) => {
    // ⚠️ DEPRECADO: Use getOrCreateAssessment ao invés
    console.warn(
      "⚠️ createAssessment está deprecado. Use getOrCreateAssessment"
    );
    const assessment = await get().getOrCreateAssessment(buildingId);
    return assessment.id;
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

      const newAnswers = new Map(answers);
      newAnswers.set(questionId, answer);
      set({ answers: newAnswers });

      console.log(
        "✅ Estado local atualizado. Total de respostas:",
        newAnswers.size
      );
    } catch (error: any) {
      console.error("❌ Erro ao salvar resposta:", error);
      throw error;
    }
  },

  fetchAnswers: async (assessmentId: string) => {
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

      set({ answers: answersMap });
    } catch (error: any) {
      console.error("❌ Erro ao buscar respostas:", error);
      set({ error: error.message });
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
          updated_at: new Date().toISOString(),
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
    set({ currentAssessment: null, answers: new Map(), isCreating: false });
  },
}));
