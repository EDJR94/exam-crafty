import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, RotateCcw, Star, ChevronDown, ChevronUp, Trophy, Clock, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";

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
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .in('topic_id', topicIds);
  
  if (error) throw error;
  
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
  const [showRationaleCollapsible, setShowRationaleCollapsible] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date>(new Date());

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

  // Fetch the package_id for the current topic
  useEffect(() => {
    const fetchTopicDetails = async () => {
      if (!topicId) return;

      const { data, error } = await supabase
        .from('topics')
        .select('package_id')
        .eq('id', topicId)
        .single();

      if (error) {
        console.error('Error fetching topic details:', error);
        return;
      }

      setPackageId(data.package_id);
    };

    fetchTopicDetails();
  }, [topicId]);

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
          topic_id: topicId,
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
  }, [topicId, questions, sessionId]);

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
      
      // Show summary
      setShowSummary(true);
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
    return <div className="text-center py-8">Loading questions...</div>;
  }

  if (error || !questions) {
    return <div className="text-center py-8 text-red-600">Error loading questions. Please try again later.</div>;
  }

  // Performance Summary component
  if (showSummary) {
    const metrics = calculateSessionMetrics();
    if (!metrics) return <div>No data available</div>;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={handleBackToTopics}
              className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Topics
            </button>
          </div>

          <Card className="mb-8">
            <CardHeader className="text-center">
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">Session Complete!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <p className="text-4xl font-bold text-primary">
                    {metrics.correctCount}/{metrics.totalQuestions}
                  </p>
                  <p className="text-slate-600">
                    Score: {metrics.accuracy.toFixed(1)}%
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Accuracy</p>
                    <Progress value={metrics.accuracy} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg flex items-center">
                      <Clock className="w-5 h-5 text-slate-600 mr-3" />
                      <div>
                        <p className="text-sm text-slate-600">Total Time</p>
                        <p className="font-medium">{formatTime(metrics.sessionTime)}</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-slate-50 rounded-lg flex items-center">
                      <Clock className="w-5 h-5 text-slate-600 mr-3" />
                      <div>
                        <p className="text-sm text-slate-600">Avg. Time per Question</p>
                        <p className="font-medium">{formatTime(Math.round(metrics.averageTimePerQuestion))}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <h3 className="font-medium mb-3">Question Analysis</h3>
                    <div className="space-y-2">
                      {attempts.map((attempt, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div className="flex items-center">
                            {attempt.isCorrect ? (
                              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500 mr-3" />
                            )}
                            <span>Question {index + 1}</span>
                          </div>
                          <span className="text-slate-600">{formatTime(attempt.timeSpent)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleBackToTopics}
                    className="px-8"
                  >
                    Back to Topics
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

  const handleAnswerSelect = (optionId: string) => {
    setSelectedAnswer(optionId);
  };

  const handleSolve = async () => {
    if (!selectedAnswer) return;

    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    await recordAttempt(currentQuestion.id, selectedAnswer, isCorrect);
    
    setShowAnswer(true);
    setStartTime(new Date()); // Reset timer for next question
  };

  const isCorrectAnswer = selectedAnswer === currentQuestion.correct_answer;

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setShowRationaleCollapsible(false);
      setStartTime(new Date());
    } else {
      // Complete the session and show summary
      handleSessionCompletion();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setShowRationaleCollapsible(false);
      setStartTime(new Date());
    }
  };

  // Calculate current progress percentage
  const progressPercentage = (currentQuestionIndex / questions.length) * 100;
  
  // Calculate current score if any answers have been attempted
  const currentScore = attempts.length > 0
    ? (attempts.filter(a => a.isCorrect).length / attempts.length) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={handleBackToTopics}
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

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-600">Progresso</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{correctAnswers}/{attempts.length}</span>
              <span className="text-xs text-slate-500">
                {attempts.length > 0 ? `(${currentScore.toFixed(0)}%)` : ''}
              </span>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
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
            disabled={currentQuestionIndex === questions.length - 1 && !showAnswer}
          >
            {currentQuestionIndex === questions.length - 1 ? "Finalizar" : "Próxima"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Practice;
