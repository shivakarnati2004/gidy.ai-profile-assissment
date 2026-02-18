import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Briefcase, Flame, Search, Trophy, ExternalLink, Plus } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const jobs: { title: string; company: string; source: string; type: string }[] = [];
const hackathons: { title: string; org: string; date: string; prize: string }[] = [];
const topProfiles: { name: string; badge: string; initials: string }[] = [];

const days = ["M", "T", "W", "T", "F", "S", "S"];
const streakDays = [true, true, true, true, false, false, false];

const Dashboard = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const id = location.hash.replace("#", "");
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Jobs Section */}
            <div id="jobs" className="animate-fade-in-up stagger-1 scroll-mt-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" /> Jobs For You
                </h2>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="text-xs">
                    <Plus className="h-3 w-3 mr-1" /> Post Your Job
                  </Button>
                  <Link to="#" className="text-sm text-primary hover:underline font-medium">View all</Link>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {jobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No jobs available yet.</p>
                ) : (
                  jobs.map((job, i) => (
                    <Card key={i} className="hover-lift group cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground text-sm">{job.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{job.company}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs px-2 py-0">{job.type}</Badge>
                              <span className="text-xs text-muted-foreground">via {job.source}</span>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            Apply <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Hackathons */}
            <div id="hackathons" className="animate-fade-in-up stagger-2 scroll-mt-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" /> Hackathons
                </h2>
                <Link to="#" className="text-sm text-primary hover:underline font-medium">View all</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {hackathons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hackathons available yet.</p>
                ) : (
                  hackathons.map((h, i) => (
                    <Card key={i} className="hover-lift cursor-pointer">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground text-sm">{h.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">by {h.org}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-muted-foreground">{h.date}</span>
                          <Badge className="bg-accent text-accent-foreground border-0 text-xs">{h.prize}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            <Card id="projects" className="animate-fade-in-up stagger-3 scroll-mt-20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No projects available yet.</p>
              </CardContent>
            </Card>

            <Card id="tasks" className="animate-fade-in-up stagger-4 scroll-mt-20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No tasks available yet.</p>
              </CardContent>
            </Card>

            <Card id="organization" className="animate-fade-in-up stagger-5 scroll-mt-20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Organization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No organization updates yet.</p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Streaks */}
            <Card className="animate-fade-in-up stagger-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Flame className="h-5 w-5 text-destructive" /> Gidy Streaks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <span className="text-3xl font-bold text-foreground">100</span>
                  <span className="text-sm text-muted-foreground ml-1">pts</span>
                </div>
                <div className="flex justify-center gap-2">
                  {days.map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                        streakDays[i]
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}>
                        {day}
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full" size="sm">Complete Daily Challenge</Button>
                <Link to="#" className="block text-center text-sm text-primary hover:underline font-medium">
                  View Leader Board
                </Link>
              </CardContent>
            </Card>

            {/* Search & Top Profiles */}
            <Card className="animate-fade-in-up stagger-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Top Profiles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search profiles..." className="pl-9 h-9 text-sm" />
                </div>
                <div className="space-y-3">
                  {topProfiles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No top profiles yet.</p>
                  ) : (
                    topProfiles.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 group cursor-pointer">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">{p.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{p.name}</p>
                        </div>
                        <Badge variant={p.badge === "Winner" ? "default" : "secondary"} className="text-xs px-2 py-0">
                          {p.badge}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
