import { z } from 'zod';

/*
 * The contact and newsletter forms validate with these schemas in the browser (src/) and again in
 * the functions (api/). They live under api/ because Vercel compiles every file a function imports
 * with the nearest tsconfig.json, and only api/tsconfig.json emits the CommonJS that Node loads.
 * Keep this file free of Node APIs: the browser bundle imports it.
 */

const email = z
  .string()
  .trim()
  .min(1, 'Please enter your email address.')
  .max(254, 'This email address is too long.')
  .email('Please enter a valid email address.');

/** The honeypot. It is hidden from readers, so only bots fill it in. */
const website = z.string().optional();

export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name.').max(100, 'Please keep your name under 100 characters.'),
  email,
  subject: z.string().trim().max(150, 'Please keep the subject under 150 characters.').optional(),
  message: z
    .string()
    .trim()
    .min(1, 'Please enter a message.')
    .max(5000, 'Please keep your message under 5000 characters.'),
  website,
});

export const subscribeSchema = z.object({ email, website });

export type ContactValues = z.infer<typeof contactSchema>;
export type SubscribeValues = z.infer<typeof subscribeSchema>;
