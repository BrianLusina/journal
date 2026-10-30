import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components';
import { postForm } from '@/lib/postForm';
import { subscribeSchema, type SubscribeValues } from '../../../api/_forms/schemas';

/** The newsletter signup. It validates with the same schema as api/subscribe. */
const SubscribeForm = () => {
  const id = useId();
  const [status, setStatus] = useState<'subscribed' | 'failed' | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubscribeValues>({ resolver: zodResolver(subscribeSchema) });

  const onSubmit = async (values: SubscribeValues) => {
    setStatus(null);
    try {
      await postForm('/api/subscribe', values);
      reset();
      setStatus('subscribed');
    } catch {
      setStatus('failed');
    }
  };

  const errorId = `${id}-email-error`;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto space-y-3">
      <div className="flex flex-col sm:flex-row gap-4">
        <label htmlFor={`${id}-email`} className="sr-only">
          Email address
        </label>
        <input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          placeholder="Your email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? errorId : undefined}
          className="flex-1 px-4 py-3 rounded-full border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive"
          {...register('email')}
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8"
        >
          {isSubmitting ? 'Subscribing…' : 'Subscribe'}
        </Button>
      </div>
      {/* Honeypot: hidden from readers and assistive technology, so only bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <input type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>
      {errors.email && (
        <p id={errorId} className="text-sm font-medium">
          {errors.email.message}
        </p>
      )}
      <p role="status" className="text-sm">
        {status === 'subscribed' && 'Thanks for subscribing!'}
      </p>
      {status === 'failed' && (
        <p role="alert" className="text-sm font-medium">
          Sorry, we couldn't subscribe you. Please try again later.
        </p>
      )}
    </form>
  );
};

export default SubscribeForm;
