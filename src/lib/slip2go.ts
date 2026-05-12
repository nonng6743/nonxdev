import { logger } from '@/lib/logger';

/**
 * Slip2Go (slip2go.com) client.
 *
 * Configurable via env so you can adapt to your exact account/endpoint:
 *   SLIP2GO_API_URL        — full URL to the verify endpoint
 *                            (default: https://connect.slip2go.com/api/verify-slip/image)
 *   SLIP2GO_API_KEY        — your slip2go API key / bearer token
 *   SLIP2GO_AUTH_SCHEME    — auth header scheme (default: "Bearer")
 *                            For services using "X-API-Key", set this to "X-API-Key"
 *                            (special-cased to send as header name).
 *
 * The response parser is defensive — it tries multiple field locations
 * commonly seen in Thai slip-verification APIs (slip2go, SlipOK, EasySlip).
 */

export type SlipResult = {
  ok: true;
  amount: number;
  date: string | null;        // ISO yyyy-mm-dd
  time: string | null;        // HH:mm:ss
  ref: string | null;         // transRef / transactionRef
  sender: SlipParty;
  receiver: SlipParty;
  raw: unknown;
};

export type SlipParty = {
  name: string | null;
  bank: string | null;
  account: string | null;
};

export type SlipError = {
  ok: false;
  code: 'not_configured' | 'upstream_error' | 'parse_error';
  status?: number;
  message: string;
  raw?: unknown;
};

function getConfig() {
  return {
    url: process.env.SLIP2GO_API_URL || 'https://connect.slip2go.com/api/verify-slip/qr-image/info',
    key: process.env.SLIP2GO_API_KEY,
    scheme: process.env.SLIP2GO_AUTH_SCHEME || 'Bearer',
  };
}

/**
 * Build the Authorization header value. Accepts either:
 *   - scheme = "Bearer", key = "xxx"        →  "Bearer xxx"
 *   - scheme = "Bearer xxx", key = anything →  "Bearer xxx"  (scheme already contains token)
 *   - scheme = "X-API-Key" / "apikey"       →  handled by caller as separate header
 */
function buildAuthorizationValue(scheme: string, key: string): string {
  const s = scheme.trim();
  if (s.includes(' ')) return s; // already contains scheme + token
  return `${s} ${key}`;
}

export async function verifySlipImage(
  file: { buffer: ArrayBuffer; filename: string; mime: string },
): Promise<SlipResult | SlipError> {
  const cfg = getConfig();
  if (!cfg.key) {
    return { ok: false, code: 'not_configured', message: 'SLIP2GO_API_KEY ไม่ได้ตั้งค่า' };
  }

  const form = new FormData();
  const blob = new Blob([file.buffer], { type: file.mime || 'image/jpeg' });
  form.append('file', blob, file.filename);

  const headers: Record<string, string> = {};
  const schemeLower = cfg.scheme.trim().toLowerCase();
  if (schemeLower === 'x-api-key' || schemeLower === 'apikey') {
    headers['X-API-Key'] = cfg.key;
  } else {
    headers['Authorization'] = buildAuthorizationValue(cfg.scheme, cfg.key);
  }

  let res: Response;
  try {
    res = await fetch(cfg.url, { method: 'POST', headers, body: form });
  } catch (err) {
    logger.error('slip2go_network_error', {
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, code: 'upstream_error', message: 'เชื่อมต่อ slip2go ไม่ได้' };
  }

  let body: unknown = null;
  const contentType = res.headers.get('content-type') ?? '';
  try {
    body = contentType.includes('application/json') ? await res.json() : await res.text();
  } catch {
    body = null;
  }

  if (!res.ok) {
    logger.warn('slip2go_upstream_error', { status: res.status, body });
    return {
      ok: false,
      code: 'upstream_error',
      status: res.status,
      message:
        (typeof body === 'object' && body && 'message' in body && typeof (body as { message?: unknown }).message === 'string'
          ? (body as { message: string }).message
          : null) ?? `slip2go HTTP ${res.status}`,
      raw: body,
    };
  }

  const parsed = parseSlipResponse(body);
  if (!parsed) {
    logger.error('slip2go_parse_failed', { body });
    return { ok: false, code: 'parse_error', message: 'อ่านผลลัพธ์จาก slip2go ไม่สำเร็จ', raw: body };
  }
  return parsed;
}

/* ------------------------------ Response parsing ------------------------------ */

function parseSlipResponse(body: unknown): SlipResult | null {
  if (!body || typeof body !== 'object') return null;
  const root = body as Record<string, unknown>;

  // Common envelopes: {data: {...}}, {result: {...}}, or top-level
  const data = pickObject(root.data) ?? pickObject(root.result) ?? root;

  const amount = toNumber(
    pickFirst(data, ['amount', 'transAmount', 'total']) ??
      pickFirst(pickObject(data.transaction) ?? {}, ['amount', 'total']),
  );
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return null;

  const dateRaw = pickString(pickFirst(data, ['transDate', 'date', 'paymentDate']));
  const timeRaw = pickString(pickFirst(data, ['transTime', 'time']));
  const date = parseDate(dateRaw);
  const time = parseTime(timeRaw);
  const ref = pickString(pickFirst(data, ['transRef', 'transactionRef', 'ref', 'reference']));

  const sender = parseParty(pickObject(data.sender), {
    name: ['displayName', 'name', 'accountName'],
    bank: ['bankCode', 'bank', 'bankName'],
    account: ['accountNo', 'account', 'accountNumber'],
  });
  const receiver = parseParty(pickObject(data.receiver), {
    name: ['displayName', 'name', 'accountName'],
    bank: ['bankCode', 'bank', 'bankName'],
    account: ['accountNo', 'account', 'accountNumber'],
  });

  return {
    ok: true,
    amount,
    date,
    time,
    ref,
    sender,
    receiver,
    raw: body,
  };
}

function parseParty(obj: Record<string, unknown> | null, keys: { name: string[]; bank: string[]; account: string[] }): SlipParty {
  if (!obj) return { name: null, bank: null, account: null };
  return {
    name: pickString(pickFirst(obj, keys.name)),
    bank: pickString(pickFirst(obj, keys.bank)),
    account: pickString(pickFirst(obj, keys.account)),
  };
}

function pickFirst(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) if (obj[k] != null) return obj[k];
  return null;
}

function pickObject(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function pickString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number') return String(v);
  return null;
}

function toNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const cleaned = v.replace(/,/g, '').trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseDate(raw: string | null): string | null {
  if (!raw) return null;
  // formats: "20240115", "2024-01-15", "15/01/2024", ISO datetime
  const compact = raw.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return null;
}

function parseTime(raw: string | null): string | null {
  if (!raw) return null;
  const compact = raw.match(/^(\d{2})(\d{2})(\d{2})$/);
  if (compact) return `${compact[1]}:${compact[2]}:${compact[3]}`;
  const hms = raw.match(/^(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (hms) return `${hms[1]}:${hms[2]}:${hms[3] ?? '00'}`;
  return null;
}
