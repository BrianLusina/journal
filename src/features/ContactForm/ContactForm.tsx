import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components';
import { postForm } from '@/lib/postForm';
import { contactSchema, type ContactValues } from '../../../api/_forms/schemas';

const inputClassName =
  'w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive';

/** The contact form. It validates with the same schema as api/contact, which emails the owner. */
const ContactForm = () => {
  const id = useId();
  const [status, setStatus] = useState<'sent' | 'failed' | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (values: ContactValues) => {
    setStatus(null);
    try {
      await postForm('/api/contact', values);
      reset();
      setStatus('sent');
    } catch {
      setStatus('failed');
    }
  };

  /** Props that register a field and tie it to its label and error message. */
  const field = (name: keyof ContactValues) => ({
    id: `${id}-${name}`,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `${id}-${name}-error` : undefined,
    className: inputClassName,
    ...register(name),
  });

  const label = (name: keyof ContactValues, text: string) => (
    <label htmlFor={`${id}-${name}`} className="block text-sm font-medium mb-2">
      {text}
    </label>
  );

  const error = (name: keyof ContactValues) =>
    errors[name] && (
      <p id={`${id}-${name}-error`} className="mt-2 text-sm font-medium">
        {errors[name].message}
      </p>
    );

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-slide-up stagger-2">
      <div>
        {label('name', 'Name')}
        <input type="text" autoComplete="name" placeholder="Your name" {...field('name')} />
        {error('name')}
      </div>
      <div>
        {label('email', 'Email')}
        <input type="email" autoComplete="email" placeholder="your.email@example.com" {...field('email')} />
        {error('email')}
      </div>
      <div>
        {label('subject', 'Subject (optional)')}
        <input type="text" placeholder="What's this about?" {...field('subject')} />
        {error('subject')}
      </div>
      <div>
        {label('message', 'Message')}
        <textarea rows={6} placeholder="Tell us what's on your mind..." {...field('message')} />
        {error('message')}
      </div>
      {/* Honeypot: hidden from readers and assistive technology, so only bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <input type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-6"
      >
        {isSubmitting ? 'Sending…' : 'Send Message'}
      </Button>
      <p role="status" className="text-sm">
        {status === 'sent' && "Thanks! Your message has been sent. We'll get back to you soon."}
      </p>
      {status === 'failed' && (
        <p role="alert" className="text-sm font-medium">
          Sorry, we couldn't send your message. Please try again later.
        </p>
      )}
    </form>
  );
};

export default ContactForm;
