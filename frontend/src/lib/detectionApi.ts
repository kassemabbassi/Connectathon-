export type CariesDetection = {
  label: "caries" | "cavity";
  confidence: number;
  // normalized coordinates (0 to 1), relative to image width/height
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DetectionResponse = {
  detections: CariesDetection[];
  image_width: number;
  image_height: number;
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/**
 * Converts a data URL (e.g. from FileReader or the camera capture)
 * back into a Blob/File so it can be sent as multipart form data.
 */
export function dataUrlToFile(dataUrl: string, fileName = "capture.jpg"): File {
  const [meta, base64] = dataUrl.split(",");
  const mimeMatch = meta.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], fileName, { type: mime });
}

/**
 * Converts a data URL or an asset URL into a File for multipart upload.
 */
export async function imageSourceToFile(image: string, fileName = "capture.jpg"): Promise<File> {
  if (image.startsWith("data:")) {
    return dataUrlToFile(image, fileName);
  }

  const response = await fetch(image);
  if (!response.ok) {
    throw new Error("Unable to read the screening image.");
  }
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || "image/jpeg" });
}

/**
 * Sends an image (as a data URL or asset URL) to the backend for caries detection.
 * Throws if the backend is unreachable or returns an error — callers
 * should catch this and fall back to the offline demo path.
 */
export async function detectCaries(imageDataUrl: string, token: string): Promise<DetectionResponse> {
  const file = await imageSourceToFile(imageDataUrl);
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/detect`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Detection API returned ${response.status}`);
  }

  const result = (await response.json()) as DetectionResponse;
  if (!Array.isArray(result.detections)) {
    throw new Error("Detection API returned an invalid response.");
  }

  return result;
}