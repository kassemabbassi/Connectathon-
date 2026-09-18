import { imageSourceToFile, type CariesDetection } from "./detectionApi";
import type { PatientForm, SavedScreening, ScreeningPhoto } from "../pages/screeningTypes";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

class ScreeningApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ScreeningApiError";
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

async function authorizedJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (init?.method && !["GET", "HEAD"].includes(init.method)) headers.set("X-CSRF-Token", csrfToken());

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  if (!response.ok) {
    throw new ScreeningApiError(response.status, await parseError(response));
  }
  return (await response.json()) as T;
}

export async function saveScreening(input: {
  patient: PatientForm;
  photos: ScreeningPhoto[];
  notes: string;
  result: string;
  flaggedAreas: number;
  guardianConsentConfirmed: boolean;
}): Promise<SavedScreening> {
  const formData = new FormData();
  formData.append("patient_code", input.patient.code);
  formData.append("guardian_consent_confirmed", String(input.guardianConsentConfirmed));
  formData.append("notes", input.notes);
  formData.append("result", input.result);
  formData.append("flagged_areas", String(input.flaggedAreas));

  const detections: Record<string, CariesDetection[]> = {};
  for (const photo of input.photos) {
    detections[photo.angle] = photo.detections ?? [];
    formData.append("files", await imageSourceToFile(photo.image, `${photo.angle}.jpg`));
  }
  formData.append("detections_json", JSON.stringify(detections));

  const response = await fetch(`${API_BASE_URL}/screenings`, {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken(),
    },
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    throw new ScreeningApiError(response.status, await parseError(response));
  }
  return (await response.json()) as SavedScreening;
}

export async function listScreenings(): Promise<SavedScreening[]> {
  return authorizedJson<SavedScreening[]>("/screenings");
}

export async function updateScreeningNotes(
  screeningId: string,
  notes: string,
): Promise<SavedScreening> {
  return authorizedJson<SavedScreening>(`/screenings/${screeningId}/notes`, {
    method: "PATCH",
    body: JSON.stringify({ notes }),
  });
}

export async function updateScreeningValidation(
  screeningId: string,
  validatedAngles: string[],
): Promise<SavedScreening> {
  return authorizedJson<SavedScreening>(`/screenings/${screeningId}/validation`, {
    method: "PATCH",
    body: JSON.stringify({ validated_angles: validatedAngles }),
  });
}

export async function deleteScreening(screeningId: string): Promise<void> {
  await authorizedJson<{ deleted: boolean }>(`/screenings/${screeningId}`, {
    method: "DELETE",
  });
}

export async function completeFileValidation(screeningId: string): Promise<SavedScreening> {
  return authorizedJson<SavedScreening>(`/screenings/${screeningId}/file-validation`, {
    method: "PATCH",
  });
}

export { ScreeningApiError };
