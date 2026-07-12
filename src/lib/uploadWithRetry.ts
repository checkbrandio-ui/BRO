const API_URL = import.meta.env.VITE_API_URL || 'https://api.bro-crm.ru';
const TOKEN_KEY = 'base44_access_token';

/**
 * Загрузка файла на наш бэкенд с автоматическими повторными попытками.
 */
export async function uploadWithRetry(file: File, maxRetries = 3): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem(TOKEN_KEY);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      return json.data.file_url as string;
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
