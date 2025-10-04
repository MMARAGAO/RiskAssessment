import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  score_value: number;
  triggers_subquestion: boolean;
  display_order: number;
  created_at: string;
  condition_value?: string | null;
}

export type QuestionType =
  | "yes_no"
  | "multiple_choice"
  | "single_choice" // ✅ Adicionar este tipo
  | "numeric"
  | "text";

export interface Question {
  id: string;
  topic_id: string;
  parent_question_id: string | null;
  question_text: string;
  question_type: QuestionType; // ✅ Usar o type union atualizado
  max_score: number;
  weight: number;
  is_critical: boolean;
  help_text: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  condition_parent_answer: string | null;
  condition_parent_option_id: string | null;
  options?: QuestionOption[];
  subquestions?: Question[];
}

export interface QuestionFormData {
  topic_id: string;
  parent_question_id: string | null;
  question_text: string;
  question_type: QuestionType; // ✅ Usar o type union atualizado
  max_score: number;
  weight: number;
  is_critical: boolean;
  help_text: string | null;
  display_order: number;
  condition_parent_answer?: string | null;
  condition_parent_option_id?: string | null;
}

export interface QuestionTopic {
  id: string;
  name: string;
  description: string | null;
  building_type: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  questions?: Question[]; // ✅ Adicionar campo opcional de perguntas
}

interface QuestionStore {
  topics: QuestionTopic[];
  loading: boolean;
  error: string | null;

  fetchTopics: (buildingType?: string) => Promise<void>;
  createTopic: (data: Omit<QuestionTopic, "id" | "created_at" | "updated_at">) => Promise<void>;
  updateTopic: (id: string, data: Partial<Omit<QuestionTopic, "id" | "created_at" | "updated_at">>) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;

  fetchQuestionTree: (topicId: string) => Promise<Question[]>;
  createQuestion: (
    data: QuestionFormData,
    options?: Omit<QuestionOption, "id" | "created_at" | "question_id">[] // ✅ Adicionar question_id ao Omit
  ) => Promise<Question>;
  updateQuestion: (
    id: string,
    data: Partial<QuestionFormData>
  ) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
}

export const useQuestionStore = create<QuestionStore>((set, get) => ({
  topics: [],
  loading: false,
  error: null,

  fetchTopics: async (buildingType?: string) => {
    set({ loading: true, error: null });
    try {
      let query = supabase
        .from("question_topics")
        .select("*")
        .order("display_order", { ascending: true });

      if (buildingType) {
        query = query.eq("building_type", buildingType);
      }

      const { data, error } = await query;

      if (error) throw error;
      set({ topics: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createTopic: async (data) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.from("question_topics").insert([data]);

      if (error) throw error;

      await get().fetchTopics(data.building_type);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateTopic: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from("question_topics")
        .update(data)
        .eq("id", id);

      if (error) throw error;

      const topics = get().topics;
      const updatedTopic = topics.find((t) => t.id === id);
      if (updatedTopic) {
        await get().fetchTopics(updatedTopic.building_type);
      }
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteTopic: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from("question_topics")
        .delete()
        .eq("id", id);

      if (error) throw error;

      set((state) => ({
        topics: state.topics.filter((t) => t.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchQuestionTree: async (topicId: string) => {
    set({ loading: true, error: null });
    try {
      // Buscar perguntas principais com suas opções (especificando a relação correta)
      const { data: mainQuestions, error: mainError } = await supabase
        .from("questions")
        .select(
          `
          *,
          options:question_options!question_options_question_id_fkey(*)
        `
        )
        .eq("topic_id", topicId)
        .is("parent_question_id", null)
        .order("display_order", { ascending: true });

      if (mainError) {
        console.error("Erro ao buscar perguntas principais:", mainError);
        throw mainError;
      }

      // Função recursiva para buscar sub-perguntas
      const fetchSubquestions = async (
        parentId: string
      ): Promise<Question[]> => {
        const { data: subs, error: subError } = await supabase
          .from("questions")
          .select(
            `
            *,
            options:question_options!question_options_question_id_fkey(*)
          `
          )
          .eq("parent_question_id", parentId)
          .order("display_order", { ascending: true });

        if (subError) {
          console.error("Erro ao buscar sub-perguntas:", subError);
          throw subError;
        }

        const subsWithChildren = await Promise.all(
          (subs || []).map(async (sub) => ({
            ...sub,
            subquestions: await fetchSubquestions(sub.id),
          }))
        );

        return subsWithChildren;
      };

      // Buscar sub-perguntas para cada pergunta principal
      const questionsWithSubs = await Promise.all(
        (mainQuestions || []).map(async (q) => ({
          ...q,
          subquestions: await fetchSubquestions(q.id),
        }))
      );

      set({ loading: false });
      return questionsWithSubs;
    } catch (error: any) {
      console.error("Erro completo ao buscar árvore:", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createQuestion: async (data, options = []) => {
    set({ loading: true, error: null });
    try {
      console.log("📝 Criando pergunta:", { data, options });

      const { data: question, error: questionError } = await supabase
        .from("questions")
        .insert(data)
        .select()
        .single();

      if (questionError) {
        console.error("❌ Erro ao criar pergunta:", questionError);
        throw questionError;
      }

      console.log("✅ Pergunta criada:", question);

      // ✅ Adicionar question_id às opções antes de inserir
      if (options && options.length > 0) {
        const optionsWithQuestionId = options.map((opt) => ({
          ...opt,
          question_id: question.id, // ✅ Adicionar o ID da pergunta criada
        }));

        console.log("📝 Inserindo opções:", optionsWithQuestionId);

        const { error: optionsError } = await supabase
          .from("question_options")
          .insert(optionsWithQuestionId);

        if (optionsError) {
          console.error("❌ Erro ao criar opções:", optionsError);
          throw optionsError;
        }

        console.log("✅ Opções criadas com sucesso");
      }

      set({ loading: false });
      return question;
    } catch (error: any) {
      console.error("❌ Erro no createQuestion:", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateQuestion: async (id, data) => {
    set({ loading: true, error: null });
    try {
      console.log("Atualizando pergunta:", id, data);

      const { error } = await supabase
        .from("questions")
        .update(data)
        .eq("id", id);

      if (error) {
        console.error("Erro ao atualizar pergunta:", error);
        throw error;
      }

      set({ loading: false });
    } catch (error: any) {
      console.error("Erro ao atualizar:", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteQuestion: async (id) => {
    set({ loading: true, error: null });
    try {
      console.log("Excluindo pergunta:", id);

      const { error } = await supabase.from("questions").delete().eq("id", id);

      if (error) {
        console.error("Erro ao excluir pergunta:", error);
        throw error;
      }

      set({ loading: false });
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
