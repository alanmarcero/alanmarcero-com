import { LAMBDA_URL, YOUTUBE_CHANNEL_URL, GITHUB_URL, PAYPAL_DONATE_URL, SCROLL_THRESHOLD, TOAST_DISMISS_MS } from './config';

describe('config', () => {
  it('LAMBDA_URL is a valid HTTPS URL', () => {
    expect(LAMBDA_URL).toMatch(/^https:\/\/.+/);
  });

  it('LAMBDA_URL points to AWS Lambda', () => {
    expect(LAMBDA_URL).toContain('lambda-url');
    expect(LAMBDA_URL).toContain('.on.aws');
  });

  it('exports external URLs as valid HTTPS URLs', () => {
    expect(YOUTUBE_CHANNEL_URL).toMatch(/^https:\/\/.+/);
    expect(GITHUB_URL).toMatch(/^https:\/\/.+/);
    expect(PAYPAL_DONATE_URL).toMatch(/^https:\/\/.+/);
  });

  it('YOUTUBE_CHANNEL_URL points to youtube.com', () => {
    expect(YOUTUBE_CHANNEL_URL).toContain('youtube.com');
  });

  it('GITHUB_URL points to github.com', () => {
    expect(GITHUB_URL).toContain('github.com');
  });

  it('PAYPAL_DONATE_URL points to paypal.com', () => {
    expect(PAYPAL_DONATE_URL).toContain('paypal.com');
  });

  it('SCROLL_THRESHOLD matches the expected pixel value', () => {
    expect(SCROLL_THRESHOLD).toBe(400);
  });

  it('TOAST_DISMISS_MS matches the expected duration', () => {
    expect(TOAST_DISMISS_MS).toBe(2500);
  });
});
