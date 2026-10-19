import { createFormHandler, resend } from './_forms/handler';
import { subscribeSchema } from './_forms/schemas';

/**
 * Adds a newsletter subscriber to the Resend audience. Resend now calls audiences "segments" and
 * marks the audience endpoints deprecated: they still work, but will be removed. Moving to
 * `POST /contacts` with `segments` is a follow-up.
 */
export default createFormHandler({
  schema: subscribeSchema,
  env: ['RESEND_API_KEY', 'RESEND_AUDIENCE_ID'],
  deliver: ({ email }, env) =>
    resend(`/audiences/${encodeURIComponent(env.RESEND_AUDIENCE_ID)}/contacts`, env.RESEND_API_KEY, { email }),
  // Subscribing twice succeeds too, so the answer never tells whether an address is subscribed.
  isAlsoDelivered: (status, body) => status === 409 || /already exists/i.test(body),
});
