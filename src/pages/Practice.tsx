
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, RotateCcw, Star } from "lucide-react";

type Question = {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
};

const Practice = () => {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // Mock questions - replace with actual data from your backend
  const questions: Question[] = [
    {
      id: "1",
      text: "No que se refere ao conceito de administração pública, às fontes do direito administrativo e aos atos administrativos, julgue os itens seguintes.\n\nDe acordo com o critério orgânico, administração pública designa o conjunto de agentes, órgãos e pessoas jurídicas responsáveis por funções administrativas.",
      options: [
        { id: "C", text: "Certo" },
        { id: "E", text: "Errado" },
      ],
      correctAnswer: "C",
    },
    // Add more questions here
  ];

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (optionId: string) => {
    setSelectedAnswer(optionId);
    setShowAnswer(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
    }
  };

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
                        ? option.id === currentQuestion.correctAnswer
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
