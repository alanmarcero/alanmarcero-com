# alanmarcero.com

Personal website for a music producer showcasing synthesizer patch banks and YouTube music content. Hard Outrun CRT theme — retro-futuristic design with cyan/violet/orange accents, CRT scanline overlays, CRT glitch animations, Space Grotesk headings, frosted glass cards, and centered hero layout on deep blue-black backgrounds.

## Architecture

```
                        ┌──────────────────┐
                   ┌───▶│   S3 (Frontend)  │
                   │    │   Static React   │
┌─────────────────┐│    └──────────────────┘     ┌─────────────────┐
│   CloudFront    │┤                              │  YouTube API    │
│   (CDN + HTTPS) ││    ┌──────────────────┐     │                 │
└─────────────────┘└───▶│     Lambda       │────▶└─────────────────┘
                  /api  │  (Playlist API)  │
┌─────────────────┐     └──────────────────┘
│    Route 53     │
│   (DNS)         │
└─────────────────┘
```

**Cost-optimized AWS setup:**
- S3 + CloudFront for static frontend hosting
- Lambda behind CloudFront at `/api` with 5-minute edge cache (CachingOptimized policy)
- No database — patch bank data is hardcoded, YouTube data is fetched on-demand

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7 |
| Styling | CSS custom properties, Google Fonts (Inter, Space Grotesk) |
| Lambda | TypeScript, Node.js |
| Testing | Jest 30, React Testing Library |
| Hosting | S3, CloudFront (static + Lambda /api) |
| CI/CD | GitHub Actions |
| DNS/TLS | Route 53, CloudFront (ACM) |

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── Footer.jsx             # Footer with nav links + dynamic year
│   │   ├── Footer.test.jsx        # Footer tests
│   │   ├── Hero.jsx               # Hero section: image, name, bio, CTA, search + clear, useRandomGlitch hook
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
│   │   ├── YouTubeEmbed.jsx       # Click-to-load YouTube facade (thumbnail + play button; iframe loads on click)
│   │   └── YouTubeEmbed.test.jsx  # YouTubeEmbed tests
│   ├── hooks/
│   │   ├── useMusicItems.js          # Custom hook: Lambda fetch for music items
│   │   ├── useMusicItems.test.js     # useMusicItems tests
│   │   ├── useInViewport.js          # Custom hook: IntersectionObserver visibility (pauses off-screen animations)
│   │   ├── useInViewport.test.js     # useInViewport tests
│   │   ├── usePrefersReducedMotion.js      # Custom hook: prefers-reduced-motion
│   │   ├── usePrefersReducedMotion.test.js # usePrefersReducedMotion tests
│   │   ├── useScrollProgress.js      # Custom hook: writes scroll-progress transform via ref + rAF (no re-render)
│   │   ├── useScrollProgress.test.js # useScrollProgress tests
│   ├── utils/
│   │   ├── cardGlow.js            # Mouse-tracking glow effect handlers for cards
│   │   └── cardGlow.test.js       # cardGlow tests
│   ├── data/
│   │   ├── patchBanks.js         # Hardcoded patch bank catalog
│   │   └── patchBanks.test.ts    # Data validation tests
│   ├── config.js                 # Centralized config (Lambda URL, external URLs, scroll threshold, toast duration)
│   ├── App.jsx                   # Main app: search filtering, toast, layout
│   ├── App.test.jsx              # App integration tests
│   ├── App.css                   # Main page stylesheet (imports shared/theme.css): hero, cards, animations, responsive
│   ├── main.jsx                  # React entry point (main page)
│   ├── shared/
│   │   └── theme.css             # Shared theme tokens, CRT base styles, resets, .btn-primary, reduced-motion
│   └── arcade/
│       ├── main.jsx              # React entry point (arcade page)
│       ├── ArcadeApp.jsx         # Root: game picker vs active game state
│       ├── ArcadeApp.css         # Arcade-specific styles (imports shared/theme.css): cabinet cards, game canvas, touch controls
│       ├── components/
│       │   ├── ArcadeHeader.jsx  # Back-to-home link + "ARCADE" gradient title
│       │   ├── GamePicker.jsx    # Flex layout of CabinetCards
│       │   ├── CabinetCard.jsx   # Mini arcade cabinet styled button (screen, marquee, joystick, INSERT COIN)
│       │   ├── GameCanvas.jsx    # Full-screen game wrapper: canvas, CRT overlay, HUD, game-over, TouchControls
│       │   └── TouchControls.jsx # Mobile d-pad + action buttons (pointer: coarse only)
│       └── games/
│           ├── gameRegistry.js   # Game metadata + factory functions for all 11 games
│           ├── useGameLoop.js    # Shared requestAnimationFrame hook with delta-time clamping
│           ├── palette.js        # Shared CRT palette constants (CYAN, VIOLET, ORANGE, BG, WHITE, MUTED)
│           ├── space-invaders/
│           │   ├── SpaceInvaders.js      # Canvas game: player ship, alien grid, shields, bullets
│           │   └── SpaceInvaders.test.js
│           ├── asteroids/
│           │   ├── Asteroids.js          # Canvas game: vector-style ship, asteroid polygons, wrap-around
│           │   └── Asteroids.test.js
│           ├── tetris/
│           │   ├── Tetris.js             # Canvas game: 10x20 grid, 7 tetrominoes, ghost piece, line-clear
│           │   └── Tetris.test.js
│           ├── pac-man/
│           │   ├── PacMan.js             # Canvas game: maze, dots, power pellets, 4 ghosts with AI
│           │   └── PacMan.test.js
│           ├── breakout/
│           │   ├── Breakout.js           # Canvas game: paddle, ball, 6x10 brick grid, angle deflection
│           │   └── Breakout.test.js
│           ├── frogger/
│           │   ├── Frogger.js            # Canvas game: grid movement, road/river lanes, logs, 5 goals
│           │   └── Frogger.test.js
│           ├── snake/
│           │   ├── Snake.js              # Canvas game: grid movement, food, speed increase, wall/self collision
│           │   └── Snake.test.js
│           ├── pong/
│           │   ├── Pong.js               # Canvas game: player vs AI, paddle angle, serve timer
│           │   └── Pong.test.js
│           ├── rhythm/
│           │   ├── RhythmCatcher.js      # Canvas game: 4 lanes, falling notes, timing, combo system
│           │   └── RhythmCatcher.test.js
│           ├── centipede/
│           │   ├── Centipede.js          # Canvas game: mushroom field, centipede chain, spider, splitting
│           │   └── Centipede.test.js
│           └── bird-name-generator/
│               ├── BirdNameGenerator.js  # Canvas toy: press SPACE to discover funny real-bird-style names + pixel bird mascot
│               └── BirdNameGenerator.test.js
├── public/
│   ├── banks/                    # Downloadable patch zip files
│   ├── about-me.webp             # Hero profile image (circular, cyan border glow)
│   └── hero-bg.webp              # Background image (outrun landscape, used in .hero-backdrop)
├── index.html                    # Main page HTML entry with Google Fonts, meta description, canonical URL
├── arcade.html                   # Arcade page HTML entry (separate Vite entry point)
├── index.ts                      # AWS Lambda handler
├── index.local.ts                # Local Lambda dev runner
├── index.test.ts                 # Lambda tests
├── infrastructure/
│   ├── cloudfront-add-api-origin.yml  # Archived: one-time CloudFront /api origin setup
│   └── cloudfront-add-oac.yml        # Archived: one-time Lambda URL lockdown (OAC + IAM auth)
├── .npmrc                        # Forces npm.org registry (overrides corporate)
└── .github/workflows/deploy.yml  # GitHub Actions CI/CD
```

**Total: 737 tests across 46 suites**

## Key Files

- `src/App.jsx` — Main component: client-side search filtering, toast notifications, layout (delegates fetch to useMusicItems hook)
- `src/shared/theme.css` — Shared CSS custom properties, CRT background/scanline base, resets, `.btn-primary`, reduced-motion. Imported by both `App.css` and `ArcadeApp.css`
- `src/App.css` — Main page stylesheet (imports shared theme): hero, cards, CRT scanline sweep, glitch keyframes, animations, responsive
- `src/components/Hero.jsx` — Centered stacked hero: circular profile image with cyan glow, gradient text name, uppercase tagline, CTA row (YouTube + Arcade links), pill-shaped search input with clear button. Contains `useRandomGlitch` hook for JS-driven randomized CRT glitch on hero name
- `src/arcade/ArcadeApp.jsx` — Arcade page root: toggles between game picker and active game canvas
- `src/arcade/games/gameRegistry.js` — Game metadata array (id, name, description, accent color, controls, factory function) for all 10 arcade games
- `src/config.js` — Centralized external URLs (Lambda, YouTube, GitHub) and UI constants (SCROLL_THRESHOLD, TOAST_DISMISS_MS)
- `src/hooks/useMusicItems.js` — Custom hook: fetches music items from Lambda, returns {musicItems, musicLoading, musicError}
- `src/hooks/useScrollProgress.js` — Custom hook: returns a ref and writes `transform: scaleX(fraction)` to it via rAF on scroll (no React re-render per scroll)
- `src/hooks/useInViewport.js` — Custom hook: `[ref, inView]` via IntersectionObserver; used to pause off-screen animations (SignalMeter rAF, LissajousHalo SMIL/spin)
- `src/data/patchBanks.js` — Static patch bank catalog (add new releases here)
- `index.ts` — Fetches YouTube playlist, transforms response, returns JSON with Cache-Control: public, max-age=300. Generic error responses (no internal message leaks)
- `infrastructure/cloudfront-add-oac.yml` — One-time workflow: Lambda URL lockdown via CloudFront OAC (already run)

## Design System

**Theme:** Hard Outrun CRT — retro-futuristic design with cyan/violet/orange accents, CRT scanline overlays on background and buttons, randomized dual CRT glitch on hero name, scanline sweep bar (hero-only), frosted glass cards, gradient text, and neon glow effects. Dark mode only.

**Fonts:** Inter 400/500/600 (body, buttons, tagline), Space Grotesk 500/700 (headings — techy geometric) via Google Fonts.

**CSS Custom Properties (shared/theme.css `:root`):**

| Token | Value | Usage |
|-------|-------|-------|
| `--accent-cyan` | `#00e5ff` | Primary cyan |
| `--accent-magenta` | `#b829f5` | Secondary violet |
| `--accent-orange` | `#ff4500` | Tertiary (PayPal button) |
| `--gradient-accent` | cyan → violet (135deg) | Buttons, glows |
| `--gradient-hero-text` | cyan → violet (135deg) | Hero name |
| `--bg-body` | `#0e0e1a` | Deep blue-black |
| `--bg-surface` | `rgba(16, 16, 32, 0.85)` | Card backgrounds (frosted) |
| `--bg-surface-hover` | `rgba(20, 20, 40, 0.9)` | Card hover |
| `--bg-footer` | `#06060e` | Footer |
| `--text-primary` | `#e8e6f0` | Cool off-white |
| `--text-secondary` | `#8888aa` | Muted lavender |
| `--text-muted` | `#4a4a66` | Faint |

**CRT Effects:**
- `html, body` background-image — Phosphor dot grid (cyan horizontal + violet vertical micro-lines at low opacity) with edge vignette (radial-gradient darkening corners), `background-attachment: fixed`
- `body::after` — Full-viewport scanlines (repeating-linear-gradient, 3px spacing, z-index 9999, pointer-events: none) with subtle flicker animation
- `.hero::after` — Scanline sweep bar confined to hero section (120px bright bar sweeping top-to-bottom within hero, 10s linear infinite, 2-3% opacity, clipped by hero's `overflow: hidden`)
- `.btn-primary::after, .back-to-top::after` — Shared finer scanlines on button surfaces (2px spacing, consolidated CSS rule)
- `.hero-name` — Dual CRT glitch effects via `::before`/`::after` pseudo-elements with `content: attr(data-text)`, cyan/violet color channel split. JS-driven (`useRandomGlitch` hook in Hero.jsx): random interval (4-10s), randomly selects between effect 1 (standard: 500ms, 3-5px offsets) or effect 2 (intense: 700ms, 8-12px offsets + skewX + flicker gaps). Triggered by adding `.glitch-1`/`.glitch-2` CSS classes. Respects `prefers-reduced-motion`
- `.hero-name` — Flowing gradient text animation (`background-size: 300%`, 6s ease-in-out infinite)
- `@keyframes crtFlicker` — Gentle opacity oscillation on body scanlines
- `@media (prefers-reduced-motion: reduce)` — Disables flicker and all animations

**Shared CSS classes:**
- `.btn-primary` — Gradient pill button (50px radius, cyan→violet, CRT overlay via ::after)
- `.hero-cta-row` — Flex container for hero CTAs (gap, wrap, centered)
- `.hero-cta` — Hero CTA (inherits .btn-primary gradient pill)
- `.hero-cta--secondary` — Outlined CTA variant (transparent bg, cyan border, hover glow)
- `.store-item` — Frosted glass card (8px radius, backdrop-filter: blur(12px), cyan left-border glow on hover, mouse-follow glow via ::before, flexbox column layout with download button at bottom-center)
- `.section-title` — Left-aligned heading with engraved channel-number kicker (::before from data-kicker)
- `.toast` / `.toast--visible` — Fixed bottom-center notification with slide-up animation
- `.content-grid` — Responsive grid layout for patch bank and music sections (20px bottom padding)
- `.skeleton-card` — Loading placeholder card with cyan shimmer animation
- `.back-to-top` / `.back-to-top--visible` — Fixed gradient pill button with CRT overlay
- `.no-results` — Centered empty state message for search
- `.search-clear` — Clear button inside search input
**Key visual characteristics:**
- **Centered stacked hero** on all viewports (flexbox column, centered text)
- CRT phosphor grid on body background + edge vignette, scanlines across entire viewport (body::after), scanline sweep bar confined to hero section (.hero::after), and finer scanlines on buttons (::after)
- Frosted glass cards with `backdrop-filter: blur(12px)` on semi-transparent backgrounds
- Cards: 8px border-radius, cyan left-border glow on hover, mouse-follow radial glow (::before), neon box-shadow, flexbox column with download buttons bottom-center
- YouTube embeds: 85% width, 180px height within cards
- Buttons: pill-shaped (50px border-radius), gradient background
- Hero image: circular (50% radius, 260px desktop / 220px tablet / 180px mobile), cyan border with multi-layered neon glow
- Page scope (`LissajousHalo` in `components/graphics/`, rendered in `.page-scope` above the footer): a live XY-oscilloscope trace built from **parametric equations** (`parametric.js` — Lissajous + rose curves), centered at the foot of the page, morphing between figures via SMIL while an amber beam packet crawls the trace; slowly spins. Decorative, `aria-hidden`, dropped to a static curve under `prefers-reduced-motion`
- Hero content: max-width 900px, hero bio: max-width 820px
- Hero backdrop: 20% opacity background image
- Hero name: flowing gradient text (cyan→violet→cyan, 300% background-size) via `background-clip: text`, randomized dual CRT glitch via JS-driven `.glitch-1`/`.glitch-2` classes on ::before/::after pseudo-elements
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
- `@keyframes scanlineSweep` — Bright bar sweeping top-to-bottom within hero section only (10s, 2-3% opacity)
- `@keyframes heroGradientFlow` — Flowing cyan→violet gradient on hero name (6s ease-in-out infinite)
- `@keyframes glitch1Top / glitch1Bottom` — Standard CRT glitch (500ms, 3-5px translates, clip-path slices)
- `@keyframes glitch2Top / glitch2Bottom` — Intense CRT glitch (700ms, 8-12px translates, skewX distortion, flicker gaps)
- `@keyframes gradientFlow` — Flowing cyan→violet gradient on all section title underlines (3s linear infinite)
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
├── Hero (searchQuery, onSearchChange) — Centered stacked layout (flexbox column), scanline sweep bar (::after), useRandomGlitch hook
│   ├── Profile image (circular 50%, 260px, cyan border glow)
│   ├── Name (Space Grotesk 700, 3.5rem, flowing gradient text cyan→violet, randomized dual CRT glitch via JS + ::before/::after)
│   ├── Tagline (uppercase, 3px tracking, cyan)
│   ├── Bio paragraph
│   ├── CTA row (.hero-cta-row flex container)
│   │   ├── YouTube CTA (gradient pill button with CRT overlay)
│   │   └── Arcade link (outlined secondary CTA → /arcade.html)
│   └── Search input (pill-shaped, cyan focus ring) + clear button
├── SkeletonCard[] (×3, shown during loading)
├── NoResults (query) — shown when search yields no matches
├── Patch Banks section
│   └── PatchBankItem[] (bank, style={--card-index}, onDownload, cardGlowHandlers)
│       ├── Name, description
│       ├── YouTubeEmbed[] (videoId)
│       └── Download button (.btn-primary, triggers toast)
├── Music section (consistent background)
│   └── MusicItem[] (item, style={--card-index}, cardGlowHandlers)
│       ├── Title
│       ├── YouTubeEmbed (videoId)
│       └── Description
├── Page scope (.page-scope → LissajousHalo, centered parametric trace above footer)
├── Footer
│   ├── Nav links (YouTube, GitHub) — semantic <nav> element
│   ├── SignalMeter (Winamp-style spectrum analyzer; rAF paused off-screen via useInViewport)
│   └── Dynamic copyright year
└── Toast (message, visible) — download notification
```

**Arcade Page** (`arcade.html` — separate Vite entry point, zero impact on main bundle):
```
ArcadeApp
├── [Picker mode]
│   ├── ArcadeHeader — Back-to-home link, "ARCADE" gradient title
│   └── GamePicker — Flex row of CabinetCards
│       └── CabinetCard[] (game) — Mini arcade cabinet: screen area with scanlines, gradient marquee, decorative joystick/buttons, blinking "INSERT COIN"
├── [Game mode]
│   └── GameCanvas (game, onExit) — Full-screen fixed wrapper
│       ├── HUD bar (score, lives, level, ESC exit button)
│       ├── <canvas> — Game rendering (requestAnimationFrame loop via useGameLoop)
│       ├── CRT scanline overlay div (pointer-events: none)
│       ├── TouchControls — D-pad + action buttons (pointer: coarse only)
│       └── Game-over overlay (score, Play Again, Back to Arcade)
```

**Game Class Interface** (plain JS, no React — used by all 10 games):
- `init(w, h)` / `resize(w, h)` — Set up game state for canvas dimensions
- `update(dt)` / `render(ctx)` — Game loop (dt in seconds, ctx is CanvasRenderingContext2D)
- `handleKeyDown(key)` / `handleKeyUp(key)` — Keyboard input
- `handleTouchAction(action, active)` — Mobile touch controls
- `onHudUpdate` callback — Reports `{score, lives, level, gameOver}` to React HUD
- `destroy()` — Cleanup

## Development

```bash
npm install                    # Install dependencies
npm run dev                    # Vite dev server (requires Node.js 20.19+), serves both / and /arcade.html
npm test                       # Jest (737 tests, 46 suites)
npm run build                  # Vite production build (outputs both index.html and arcade.html)
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

- **Frontend path:** `/api` (routed through CloudFront, 5-minute edge cache)
- **Origin:** `https://hh2nvebg2jac4yabkprsserxcq0lvhid.lambda-url.us-east-1.on.aws/` (direct access returns 403 — locked down via OAC)
- **Auth:** `AWS_IAM` — CloudFront signs requests via OAC (SigV4), scoped to distribution
- **Cache-Control:** `public, max-age=300` on all responses (200 + 500)
- **CloudFront cache policy:** CachingOptimized (respects origin Cache-Control)
- **Origin request policy:** AllViewerExceptHostHeader (Lambda Function URLs reject mismatched Host)
- **Playlist ID:** `PLjHbhxiY56y28ezRPYzMi3lzV3nMQt-1c`
- **Max Results:** 50 items per request
- **Dev proxy:** Vite proxies `/api` through CloudFront (`https://alanmarcero.com`)

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
- Arcade games: Canvas-based, all game logic in plain JS classes (no external game libraries)

## Arcade Page

**URL:** `/arcade.html` (separate Vite entry point — not React Router)

**Architecture:** Separate `arcade.html` entry + `src/arcade/main.jsx` React root. Zero impact on main page bundle size. Vite handles shared vendor chunks (React) automatically via `build.rollupOptions.input` in `vite.config.js`.

**Games** (11 canvas-based games/toys, Outrun CRT palette only):
- **Space Invaders** — Cyan player ship, alien grid (cyan/violet/orange by row), destructible shields, levels increase alien speed
- **Asteroids** — Vector-style outlines (violet ship, cyan asteroid polygons, orange thrust), wrap-around edges, asteroids split on hit
- **Tetris** — 10x20 grid, 7 tetrominoes in palette colors, ghost piece, next-piece preview, line-clear flash, DAS key repeat
- **Pac-Man** — Maze with dots, power pellets, 4 ghosts with scatter/chase/frightened AI modes
- **Breakout** — Paddle + ball, 6x10 brick grid with row colors/scores, angle-based paddle deflection, 3 lives
- **Frogger** — Grid-based movement, road (vehicles) and river (logs) lanes, 5 goal slots, forward progress scoring
- **Snake** — Grid-based timer movement, food spawning, speed increase per food, wall/self collision, 1 life
- **Pong** — Player vs AI paddle, angle-based bounce, AI with reaction delay/imprecision, serve timer
- **Rhythm Catcher** — 4 lanes (arrow keys), falling notes, perfect/good timing windows, combo multiplier, pattern generation
- **Centipede** — Player in bottom zone, 10-segment centipede chain, mushroom field, spider enemy, segment splitting on hit
- **Bird Name Generator** — Press SPACE to generate absurd-but-real-sounding bird species (Boobie, Bushtit, Smew, etc.) combined with prefixes/colors/body parts; pixel-style bird mascot with randomized body, wings, crest, beak, and Latin name

**Mobile support:** Touch controls (d-pad + action buttons) appear on `pointer: coarse` devices. Uses `touchstart`/`touchend` with `preventDefault()`.

**CRT overlay on games:** CSS div with scanline `repeating-linear-gradient` positioned over the canvas + `crtFlicker` animation, `pointer-events: none`.

## Take Me Back (era themes)

A hero control (`TakeMeBack`, next to the Arcade link) opens a year picker that
re-skins **today's content** as a past version of alanmarcero.com. It is a theme
switch, not a content snapshot — the same React app (patch banks, music, search,
downloads) keeps working; only the skin changes. Years for 2007/2014/2020 come
from Wayback Machine captures; 2001 is an estimated GeoCities era.

- `src/eras/eras.js` — era metadata (`present`, `y2001`, `y2007`, `y2014`, `y2020`).
- `src/eras/useEra.js` — hook: reflects the era on `<html data-era>` and syncs `?era=`.
- `src/eras/eras.css` — all `[data-era="…"]` theme skins + GeoCities chrome + the time-travel bar.
- `src/eras/EraChrome.jsx` — a persistent time-travel bar (all past eras) plus, for
  GeoCities, an avalanche of real period GIFs (`public/eras/gifs/` — fire, anarchy,
  aliens/UFOs, StarCraft/Diablo/WarCraft, Netscape Now, etc. sourced from the
  Internet Archive's GifCities), marquees, corner stickers, a favorites wall, a
  fake hit counter, and a MIDI player.
- `src/eras/miditracks.js` + `src/eras/midiPlayer.js` + `src/components/MidiPlayer.jsx` —
  a Web Audio "MIDI" background player (autoplays sandstorm.mid; playlist also has
  Zombie Nation, Better Off Alone, Blood Is Pumping, Nokia, Für Elise). Synthesized
  riffs, no audio files; autoplay starts on the click that enters the era.

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

- **Lambda Function URL lockdown:** CloudFront Origin Access Control (OAC) with IAM auth. The Lambda Function URL auth type is `AWS_IAM` — direct access returns 403. Only CloudFront can invoke it via SigV4-signed requests, scoped to the specific distribution. Setup workflow: `infrastructure/cloudfront-add-oac.yml`
- **Lambda error responses:** Generic `{ error: "YouTube Fetch Failed" }` — no internal error messages leaked
- **External links:** All external links use `target="_blank" rel="noopener noreferrer"`
- **YouTube iframes:** Sandboxed with `allow-scripts allow-same-origin allow-popups allow-presentation`
- **Environment files:** `.env*` in `.gitignore`
- **SEO:** Meta description, canonical URL, theme-color meta tag
- **Last audit:** Feb 2026 — 0 critical, 0 high, 0 medium findings
