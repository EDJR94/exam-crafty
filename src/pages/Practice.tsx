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
  rationale: string;
};

const Practice = () => {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showRationale, setShowRationale] = useState(false);

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
      rationale: `
        <p class="bold">Questão 1</p>
        <p>Com relação ao Imposto sobre a Propriedade de Veículos Automotores – IPVA, julgue o item subsequente.</p>
        <p>O adquirente do veículo automotor é solidariamente responsável pelo pagamento do imposto dos exercícios anteriores, cabendo, contudo, o benefício de ordem.</p>
        <p class="red-bold">GABARITO: ERRADO.</p>
        <p class="bold">JUSTIFICATIVA:</p>
        <p>O adquirente do veículo automotor é solidariamente responsável pelo pagamento do imposto dos exercícios anteriores, <span class="red-strike">cabendo, contudo, o benefício de ordem</span>.</p>
        <p>De acordo com a Lei Estadual nº 6.348/1991 - IPVA (BA), que dispõe sobre o IPVA:</p>
        <blockquote>
            <p>Art. 9º - São responsáveis, solidariamente, pelo pagamento do Imposto:</p>
            <p>I - o adquirente, em relação ao veículo adquirido sem o pagamento do imposto do exercício ou exercícios anteriores;</p>
            <p>(...)</p>
            <p>Parágrafo único. A solidariedade prevista neste artigo <span class="blue-bold">não comporta benefício de ordem</span>.</p>
        </blockquote>
      `,
    },
    // Add more questions here
  ];

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (optionId: string) => {
    setSelectedAnswer(optionId);
  };

  const handleSolve = () => {
    setShowAnswer(true);
    setShowRationale(true);
  };

  const isCorrectAnswer = selectedAnswer === currentQuestion.correctAnswer;

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
                  ? "Resposta correta! Ver resolução"
                  : "Resposta errada. Ver resolução"}
              </div>
            )}

            {showRationale && (
              <div className="mt-8 p-6 bg-white rounded-lg border">
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
            )}
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
