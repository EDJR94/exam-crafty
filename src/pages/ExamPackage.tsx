import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowLeft, BookOpen, Search, FolderOpen, X } from "lucide-react";
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
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [questionsCount, setQuestionsCount] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: topics, isLoading, error } = useQuery({
    queryKey: ['topics', id],
    queryFn: () => fetchTopics(id!),
    enabled: !!id,
  });

  const filteredTopics = topics?.filter(topic => 
    topic.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics(prev => {
      if (prev.includes(topicId)) {
        return prev.filter(id => id !== topicId);
      } else {
        return [...prev, topicId];
      }
    });
  };

  const handleRemoveTopic = (topicId: string) => {
    setSelectedTopics(prev => prev.filter(id => id !== topicId));
  };

  const handleStartPractice = () => {
    if (selectedTopics.length > 0) {
      // Join all selected topic IDs with commas and pass the count
      navigate(`/practice/${selectedTopics.join(',')}?count=${questionsCount}`);
    }
  };

  const handleQuestionsCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuestionsCount(value);
    }
  };

  // Calculate total questions count from selected topics
  const totalQuestionsAvailable = selectedTopics.reduce((total, topicId) => {
    const topic = topics?.find(t => t.id === topicId);
    return total + (topic?.question_count || 0);
  }, 0);

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

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Novo caderno de questões</h1>
          <p className="text-lg text-slate-600">
            Selecione os tópicos para praticar e defina seu número preferido de questões
          </p>
        </div>

        {isLoading ? (
          <div className="text-center">Loading topics...</div>
        ) : error ? (
          <div className="text-center text-red-600">Error loading topics. Please try again later.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: Topic Selection */}
            <div className="col-span-2">
              <Card className="shadow-md border-0">
                <CardHeader className="bg-slate-50 border-b">
                  <CardTitle className="text-lg flex items-center">
                    <FolderOpen className="w-5 h-5 mr-2 text-primary" />
                    Matérias e assuntos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-4 border-b">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Pesquisar por nome"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <tbody>
                        {filteredTopics?.map((topic) => (
                          <tr 
                            key={topic.id}
                            onClick={() => handleTopicToggle(topic.id)}
                            className={`border-b last:border-b-0 hover:bg-slate-50 cursor-pointer transition-colors ${
                              selectedTopics.includes(topic.id) ? 'bg-primary/10' : ''
                            }`}
                          >
                            <td className="p-4">
                              <div className="flex items-center">
                                <FolderOpen className="w-5 h-5 mr-3 text-yellow-400" />
                                <div>
                                  <div className="font-medium">{topic.title}</div>
                                  <div className="text-sm text-slate-500">{topic.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-right text-sm text-slate-500">
                              <div className="flex items-center justify-end">
                                <CheckCircle className={`w-4 h-4 mr-1 ${
                                  selectedTopics.includes(topic.id) ? 'text-primary' : 'text-slate-300'
                                }`} />
                                {topic.question_count} questões
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredTopics?.length === 0 && (
                          <tr>
                            <td colSpan={2} className="p-4 text-center text-slate-500">
                              Nenhum tópico encontrado
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column: Settings & Actions */}
            <div>
              <Card className="shadow-md border-0 mb-6">
                <CardHeader className="bg-slate-50 border-b">
                  <CardTitle className="text-lg">Filtros ativos: {selectedTopics.length}</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {selectedTopics.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTopics.map(topicId => {
                        const topic = topics?.find(t => t.id === topicId);
                        return (
                          <div key={topicId} className="p-3 bg-primary/10 rounded-md flex justify-between items-center">
                            <div className="text-sm font-medium">{topic?.title}</div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTopic(topicId);
                              }}
                              className="text-slate-500 hover:text-slate-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 text-center p-6">
                      Selecione pelo menos um tópico para começar
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-md border-0 mb-6">
                <CardHeader className="bg-slate-50 border-b">
                  <CardTitle className="text-lg">Configurações</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div>
                    <label htmlFor="questionsCount" className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Questões
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
                </CardContent>
              </Card>

              <div className="text-center mt-6">
                <div className="mb-3 text-sm text-slate-500">
                  {totalQuestionsAvailable} questões encontradas
                </div>
                <Button
                  className="w-full py-6 text-lg bg-primary hover:bg-primary/90 disabled:opacity-50"
                  disabled={selectedTopics.length === 0}
                  onClick={handleStartPractice}
                >
                  Gerar Caderno
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamPackage;
