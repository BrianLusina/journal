import { createFormHandler, resend } from './_forms/handler';
import { contactSchema } from './_forms/schemas';

/** Emails a contact form message to the owner through Resend. Replies go to the reader. */
export default createFormHandler({
  schema: contactSchema,
  env: ['RESEND_API_KEY', 'CONTACT_TO_EMAIL', 'CONTACT_FROM_EMAIL'],
  deliver: ({ name, email, subject, message }, env) =>
    resend('/emails', env.RESEND_API_KEY, {
      from: env.CONTACT_FROM_EMAIL,
      to: env.CONTACT_TO_EMAIL,
      reply_to: email,
      subject: `Contact form: ${subject || `message from ${name}`}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    }),
});
