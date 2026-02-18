import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clearAuthSession, endorseSkill, fetchProfile, getStoredEmail, getStoredUsername, updateProfile, uploadProfilePhoto, uploadResumeFile } from "@/lib/api";
import { buildBioSummary } from "@/lib/utils";
import { MapPin, Mail, Download, Award, Target, Briefcase, GraduationCap, FileCheck, ExternalLink, Pencil, Plus, Trash2, WandSparkles } from "lucide-react";

type ExperienceItem = {
  title: string;
  company: string;
  location: string;
  dates: string;
  description: string;
};

type EducationItem = {
  degree: string;
  institution: string;
  year: string;
  grade?: string;
};

type CertificationItem = {
  name: string;
  credentialId: string;
  link?: string;
};

type CareerGoalItem = {
  title: string;
  description?: string;
};

type SocialLinkItem = {
  platform: string;
  url: string;
};

const Profile = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const username = getStoredUsername();
  const [isEditing, setIsEditing] = useState(false);
  const [formProfile, setFormProfile] = useState({
    displayName: "",
    avatarUrl: "",
    headline: "",
    bio: "",
    location: "",
    contactEmail: "",
    avatarInitials: "",
    resumeUrl: "",
    levelBadge: "",
    graduateBadge: "",
    rewardLeague: "",
    rewardRank: 0,
    rewardPoints: 0,
    completionPercent: 0
  });
  const [skillsInput, setSkillsInput] = useState("");
  const [endorserEmail, setEndorserEmail] = useState(getStoredEmail() ?? "");
  const [endorsementCounts, setEndorsementCounts] = useState<Record<string, number>>({});
  const [endorsementMessage, setEndorsementMessage] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeMessage, setResumeMessage] = useState<string | null>(null);
  const [activeExperienceIndex, setActiveExperienceIndex] = useState(0);
  const [experienceItems, setExperienceItems] = useState<ExperienceItem[]>([]);
  const [educationItems, setEducationItems] = useState<EducationItem[]>([]);
  const [certificationItems, setCertificationItems] = useState<CertificationItem[]>([]);
  const [careerGoalItems, setCareerGoalItems] = useState<CareerGoalItem[]>([]);
  const [socialLinkItems, setSocialLinkItems] = useState<SocialLinkItem[]>([]);

  const profileQuery = useQuery({
    queryKey: ["profile", username],
    queryFn: () => fetchProfile(username ?? ""),
    enabled: Boolean(username)
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateProfile>[1]) => updateProfile(username ?? "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
      setIsEditing(false);
    }
  });

  const profile = profileQuery.data?.profile;
  const skills = profileQuery.data?.skills ?? [];
  const experience = profileQuery.data?.experience ?? [];
  const education = profileQuery.data?.education ?? [];
  const certifications = profileQuery.data?.certifications ?? [];
  const careerGoals = profileQuery.data?.careerGoals ?? [];
  const socialLinks = profileQuery.data?.socialLinks ?? [];

  useEffect(() => {
    const mapped = Object.fromEntries(skills.map((skill) => [skill.id, skill.endorsementsCount]));
    setEndorsementCounts(mapped);
  }, [skills]);

  useEffect(() => {
    if (experience.length === 0) {
      setActiveExperienceIndex(0);
      return;
    }

    if (activeExperienceIndex >= experience.length) {
      setActiveExperienceIndex(experience.length - 1);
    }
  }, [experience, activeExperienceIndex]);

  const handleEndorse = async (skillId: string) => {
    setEndorsementMessage(null);

    if (!endorserEmail.trim()) {
      setEndorsementMessage("Add an endorser email first.");
      return;
    }

    try {
      await endorseSkill(skillId, endorserEmail.trim());
      setEndorsementCounts((prev) => ({
        ...prev,
        [skillId]: (prev[skillId] ?? 0) + 1
      }));
      setEndorsementMessage("Skill endorsed successfully.");
    } catch (error) {
      setEndorsementMessage(error instanceof Error ? error.message : "Unable to endorse skill.");
    }
  };

  const handleGenerateBio = () => {
    const generatedBio = buildBioSummary({
      displayName: formProfile.displayName,
      headline: formProfile.headline,
      skills: skillsInput.split(","),
      goals: careerGoalItems.map((goal) => goal.title)
    });

    setFormProfile((prev) => ({ ...prev, bio: generatedBio }));
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const handleUploadPhoto = async () => {
    if (!username || !photoFile) {
      setPhotoMessage("Select an image file first.");
      return;
    }

    try {
      const uploaded = await uploadProfilePhoto(username, photoFile);
      setFormProfile((prev) => ({ ...prev, avatarUrl: uploaded.avatarUrl }));
      setPhotoMessage("Profile photo uploaded.");
      setPhotoFile(null);
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
    } catch (error) {
      setPhotoMessage(error instanceof Error ? error.message : "Unable to upload photo.");
    }
  };

  const handleUploadResume = async () => {
    if (!username || !resumeFile) {
      setResumeMessage("Select a resume file first.");
      return;
    }

    try {
      const uploaded = await uploadResumeFile(username, resumeFile);
      setFormProfile((prev) => ({ ...prev, resumeUrl: uploaded.resumeUrl }));
      setResumeMessage("Resume uploaded.");
      setResumeFile(null);
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
    } catch (error) {
      setResumeMessage(error instanceof Error ? error.message : "Unable to upload resume.");
    }
  };

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFormProfile({
      displayName: profile.displayName ?? "",
      avatarUrl: profile.avatarUrl ?? "",
      headline: profile.headline ?? "",
      bio: profile.bio ?? "",
      location: profile.location ?? "",
      contactEmail: profile.contactEmail ?? "",
      avatarInitials: profile.avatarInitials ?? "",
      resumeUrl: profile.resumeUrl ?? "",
      levelBadge: profile.levelBadge ?? "",
      graduateBadge: profile.graduateBadge ?? "",
      rewardLeague: profile.rewardLeague ?? "",
      rewardRank: profile.rewardRank ?? 0,
      rewardPoints: profile.rewardPoints ?? 0,
      completionPercent: profile.completionPercent ?? 0
    });

    setSkillsInput(skills.map((skill) => skill.name).join(", "));
    setExperienceItems(
      (profileQuery.data?.experience ?? []).map((item) => ({
        title: item.title,
        company: item.company,
        location: item.location,
        dates: item.dates,
        description: item.description
      }))
    );
    setEducationItems(
      (profileQuery.data?.education ?? []).map((item) => ({
        degree: item.degree,
        institution: item.institution,
        year: item.year,
        grade: item.grade ?? ""
      }))
    );
    setCertificationItems(
      (profileQuery.data?.certifications ?? []).map((item) => ({
        name: item.name,
        credentialId: item.credentialId,
        link: item.link ?? ""
      }))
    );
    setCareerGoalItems(
      (profileQuery.data?.careerGoals ?? []).map((item) => ({
        title: item.title,
        description: item.description ?? ""
      }))
    );
    setSocialLinkItems(
      (profileQuery.data?.socialLinks ?? []).map((item) => ({
        platform: item.platform,
        url: item.url
      }))
    );
  }, [profile, skills, profileQuery.data]);

  const summaryProfile = useMemo(() => {
    const initialSource = profile?.avatarInitials?.trim()
      || profile?.displayName?.trim()
      || profileQuery.data?.user?.username?.trim()
      || "U";
    const initials = initialSource
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || initialSource.slice(0, 2).toUpperCase();

    return {
      displayName: profile?.displayName?.trim() || "Not set",
      avatarUrl: profile?.avatarUrl?.trim() || "",
      headline: profile?.headline?.trim() || "",
      bio: profile?.bio?.trim() || "No bio added yet.",
      location: profile?.location?.trim() || "Not set",
      contactEmail: profile?.contactEmail?.trim() || "Not set",
      avatarInitials: initials,
      resumeUrl: profile?.resumeUrl?.trim() || "",
      levelBadge: profile?.levelBadge?.trim() || "",
      graduateBadge: profile?.graduateBadge?.trim() || "",
      rewardLeague: profile?.rewardLeague?.trim() || "No rewards yet",
      rewardRank: profile?.rewardRank ?? 0,
      rewardPoints: profile?.rewardPoints ?? 0,
      completionPercent: profile?.completionPercent ?? 0
    };
  }, [profile, profileQuery.data?.user?.username]);

  const handleSave = () => {
    const parsedSkills = skillsInput
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean)
      .map((name, index) => ({ name, order: index }));

    updateMutation.mutate({
      profile: {
        displayName: formProfile.displayName,
        avatarUrl: formProfile.avatarUrl,
        headline: formProfile.headline,
        bio: formProfile.bio,
        location: formProfile.location,
        contactEmail: formProfile.contactEmail,
        avatarInitials: formProfile.avatarInitials,
        resumeUrl: formProfile.resumeUrl,
        levelBadge: formProfile.levelBadge,
        graduateBadge: formProfile.graduateBadge,
        rewardLeague: formProfile.rewardLeague,
        rewardRank: formProfile.rewardRank,
        rewardPoints: formProfile.rewardPoints,
        completionPercent: formProfile.completionPercent
      },
      skills: parsedSkills,
      experience: experienceItems.map((item, index) => ({ ...item, order: index })),
      education: educationItems.map((item, index) => ({ ...item, order: index })),
      certifications: certificationItems.map((item, index) => ({ ...item, order: index })),
      careerGoals: careerGoalItems.map((item, index) => ({ ...item, order: index })),
      socialLinks: socialLinkItems.map((item, index) => ({ ...item, order: index }))
    });
  };

  if (!username) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Sign in with your email to load your profile data.
            </p>
            <Link to="/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profileQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (profileQuery.error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-destructive">
          {profileQuery.error instanceof Error ? profileQuery.error.message : "Unable to load profile"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {isEditing && (
              <Card className="animate-fade-in-up stagger-1">
                <CardHeader>
                  <CardTitle className="text-base">Edit Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display name</Label>
                      <Input
                        id="displayName"
                        value={formProfile.displayName}
                        onChange={(event) =>
                          setFormProfile((prev) => ({ ...prev, displayName: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="headline">Headline</Label>
                      <Input
                        id="headline"
                        value={formProfile.headline}
                        onChange={(event) =>
                          setFormProfile((prev) => ({ ...prev, headline: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formProfile.location}
                        onChange={(event) =>
                          setFormProfile((prev) => ({ ...prev, location: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formProfile.contactEmail}
                        onChange={(event) =>
                          setFormProfile((prev) => ({ ...prev, contactEmail: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="photoFile">Profile photo</Label>
                      <Input
                        id="photoFile"
                        type="file"
                        accept="image/*"
                        onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={handleUploadPhoto}>
                        Upload photo
                      </Button>
                      {photoMessage && (
                        <p className="text-xs text-muted-foreground">{photoMessage}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avatarInitials">Avatar initials</Label>
                      <Input
                        id="avatarInitials"
                        value={formProfile.avatarInitials}
                        onChange={(event) =>
                          setFormProfile((prev) => ({ ...prev, avatarInitials: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rewardLeague">Reward league</Label>
                      <Input
                        id="rewardLeague"
                        value={formProfile.rewardLeague}
                        onChange={(event) =>
                          setFormProfile((prev) => ({ ...prev, rewardLeague: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="resumeUrl">Resume URL</Label>
                      <Input
                        id="resumeUrl"
                        value={formProfile.resumeUrl}
                        onChange={(event) =>
                          setFormProfile((prev) => ({ ...prev, resumeUrl: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="resumeFile">Resume file (PDF/DOC/DOCX)</Label>
                      <Input
                        id="resumeFile"
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={handleUploadResume}>
                        Upload resume
                      </Button>
                      {resumeMessage && (
                        <p className="text-xs text-muted-foreground">{resumeMessage}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rewardRank">Reward rank</Label>
                      <Input
                        id="rewardRank"
                        type="number"
                        min={0}
                        value={formProfile.rewardRank}
                        onChange={(event) =>
                          setFormProfile((prev) => ({ ...prev, rewardRank: Number(event.target.value) || 0 }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rewardPoints">Reward points</Label>
                      <Input
                        id="rewardPoints"
                        type="number"
                        min={0}
                        value={formProfile.rewardPoints}
                        onChange={(event) =>
                          setFormProfile((prev) => ({ ...prev, rewardPoints: Number(event.target.value) || 0 }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="completionPercent">Completion %</Label>
                      <Input
                        id="completionPercent"
                        type="number"
                        min={0}
                        max={100}
                        value={formProfile.completionPercent}
                        onChange={(event) =>
                          setFormProfile((prev) => ({ ...prev, completionPercent: Math.max(0, Math.min(100, Number(event.target.value) || 0)) }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <div className="flex justify-end">
                      <Button type="button" variant="outline" size="sm" onClick={handleGenerateBio}>
                        <WandSparkles className="h-3.5 w-3.5 mr-1" /> Generate AI Summary
                      </Button>
                    </div>
                    <Textarea
                      id="bio"
                      value={formProfile.bio}
                      onChange={(event) => setFormProfile((prev) => ({ ...prev, bio: event.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skills">Skills (comma separated)</Label>
                    <Input
                      id="skills"
                      value={skillsInput}
                      onChange={(event) => setSkillsInput(event.target.value)}
                      placeholder="React, TypeScript, Node.js"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Experience</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setExperienceItems((prev) => [
                            ...prev,
                            { title: "", company: "", location: "", dates: "", description: "" }
                          ])
                        }
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                    {experienceItems.map((item, index) => (
                      <div key={index} className="rounded-lg border border-border/60 p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">Item {index + 1}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setExperienceItems((prev) => prev.filter((_, i) => i !== index))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            placeholder="Title"
                            value={item.title}
                            onChange={(event) =>
                              setExperienceItems((prev) =>
                                prev.map((entry, i) =>
                                  i === index ? { ...entry, title: event.target.value } : entry
                                )
                              )
                            }
                          />
                          <Input
                            placeholder="Company"
                            value={item.company}
                            onChange={(event) =>
                              setExperienceItems((prev) =>
                                prev.map((entry, i) =>
                                  i === index ? { ...entry, company: event.target.value } : entry
                                )
                              )
                            }
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            placeholder="Location"
                            value={item.location}
                            onChange={(event) =>
                              setExperienceItems((prev) =>
                                prev.map((entry, i) =>
                                  i === index ? { ...entry, location: event.target.value } : entry
                                )
                              )
                            }
                          />
                          <Input
                            placeholder="Dates"
                            value={item.dates}
                            onChange={(event) =>
                              setExperienceItems((prev) =>
                                prev.map((entry, i) =>
                                  i === index ? { ...entry, dates: event.target.value } : entry
                                )
                              )
                            }
                          />
                        </div>
                        <Textarea
                          placeholder="Description"
                          value={item.description}
                          rows={2}
                          onChange={(event) =>
                            setExperienceItems((prev) =>
                              prev.map((entry, i) =>
                                i === index ? { ...entry, description: event.target.value } : entry
                              )
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Education</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setEducationItems((prev) => [
                            ...prev,
                            { degree: "", institution: "", year: "", grade: "" }
                          ])
                        }
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                    {educationItems.map((item, index) => (
                      <div key={index} className="rounded-lg border border-border/60 p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">Item {index + 1}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEducationItems((prev) => prev.filter((_, i) => i !== index))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            placeholder="Degree"
                            value={item.degree}
                            onChange={(event) =>
                              setEducationItems((prev) =>
                                prev.map((entry, i) =>
                                  i === index ? { ...entry, degree: event.target.value } : entry
                                )
                              )
                            }
                          />
                          <Input
                            placeholder="Institution"
                            value={item.institution}
                            onChange={(event) =>
                              setEducationItems((prev) =>
                                prev.map((entry, i) =>
                                  i === index ? { ...entry, institution: event.target.value } : entry
                                )
                              )
                            }
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            placeholder="Year"
                            value={item.year}
                            onChange={(event) =>
                              setEducationItems((prev) =>
                                prev.map((entry, i) =>
                                  i === index ? { ...entry, year: event.target.value } : entry
                                )
                              )
                            }
                          />
                          <Input
                            placeholder="Grade"
                            value={item.grade ?? ""}
                            onChange={(event) =>
                              setEducationItems((prev) =>
                                prev.map((entry, i) =>
                                  i === index ? { ...entry, grade: event.target.value } : entry
                                )
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Certifications</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCertificationItems((prev) => [
                            ...prev,
                            { name: "", credentialId: "", link: "" }
                          ])
                        }
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                    {certificationItems.map((item, index) => (
                      <div key={index} className="rounded-lg border border-border/60 p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">Item {index + 1}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setCertificationItems((prev) => prev.filter((_, i) => i !== index))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            placeholder="Name"
                            value={item.name}
                            onChange={(event) =>
                              setCertificationItems((prev) =>
                                prev.map((entry, i) =>
                                  i === index ? { ...entry, name: event.target.value } : entry
                                )
                              )
                            }
                          />
                          <Input
                            placeholder="Credential ID"
                            value={item.credentialId}
                            onChange={(event) =>
                              setCertificationItems((prev) =>
                                prev.map((entry, i) =>
                                  i === index ? { ...entry, credentialId: event.target.value } : entry
                                )
                              )
                            }
                          />
                        </div>
                        <Input
                          placeholder="Link (optional)"
                          value={item.link ?? ""}
                          onChange={(event) =>
                            setCertificationItems((prev) =>
                              prev.map((entry, i) =>
                                i === index ? { ...entry, link: event.target.value } : entry
                              )
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Additional Details</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSocialLinkItems((prev) => [
                            ...prev,
                            { platform: "", url: "" }
                          ])
                        }
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Link
                      </Button>
                    </div>
                    {socialLinkItems.map((item, index) => (
                      <div key={index} className="rounded-lg border border-border/60 p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">Link {index + 1}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSocialLinkItems((prev) => prev.filter((_, i) => i !== index))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            placeholder="Platform (LinkedIn, GitHub...)"
                            value={item.platform}
                            onChange={(event) =>
                              setSocialLinkItems((prev) =>
                                prev.map((entry, i) => (i === index ? { ...entry, platform: event.target.value } : entry))
                              )
                            }
                          />
                          <Input
                            placeholder="URL"
                            value={item.url}
                            onChange={(event) =>
                              setSocialLinkItems((prev) =>
                                prev.map((entry, i) => (i === index ? { ...entry, url: event.target.value } : entry))
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Career goals</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCareerGoalItems((prev) => [
                            ...prev,
                            { title: "", description: "" }
                          ])
                        }
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                    {careerGoalItems.map((item, index) => (
                      <div key={index} className="rounded-lg border border-border/60 p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">Item {index + 1}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setCareerGoalItems((prev) => prev.filter((_, i) => i !== index))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Goal title"
                          value={item.title}
                          onChange={(event) =>
                            setCareerGoalItems((prev) =>
                              prev.map((entry, i) =>
                                i === index ? { ...entry, title: event.target.value } : entry
                              )
                            )
                          }
                        />
                        <Textarea
                          placeholder="Description (optional)"
                          value={item.description ?? ""}
                          rows={2}
                          onChange={(event) =>
                            setCareerGoalItems((prev) =>
                              prev.map((entry, i) =>
                                i === index ? { ...entry, description: event.target.value } : entry
                              )
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleSave} disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? "Saving..." : "Save changes"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    {updateMutation.isError && (
                      <span className="text-sm text-destructive">
                        {updateMutation.error instanceof Error ? updateMutation.error.message : "Unable to save"}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Profile Header */}
            <Card className="animate-fade-in-up stagger-1">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <Avatar className="h-20 w-20 flex-shrink-0">
                    {summaryProfile.avatarUrl && <AvatarImage src={summaryProfile.avatarUrl} alt="Profile photo" />}
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                      {summaryProfile.avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl font-bold text-foreground">{summaryProfile.displayName}</h1>
                      {summaryProfile.levelBadge && (
                        <Badge variant="secondary" className="text-xs">{summaryProfile.levelBadge}</Badge>
                      )}
                      {summaryProfile.graduateBadge && (
                        <Badge className="bg-accent text-accent-foreground border-0 text-xs">{summaryProfile.graduateBadge}</Badge>
                      )}
                    </div>
                    {summaryProfile.headline && (
                      <p className="mt-1 text-sm text-muted-foreground">{summaryProfile.headline}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {summaryProfile.location}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {summaryProfile.bio}
                    </p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" /> {summaryProfile.contactEmail}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      {summaryProfile.resumeUrl ? (
                        <Button size="sm" variant="outline" className="mt-0" asChild>
                          <a href={summaryProfile.resumeUrl} target="_blank" rel="noreferrer">
                            <Download className="h-3.5 w-3.5 mr-1" /> Download Resume
                          </a>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="mt-0" disabled>
                          <Download className="h-3.5 w-3.5 mr-1" /> Download Resume
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setIsEditing((prev) => !prev)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> {isEditing ? "Close" : "Edit"}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={handleLogout}>
                        Logout
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="animate-fade-in-up stagger-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {skills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No skills added yet.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        placeholder="Endorser email"
                        value={endorserEmail}
                        onChange={(event) => setEndorserEmail(event.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <div key={skill.id} className="flex items-center gap-2 rounded-md border border-border/60 px-2.5 py-1.5">
                        <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium cursor-default">
                          {skill.name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {endorsementCounts[skill.id] ?? skill.endorsementsCount} endorsements
                        </span>
                        <Button size="sm" variant="outline" onClick={() => handleEndorse(skill.id)}>
                          Endorse
                        </Button>
                      </div>
                    ))}
                    </div>
                    {endorsementMessage && (
                      <p className="text-xs text-muted-foreground">{endorsementMessage}</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Experience */}
            <Card className="animate-fade-in-up stagger-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" /> Work Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {experience.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No experience added yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 space-y-2">
                      {experience.map((exp, i) => (
                        <button
                          key={`${exp.title}-${i}`}
                          type="button"
                          onClick={() => setActiveExperienceIndex(i)}
                          className={`w-full text-left rounded-md border px-3 py-2 transition-colors ${
                            activeExperienceIndex === i
                              ? "border-primary bg-accent/50"
                              : "border-border/60 hover:bg-accent/30"
                          }`}
                        >
                          <p className="text-xs text-muted-foreground">{exp.dates}</p>
                          <p className="text-sm font-medium text-foreground truncate">{exp.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{exp.company}</p>
                        </button>
                      ))}
                    </div>
                    <div className="md:col-span-2 rounded-lg border border-border/60 p-4">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Briefcase className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">{experience[activeExperienceIndex]?.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {experience[activeExperienceIndex]?.company} · {experience[activeExperienceIndex]?.location}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{experience[activeExperienceIndex]?.dates}</p>
                          <p className="text-xs text-muted-foreground mt-1">{experience[activeExperienceIndex]?.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Education */}
            <Card className="animate-fade-in-up stagger-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" /> Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                {education.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No education added yet.</p>
                ) : (
                  education.map((edu, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                        <GraduationCap className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">{edu.degree}</h3>
                        <p className="text-xs text-muted-foreground">{edu.institution}</p>
                        <p className="text-xs text-muted-foreground">{edu.year}{edu.grade ? ` · ${edu.grade}` : ""}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card className="animate-fade-in-up stagger-5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-primary" /> Certifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {certifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No certifications added yet.</p>
                ) : (
                  certifications.map((cert, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileCheck className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-sm">{cert.name}</h3>
                        <p className="text-xs text-muted-foreground">ID: {cert.credentialId}</p>
                      </div>
                      {cert.link && (
                        <a href={cert.link} className="text-primary hover:underline">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Rewards */}
            <Card className="animate-fade-in-up stagger-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" /> Rewards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center p-4 rounded-xl bg-accent/50">
                  <div className="text-3xl mb-1">🥉</div>
                  <p className="font-semibold text-foreground text-sm">{summaryProfile.rewardLeague}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rank</span>
                  <span className="font-semibold text-foreground">
                    {summaryProfile.rewardRank > 0 ? `#${summaryProfile.rewardRank}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Points</span>
                  <span className="font-semibold text-foreground">
                    {summaryProfile.rewardPoints > 0 ? summaryProfile.rewardPoints.toLocaleString() : "—"}
                  </span>
                </div>
                <a href="#" className="block text-center text-sm text-primary hover:underline font-medium">
                  View My Rewards
                </a>
              </CardContent>
            </Card>

            {/* Career Goals */}
            <Card className="animate-fade-in-up stagger-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" /> Career Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {careerGoals.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">No career goals yet.</p>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>+ Add Career Goal</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {careerGoals.map((goal, index) => (
                      <div key={index} className="rounded-lg border border-border/60 p-3">
                        <p className="text-sm font-semibold text-foreground">{goal.title}</p>
                        {goal.description && (
                          <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card className="animate-fade-in-up stagger-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Additional Details</CardTitle>
              </CardHeader>
              <CardContent>
                {socialLinks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No additional links added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {socialLinks.map((item, index) => (
                      <div key={index} className="rounded-lg border border-border/60 p-3">
                        <p className="text-sm font-semibold text-foreground">{item.platform}</p>
                        <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline break-all">
                          {item.url}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile Completion */}
            <Card className="animate-fade-in-up stagger-5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Profile Completion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-semibold text-primary">{summaryProfile.completionPercent}%</span>
                </div>
                <Progress value={summaryProfile.completionPercent} className="h-2" />
                <p className="text-xs text-muted-foreground">Great job! Your profile is complete.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
