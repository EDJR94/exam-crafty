
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowLeft, BookOpen } from "lucide-react";

type Question = {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

const ExamPackage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questionsCount, setQuestionsCount] = useState(10);

  // This would come from your database
  const examTopics = [
    {
      id: "1",
      title: "Constitutional Principles",
      description: "Fundamental principles of constitutional law",
      questionCount: 150,
    },
    {
      id: "2",
      title: "Civil Procedures",
      description: "Legal procedures in civil law cases",
      questionCount: 200,
    },
    {
      id: "3",
      title: "Contract Law",
      description: "Formation and execution of contracts",
      questionCount: 180,
    },
  ];

  const handleStartPractice = () => {
    if (selectedTopic) {
      navigate(`/practice/${selectedTopic}?count=${questionsCount}`);
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {examTopics.map((topic) => (
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
                  {topic.questionCount} questions available
                </div>
              </CardContent>
            </Card>
          ))}
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
      </div>
    </div>
  );
};

export default ExamPackage;
