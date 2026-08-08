import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import type { ZodError } from 'zod';

/** Единый конверт ответа демо-API — совпадает с типом ApiResponse<T> на клиенте. */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiResponse<T>>({ ok: true, data }, init);
}

export function fail(code: string, message: string, status = 400, details?: Record<string, string[]>) {
  return NextResponse.json<ApiResponse<never>>(
    { ok: false, error: { code, message, details } },
    { status },
  );
}

export function failFromZod(error: ZodError) {
  const details: Record<string, string[]> = {};
  error.issues.forEach((issue) => {
    const key = issue.path.join('.') || 'form';
    (details[key] ||= []).push(issue.message);
  });
  return fail('VALIDATION_ERROR', 'Проверьте правильность заполнения полей', 422, details);
}

export function notFound(message = 'Не найдено') {
  return fail('NOT_FOUND', message, 404);
}
