"use client";

import { useState } from "react";
import { Card, CardBody, Button, Chip, Badge, Divider } from "@heroui/react";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Plus,
  ListTree,
  FileQuestion,
  Building,
  Building2,
  Factory,
  Home,
  AlertTriangle,
} from "lucide-react";
import type { QuestionTopic, Question } from "@/store/questionStore";
import { QuestionItem } from "./QuestionItem";

interface TopicCardProps {
  topic: QuestionTopic;
  questions: Question[];
  onEdit: (topic: QuestionTopic) => void;
  onDelete: (id: string, name: string) => void;
  onAddQuestion: (topicId: string) => void;
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onAddSubQuestion: (parentQuestion: Question) => void;
}

const buildingTypeIcons = {
  Residencial: Home,
  Comercial: Building2,
  Industrial: Factory,
  Misto: Building,
};

export function TopicCard({
  topic,
  questions,
  onEdit,
  onDelete,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onAddSubQuestion,
}: TopicCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalQuestions = questions.length;
  const criticalQuestions = questions.filter((q) => q.is_critical).length;
  const BuildingIcon =
    buildingTypeIcons[topic.building_type as keyof typeof buildingTypeIcons] ||
    Building;

  return (
    <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-zinc-900">
      <CardBody className="p-0">
        {/* Header do Card */}
        <div
          className="p-6 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Informações Principais */}
            <div className="flex items-start gap-4 flex-1">
              {/* Ícone e Número */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {topic.display_order + 1}
                </div>
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                    <BuildingIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {topic.name}
                  </h3>
                </div>

                {topic.description && (
                  <p className="text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
                    {topic.description}
                  </p>
                )}

                {/* Tags e Stats */}
                <div className="flex flex-wrap items-center gap-2">
                  <Chip
                    size="md"
                    variant="flat"
                    className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    startContent={<BuildingIcon className="h-4 w-4" />}
                  >
                    {topic.building_type}
                  </Chip>

                  <Badge
                    content={totalQuestions}
                    classNames={{
                      badge: "bg-blue-600 dark:bg-blue-500 text-white",
                    }}
                    placement="top-right"
                  >
                    <Chip
                      size="md"
                      variant="flat"
                      className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                      startContent={<ListTree className="h-4 w-4" />}
                    >
                      Perguntas
                    </Chip>
                  </Badge>

                  {criticalQuestions > 0 && (
                    <Badge
                      content={criticalQuestions}
                      classNames={{
                        badge: "bg-blue-600 dark:bg-blue-500 text-white",
                      }}
                      placement="top-right"
                    >
                      <Chip
                        size="md"
                        variant="flat"
                        className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        startContent={<AlertTriangle className="h-4 w-4" />}
                      >
                        Críticas
                      </Chip>
                    </Badge>
                  )}

                  <Chip
                    size="md"
                    variant="flat"
                    className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                  >
                    Ordem: {topic.display_order}
                  </Chip>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div
              className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                onPress={() => onEdit(topic)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                onPress={() => onDelete(topic.id, topic.name)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Conteúdo Expansível - Perguntas */}
        {isExpanded && (
          <>
            <Divider className="bg-zinc-200 dark:bg-zinc-800" />
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <ListTree className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Perguntas do Tópico
                </h4>
                <Button
                  size="md"
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold shadow-lg"
                  startContent={<Plus className="h-4 w-4" />}
                  onPress={() => onAddQuestion(topic.id)}
                >
                  Nova Pergunta
                </Button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700">
                  <div className="inline-block p-4 bg-zinc-100 dark:bg-zinc-700 rounded-full mb-4">
                    <FileQuestion className="h-12 w-12 text-zinc-400 dark:text-zinc-500" />
                  </div>
                  <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-4">
                    Nenhuma pergunta cadastrada neste tópico
                  </p>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                    variant="flat"
                    startContent={<Plus className="h-4 w-4" />}
                    onPress={() => onAddQuestion(topic.id)}
                  >
                    Adicionar primeira pergunta
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((question) => (
                    <QuestionItem
                      key={question.id}
                      question={question}
                      onEdit={onEditQuestion}
                      onDelete={onDeleteQuestion}
                      onAddSubQuestion={onAddSubQuestion}
                      level={0}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
