export class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const ADMIN_TOKEN_STORAGE_KEY = 'mk_admin_session_token';

export function getStoredAdminToken(): string | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) : null;
  } catch {
    return null;
  }
}

export function setStoredAdminToken(token: string | null): void {
  try {
    if (typeof window === 'undefined') return;
    if (token) {
      window.sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage restriction
  }
}

let unauthorizedHandler: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export async function adminFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getStoredAdminToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    setStoredAdminToken(null);
    unauthorizedHandler?.();
    const errBody = await res.json().catch(() => ({}));
    throw new AdminApiError(
      (errBody as { error?: string }).error || 'Administrator session expired. Please sign in again.',
      401
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AdminApiError(
      (data as { error?: string }).error || `Request failed (${res.status})`,
      res.status
    );
  }

  return data as T;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Unable to read image file.'));
      }
    };
    reader.onerror = () => reject(new Error('Unable to read image file.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadAdminImage(file: File): Promise<string> {
  if (file.size > 3 * 1024 * 1024) {
    throw new Error('Image size must be 3 MB or less.');
  }
  const dataUrl = await readFileAsDataUrl(file);
  const res = await adminFetch<{ url: string }>('/api/admin/upload', {
    method: 'POST',
    body: JSON.stringify({ filename: file.name, dataUrl }),
  });
  return res.url;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
