import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, RotateCcw, Star, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type QuestionOption = {
  id: string;
  text: string;
};

type Question = {
  id: string;
  text: string;
  options: QuestionOption[];
  correct_answer: string;
  rationale: string;
};

type RawQuestion = {
  id: string;
  text: string;
  options: any; // Changed from Json to any to fix TypeScript error
  correct_answer: string;
  rationale: string;
  topic_id: string;
  created_at: string;
};

const fetchQuestions = async (topicId: string) => {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('topic_id', topicId);
  
  if (error) throw error;
  
  // Transform the raw questions to match our Question type
  return (data as RawQuestion[]).map(q => ({
    ...q,
    options: q.options as QuestionOption[],
  })) as Question[];
};

const Practice = () => {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showRationale, setShowRationale] = useState(false);

  const { data: questions, isLoading, error } = useQuery({
    queryKey: ['questions', topicId],
    queryFn: () => fetchQuestions(topicId!),
    enabled: !!topicId,
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading questions...</div>;
  }

  if (error || !questions) {
    return <div className="text-center py-8 text-red-600">Error loading questions. Please try again later.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (optionId: string) => {
    setSelectedAnswer(optionId);
  };

  const handleSolve = () => {
    setShowAnswer(true);
    setShowRationale(true);
  };

  const isCorrectAnswer = selectedAnswer === currentQuestion.correct_answer;

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setShowRationale(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setShowRationale(false);
    }
  };

  const [showRationaleCollapsible, setShowRationaleCollapsible] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              Questão {currentQuestionIndex + 1} de {questions.length}
            </span>
            <Button variant="outline" size="icon">
              <Star className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="mb-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium">{currentQuestionIndex + 1}</span>
                  </div>
                </div>
                <div>
                  <p className="text-slate-600 whitespace-pre-line">{currentQuestion.text}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleAnswerSelect(option.id)}
                  className={`w-full p-4 text-left rounded-lg border transition-all ${
                    selectedAnswer === option.id
                      ? showAnswer
                        ? option.id === currentQuestion.correct_answer
                          ? "bg-green-50 border-green-500 text-green-700"
                          : "bg-red-50 border-red-500 text-red-700"
                        : "bg-primary/10 border-primary"
                      : "border-slate-200 hover:border-primary"
                  }`}
                  disabled={showAnswer}
                >
                  <span className="font-medium">{option.id}</span> - {option.text}
                </button>
              ))}
            </div>

            {!showAnswer && selectedAnswer && (
              <div className="mt-6 flex justify-center">
                <Button onClick={handleSolve} className="w-full max-w-xs">
                  Resolver
                </Button>
              </div>
            )}

            {showAnswer && (
              <div className={`mt-6 text-center font-medium ${
                isCorrectAnswer ? "text-green-600" : "text-red-600"
              }`}>
                {isCorrectAnswer
                  ? "Resposta correta!"
                  : "Resposta errada."}
              </div>
            )}

            <Collapsible
              open={showRationaleCollapsible}
              onOpenChange={setShowRationaleCollapsible}
              className="mt-6"
            >
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full">
                  Ver Resolução
                  {showRationaleCollapsible ? (
                    <ChevronUp className="w-4 h-4 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-2" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="p-6 bg-white rounded-lg border">
                  <style dangerouslySetInnerHTML={{
                    __html: `
                      .bold { font-weight: bold; }
                      .red-strike { color: #FF6666; text-decoration: line-through; text-decoration-color: #000; }
                      .blue-bold { color: #0000FF; font-weight: bold; }
                      .red-bold { color: #FF6666; font-weight: bold; }
                      blockquote { color: #000; margin: 10px 0; font-style: italic; padding-left: 1rem; border-left: 4px solid #e5e7eb; }
                    `
                  }} />
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: currentQuestion.rationale }}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={handleNext}
            disabled={currentQuestionIndex === questions.length - 1}
          >
            Próxima
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Practice;
