import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle, Trophy, LogIn, LogOut, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
    });

    // Listen for auth changes
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

  const examPackages = [
    {
      id: "1",
      title: "Civil Law Package",
      description: "Complete preparation for Civil Law exams",
      price: "R$ 199,90",
      features: ["500+ questions", "Video explanations", "Practice tests", "Progress tracking"],
    },
    {
      id: "2",
      title: "Criminal Law Package",
      description: "Comprehensive Criminal Law study material",
      price: "R$ 199,90",
      features: ["400+ questions", "Expert feedback", "Mock exams", "Performance analytics"],
    },
    {
      id: "3",
      title: "Tax Law Package",
      description: "Master Tax Law concepts and applications",
      price: "R$ 199,90",
      features: ["600+ questions", "Case studies", "Study guides", "Weekly updates"],
    },
  ];

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
            Master Your Exam Preparation
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Practice with thousands of real exam questions, track your progress, and achieve excellence in your legal career.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-lg animate-fade-in">
            <CardHeader>
              <BookOpen className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Extensive Question Bank</CardTitle>
              <CardDescription>Access thousands of real exam questions with detailed explanations</CardDescription>
            </CardHeader>
          </Card>

          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-lg animate-fade-in [animation-delay:200ms]">
            <CardHeader>
              <CheckCircle className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Smart Practice</CardTitle>
              <CardDescription>Create custom notebooks and track your learning progress</CardDescription>
            </CardHeader>
          </Card>

          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-lg animate-fade-in [animation-delay:400ms]">
            <CardHeader>
              <Trophy className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>Detailed insights into your strengths and areas for improvement</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-8">Choose Your Study Package</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {examPackages.map((pkg, index) => (
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
                  <p className="text-2xl font-bold text-primary mb-4">{pkg.price}</p>
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
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
