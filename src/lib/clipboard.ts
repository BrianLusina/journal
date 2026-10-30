import { toast } from 'sonner';

/**
 * Copies the current page URL and tells the reader whether it worked. The clipboard API can
 * reject (permission denied) or be missing entirely (insecure origins), so success is only
 * reported once the write has resolved.
 */
export async function copyCurrentUrl(): Promise<void> {
  try {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  } catch {
    toast.error('Could not copy the link. Please copy it from the address bar.');
  }
}
