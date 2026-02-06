# alanmarcero.com

Personal website for a music producer showcasing synthesizer patch banks and YouTube music content.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   CloudFront    │────▶│   S3 (Frontend)  │     │  YouTube API    │
│   (CDN + HTTPS) │     │   Static React   │     │                 │
└─────────────────┘     └──────────────────┘     └────────▲────────┘
                                                          │
┌─────────────────┐     ┌──────────────────┐              │
│    Route 53     │     │     Lambda       │──────────────┘
│   (DNS)         │     │  (Playlist API)  │
└─────────────────┘     └──────────────────┘
```

**Cost-optimized AWS setup:**
- S3 + CloudFront for static frontend hosting
- Single Lambda with Function URL (no API Gateway costs)
- No database - patch bank data is hardcoded, YouTube data is fetched on-demand

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite |
| Lambda | TypeScript, Node.js |
| Hosting | S3, CloudFront, Lambda Function URL |
| DNS/TLS | Route 53, CloudFront (ACM) |

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── YouTubeEmbed.jsx    # Shared YouTube iframe component
│   │   ├── PatchBankItem.jsx   # Patch bank card with download button
│   │   └── MusicItem.jsx       # YouTube playlist item display
│   ├── data/
│   │   └── patchBanks.js       # Hardcoded patch bank catalog
│   ├── config.js               # Centralized config (Lambda URL)
│   ├── App.jsx                 # Main app with search and data fetching
│   └── App.css                 # Styles (dark theme, cyan accents)
├── public/
│   └── banks/                  # Downloadable patch zip files
├── lambda.ts                   # AWS Lambda handler
├── lambda.local.ts             # Local Lambda runner
├── lambda.test.ts              # Jest tests for Lambda
├── .npmrc                      # Forces npm.org registry (overrides corporate)
└── .github/workflows/deploy.yml # GitHub Actions CI/CD
```

## Key Files

- `lambda.ts` - Fetches YouTube playlist, transforms response, returns JSON
- `src/data/patchBanks.js` - Static patch bank catalog (add new releases here)
- `src/App.jsx` - Main React component with search filtering

## Development

```bash
# Install dependencies
npm install

# Run frontend dev server
npm run dev

# Run Lambda locally
npx ts-node lambda.local.ts

# Run tests
npm test

# Build frontend for production
npm run build

# Build Lambda TypeScript
npm run build:ts
```

## Environment Variables

| Variable | Description | Where |
|----------|-------------|-------|
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | Lambda environment |

## Lambda Details

- **Endpoint:** `https://hh2nvebg2jac4yabkprsserxcq0lvhid.lambda-url.us-east-1.on.aws/`
- **Playlist ID:** `PLjHbhxiY56y28ezRPYzMi3lzV3nMQt-1c`
- **Max Results:** 50 items per request

## Deployment

**Automatic via GitHub Actions** - pushes to `main` trigger deployment.

### Required GitHub Secrets

Configure these in: Repository → Settings → Secrets and variables → Actions

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `S3_BUCKET_NAME` | S3 bucket for frontend (e.g., `alanmarcero-com`) |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID |
| `LAMBDA_FUNCTION_NAME` | Lambda function name |

### IAM Permissions Required

The IAM user needs these permissions:
- `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` on the S3 bucket
- `cloudfront:CreateInvalidation` on the distribution
- `lambda:UpdateFunctionCode` on the Lambda function

### Manual Deployment

**Frontend:**
```bash
npm run build
aws s3 sync dist/ s3://YOUR-BUCKET-NAME --delete
```

**Lambda:**
```bash
npm run build:ts
cd dist && zip -r ../lambda.zip lambda.js
aws lambda update-function-code --function-name YOUR-FUNCTION --zip-file fileb://lambda.zip
```

## Adding New Patch Banks

1. Add zip file to `public/banks/`
2. Add entry to `src/data/patchBanks.js`:
```javascript
{
  name: 'Patch Bank Name',
  description: 'Description of the patches',
  audioDemo: ['YOUTUBE_VIDEO_ID'],
  downloadLink: '/banks/filename.zip'
}
```
3. Rebuild and deploy frontend

## Data Model

**No database** - this is intentional for cost optimization:
- Patch banks: Hardcoded in `src/data/patchBanks.js`
- Music items: Fetched live from YouTube API via Lambda
- Search: Client-side filtering in React

## Claude Code Skills

Custom skills are maintained in two locations:
- **Active:** `~/.claude/skills/` (used by Claude Code)
- **Source repo:** `/Users/alan.marcero/Development/my-skills/`

Available skills: `clean-code`, `security-audit`, `todo-tracker`, `create-ticket`

To update a skill, edit in `my-skills/` repo and copy to `~/.claude/skills/`.

## Notes

- `.npmrc` overrides corporate CodeArtifact registry to use public npm.org
- Shell hooks may interfere with npm commands; use `--prefix` flag if needed

## Future Feature Ideas

**Planned:**
- Photo portfolio section (public gallery for studio/gear/live shots)
- Admin photo upload (hidden, password-protected, uploads to S3)
- Payment processing for patch banks (see detailed plan below)

## Payment Processing Plan

**Goal:** Sell patch banks with secure download delivery.

### Recommended: Stripe Checkout + Lambda

**Why Stripe:**
- No monthly fee (only 2.9% + $0.30 per transaction)
- Hosted checkout (no PCI compliance burden)
- Webhooks for fulfillment
- Supports one-time payments for digital goods

### Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│  Buy Button │────▶│ Stripe Checkout │────▶│   Payment   │
│  (React)    │     │    (Hosted)     │     │  Complete   │
└─────────────┘     └─────────────────┘     └──────┬──────┘
                                                   │
                                                   ▼
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│  Download   │◀────│ Lambda Webhook  │◀────│  Stripe     │
│  (Signed    │     │ (Verify + Sign) │     │  Webhook    │
│   S3 URL)   │     └─────────────────┘     └─────────────┘
└─────────────┘
```

### Implementation Steps

**Phase 1: Stripe Setup**
1. Create Stripe account, get API keys
2. Create Products in Stripe Dashboard (one per patch bank)
3. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to Lambda env

**Phase 2: Protect Downloads**
1. Move patch banks from `public/banks/` to private S3 bucket
2. Remove direct download links from `patchBanks.js`
3. Add `price` and `stripeProductId` fields to patch bank data

**Phase 3: Checkout Lambda**
```
POST /create-checkout-session
- Input: { productId: "prod_xxx" }
- Creates Stripe Checkout Session
- Returns: { url: "https://checkout.stripe.com/..." }
```

**Phase 4: Webhook Lambda**
```
POST /webhook
- Receives Stripe checkout.session.completed event
- Verifies signature
- Generates signed S3 URL (expires in 24h)
- Returns download URL (displayed on success page)
- Optional: Send email with download link
```

**Phase 5: Frontend Changes**
1. Replace "Download" button with "Buy $X" button
2. On click: call checkout Lambda, redirect to Stripe
3. Success page: display download link from webhook response
4. Keep some banks free (check `price` field, show Download if null)

### Data Model Update

```javascript
// src/data/patchBanks.js
{
  name: 'Sequential Prophet 08 Series',
  description: '128 patches...',
  audioDemo: ['senhvxSN3PU'],
  price: 9.99,                    // null = free
  stripeProductId: 'prod_xxx',    // Stripe product ID
  s3Key: 'banks/Alan-M_Prophet_08_Patches.zip'  // Private S3 key
}
```

### Cost Estimate

| Item | Cost |
|------|------|
| Stripe fee | 2.9% + $0.30 per sale |
| Lambda | ~free (low volume) |
| S3 private bucket | ~$0.01/month |
| **Total** | ~3% per transaction |

### Alternative: Gumroad/LemonSqueezy

If you want zero code:
- Upload files to Gumroad, embed buy buttons
- Higher fees (~10%) but no Lambda work
- Less control over branding

**Potential additions:**
| Feature | Description | Effort |
|---------|-------------|--------|
| Mailing list signup | Email capture via Buttondown/Mailchimp free tier | Low |
| Soundcloud/Spotify embeds | Streaming links alongside YouTube | Low |
| Gear list page | Synths used with photos (good for SEO) | Low |
| Patch request form | Simple form for synth requests | Low |
| Blog/news section | Static markdown posts, no DB | Medium |
| Download counter | Track patch popularity via Lambda | Medium |
| Audio previews | MP3 clips per patch bank (no YouTube) | Medium |
| Preset browser | Filter patches by synth/genre/type | High |
