# alanmarcero.com

Personal website for a music producer showcasing synthesizer patch banks and YouTube music content. Outrun CRT theme — retro-futuristic design with cyan/magenta/orange accents, CRT scanline overlays, Space Grotesk headings, frosted glass cards, and centered hero layout on deep blue-black backgrounds.

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
│   │   ├── BackToTop.jsx          # Scroll-to-top button (uses useScrollPosition + SCROLL_THRESHOLD)
│   │   ├── BackToTop.test.jsx     # BackToTop tests
│   │   ├── Footer.jsx             # Footer with nav links + dynamic year
│   │   ├── Footer.test.jsx        # Footer tests
│   │   ├── Hero.jsx               # Hero section: image, name, bio, CTA, search + clear
│   │   ├── Hero.test.jsx          # Hero tests
│   │   ├── MusicItem.jsx          # YouTube playlist item display (card glow)
│   │   ├── MusicItem.test.jsx     # MusicItem tests
│   │   ├── NoResults.jsx          # Empty state for search with no matches (aria-hidden emoji)
│   │   ├── NoResults.test.jsx     # NoResults tests
│   │   ├── PatchBankItem.jsx      # Patch bank card with download button (card glow, onDownload)
│   │   ├── PatchBankItem.test.jsx # PatchBankItem tests
│   │   ├── SkeletonCard.jsx       # Loading placeholder with shimmer animation
│   │   ├── SkeletonCard.test.jsx  # SkeletonCard tests
│   │   ├── Toast.jsx              # Download toast notification
│   │   ├── Toast.test.jsx         # Toast tests
│   │   ├── YouTubeEmbed.jsx       # Shared YouTube iframe component
│   │   └── YouTubeEmbed.test.jsx  # YouTubeEmbed tests
│   ├── hooks/
│   │   ├── useMusicItems.js          # Custom hook: Lambda fetch for music items
│   │   ├── useMusicItems.test.js     # useMusicItems tests
│   │   ├── useScrollPosition.js      # Custom hook: scroll threshold detection
│   │   ├── useScrollPosition.test.js # useScrollPosition tests
│   │   ├── useScrollReveal.js        # Custom hook: IntersectionObserver scroll-reveal
│   │   └── useScrollReveal.test.js   # useScrollReveal tests
│   ├── utils/
│   │   ├── cardGlow.js            # Mouse-tracking glow effect handlers for cards
│   │   └── cardGlow.test.js       # cardGlow tests
│   ├── data/
│   │   ├── patchBanks.js         # Hardcoded patch bank catalog
│   │   └── patchBanks.test.ts    # Data validation tests
│   ├── config.js                 # Centralized config (Lambda URL, external URLs, scroll threshold, toast duration)
│   ├── App.jsx                   # Main app: search filtering, scroll reveal, toast, layout
│   ├── App.test.jsx              # App integration tests
│   ├── App.css                   # Full stylesheet: Outrun CRT theme, animations, responsive
│   └── main.jsx                  # React entry point
├── public/
│   ├── banks/                    # Downloadable patch zip files
│   ├── about-me.webp             # Hero profile image (circular, cyan border glow)
│   └── hero-bg.webp              # Background image (outrun landscape, used in .hero-backdrop)
├── index.html                    # Entry HTML with Google Fonts, meta description, canonical URL
├── index.ts                      # AWS Lambda handler
├── index.local.ts                # Local Lambda dev runner
├── index.test.ts                 # Lambda tests
├── .npmrc                        # Forces npm.org registry (overrides corporate)
└── .github/workflows/deploy.yml  # GitHub Actions CI/CD
```

**Total: 114 tests across 16 suites**

## Key Files

- `src/App.jsx` — Main component: client-side search filtering, scroll reveal, toast notifications, layout (delegates fetch to useMusicItems hook)
- `src/App.css` — Complete stylesheet: CSS custom properties, Outrun CRT palette, frosted glass cards, centered hero, CRT scanlines, neon glow effects, animations, responsive
- `src/components/Hero.jsx` — Centered stacked hero: circular profile image with cyan glow, gradient text name, uppercase tagline, gradient CTA, pill-shaped search input with clear button
- `src/config.js` — Centralized external URLs (Lambda, YouTube, GitHub, PayPal) and UI constants (SCROLL_THRESHOLD, TOAST_DISMISS_MS)
- `src/hooks/useMusicItems.js` — Custom hook: fetches music items from Lambda, returns {musicItems, musicLoading, musicError}
- `src/hooks/useScrollPosition.js` — Custom hook returning boolean when scroll exceeds a threshold
- `src/data/patchBanks.js` — Static patch bank catalog (add new releases here)
- `index.ts` — Fetches YouTube playlist, transforms response, returns JSON with Content-Type headers. Generic error responses (no internal message leaks)

## Design System

**Theme:** Outrun CRT — retro-futuristic design with cyan/magenta/orange accents, CRT scanline overlays on background and buttons, frosted glass cards, gradient text, and neon glow effects. Dark mode only.

**Fonts:** Inter 400/500/600 (body, buttons, tagline), Space Grotesk 500/700 (headings — techy geometric) via Google Fonts.

**CSS Custom Properties (App.css `:root`):**

| Token | Value | Usage |
|-------|-------|-------|
| `--accent-cyan` | `#00e5ff` | Primary cyan |
| `--accent-magenta` | `#ff2d95` | Secondary magenta |
| `--accent-orange` | `#ff6b00` | Tertiary (PayPal) |
| `--gradient-accent` | cyan → magenta (135deg) | Buttons, glows |
| `--gradient-hero-text` | cyan → magenta (135deg) | Hero name |
| `--bg-body` | `#0e0e1a` | Deep blue-black |
| `--bg-surface` | `rgba(16, 16, 32, 0.85)` | Card backgrounds (frosted) |
| `--bg-surface-hover` | `rgba(20, 20, 40, 0.9)` | Card hover |
| `--bg-footer` | `#06060e` | Footer |
| `--text-primary` | `#e8e6f0` | Cool off-white |
| `--text-secondary` | `#8888aa` | Muted lavender |
| `--text-muted` | `#4a4a66` | Faint |

**CRT Effects:**
- `html, body` background-image — Phosphor dot grid (cyan horizontal + magenta vertical micro-lines at low opacity) with edge vignette (radial-gradient darkening corners), `background-attachment: fixed`
- `body::after` — Full-viewport scanlines (repeating-linear-gradient, 3px spacing, z-index 9999, pointer-events: none) with subtle flicker animation
- `.btn-primary::after, .back-to-top::after` — Shared finer scanlines on button surfaces (2px spacing, consolidated CSS rule)
- `@keyframes crtFlicker` — Gentle opacity oscillation on body scanlines
- `@media (prefers-reduced-motion: reduce)` — Disables flicker, keeps static scanlines

**Shared CSS classes:**
- `.btn-primary` — Gradient pill button (50px radius, cyan→magenta, CRT overlay via ::after)
- `.hero-cta` — Hero CTA (inherits .btn-primary gradient pill)
- `.store-item` — Frosted glass card (8px radius, backdrop-filter: blur(12px), cyan left-border glow on hover, mouse-follow glow via ::before, flexbox column layout with download button at bottom-center)
- `.section-title` — Left-aligned heading with flowing gradient underline (::after, 60px wide, 4px tall, gradientFlow animation, animates in with scroll reveal)
- `.scroll-reveal` / `.scroll-reveal--visible` — Fade-up reveal on scroll via IntersectionObserver
- `.toast` / `.toast--visible` — Fixed bottom-center notification with slide-up animation
- `.content-grid` — Responsive grid layout for patch bank and music sections (20px bottom padding)
- `.skeleton-card` — Loading placeholder card with cyan shimmer animation
- `.back-to-top` / `.back-to-top--visible` — Fixed gradient pill button with CRT overlay
- `.no-results` — Centered empty state message for search
- `.search-clear` — Clear button inside search input
- `.paypal-button` — Orange accent button

**Key visual characteristics:**
- **Centered stacked hero** on all viewports (flexbox column, centered text)
- CRT phosphor grid on body background + edge vignette, scanlines across entire viewport (body::after), and on buttons (::after)
- Frosted glass cards with `backdrop-filter: blur(12px)` on semi-transparent backgrounds
- Cards: 8px border-radius, cyan left-border glow on hover, mouse-follow radial glow (::before), neon box-shadow, flexbox column with download buttons bottom-center
- YouTube embeds: 85% width, 180px height within cards
- Buttons: pill-shaped (50px border-radius), gradient background
- Hero image: circular (50% radius, 260px desktop / 220px tablet / 180px mobile), cyan border with multi-layered neon glow
- Hero content: max-width 800px, hero bio: max-width 720px
- Hero backdrop: 20% opacity background image
- Hero name: gradient text (cyan→magenta) via `background-clip: text`
- Hero tagline: uppercase, letter-spacing 3px, Inter 600, cyan color
- Pill-shaped search input with cyan focus ring
- Cyan-tinted subtle borders (rgba cyan at 8% and 20%)
- Left-aligned section titles with flowing gradient underline (4px, gradientFlow animation)
- Space Grotesk gives headings a techy geometric personality
- Neon glow effects (layered box-shadows) on cards, buttons, hero image

**Animations & Micro-Interactions:**
- Staggered card entry via `--card-index` CSS custom property (80ms delay per card)
- `@keyframes shimmer` — Cyan gradient sweep for skeleton loading cards
- `@keyframes crtFlicker` — Subtle opacity flicker on body scanlines
- `@keyframes gradientFlow` — Flowing cyan→magenta gradient on all section title underlines (3s linear infinite)
- Scroll-reveal fade-up for sections (IntersectionObserver, one-shot, 0.6s ease)
- Mouse-follow radial glow on cards (CSS custom properties `--mouse-x`/`--mouse-y`)
- Button press feedback (scale 0.96 on :active)
- Section-title underline grow (0→60px, 4px tall, 0.5s ease, 0.2s delay after reveal)
- Download toast slide-up notification (2.5s auto-dismiss)
- `@media (prefers-reduced-motion: reduce)` — Disables all animations and transitions
- Smooth scroll behavior (`html { scroll-behavior: smooth }`)

**Responsive breakpoints:**
- Desktop: 3-column grid (default)
- Tablet (max-width: 1024px): 2-column grid, smaller hero text/image
- Mobile (max-width: 767px): 1-column grid, compact hero

## Component Architecture

```
App
├── Hero (searchQuery, onSearchChange) — Centered stacked layout (flexbox column)
│   ├── Profile image (circular 50%, 260px, cyan border glow)
│   ├── Name (Space Grotesk 700, 3.5rem, gradient text cyan→magenta)
│   ├── Tagline (uppercase, 3px tracking, cyan)
│   ├── Bio paragraph
│   ├── YouTube CTA (gradient pill button with CRT overlay)
│   └── Search input (pill-shaped, cyan focus ring) + clear button
├── SkeletonCard[] (×3, shown during loading)
├── NoResults (query) — shown when search yields no matches
├── Donate section (scroll-reveal, compact 1200px banner, left-aligned title, flowing gradient underline)
│   └── PayPal button (.btn-primary, orange accent)
├── Patch Banks section (scroll-reveal, ref=storeRef)
│   └── PatchBankItem[] (bank, style={--card-index}, onDownload, cardGlowHandlers)
│       ├── Name, description
│       ├── YouTubeEmbed[] (videoId)
│       └── Download button (.btn-primary, triggers toast)
├── Music section (scroll-reveal, ref=musicRef, consistent background)
│   └── MusicItem[] (item, style={--card-index}, cardGlowHandlers)
│       ├── Title
│       ├── YouTubeEmbed (videoId)
│       └── Description
├── Footer
│   ├── Nav links (YouTube, GitHub) — semantic <nav> element
│   └── Dynamic copyright year
├── BackToTop (uses useScrollPosition hook, gradient pill with CRT overlay)
└── Toast (message, visible) — download notification
```

## Development

```bash
npm install                    # Install dependencies
npm run dev                    # Vite dev server (requires Node.js 20.19+)
npm test                       # Jest (130 tests, 17 suites)
npm run build                  # Vite production build
npm run build:ts               # Compile Lambda TypeScript
npx ts-node index.local.ts     # Run Lambda locally
```

**Node.js requirement:** Vite 7 requires Node.js 20.19+ or 22.12+. Use `nvm use 20.19.6` if your default version is older.

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
cd dist && zip -r ../lambda.zip index.js
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

## Image Generation

Images converted to webp using `cwebp` (installed via `brew install webp`). Can be generated via Stability AI MCP tool or Gemini.

**Current images:**

| File | Usage | Style |
|------|-------|-------|
| `public/about-me.webp` | Hero circular avatar (260px CSS, cyan border glow) | Bright outrun synth setup |
| `public/hero-bg.webp` | Hero section background (20% opacity via .hero-backdrop) | Abstract outrun landscape |

**Converting images:**
```bash
cwebp -q 85 input.png -o public/output.webp
rm input.png
```

## Security

- **Lambda error responses:** Generic `{ error: "YouTube Fetch Failed" }` — no internal error messages leaked
- **External links:** PayPal donate link uses `target="_blank" rel="noopener noreferrer"`
- **YouTube iframes:** Sandboxed with `allow-scripts allow-same-origin allow-popups allow-presentation`
- **Environment files:** `.env*` in `.gitignore`
- **SEO:** Meta description, canonical URL, theme-color meta tag
- **Last audit:** Feb 2026 — 0 critical, 0 high, 0 medium findings
