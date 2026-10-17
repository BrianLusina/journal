import { toast } from 'sonner';
import { copyCurrentUrl } from './clipboard';

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const setClipboard = (clipboard: unknown) => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
};

describe('copyCurrentUrl', () => {
  it('copies the current URL and confirms', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });

    await copyCurrentUrl();

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(toast.success).toHaveBeenCalledWith('Link copied to clipboard!');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('tells the reader when the browser refuses the write', async () => {
    setClipboard({ writeText: jest.fn().mockRejectedValue(new Error('denied')) });

    await copyCurrentUrl();

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it('tells the reader when the clipboard API is unavailable, as on insecure origins', async () => {
    setClipboard(undefined);

    await copyCurrentUrl();

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });
});
