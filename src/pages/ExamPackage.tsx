
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowLeft, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";

type Topic = {
  id: string;
  title: string;
  description: string;
  question_count: number;
};

const fetchTopics = async (packageId: string) => {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('package_id', packageId);
  
  if (error) throw error;
  return data as Topic[];
};

const ExamPackage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questionsCount, setQuestionsCount] = useState(10);

  const { data: topics, isLoading, error } = useQuery({
    queryKey: ['topics', id],
    queryFn: () => fetchTopics(id!),
    enabled: !!id,
  });

  const handleStartPractice = () => {
    if (selectedTopic) {
      navigate(`/practice/${selectedTopic}?count=${questionsCount}`);
    }
  };

  const handleQuestionsCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuestionsCount(value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container px-4 py-8 mx-auto">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-slate-600 hover:text-slate-900 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Packages
        </button>

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Topic</h1>
          <p className="text-lg text-slate-600">
            Select a topic to practice and set your preferred number of questions
          </p>
        </div>

        {isLoading ? (
          <div className="text-center">Loading topics...</div>
        ) : error ? (
          <div className="text-center text-red-600">Error loading topics. Please try again later.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {topics?.map((topic) => (
                <Card
                  key={topic.id}
                  className={`transform transition-all duration-300 hover:scale-105 backdrop-blur-sm bg-white/90 border-0 shadow-lg cursor-pointer ${
                    selectedTopic === topic.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedTopic(topic.id)}
                >
                  <CardHeader>
                    <BookOpen className="w-8 h-8 text-primary mb-4" />
                    <CardTitle>{topic.title}</CardTitle>
                    <CardDescription>{topic.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-primary mr-2" />
                      {topic.question_count} questions available
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex flex-col items-center gap-6 mb-8">
              <div className="w-full max-w-xs">
                <label htmlFor="questionsCount" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions
                </label>
                <Input
                  id="questionsCount"
                  type="number"
                  min="1"
                  value={questionsCount}
                  onChange={handleQuestionsCountChange}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                className="px-8 py-6 text-lg bg-primary hover:bg-primary/90 disabled:opacity-50"
                disabled={!selectedTopic}
                onClick={handleStartPractice}
              >
                Start Practice Session
                <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExamPackage;
