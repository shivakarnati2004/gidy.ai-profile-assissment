import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CatMascot from "@/components/CatMascot";
import { Briefcase, Trophy, Users, Zap, Target, BookOpen } from "lucide-react";

const features = [
  { icon: Briefcase, title: "Job Discovery", desc: "Find curated job opportunities tailored to your skills and aspirations." },
  { icon: Trophy, title: "Hackathons", desc: "Compete in exciting hackathons and showcase your talents to the world." },
  { icon: Users, title: "Community", desc: "Connect with like-minded professionals and grow your network." },
  { icon: Zap, title: "Daily Streaks", desc: "Stay motivated with gamified challenges and earn rewards every day." },
  { icon: Target, title: "Career Goals", desc: "Set and track your career milestones with actionable insights." },
  { icon: BookOpen, title: "Learning Paths", desc: "Access curated learning resources to level up your skills." },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          <div className="flex-1 text-center lg:text-left">
            <Badge className="animate-fade-in-up stagger-1 mb-4 bg-accent text-accent-foreground border-0 px-4 py-1.5 text-sm font-medium">
              ✨ Welcome To Gidy
            </Badge>
            <h1 className="animate-fade-in-up stagger-2 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight tracking-tight">
              Find Jobs.
              <br />
              <span className="text-primary">Compete in Hackathons.</span>
            </h1>
            <p className="animate-fade-in-up stagger-3 mt-5 text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0">
              Your one-stop career platform to discover opportunities, compete with peers, and accelerate your professional growth.
            </p>
            <div className="animate-fade-in-up stagger-4 mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to="/login?mode=create">
                <Button size="lg" className="px-8 text-base font-semibold shadow-lg animate-pulse-glow">
                  Get Started
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="px-8 text-base font-semibold">
                  Explore Jobs
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex-shrink-0 animate-fade-in-up stagger-5">
            <CatMascot className="w-[240px] h-[260px] sm:w-[280px] sm:h-[300px] lg:w-[320px] lg:h-[340px]" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Everything you need to <span className="text-primary">grow</span></h2>
          <p className="mt-3 text-muted-foreground text-lg max-w-2xl mx-auto">Tools and features designed to fast-track your career journey.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group p-6 rounded-2xl border border-border bg-card hover-lift cursor-default"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <f.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
        <div className="p-10 rounded-3xl bg-primary/5 border border-primary/10">
          <h2 className="text-3xl font-bold text-foreground mb-3">Ready to start your journey?</h2>
          <p className="text-muted-foreground mb-6">Join thousands of professionals already using Gidy to advance their careers.</p>
          <Link to="/login?mode=create">
            <Button size="lg" className="px-10 text-base font-semibold">Join Gidy Now</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border text-center text-sm text-muted-foreground">
        <p>© 2026 Gidy. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
