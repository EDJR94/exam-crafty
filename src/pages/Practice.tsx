
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Trophy, 
  Clock, 
  CheckCircle, 
  XCircle,
  BookOpen,
  List,
  BarChart2,
  Settings,
  Share2,
  Eye,
  GraduationCap,
  FileText,
  AlertCircle,
  ChevronRight,
  Star
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";

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
  options: any;
  correct_answer: string;
  rationale: string;
  topic_id: string;
  created_at: string;
};

type QuestionAttempt = {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
};

const fetchQuestions = async (topicIds: string[]) => {
  // Fetch questions with their topic information
  const { data, error } = await supabase
    .from('questions')
    .select(`
      *,
      topics:topic_id (
        id,
        title,
        package_id,
        exam_packages:package_id (
          title
        )
      )
    `)
    .in('topic_id', topicIds);
  
  if (error) throw error;
  
  return (data as (RawQuestion & {
    topics: {
      id: string;
      title: string;
      package_id: string;
      exam_packages: {
        title: string;
      }
    }
  })[]).map(q => ({
    ...q,
    options: q.options as QuestionOption[],
    topic: q.topics,
  })) as (Question & {
    topic: {
      id: string;
      title: string;
      package_id: string;
      exam_packages: {
        title: string;
      }
    }
  })[];
};

const Practice = () => {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showRationaleCollapsible, setShowRationaleCollapsible] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [attempts, setAttempts] = useState<QuestionAttempt[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [packageId, setPackageId] = useState<string | null>(null);
  // Add state to track answered questions
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, { 
    selected: string, 
    isCorrect: boolean 
  }>>({});
  // Add state for timer (HH:MM:SS)
  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  // Get all topic IDs from the URL
  const topicIds = topicId?.split(',') || [];
  const questionCount = parseInt(searchParams.get('count') || '10');

  const { data: allQuestions, isLoading, error } = useQuery({
    queryKey: ['questions', topicIds],
    queryFn: () => fetchQuestions(topicIds),
    enabled: topicIds.length > 0,
  });

  // Randomly select the specified number of questions
  const questions = React.useMemo(() => {
    if (!allQuestions) return null;
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, questionCount);
  }, [allQuestions, questionCount]);

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
      
      const hours = Math.floor(diff / 3600).toString().padStart(2, '0');
      const minutes = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const seconds = Math.floor(diff % 60).toString().padStart(2, '0');
      
      setElapsedTime(`${hours}:${minutes}:${seconds}`);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [sessionStartTime]);

  // Fetch the package_id for the current topic
  useEffect(() => {
    const fetchTopicDetails = async () => {
      if (!topicId) return;

      // Fix: Instead of passing multiple IDs in one request, let's take the first topic ID
      // to get the package_id as all topics should have the same package_id
      const firstTopicId = topicIds[0];
      
      const { data, error } = await supabase
        .from('topics')
        .select('package_id')
        .eq('id', firstTopicId)
        .single();

      if (error) {
        console.error('Error fetching topic details:', error);
        return;
      }

      setPackageId(data.package_id);
    };

    fetchTopicDetails();
  }, [topicId, topicIds]);

  useEffect(() => {
    const createSession = async () => {
      if (!topicId || sessionId) return;

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting current user:', userError);
        return;
      }

      const { data: session, error } = await supabase
        .from('practice_sessions')
        .insert({
          topic_id: topicIds[0], // Use first topic as reference
          total_questions: questions?.length || 0,
          user_id: user?.id, // Associate session with current user
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return;
      }

      setSessionId(session.id);
    };

    if (questions) {
      createSession();
      setSessionStartTime(new Date());
    }
  }, [topicId, questions, sessionId, topicIds]);

  const recordAttempt = async (questionId: string, selectedAnswer: string, isCorrect: boolean) => {
    if (!sessionId) return;

    const timeSpent = Math.round((new Date().getTime() - startTime.getTime()) / 1000);

    // Save attempt in local state for summary
    setAttempts(prev => [...prev, {
      questionId,
      selectedAnswer,
      isCorrect,
      timeSpent
    }]);

    // Update correct answers count
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }

    const { error } = await supabase
      .from('question_attempts')
      .insert({
        session_id: sessionId,
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        time_spent: timeSpent,
      });

    if (error) {
      console.error('Error recording attempt:', error);
    }

    // First, get the current correct_answers count
    const { data: currentSession } = await supabase
      .from('practice_sessions')
      .select('correct_answers')
      .eq('id', sessionId)
      .single();

    // Then update with the new count
    const newCorrectAnswers = (currentSession?.correct_answers || 0) + (isCorrect ? 1 : 0);
    
    const { error: sessionError } = await supabase
      .from('practice_sessions')
      .update({
        correct_answers: newCorrectAnswers,
      })
      .eq('id', sessionId);

    if (sessionError) {
      console.error('Error updating session:', sessionError);
    }
  };

  // Calculate session metrics for the summary
  const calculateSessionMetrics = () => {
    if (!questions || !attempts.length) return null;
    
    const totalQuestions = attempts.length;
    const correctCount = attempts.filter(a => a.isCorrect).length;
    const totalTimeSpent = attempts.reduce((total, a) => total + a.timeSpent, 0);
    const averageTimePerQuestion = totalTimeSpent / totalQuestions;
    
    // Calculate overall session time
    const sessionTime = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000);
    
    return {
      totalQuestions,
      correctCount,
      accuracy: (correctCount / totalQuestions) * 100,
      totalTimeSpent,
      averageTimePerQuestion,
      sessionTime
    };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleSessionCompletion = async () => {
    if (sessionId) {
      // Update session completion in database
      await supabase
        .from('practice_sessions')
        .update({ 
          completed_at: new Date().toISOString(),
          correct_answers: correctAnswers
        })
        .eq('id', sessionId);
      
      // Explicitly set showSummary to true
      setShowSummary(true);
      console.log('Setting showSummary to true'); // Debug log
    }
  };

  // Handle navigation back to topics
  const handleBackToTopics = () => {
    if (packageId) {
      navigate(`/package/${packageId}`);
    } else {
      // Fallback to a safer route if packageId isn't available
      navigate('/topics');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando questões...</p>
        </div>
      </div>
    );
  }

  if (error || !questions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Erro ao carregar questões</h2>
          <p className="text-slate-600 mb-4">Não foi possível carregar as questões. Por favor, tente novamente mais tarde.</p>
          <Button onClick={handleBackToTopics}>Voltar aos Tópicos</Button>
        </div>
      </div>
    );
  }

  // Performance Summary component
  if (showSummary) {
    const metrics = calculateSessionMetrics();
    if (!metrics) return <div>No data available</div>;

    return (
      <div className="min-h-screen bg-slate-50 py-6">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={handleBackToTopics}
              className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Tópicos
            </button>
          </div>

          <Card className="mb-8 shadow-sm">
            <CardHeader className="text-center border-b pb-6">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">Sessão Concluída!</CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-primary/10 mb-4">
                    <p className="text-4xl font-bold text-primary">
                      {metrics.correctCount}/{metrics.totalQuestions}
                    </p>
                  </div>
                  <p className="text-xl text-slate-600">
                    Pontuação: <span className="font-semibold">{metrics.accuracy.toFixed(1)}%</span>
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center">
                      <Clock className="w-5 h-5 text-slate-600 mr-3" />
                      <div>
                        <p className="text-sm text-slate-600">Tempo Total</p>
                        <p className="font-medium">{formatTime(metrics.sessionTime)}</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center">
                      <Clock className="w-5 h-5 text-slate-600 mr-3" />
                      <div>
                        <p className="text-sm text-slate-600">Tempo Médio por Questão</p>
                        <p className="font-medium">{formatTime(Math.round(metrics.averageTimePerQuestion))}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-6">
                    <h3 className="font-medium mb-4 text-slate-900">Análise de Questões</h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {attempts.map((attempt, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow">
                          <div className="flex items-center">
                            {attempt.isCorrect ? (
                              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500 mr-3" />
                            )}
                            <span>Questão {index + 1}</span>
                          </div>
                          <span className="text-slate-600">{formatTime(attempt.timeSpent)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-6">
                  <Button
                    onClick={handleBackToTopics}
                    className="px-8"
                  >
                    Voltar aos Tópicos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const resolvedCount = Object.keys(answeredQuestions).length;
  const correctCount = Object.values(answeredQuestions).filter(a => a.isCorrect).length;
  const errorCount = resolvedCount - correctCount;

  const handleAnswerSelect = (optionId: string) => {
    if (showAnswer) return; // Prevent changing answer after submission
    setSelectedAnswer(optionId);
  };

  const handleSolve = async () => {
    if (!selectedAnswer || !currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    await recordAttempt(currentQuestion.id, selectedAnswer, isCorrect);
    
    // Store the answer in our tracking state
    setAnsweredQuestions(prev => ({
      ...prev,
      [currentQuestion.id]: {
        selected: selectedAnswer,
        isCorrect
      }
    }));
    
    setShowAnswer(true);
    
    // Show feedback toast based on correctness
    if (isCorrect) {
      toast({
        title: "Resposta correta!",
        description: "Muito bem! Você acertou a questão.",
        variant: "default",
      });
    } else {
      toast({
        title: "Resposta incorreta",
        description: `A alternativa correta era ${currentQuestion.correct_answer}.`,
        variant: "destructive",
      });
    }
    
    setStartTime(new Date()); // Reset timer for next question
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // Check if next question was previously answered
      const nextQuestion = questions[currentQuestionIndex + 1];
      const previousAnswer = answeredQuestions[nextQuestion.id];
      if (previousAnswer) {
        setSelectedAnswer(previousAnswer.selected);
        setShowAnswer(true);
      } else {
        setSelectedAnswer(null);
        setShowAnswer(false);
      }
      setShowRationaleCollapsible(false);
      setStartTime(new Date());
    } else if (showAnswer) {
      handleSessionCompletion();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // Restore previous answer if it exists
      const prevQuestion = questions[currentQuestionIndex - 1];
      const previousAnswer = answeredQuestions[prevQuestion.id];
      if (previousAnswer) {
        setSelectedAnswer(previousAnswer.selected);
        setShowAnswer(true);
      } else {
        setSelectedAnswer(null);
        setShowAnswer(false);
      }
      setShowRationaleCollapsible(false);
      setStartTime(new Date());
    }
  };

  // Calculate current progress percentage
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-2 max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <button 
                onClick={handleBackToTopics}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Questões
              </button>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              
              <span className="text-slate-600">Minhas pastas</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              
              {currentQuestion?.topic?.exam_packages?.title && (
                <>
                  <span className="text-slate-600">{currentQuestion.topic.exam_packages.title}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </>
              )}
              
              {currentQuestion?.topic?.title && (
                <>
                  <span className="text-slate-600">{currentQuestion.topic.title}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </>
              )}
              
              <span className="text-red-500 font-medium">
                {currentQuestion?.topic?.title} {questions.length}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center text-slate-700">
                <Eye className="w-4 h-4 mr-1" />
              </div>
              <div className="font-mono text-slate-700">{elapsedTime}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Secondary Navigation */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-2 max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-y-2">
            <div className="flex items-center space-x-6">
              <Button variant="ghost" className="text-blue-600">
                <BookOpen className="w-4 h-4 mr-2" />
                Questões
              </Button>
              
              <Button variant="ghost" className="text-slate-600">
                <List className="w-4 h-4 mr-2" />
                Índice
              </Button>
              
              <Button variant="ghost" className="text-slate-600">
                <BarChart2 className="w-4 h-4 mr-2" />
                Estatísticas
              </Button>
              
              <Button variant="ghost" className="text-slate-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                Gabarito
              </Button>
              
              <Button variant="ghost" className="text-slate-600">
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" className="text-slate-600">
                <FileText className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              
              <Button variant="ghost" className="text-slate-600">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Question Counter */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 max-w-5xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <h2 className="font-semibold text-slate-800">
                  Questão {currentQuestionIndex + 1} de {questions.length}
                </h2>
                <span className="text-sm text-slate-500">
                  ({resolvedCount} Resolvidas, {correctCount} Acertos e {errorCount} Erros)
                </span>
              </div>
              
              <div className="mt-1 text-sm">
                <span className="text-slate-600">Matéria: </span>
                <span className="text-blue-600">
                  {currentQuestion?.topic?.title || "Não especificada"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              
              <button className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-red-600" />
              </button>
              
              <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Question ID */}
        <div className="mb-4 text-sm text-slate-500 flex items-center">
          <span>#192{currentQuestion.id.substring(0, 6)}</span>
          <span className="mx-2">-</span>
          <span>{currentQuestion.topic.exam_packages.title}</span>
        </div>
        
        {/* Question Text */}
        <div className="mb-8">
          <div className="prose max-w-none text-slate-800">
            <p className="whitespace-pre-line text-lg">{currentQuestion.text}</p>
          </div>
        </div>
        
        {/* Options */}
        <div className="space-y-3 mb-8">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrect = option.id === currentQuestion.correct_answer;
            
            let optionClasses = "w-full p-4 text-left rounded-lg border transition-all flex items-start ";
            
            if (showAnswer) {
              if (isCorrect) {
                optionClasses += "bg-green-50 border-green-500 text-green-700 ";
              } else if (isSelected && !isCorrect) {
                optionClasses += "bg-red-50 border-red-500 text-red-700 ";
              } else {
                optionClasses += "border-slate-200 text-slate-700 ";
              }
            } else if (isSelected) {
              optionClasses += "bg-blue-50 border-blue-500 text-blue-700 ";
            } else {
              optionClasses += "border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 ";
            }
            
            return (
              <button
                key={option.id}
                onClick={() => handleAnswerSelect(option.id)}
                className={optionClasses}
                disabled={showAnswer}
              >
                <span className="font-medium text-lg mr-2">{option.id}</span>
                <span className="pt-0.5">{option.text}</span>
              </button>
            );
          })}
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          
          {!showAnswer && selectedAnswer && (
            <Button onClick={handleSolve} className="px-6">
              Resolver
            </Button>
          )}
          
          <Button
            onClick={handleNext}
            disabled={currentQuestionIndex === questions.length - 1 && !showAnswer}
            className="px-4"
          >
            {currentQuestionIndex === questions.length - 1 && showAnswer ? "Finalizar" : "Próxima"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        
        {/* Explanation Section */}
        {showAnswer && (
          <Collapsible
            open={showRationaleCollapsible}
            onOpenChange={setShowRationaleCollapsible}
            className="mb-8"
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
        )}
        
        {/* Question Status */}
        {showAnswer && (
          <div className="mt-6 mb-6">
            <div className="p-4 rounded-lg flex items-center gap-3 justify-center">
              {selectedAnswer === currentQuestion.correct_answer ? (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                  <span className="text-green-800 font-medium">Resposta correta!</span>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center">
                  <XCircle className="w-6 h-6 text-red-600 mr-3" />
                  <span className="text-red-800 font-medium">
                    Resposta incorreta. A alternativa correta é {currentQuestion.correct_answer}.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Practice;
