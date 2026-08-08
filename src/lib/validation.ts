import { z } from 'zod';

/**
 * Схемы валидации. Одни и те же схемы используются формой (React Hook Form)
 * и демо-API — рассинхронизации между клиентом и сервером быть не может.
 */

const phoneRegex = /^\+?[0-9\s()-]{10,20}$/;

export const bookingFormSchema = z.object({
  date: z.string().min(1, 'Выберите дату'),
  time: z.string().min(1, 'Выберите время'),
  guests: z
    .number({ invalid_type_error: 'Укажите количество гостей' })
    .int('Только целое число')
    .min(1, 'Минимум 1 гость')
    .max(400, 'Для такой компании напишите нам напрямую'),
  comment: z.string().max(500, 'Не длиннее 500 символов').optional(),
  name: z
    .string()
    .min(2, 'Как к вам обращаться?')
    .max(80, 'Слишком длинное имя'),
  phone: z
    .string()
    .min(1, 'Телефон нужен для подтверждения брони')
    .regex(phoneRegex, 'Похоже, в номере опечатка'),
  email: z.string().min(1, 'Укажите email').email('Проверьте адрес почты'),
  agree: z.literal(true, {
    errorMap: () => ({ message: 'Нужно согласие с правилами бронирования' }),
  }),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

export const createBookingSchema = bookingFormSchema
  .omit({ agree: true })
  .extend({
    venueId: z.string().min(1),
    extras: z
      .array(
        z.object({
          serviceId: z.string(),
          name: z.string(),
          price: z.number().nonnegative(),
          quantity: z.number().int().positive(),
        }),
      )
      .optional(),
  });

export const paymentSchema = z.object({
  bookingId: z.string().min(1),
  method: z.enum(['card', 'apple_pay', 'google_pay', 'kaspi', 'cash_on_site']),
});

export const aiRequestSchema = z.object({
  cuisineIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
  budgetPerPerson: z.number().positive().optional(),
  guests: z.number().int().positive().max(500).optional(),
  districtIds: z.array(z.string()).optional(),
  centerOnly: z.boolean().optional(),
  dayPart: z.enum(['morning', 'lunch', 'afternoon', 'evening', 'night']).optional(),
  occasion: z
    .enum(['date', 'friends', 'family', 'business', 'celebration', 'solo'])
    .optional(),
  vibes: z
    .array(z.enum(['cozy', 'lively', 'quiet', 'premium', 'trendy', 'casual']))
    .optional(),
  mustHave: z.array(z.string()).optional(),
  freeText: z.string().max(400).optional(),
});

export const profileSchema = z.object({
  name: z.string().min(2, 'Укажите имя').max(80),
  email: z.string().email('Проверьте адрес почты'),
  phone: z.string().regex(phoneRegex, 'Похоже, в номере опечатка'),
  budgetPerPerson: z.number().int().min(1000).max(200000),
  typicalPartySize: z.number().int().min(1).max(50),
});

export type ProfileValues = z.infer<typeof profileSchema>;

export const venueEditSchema = z.object({
  name: z.string().min(2, 'Название обязательно').max(80),
  tagline: z.string().min(10, 'Добавьте продающий подзаголовок').max(120),
  description: z.string().min(40, 'Опишите заведение подробнее').max(2000),
  phone: z.string().regex(phoneRegex, 'Похоже, в номере опечатка'),
  email: z.string().email('Проверьте адрес почты'),
  address: z.string().min(5, 'Укажите адрес'),
  averagePrice: z.number().int().min(500).max(500000),
  capacity: z.number().int().min(1).max(2000),
});

export type VenueEditValues = z.infer<typeof venueEditSchema>;

export const createVenueSchema = venueEditSchema.extend({
  categoryId: z.string().min(1, 'Выберите категорию'),
  cuisineIds: z.array(z.string()).min(1, 'Выберите хотя бы одну кухню'),
  districtId: z.string().min(1, 'Выберите район'),
  amenities: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateVenueValues = z.infer<typeof createVenueSchema>;

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3, 'Добавьте заголовок').max(100),
  text: z.string().min(20, 'Расскажите подробнее — минимум 20 символов').max(2000),
});

export const mergeCreateSchema = z.object({
  hostName: z.string().min(2, 'Как вас зовут?').max(40),
  title: z.string().max(80).optional(),
});

export const mergeJoinSchema = z.object({
  code: z.string().min(4).max(8),
  name: z.string().min(2, 'Как вас зовут?').max(40),
});
