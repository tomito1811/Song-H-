import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

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

    // 2. Generate unique storage path
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const sanitizedName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '-')
      .replace(/-+/g, '-');
    const storagePath = `${folder}/${timestamp}_${randomSuffix}_${sanitizedName}.jpg`;

    // 3. Upload to Firebase Storage
    const storageRef = ref(storage, storagePath);
    const metadata = {
      contentType: 'image/jpeg',
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    };

    const uploadResult = await uploadBytes(storageRef, compressedBlob, metadata);
    const downloadUrl = await getDownloadURL(uploadResult.ref);
    return downloadUrl;
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
        const base = file.name.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 40);
        const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${base || 'anh'}.${ext}`;
        const res = await uploadBytes(ref(storage, path), blob, {
          contentType: ext === 'webp' ? 'image/webp' : 'image/jpeg',
          cacheControl: 'public,max-age=31536000',
        });
        results[index] = await getDownloadURL(res.ref);
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
  if (file.size > 15 * 1024 * 1024) throw new Error('File nhạc tối đa 15MB.');
  const base = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-').replace(/-+/g, '-');
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${base}`;
  const res = await uploadBytes(ref(storage, path), file, { contentType: file.type });
  return getDownloadURL(res.ref);
}
