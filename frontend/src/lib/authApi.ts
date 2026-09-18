export type UserRole = "staff" | "dentist" | "admin";
export type UserStatus = "pending" | "active" | "rejected" | "suspended";

export type Institution = {
  id: string;
  name: string;
  status?: string;
};

export type AuthUser = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  institution_id: string;
  status: UserStatus;
  institution_name?: string;
};

export type LoginResponse = {
  user: AuthUser;
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

class AuthApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: string | { msg?: string }[] };
    if (typeof payload.detail === "string") return payload.detail;
    if (Array.isArray(payload.detail) && payload.detail[0]?.msg) {
      return payload.detail[0].msg;
    }
  } catch {
    // Fall back to generic message below.
  }
  return "An unexpected error occurred. Please try again.";
}

function csrfToken() {
  return document.cookie.split("; ").find((item) => item.startsWith("dentalscreen_csrf="))?.split("=")[1] ?? "";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (init?.method && !["GET", "HEAD"].includes(init.method)) {
    headers.set("X-CSRF-Token", csrfToken());
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    throw new AuthApiError(response.status, await parseError(response));
  }

  return (await response.json()) as T;
}

export async function fetchInstitutions(): Promise<Institution[]> {
  return request<Institution[]>("/institutions");
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export type CreateUserPayload = {
  full_name: string;
  email: string;
  password: string;
  role: "staff" | "dentist";
  institution_id: string;
};

export async function createInstitution(name: string): Promise<Institution> {
  return request<Institution>(
    "/admin/institutions",
    {
      method: "POST",
      body: JSON.stringify({ name }),
    },
  );
}

export async function fetchAdminUsers(): Promise<AuthUser[]> {
  return request<AuthUser[]>("/admin/users");
}

export async function createUserAccount(payload: CreateUserPayload): Promise<{ message: string; user: AuthUser }> {
  return request<{ message: string; user: AuthUser }>(
    "/admin/users",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  return request<AuthUser>("/auth/me");
}

export async function logout(): Promise<void> {
  await request<{ ok: boolean }>("/auth/logout", { method: "POST" });
}

export { AuthApiError };
