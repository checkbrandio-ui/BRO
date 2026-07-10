/**
 * Клиентское сжатие изображений через canvas.
 * Критично для in-app браузеров мессенджеров (МАКС, Telegram, WhatsApp),
 * которые "вылетают" при обработке тяжёлых фото (10-15 МБ с камеры телефона).
 *
 * Сжимает до ~1 МБ, что стабильно работает в любом мобильном браузере.
 */

export function isImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(url);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

/**
 * Сжимает изображение, если оно слишком большое.
 * Не-изображения и маленькие файлы проходят без изменений.
 */
export async function compressImage(file: File, maxDimension = 1600, quality = 0.72): Promise<File> {
  if (!file.type || !file.type.startsWith('image/')) return file;
  if (file.type === 'image/heic' || file.type === 'image/heif') return file;
  if (file.type === 'image/svg+xml') return file;
  if (file.size < 1.5 * 1024 * 1024) return file;

  try {
    const img = await loadImage(file);
    let { naturalWidth: width, naturalHeight: height } = img;

    if (width > maxDimension || height > maxDimension) {
      const ratio = Math.min(maxDimension / width, maxDimension / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    return await new Promise<File>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            const name = file.name.replace(/\.(heic|heif|png|webp|bmp|gif|tiff)$/i, '.jpg');
            resolve(new File([blob], name, { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    });
  } catch {
    return file;
  }
}