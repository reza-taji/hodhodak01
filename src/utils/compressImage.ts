const OUTPUT_SIZE = 256;
const DEFAULT_QUALITY = 0.82;
const DEFAULT_MAX_BYTES = 35 * 1024;
const MIN_QUALITY = 0.2;
const QUALITY_STEP = 0.08;

export type CompressedImageMimeType = 'image/webp' | 'image/jpeg';

export interface CompressImageOptions {
  mimeType?: CompressedImageMimeType;
  quality?: number;
  maxBytes?: number;
}

export class ImageCompressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageCompressionError';
  }
}

interface LoadedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

const loadImage = async (blob: Blob): Promise<LoadedImage> => {
  if (!blob.type.startsWith('image/')) {
    throw new ImageCompressionError('فایل انتخاب‌شده یک تصویر معتبر نیست.');
  }

  if ('createImageBitmap' in globalThis) {
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Some Safari versions expose createImageBitmap but reject certain image formats.
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  const image = new Image();
  image.decoding = 'async';
  image.src = objectUrl;

  try {
    await image.decode();
  } catch {
    URL.revokeObjectURL(objectUrl);
    throw new ImageCompressionError('خواندن تصویر ممکن نیست؛ لطفاً فایل دیگری انتخاب کنید.');
  }

  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    cleanup: () => URL.revokeObjectURL(objectUrl),
  };
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  mimeType: CompressedImageMimeType,
  quality: number,
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new ImageCompressionError('مرورگر نتوانست تصویر را فشرده کند.'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new ImageCompressionError('تبدیل تصویر به داده انجام نشد.'));
    reader.readAsDataURL(blob);
  });

const estimatedDataUrlBytes = (blob: Blob): number => {
  const headerLength = `data:${blob.type};base64,`.length;
  return headerLength + Math.ceil(blob.size / 3) * 4;
};

const compressCanvas = async (
  canvas: HTMLCanvasElement,
  preferredMimeType: CompressedImageMimeType,
  initialQuality: number,
  maxBytes: number,
): Promise<string> => {
  const mimeTypes: CompressedImageMimeType[] =
    preferredMimeType === 'image/webp'
      ? ['image/webp', 'image/jpeg']
      : ['image/jpeg', 'image/webp'];

  for (const mimeType of mimeTypes) {
    for (let quality = initialQuality; quality >= MIN_QUALITY; quality -= QUALITY_STEP) {
      const blob = await canvasToBlob(canvas, mimeType, Number(quality.toFixed(2)));
      if (blob.type !== mimeType) break;
      if (estimatedDataUrlBytes(blob) <= maxBytes) return blobToDataUrl(blob);
    }
  }

  throw new ImageCompressionError(
    'حجم تصویر حتی پس از فشرده‌سازی بیشتر از ۳۵ کیلوبایت است؛ تصویر ساده‌تری انتخاب کنید.',
  );
};

/**
 * Crops a camera/uploaded image from its center into a 256×256 square and
 * returns a WebP/JPEG data URL small enough for localStorage persistence.
 */
export const compressImage = async (
  input: File | Blob,
  options: CompressImageOptions = {},
): Promise<string> => {
  if (!(input instanceof Blob) || input.size === 0) {
    throw new ImageCompressionError('تصویر انتخاب‌شده خالی یا نامعتبر است.');
  }

  const preferredMimeType = options.mimeType ?? 'image/webp';
  const initialQuality = Math.min(1, Math.max(MIN_QUALITY, options.quality ?? DEFAULT_QUALITY));
  const maxBytes = Math.max(1024, options.maxBytes ?? DEFAULT_MAX_BYTES);
  const image = await loadImage(input);

  try {
    if (image.width <= 0 || image.height <= 0) {
      throw new ImageCompressionError('ابعاد تصویر معتبر نیست.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new ImageCompressionError('Canvas در این مرورگر در دسترس نیست.');

    const cropSize = Math.min(image.width, image.height);
    const sourceX = (image.width - cropSize) / 2;
    const sourceY = (image.height - cropSize) / 2;

    context.fillStyle = '#FFF8F0';
    context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(
      image.source,
      sourceX,
      sourceY,
      cropSize,
      cropSize,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    );

    return compressCanvas(canvas, preferredMimeType, initialQuality, maxBytes);
  } finally {
    image.cleanup();
  }
};

export default compressImage;
