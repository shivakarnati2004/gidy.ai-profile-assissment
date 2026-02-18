const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const TOKEN_KEY = "profile_auth_token";
const USERNAME_KEY = "profile_username";
const EMAIL_KEY = "profile_email";

type ApiError = {
  error?: string;
};

const apiFetch = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined)
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession();
    }

    let message = `Request failed with status ${response.status}`;
    try {
      const data = (await response.json()) as ApiError;
      if (data?.error) {
        message = data.error;
      }
    } catch (error) {
      // Ignore JSON parse errors
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
};

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUsername = () => localStorage.getItem(USERNAME_KEY);

export const getStoredEmail = () => localStorage.getItem(EMAIL_KEY);

export const setAuthSession = (token: string, username: string, email: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
  localStorage.setItem(EMAIL_KEY, email);
};

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(EMAIL_KEY);
};

export const requestOtp = (email: string) => {
  return apiFetch<{ message: string }>("/api/auth/request-otp", {
    method: "POST",
    body: JSON.stringify({ email })
  });
};

export const verifyOtpForSignup = (email: string, code: string) => {
  return apiFetch<{
    message: string;
    signupToken: string;
    signup: { username: string; email: string };
  }>(
    "/api/auth/verify-otp",
    {
      method: "POST",
      body: JSON.stringify({ email, code })
    }
  );
};

export const completeSignup = async (signupToken: string, password: string, username?: string) => {
  const data = await apiFetch<{ token: string; user: { username: string; email: string } }>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ signupToken, password, username })
    }
  );

  setAuthSession(data.token, data.user.username, data.user.email);
  return data;
};

export const loginWithPassword = async (email: string, password: string) => {
  const data = await apiFetch<{ token: string; user: { username: string; email: string } }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password })
    }
  );

  setAuthSession(data.token, data.user.username, data.user.email);
  return data;
};

export type ProfilePayload = {
  profile?: {
    displayName?: string;
    avatarUrl?: string;
    headline?: string;
    bio?: string;
    location?: string;
    contactEmail?: string;
    avatarInitials?: string;
    resumeUrl?: string;
    levelBadge?: string;
    graduateBadge?: string;
    rewardLeague?: string;
    rewardRank?: number;
    rewardPoints?: number;
    completionPercent?: number;
  };
  skills?: { name: string; order?: number }[];
  experience?: {
    title: string;
    company: string;
    location: string;
    dates: string;
    description: string;
    order?: number;
  }[];
  education?: {
    degree: string;
    institution: string;
    year: string;
    grade?: string;
    order?: number;
  }[];
  certifications?: {
    name: string;
    credentialId: string;
    link?: string;
    order?: number;
  }[];
  socialLinks?: { platform: string; url: string; order?: number }[];
  careerGoals?: { title: string; description?: string; order?: number }[];
};

export const fetchProfile = (username: string) => {
  return apiFetch<{
    user: { id: string; email: string; username: string };
    profile: ProfilePayload["profile"];
    skills: { id: string; name: string; order?: number; endorsementsCount: number }[];
    experience: ProfilePayload["experience"];
    education: ProfilePayload["education"];
    certifications: ProfilePayload["certifications"];
    socialLinks: ProfilePayload["socialLinks"];
    careerGoals: ProfilePayload["careerGoals"];
  }>(`/api/profile/${username}`);
};

export const updateProfile = (username: string, payload: ProfilePayload) => {
  return apiFetch<{ message: string }>(`/api/profile/${username}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
};

export const uploadProfilePhoto = async (username: string, file: File) => {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch(`${API_BASE_URL}/api/profile/${username}/photo`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = (await response.json()) as ApiError;
      if (data?.error) {
        message = data.error;
      }
    } catch (error) {
      // Ignore JSON parse errors
    }
    throw new Error(message);
  }

  return response.json() as Promise<{ avatarUrl: string }>;
};

export const uploadResumeFile = async (username: string, file: File) => {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append("resume", file);

  const response = await fetch(`${API_BASE_URL}/api/profile/${username}/resume`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = (await response.json()) as ApiError;
      if (data?.error) {
        message = data.error;
      }
    } catch (error) {
      // Ignore JSON parse errors
    }
    throw new Error(message);
  }

  return response.json() as Promise<{ resumeUrl: string }>;
};

export const endorseSkill = (skillId: string, endorserEmail: string) => {
  return apiFetch<{ id: string }>(`/api/skills/${skillId}/endorse`, {
    method: "POST",
    body: JSON.stringify({ endorserEmail })
  });
};

export const fetchSkillEndorsements = (skillId: string) => {
  return apiFetch<{ skillId: string; count: number }>(`/api/skills/${skillId}/endorsements`);
};
