/**
 * Клиентское сжатие изображений через canvas.
 * Критично для in-app браузеров мессенджеров (МАКС, Telegram, WhatsApp),
 * которые "вылетают" при обработке тяжёлых фото (10-15 МБ с камеры телефона).
 *
 * Сжимает до ~1 МБ, что стабильно работает в любом мобильном браузере.
 */

export function isImageUrl(url) {
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(url);
}

function loadImage(file) {
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
 * @param {File} file — исходный файл
 * @param {number} maxDimension — максимальная сторона в px (по умолч. 1600)
 * @param {number} quality — качество JPEG 0-1 (по умолч. 0.72)
 * @returns {Promise<File>} — сжатый файл или исходный
 */
export async function compressImage(file, maxDimension = 1600, quality = 0.72) {
  // Не-изображения не сжимаем
  if (!file.type || !file.type.startsWith('image/')) return file;
  // HEIC/HEIF (iPhone) canvas не декодирует — пропускаем как есть
  if (file.type === 'image/heic' || file.type === 'image/heif') return file;
  // SVG не сжимаем
  if (file.type === 'image/svg+xml') return file;
  // Маленькие файлы (< 1.5 МБ) не сжимаем
  if (file.size < 1.5 * 1024 * 1024) return file;

  try {
    const img = await loadImage(file);
    let { naturalWidth: width, naturalHeight: height } = img;

    // Пропорциональное уменьшение
    if (width > maxDimension || height > maxDimension) {
      const ratio = Math.min(maxDimension / width, maxDimension / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    // Белый фон для прозрачных PNG (чтобы не было чёрного)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    return await new Promise((resolve) => {
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
  } catch (e) {
    // Любая ошибка сжатия — возвращаем оригинал, загрузка не должна прерываться
    return file;
  }
}