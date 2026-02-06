import { LAMBDA_URL } from './config';

describe('config', () => {
  it('exports LAMBDA_URL', () => {
    expect(LAMBDA_URL).toBeDefined();
  });

  it('LAMBDA_URL is a valid HTTPS URL', () => {
    expect(LAMBDA_URL).toMatch(/^https:\/\/.+/);
  });

  it('LAMBDA_URL points to AWS Lambda', () => {
    expect(LAMBDA_URL).toContain('lambda-url');
    expect(LAMBDA_URL).toContain('.on.aws');
  });
});
