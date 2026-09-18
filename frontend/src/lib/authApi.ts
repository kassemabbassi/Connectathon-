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
  access_token: string;
  token_type: "bearer";
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

async function request<T>(path: string, init?: RequestInit, token?: string | null): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new AuthApiError(response.status, await parseError(response));
  }

  return (await response.json()) as T;
}

export async function fetchInstitutions(token: string): Promise<Institution[]> {
  return request<Institution[]>("/institutions", undefined, token);
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

export async function createInstitution(token: string, name: string): Promise<Institution> {
  return request<Institution>(
    "/admin/institutions",
    {
      method: "POST",
      body: JSON.stringify({ name }),
    },
    token,
  );
}

export async function fetchAdminUsers(token: string): Promise<AuthUser[]> {
  return request<AuthUser[]>("/admin/users", undefined, token);
}

export async function createUserAccount(token: string, payload: CreateUserPayload): Promise<{ message: string; user: AuthUser }> {
  return request<{ message: string; user: AuthUser }>(
    "/admin/users",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  return request<AuthUser>("/auth/me", undefined, token);
}

export { AuthApiError };
