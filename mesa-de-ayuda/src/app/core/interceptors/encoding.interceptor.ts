import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';

const MOJIBAKE_PATTERN = /[ÃÂâ]/;
const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

/**
 * Repara texto mojibake en respuestas JSON cuando el backend entrega UTF-8
 * pero algún tramo lo interpreta como ISO-8859-1/Windows-1252.
 */
export const encodingInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map(event => {
      if (event instanceof HttpResponse && event.body) {
        return event.clone({ body: repairEncoding(event.body) });
      }
      return event;
    })
  );
};

function repairEncoding(value: unknown): unknown {
  if (typeof value === 'string') {
    return repairMojibake(value);
  }

  if (Array.isArray(value)) {
    return value.map(item => repairEncoding(item));
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      result[key] = repairEncoding(nestedValue);
    }
    return result;
  }

  return value;
}

function repairMojibake(text: string): string {
  if (!MOJIBAKE_PATTERN.test(text)) {
    return text;
  }

  const bytes = new Uint8Array(text.length);
  for (let index = 0; index < text.length; index++) {
    const codePoint = text.charCodeAt(index);

    if (codePoint > 0xff) {
      return text;
    }

    bytes[index] = codePoint;
  }

  try {
    const decoded = utf8Decoder.decode(bytes);
    return decoded.includes('\uFFFD') ? text : decoded;
  } catch {
    return text;
  }
}
