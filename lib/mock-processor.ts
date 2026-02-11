import { HideMode } from "@/types/face-hider";

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load the target image."));
    };

    image.src = objectUrl;
  });
}

function applyPixelation(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const blockSize = Math.max(8, Math.floor(Math.min(width, height) / 15));
  const imageData = ctx.getImageData(x, y, width, height);
  const { data } = imageData;

  for (let row = 0; row < height; row += blockSize) {
    for (let col = 0; col < width; col += blockSize) {
      const index = (row * width + col) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3] / 255;

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      ctx.fillRect(x + col, y + row, blockSize, blockSize);
    }
  }
}

function applyBlur(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const regionCanvas = document.createElement("canvas");
  regionCanvas.width = width;
  regionCanvas.height = height;
  const regionCtx = regionCanvas.getContext("2d");

  if (!regionCtx) {
    return;
  }

  regionCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);

  ctx.save();
  ctx.filter = "blur(14px)";
  ctx.drawImage(regionCanvas, x, y, width, height);
  ctx.restore();

  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  ctx.fillRect(x, y, width, height);
}

function applyBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
  ctx.fillRect(x, y, width, height);
}

function drawWatermark(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
): void {
  const fontSize = Math.max(16, Math.round(canvasWidth * 0.024));
  ctx.save();
  ctx.font = `700 ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
  ctx.lineWidth = 2;
  const text = "MOCK RESULT";
  const x = canvasWidth - 16;
  const y = canvasHeight - 18;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawMaskOutline(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  ctx.save();
  ctx.setLineDash([8, 6]);
  ctx.lineWidth = Math.max(2, Math.floor(Math.min(width, height) * 0.02));
  ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
}

export async function generateMockResult(
  targetFile: File,
  mode: HideMode
): Promise<string> {
  const source = await loadImageFromFile(targetFile);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context is unavailable in this browser.");
  }

  const maxDimension = 1800;
  const scale = Math.min(1, maxDimension / Math.max(source.width, source.height));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(source, 0, 0, width, height);

  const maskWidth = Math.max(64, Math.round(width * 0.3));
  const maskHeight = Math.max(64, Math.round(height * 0.26));
  const maskX = Math.round((width - maskWidth) / 2);
  const maskY = Math.round((height - maskHeight) / 2);

  if (mode === "pixelate") {
    applyPixelation(ctx, maskX, maskY, maskWidth, maskHeight);
  } else if (mode === "blur") {
    applyBlur(ctx, canvas, maskX, maskY, maskWidth, maskHeight);
  } else {
    applyBox(ctx, maskX, maskY, maskWidth, maskHeight);
  }

  drawMaskOutline(ctx, maskX, maskY, maskWidth, maskHeight);
  drawWatermark(ctx, width, height);

  return canvas.toDataURL("image/png");
}
