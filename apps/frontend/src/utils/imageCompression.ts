const MAX_BYTES = 900_000; // ~0.9MB target to stay under gateway limits
const MAX_DIMENSION = 1280; // cap longest side
const QUALITY_STEPS = [0.72, 0.6, 0.5, 0.42];

function fileNameToJpeg(originalName: string): string {
  const dot = originalName.lastIndexOf('.');
  const base = dot > 0 ? originalName.slice(0, dot) : originalName;
  return `${base}.jpg`;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
  });
}

export async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.size <= MAX_BYTES) return file;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const targetWidth = Math.max(1, Math.round(img.width * scale));
  const targetHeight = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  let bestBlob: Blob | null = null;

  for (const quality of QUALITY_STEPS) {
    const blob = await canvasToBlob(canvas, quality);
    if (!blob) continue;
    if (blob.size <= MAX_BYTES) {
      return new File([blob], fileNameToJpeg(file.name), { type: 'image/jpeg', lastModified: Date.now() });
    }
    if (!bestBlob || blob.size < bestBlob.size) {
      bestBlob = blob;
    }
  }

  // If no quality met the target, use the smallest attempt if it improves size
  if (bestBlob && bestBlob.size < file.size) {
    return new File([bestBlob], fileNameToJpeg(file.name), { type: 'image/jpeg', lastModified: Date.now() });
  }

  return file;
}
