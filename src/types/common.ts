/**
 * Базовые примитивы домена.
 * Все сущности наследуют ID/таймстемпы — это упростит переход на Prisma:
 * поля 1-в-1 ложатся на колонки таблиц.
 */

export type ID = string;

/** ISO-8601 строка. Храним даты строками, чтобы сериализация RSC/JSON была прозрачной. */
export type ISODateString = string;

/** Валюта в минорных единицах не используем в MVP — цены в тенге, целые числа. */
export type Currency = 'KZT' | 'USD' | 'EUR';

export interface Money {
  amount: number;
  currency: Currency;
}

export interface Timestamps {
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Entity extends Timestamps {
  id: ID;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiFailure {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** Диапазон значений — используется для цен, рейтингов, вместимости. */
export interface Range {
  min: number;
  max: number;
}

/** Дни недели: 0 = воскресенье (совместимо с Date.getDay()). */
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** "HH:mm" */
export type TimeString = string;
