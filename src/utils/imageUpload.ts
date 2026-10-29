import { auth } from '../firebase';

/**
 * Ảnh & nhạc được lưu trên Cloudflare (Worker + KV, miễn phí) vì dự án Firebase chưa bật Storage.
 * Worker xác thực người tải bằng phiên đăng nhập Gmail (Firebase ID token).
 */
const MEDIA_WORKER = 'https://songhy-sepay.contact-media-vnn.workers.dev';

async function uploadBlob(blob: Blob, contentType: string, ext: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Vui lòng đăng nhập Gmail để tải ảnh lên.');
  const token = await user.getIdToken();
  const res = await fetch(`${MEDIA_WORKER}/upload?ext=${ext}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': contentType },
    body: blob,
  });
  let data: any = {};
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok || !data.url) throw new Error(data.message || `Tải lên thất bại (mã ${res.status}).`);
  return data.url as string;
}

/**
 * Compresses an image file on client side using HTML5 Canvas
 * Max dimension (width or height) defaults to 1600px
 * Quality defaults to 0.85 JPEG
 */
export async function compressImage(
  file: File,
  maxDimension: number = 1600,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Tệp tải lên không phải là định dạng hình ảnh hợp lệ.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Không thể tải dữ liệu ảnh vào bộ nhớ.'));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width <= 0 || height <= 0) {
          return reject(new Error('Kích thước ảnh không hợp lệ.'));
        }

        // Scale down if larger than maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Không thể khởi tạo Canvas 2D để nén ảnh.'));
        }

        // Smooth image scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Nén ảnh thất bại.'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an image and uploads it to Firebase Storage
 * Returns the public download URL
 */
export async function uploadImageToStorage(
  file: File,
  folder: string = 'invitations'
): Promise<string> {
  try {
    // 1. Compress image to max 1600px
    const compressedBlob = await compressImage(file, 1600, 0.85);

    // 2. Tải lên kho ảnh Cloudflare
    void folder;
    return await uploadBlob(compressedBlob, 'image/jpeg', 'jpg');
  } catch (err: any) {
    console.error('Firebase Storage upload error:', err);
    throw new Error(err.message || 'Lỗi khi tải ảnh lên máy chủ Firebase Storage.');
  }
}

// ==========================================
// NÉN ẢNH NHANH & TẢI NHIỀU ẢNH SONG SONG
// ==========================================

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

/**
 * Nén ảnh nhanh: giải mã bằng createImageBitmap (luồng nền của trình duyệt, tự xoay theo EXIF),
 * thu nhỏ về tối đa `maxDimension` và xuất WebP (nhẹ hơn JPEG ~30%), fallback JPEG.
 */
export async function compressImageFast(
  file: File,
  maxDimension = 1600,
  quality = 0.82
): Promise<{ blob: Blob; ext: 'webp' | 'jpg' }> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`"${file.name}" không phải là ảnh.`);
  }
  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  } catch {
    // Trình duyệt cũ: dùng đường nén cũ
    const blob = await compressImage(file, maxDimension, quality);
    return { blob, ext: 'jpg' };
  }
  const w0 = (source as ImageBitmap).width;
  const h0 = (source as ImageBitmap).height;
  const scale = Math.min(1, maxDimension / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không khởi tạo được Canvas để nén ảnh.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source as ImageBitmap, 0, 0, w, h);
  (source as ImageBitmap).close?.();

  const webp = await canvasToBlob(canvas, 'image/webp', quality);
  if (webp && webp.type === 'image/webp') return { blob: webp, ext: 'webp' };
  const jpg = await canvasToBlob(canvas, 'image/jpeg', quality);
  if (!jpg) throw new Error('Nén ảnh thất bại.');
  return { blob: jpg, ext: 'jpg' };
}

export interface BatchUploadProgress {
  done: number;
  total: number;
  failed: number;
  savedBytes: number;
}

/**
 * Tải nhiều ảnh cùng lúc: nén nhanh từng ảnh rồi upload song song (mặc định 4 luồng).
 * Trả về danh sách URL theo đúng thứ tự file đã chọn (bỏ qua file lỗi).
 */
export async function uploadImagesBatch(
  files: File[],
  folder = 'invitations',
  onProgress?: (p: BatchUploadProgress) => void,
  concurrency = 4
): Promise<{ urls: string[]; errors: string[] }> {
  const results: (string | null)[] = new Array(files.length).fill(null);
  const errors: string[] = [];
  const progress: BatchUploadProgress = { done: 0, total: files.length, failed: 0, savedBytes: 0 };
  let cursor = 0;

  const worker = async () => {
    while (cursor < files.length) {
      const index = cursor++;
      const file = files[index];
      try {
        const { blob, ext } = await compressImageFast(file);
        progress.savedBytes += Math.max(0, file.size - blob.size);
        void folder;
        results[index] = await uploadBlob(blob, ext === 'webp' ? 'image/webp' : 'image/jpeg', ext);
      } catch (err: any) {
        progress.failed++;
        errors.push(`${file.name}: ${err?.message || 'lỗi tải lên'}`);
      } finally {
        progress.done++;
        onProgress?.({ ...progress });
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, worker));
  return { urls: results.filter((u): u is string => Boolean(u)), errors };
}

/** Tải file nhạc MP3/M4A (tối đa 15MB) lên Firebase Storage. */
export async function uploadAudioToStorage(file: File, folder = 'music'): Promise<string> {
  if (!file.type.startsWith('audio/')) throw new Error('Vui lòng chọn file nhạc (MP3, M4A...).');
  if (file.size > 10 * 1024 * 1024) throw new Error('File nhạc tối đa 10MB.');
  void folder;
  const ext = (file.name.split('.').pop() || 'mp3').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'mp3';
  return uploadBlob(file, file.type || 'audio/mpeg', ext);
}
