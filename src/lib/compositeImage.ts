export interface CompositeOptions {
  timestamp: Date;
  latitude: number | null;
  longitude: number | null;
  userName?: string;
  companyName?: string;
  note?: string;
  fontSize: "small" | "medium" | "large";
}

const FONT_SCALE: Record<string, number> = {
  small: 0.015,
  medium: 0.02,
  large: 0.025,
};

export async function compositeImage(
  imageFile: File,
  options: CompositeOptions
): Promise<Blob> {
  const img = await loadImage(imageFile);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  // Draw the original photo
  ctx.drawImage(img, 0, 0);

  // Calculate font size
  const scale = FONT_SCALE[options.fontSize] || FONT_SCALE.medium;
  const size = Math.max(Math.round(canvas.height * scale), 14);
  const lineHeight = Math.round(size * 1.4);
  const padding = Math.round(size * 0.6);
  const leftPad = Math.round(size * 0.75);

  // Build text lines
  const lines: string[] = [];

  // Timestamp
  lines.push(formatTimestamp(options.timestamp));

  // GPS coordinates
  if (options.latitude !== null && options.longitude !== null) {
    lines.push(
      `${options.latitude.toFixed(4)}, ${options.longitude.toFixed(4)}`
    );
  } else {
    lines.push("Location unavailable");
  }

  // User / Company name
  const nameParts: string[] = [];
  if (options.userName) nameParts.push(options.userName);
  if (options.companyName) nameParts.push(options.companyName);
  if (nameParts.length > 0) {
    lines.push(nameParts.join(" — "));
  }

  // Note
  if (options.note) {
    lines.push(options.note);
  }

  // Draw overlay bar at the top
  const barHeight = padding + lines.length * lineHeight + padding;
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, canvas.width, barHeight);

  // Draw text
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textBaseline = "top";

  lines.forEach((line, i) => {
    ctx.fillText(line, leftPad, padding + i * lineHeight);
  });

  // Export as JPEG
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to export image"));
      },
      "image/jpeg",
      0.92
    );
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

function formatTimestamp(date: Date): string {
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
