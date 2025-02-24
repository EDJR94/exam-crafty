
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle, Trophy, LogIn, LogOut, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";

type ExamPackage = {
  id: string;
  title: string;
  description: string;
  price: number;
  features: string[];
};

const fetchExamPackages = async () => {
  const { data, error } = await supabase
    .from('exam_packages')
    .select('*');
  
  if (error) throw error;
  return data as ExamPackage[];
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const { data: examPackages, isLoading, error } = useQuery({
    queryKey: ['examPackages'],
    queryFn: fetchExamPackages,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again.",
      });
    }
  };

  const handleGetStarted = (packageId: string) => {
    navigate(`/package/${packageId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container px-4 py-16 mx-auto">
        <div className="flex justify-end mb-4 items-center gap-2">
          {userEmail ? (
            <>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <UserRound className="w-4 h-4" />
                {userEmail}
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => navigate("/auth")}
              className="gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          )}
        </div>

        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Domine Sua Prova
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Prepare-se para a sua prova de forma inteligente com nossas questões inéditas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-lg animate-fade-in">
            <CardHeader>
              <BookOpen className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Banco de Questões</CardTitle>
              <CardDescription>Acesse milhares de questões com comentários detalhados</CardDescription>
            </CardHeader>
          </Card>

          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-lg animate-fade-in [animation-delay:200ms]">
            <CardHeader>
              <CheckCircle className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Aprendizado Inteligente</CardTitle>
              <CardDescription>Crie simulados personalizados de sua preferência</CardDescription>
            </CardHeader>
          </Card>

          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-lg animate-fade-in [animation-delay:400ms]">
            <CardHeader>
              <Trophy className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Análise de Performance</CardTitle>
              <CardDescription>Recebe um relatório personalizado e saiba onde melhorar</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-8">Escolha Seu Pacote de Estudo</h2>
          {isLoading ? (
            <div className="text-center">Carregando Pacotes...</div>
          ) : error ? (
            <div className="text-center text-red-600">Erro ao carregar pacotes, Tente novamente.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {examPackages?.map((pkg, index) => (
                <Card 
                  key={pkg.id}
                  className={`transform transition-all duration-300 hover:scale-105 backdrop-blur-sm bg-white/90 border-0 shadow-lg animate-fade-in cursor-pointer ${
                    selectedExam === pkg.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedExam(pkg.id)}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <CardHeader>
                    <CardTitle>{pkg.title}</CardTitle>
                    <CardDescription>{pkg.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-primary mb-4">R$ {pkg.price.toFixed(2)}</p>
                    <ul className="space-y-2">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-slate-600">
                          <CheckCircle className="w-4 h-4 text-primary mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full mt-6 bg-primary hover:bg-primary/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGetStarted(pkg.id);
                      }}
                    >
                      Quero começar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
