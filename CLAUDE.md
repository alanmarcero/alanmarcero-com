# alanmarcero.com

Personal website for a music producer showcasing synthesizer patch banks and YouTube music content. Dark synthwave theme with purple/fuchsia palette.

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
- No database — patch bank data is hardcoded, YouTube data is fetched on-demand

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7 |
| Styling | CSS custom properties, Google Fonts (Inter, Space Grotesk) |
| Lambda | TypeScript, Node.js |
| Testing | Jest 30, React Testing Library |
| Hosting | S3, CloudFront, Lambda Function URL |
| CI/CD | GitHub Actions |
| DNS/TLS | Route 53, CloudFront (ACM) |

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── Hero.jsx              # Hero section: image, name, bio, CTA, search
│   │   ├── Hero.test.jsx         # Hero tests (9 tests)
│   │   ├── YouTubeEmbed.jsx      # Shared YouTube iframe component
│   │   ├── YouTubeEmbed.test.jsx # YouTubeEmbed tests (7 tests)
│   │   ├── PatchBankItem.jsx     # Patch bank card with download button
│   │   ├── PatchBankItem.test.jsx # PatchBankItem tests (8 tests)
│   │   ├── MusicItem.jsx         # YouTube playlist item display
│   │   └── MusicItem.test.jsx    # MusicItem tests (5 tests)
│   ├── data/
│   │   ├── patchBanks.js         # Hardcoded patch bank catalog
│   │   └── patchBanks.test.ts    # Data validation tests (6 tests)
│   ├── config.js                 # Centralized config (Lambda URL)
│   ├── config.test.ts            # Config tests (3 tests)
│   ├── App.jsx                   # Main app: data fetching, search filtering, layout
│   ├── App.test.jsx              # App integration tests (20 tests)
│   ├── App.css                   # Full stylesheet: synthwave theme, responsive
│   └── main.jsx                  # React entry point
├── public/
│   ├── banks/                    # Downloadable patch zip files
│   ├── about-me.webp             # Hero profile image
│   └── background.webp           # Faint body overlay (8% opacity)
├── index.html                    # Entry HTML with Google Fonts
├── lambda.ts                     # AWS Lambda handler
├── lambda.local.ts               # Local Lambda dev runner
├── lambda.test.ts                # Lambda tests (4 tests)
├── .npmrc                        # Forces npm.org registry (overrides corporate)
└── .github/workflows/deploy.yml  # GitHub Actions CI/CD
```

**Total: 62 tests across 8 suites**

## Key Files

- `src/components/Hero.jsx` — Unified hero: profile image, gradient name, tagline, bio, YouTube CTA, search input
- `src/App.jsx` — Main component: fetches music from Lambda, client-side search filtering, renders Hero + sections
- `src/App.css` — Complete stylesheet: CSS custom properties, synthwave palette, glassmorphism cards, responsive
- `src/data/patchBanks.js` — Static patch bank catalog (add new releases here)
- `lambda.ts` — Fetches YouTube playlist, transforms response, returns JSON

## Design System

**Theme:** Dark synthwave — purple/fuchsia accents on dark blue-purple backgrounds. Dark mode only.

**Fonts:** Inter 400/600 (body), Space Grotesk 500/700 (headings) via Google Fonts.

**CSS Custom Properties (App.css `:root`):**

| Token | Value | Usage |
|-------|-------|-------|
| `--accent-primary` | `#a855f7` | Primary purple |
| `--accent-primary-light` | `#c084fc` | Card headings, hover states |
| `--gradient-accent` | purple → fuchsia | Buttons, underlines, card top borders |
| `--bg-body` | `#0a0a14` | Page background |
| `--bg-surface` | `rgba(20,15,40,0.9)` | Card surfaces (glassmorphism) |
| `--glow-accent` | purple box-shadow | Shared button hover glow |
| `--focus-ring` | purple outline | Search input focus state |
| `--text-primary` | `#f0eef5` | Main text |
| `--text-secondary` | `#b0a8c8` | Secondary text, bio |
| `--text-muted` | `#7a7099` | Footer, placeholders |

**Shared CSS classes:**
- `.btn-primary` — Gradient pill button (used by Hero CTA, download buttons, PayPal button)
- `.store-item` — Glassmorphism card with `backdrop-filter: blur(12px)`, purple border, hover lift + glow
- `.section-title` — Centered heading with gradient underline

**Responsive breakpoints:**
- Desktop: 3-column grid (default)
- Tablet (max-width: 1024px): 2-column grid, smaller hero text
- Mobile (max-width: 767px): 1-column grid, compact hero

## Component Architecture

```
App
├── Hero (searchQuery, onSearchChange)
│   ├── Profile image (circular, purple glow)
│   ├── Gradient text name
│   ├── Tagline
│   ├── Bio paragraph
│   ├── YouTube CTA (.btn-primary)
│   └── Search input (pill-shaped)
├── Patch Banks section
│   └── PatchBankItem[] (bank)
│       ├── Name, description
│       ├── YouTubeEmbed[] (videoId)
│       └── Download button (.btn-primary)
├── Music section
│   └── MusicItem[] (item)
│       ├── Title
│       ├── YouTubeEmbed (videoId)
│       └── Description
├── Donate section
│   └── PayPal button (.btn-primary)
└── Footer
```

## Development

```bash
npm install                    # Install dependencies
npm run dev                    # Vite dev server
npm test                       # Jest (62 tests)
npm run build                  # Vite production build
npm run build:ts               # Compile Lambda TypeScript
npx ts-node lambda.local.ts    # Run Lambda locally
```

**Note:** `.npmrc` overrides corporate CodeArtifact registry to use public npm.org. Shell hooks may interfere with npm commands; use `--prefix /Users/alan.marcero/Documents/alanmarcero-com` if running from a different directory.

## Environment Variables

| Variable | Description | Where |
|----------|-------------|-------|
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | Lambda environment |

## Lambda Details

- **Endpoint:** `https://hh2nvebg2jac4yabkprsserxcq0lvhid.lambda-url.us-east-1.on.aws/`
- **Playlist ID:** `PLjHbhxiY56y28ezRPYzMi3lzV3nMQt-1c`
- **Max Results:** 50 items per request

## Deployment

**Automatic via GitHub Actions** — pushes to `main` trigger deployment.

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `S3_BUCKET_NAME` | S3 bucket for frontend |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID |
| `LAMBDA_FUNCTION_NAME` | Lambda function name |

### Manual Deployment

```bash
# Frontend
npm run build
aws s3 sync dist/ s3://YOUR-BUCKET-NAME --delete

# Lambda
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
3. Push to `main` (auto-deploys) or manually build and sync

## Data Model

**No database** — intentional for cost optimization:
- Patch banks: Hardcoded in `src/data/patchBanks.js` (11 entries)
- Music items: Fetched live from YouTube API via Lambda
- Search: Client-side filtering in React (case-insensitive, matches name + description)

## Future Feature Ideas

**Planned:**
- Photo portfolio section (public gallery for studio/gear/live shots)
- Admin photo upload (hidden, password-protected, uploads to S3)
- Payment processing for patch banks (Stripe Checkout + Lambda)

**Other ideas:**

| Feature | Effort |
|---------|--------|
| Mailing list signup (Buttondown/Mailchimp free tier) | Low |
| Soundcloud/Spotify embeds alongside YouTube | Low |
| Gear list page with photos | Low |
| Patch request form | Low |
| Blog/news section (static markdown) | Medium |
| Download counter via Lambda | Medium |
| Audio previews (MP3 clips per patch bank) | Medium |
| Preset browser (filter by synth/genre/type) | High |
