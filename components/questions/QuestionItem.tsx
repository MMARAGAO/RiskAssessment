"use client";

import { useState } from "react";
import { Card, CardBody, Button, Chip, Badge } from "@heroui/react";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Plus,
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  List,
  Hash,
  FileText,
  GitBranch,
} from "lucide-react";
import type { Question } from "@/store/questionStore";

interface QuestionItemProps {
  question: Question;
  onEdit: (question: Question, parent?: Question) => void;
  onDelete: (id: string) => void;
  onAddSubQuestion: (parentQuestion: Question) => void;
  level: number;
  expandedQuestions?: Set<string>;
  onToggleExpand?: (id: string) => void;
  parentQuestion?: Question;
}

const questionTypeInfo = {
  yes_no: {
    label: "Sim/Não",
    icon: CheckCircle,
    color: "text-blue-600 dark:text-blue-400",
  },
  multiple_choice: {
    label: "Múltipla Escolha",
    icon: List,
    color: "text-blue-600 dark:text-blue-400",
  },
  numeric: {
    label: "Numérica",
    icon: Hash,
    color: "text-blue-600 dark:text-blue-400",
  },
  text: {
    label: "Texto Livre",
    icon: FileText,
    color: "text-blue-600 dark:text-blue-400",
  },
};

export function QuestionItem({
  question,
  onEdit,
  onDelete,
  onAddSubQuestion,
  level,
  expandedQuestions,
  onToggleExpand,
  parentQuestion,
}: QuestionItemProps) {
  const [localExpanded, setLocalExpanded] = useState(false);

  const hasSubquestions =
    question.subquestions && question.subquestions.length > 0;
  const isExpanded = expandedQuestions
    ? expandedQuestions.has(question.id)
    : localExpanded;

  const typeInfo =
    questionTypeInfo[question.question_type as keyof typeof questionTypeInfo];
  const TypeIcon = typeInfo?.icon || FileText;

  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand(question.id);
    } else {
      setLocalExpanded(!localExpanded);
    }
  };

  // Determinar a condição de ativação desta pergunta
  const getConditionText = () => {
    if (!parentQuestion) return null;

    // Se for baseado em opção específica (multiple_choice)
    if (question.condition_parent_option_id && parentQuestion.options) {
      const option = parentQuestion.options.find(
        (opt) => opt.id === question.condition_parent_option_id
      );
      if (option) {
        return `Se responder: "${option.option_text}"`;
      }
    }

    // Se for baseado em valor direto (yes_no, numeric, text)
    if (
      question.condition_parent_answer !== null &&
      question.condition_parent_answer !== undefined
    ) {
      const value = question.condition_parent_answer;

      if (parentQuestion.question_type === "yes_no") {
        // Converter string para booleano se necessário
        const boolValue =
          value === "true" ||
          value === "1" ||
          value === "yes" ||
          value === "sim";
        return `Se responder: ${boolValue ? "Sim" : "Não"}`;
      }

      return `Se responder: "${value}"`;
    }

    return null;
  };

  const conditionText = getConditionText();

  // Agrupar sub-perguntas por condição
  const groupSubquestionsByCondition = () => {
    if (!hasSubquestions || !question.subquestions) return {};

    const groups: { [key: string]: Question[] } = {};

    question.subquestions.forEach((sub) => {
      let key = "sem_condicao";
      let displayName = "Sempre exibidas";

      // Se tem condição baseada em opção (multiple_choice)
      if (sub.condition_parent_option_id && question.options) {
        const option = question.options.find(
          (opt) => opt.id === sub.condition_parent_option_id
        );
        if (option) {
          key = `option_${option.id}`;
          displayName = `Se responder: "${option.option_text}"`;
        }
      }
      // Se tem condição baseada em valor direto
      else if (
        sub.condition_parent_answer !== null &&
        sub.condition_parent_answer !== undefined
      ) {
        const value = sub.condition_parent_answer;
        key = `value_${value}`;

        if (question.question_type === "yes_no") {
          // Converter string para booleano se necessário
          const boolValue =
            value === "true" ||
            value === "1" ||
            value === "yes" ||
            value === "sim";
          displayName = `Se responder: ${boolValue ? "Sim" : "Não"}`;
        } else {
          displayName = `Se responder: "${value}"`;
        }
      }

      if (!groups[key]) {
        groups[key] = [];
      }

      // Adicionar propriedade de exibição ao grupo
      if (!groups[key].length) {
        (groups[key] as any).displayName = displayName;
      }

      groups[key].push(sub);
    });

    return groups;
  };

  const groupedSubquestions = groupSubquestionsByCondition();

  return (
    <div className="relative" style={{ marginLeft: `${level * 32}px` }}>
      {/* Linha de conexão para sub-perguntas */}
      {level > 0 && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-blue-300 via-blue-200 to-transparent dark:from-blue-800 dark:via-blue-900"
            style={{ left: "-16px" }}
          />
          <div
            className="absolute left-0 top-6 w-4 h-px bg-gradient-to-r from-blue-300 to-transparent dark:from-blue-800"
            style={{ left: "-16px" }}
          />
        </>
      )}

      <Card
        className={`group transition-all duration-200 border-2 ${
          question.is_critical
            ? "border-blue-400 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-zinc-900"
            : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
        } hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-600 hover:-translate-y-0.5`}
      >
        <CardBody className="p-5">
          <div className="flex items-start gap-4">
            {/* Botão Expandir */}
            {hasSubquestions && (
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onClick={handleToggle}
                className="flex-shrink-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:scale-110 transition-transform"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Conteúdo da Pergunta */}
            <div className="flex-1 min-w-0">
              {/* Condição de Ativação */}
              {conditionText && (
                <div className="mb-4 flex items-start gap-2 p-3 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 rounded-xl border-2 border-blue-300 dark:border-blue-800 shadow-sm">
                  <GitBranch className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                      Condição
                    </span>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mt-0.5">
                      {conditionText}
                    </p>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`p-2 rounded-xl shadow-md ${
                        question.is_critical
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700"
                          : "bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700"
                      }`}
                    >
                      <TypeIcon
                        className={`h-5 w-5 ${
                          question.is_critical ? "text-white" : typeInfo?.color
                        }`}
                      />
                    </div>
                    <h4 className="font-bold text-lg text-zinc-900 dark:text-white leading-tight">
                      {question.question_text}
                    </h4>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip
                      size="sm"
                      variant="flat"
                      className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold"
                      startContent={<TypeIcon className="h-3 w-3" />}
                    >
                      {typeInfo?.label}
                    </Chip>

                    <Chip
                      size="sm"
                      variant="flat"
                      className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-semibold"
                      startContent={<Hash className="h-3 w-3" />}
                    >
                      {question.max_score} pts
                    </Chip>

                    <Chip
                      size="sm"
                      variant="flat"
                      className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                    >
                      Peso: {question.weight}
                    </Chip>

                    {question.is_critical && (
                      <Chip
                        size="sm"
                        variant="flat"
                        className="bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-950/50 dark:to-blue-900/50 text-blue-700 dark:text-blue-300 border-2 border-blue-400 dark:border-blue-700 font-bold shadow-sm"
                        startContent={<AlertTriangle className="h-3 w-3" />}
                      >
                        Crítica
                      </Chip>
                    )}

                    {hasSubquestions && (
                      <Badge
                        content={question.subquestions?.length}
                        classNames={{
                          badge:
                            "bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold",
                        }}
                      >
                        <Chip
                          size="sm"
                          variant="flat"
                          className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                          startContent={<List className="h-3 w-3" />}
                        >
                          Sub-perguntas
                        </Chip>
                      </Badge>
                    )}

                    {level > 0 && (
                      <Chip
                        size="sm"
                        variant="flat"
                        className="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                      >
                        Nível {level}
                      </Chip>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    className="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 dark:from-blue-950/30 dark:to-blue-900/30 dark:hover:from-blue-900/50 dark:hover:to-blue-800/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-sm hover:scale-110 transition-transform"
                    onPress={() => onAddSubQuestion(question)}
                    title="Adicionar sub-pergunta"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:scale-110 transition-transform"
                    onPress={() => onEdit(question, parentQuestion)}
                    title="Editar pergunta"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    className="bg-zinc-100 hover:bg-red-100 dark:bg-zinc-800 dark:hover:bg-red-950/30 text-zinc-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:scale-110 transition-all"
                    onPress={() => onDelete(question.id)}
                    title="Excluir pergunta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Texto de Ajuda */}
              {question.help_text && (
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100/30 dark:from-blue-950/30 dark:to-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800 mb-4 shadow-sm">
                  <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-1">
                      Ajuda
                    </p>
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      {question.help_text}
                    </p>
                  </div>
                </div>
              )}

              {/* Opções (Múltipla Escolha) */}
              {question.question_type === "multiple_choice" &&
                question.options &&
                question.options.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <List className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                      <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                        Opções de resposta
                      </p>
                    </div>
                    <div className="grid gap-2">
                      {question.options.map((option, idx) => {
                        const subCount =
                          question.subquestions?.filter(
                            (sub) =>
                              sub.condition_parent_option_id === option.id
                          ).length || 0;

                        return (
                          <div
                            key={option.id}
                            className="flex items-center justify-between p-3 bg-gradient-to-r from-zinc-50 to-zinc-100/50 dark:from-zinc-800/50 dark:to-zinc-700/30 rounded-lg border border-zinc-200 dark:border-zinc-600 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                          >
                            <span className="text-sm text-zinc-900 dark:text-white flex items-center gap-3">
                              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-xs font-bold text-white shadow-md">
                                {idx + 1}
                              </span>
                              {option.option_text}
                            </span>
                            <div className="flex items-center gap-2">
                              <Chip
                                size="sm"
                                variant="flat"
                                className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600 font-semibold"
                              >
                                {option.score_value} pts
                              </Chip>
                              {subCount > 0 && (
                                <Badge
                                  content={subCount}
                                  classNames={{
                                    badge:
                                      "bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold",
                                  }}
                                >
                                  <Chip
                                    size="sm"
                                    variant="flat"
                                    className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-semibold"
                                    startContent={
                                      <GitBranch className="h-3 w-3" />
                                    }
                                  >
                                    Condições
                                  </Chip>
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Sub-perguntas Agrupadas por Condição */}
      {isExpanded && hasSubquestions && (
        <div className="mt-4 space-y-4">
          {Object.entries(groupedSubquestions).map(([conditionKey, subs]) => {
            const displayName = (subs as any).displayName || "Sem condição";
            const isConditional = conditionKey !== "sem_condicao";

            return (
              <div key={conditionKey} className="space-y-3">
                {isConditional && (
                  <div className="ml-4 flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 rounded-xl border-l-4 border-blue-500 dark:border-blue-600 shadow-sm">
                    <GitBranch className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                        Condição de exibição
                      </p>
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                        {displayName}
                      </p>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {subs.map((sub) => (
                    <QuestionItem
                      key={sub.id}
                      question={sub}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onAddSubQuestion={onAddSubQuestion}
                      level={level + 1}
                      expandedQuestions={expandedQuestions}
                      onToggleExpand={onToggleExpand}
                      parentQuestion={question} // 👈 PASSA A PERGUNTA ATUAL COMO PAI
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
