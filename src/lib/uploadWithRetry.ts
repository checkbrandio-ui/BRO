import { base44 } from '@/api/base44Client';

/**
 * Загрузка файла с автоматическими повторными попытками.
 * При сетевом сбое повторяет запрос до maxRetries раз с экспоненциальной задержкой.
 * Критично для нестабильных соединений (VPN, мобильный интернет).
 */
export async function uploadWithRetry(file: File, maxRetries = 3): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url as string;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries - 1) {
        const delay = 1000 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Клиентская валидация файла перед загрузкой.
 * Возвращает строку с ошибкой или null если файл валиден.
 */
export function validateFile(file: File, maxSizeMB = 20): string | null {
  const maxSize = maxSizeMB * 1024 * 1024;
  if (file.size > maxSize) {
    return `Файл «${file.name}» превышает ${maxSizeMB} МБ (${(file.size / 1024 / 1024).toFixed(1)} МБ)`;
  }
  if (file.name.toLowerCase().endsWith('.exe')) {
    return `Файлы .exe запрещены`;
  }
  return null;
}