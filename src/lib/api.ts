const API_BASE_URL = import.meta.env.VITE_API_URL?.trim() || (import.meta.env.PROD ? "" : "http://localhost:4000");

const TOKEN_KEY = "profile_auth_token";
const USERNAME_KEY = "profile_username";
const EMAIL_KEY = "profile_email";

const readStorage = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures (private mode / blocked storage)
  }
};

const removeStorage = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage remove failures
  }
};

type ApiError = {
  error?: string;
};

const isLikelyApiBaseMisconfigured = (path: string, status: number) => {
  if (!import.meta.env.PROD) {
    return false;
  }

  if (status !== 404) {
    return false;
  }

  if (API_BASE_URL) {
    return false;
  }

  if (typeof window === "undefined") {
    return false;
  }

  return path.startsWith("/api/") && window.location.hostname.endsWith("onrender.com");
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

    if (isLikelyApiBaseMisconfigured(path, response.status)) {
      throw new Error("API not configured. Set VITE_API_URL in Render frontend environment to your backend URL and redeploy frontend.");
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

export const getAuthToken = () => readStorage(TOKEN_KEY);

export const getStoredUsername = () => readStorage(USERNAME_KEY);

export const getStoredEmail = () => readStorage(EMAIL_KEY);

export const setAuthSession = (token: string, username: string, email: string) => {
  writeStorage(TOKEN_KEY, token);
  writeStorage(USERNAME_KEY, username);
  writeStorage(EMAIL_KEY, email);
};

export const clearAuthSession = () => {
  removeStorage(TOKEN_KEY);
  removeStorage(USERNAME_KEY);
  removeStorage(EMAIL_KEY);
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

export const endorseSkill = (skillId: string, endorserEmail: string) => {
  return apiFetch<{ id: string }>(`/api/skills/${skillId}/endorse`, {
    method: "POST",
    body: JSON.stringify({ endorserEmail })
  });
};

export const fetchSkillEndorsements = (skillId: string) => {
  return apiFetch<{ skillId: string; count: number }>(`/api/skills/${skillId}/endorsements`);
};
