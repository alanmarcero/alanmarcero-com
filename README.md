# alanmarcero.com

Personal website for a music producer showcasing synthesizer patch banks and YouTube music content.

**Live site:** [alanmarcero.com](https://alanmarcero.com)

## Tech Stack

- **Frontend:** React 19, Vite 7
- **Styling:** CSS custom properties, Google Fonts (Inter, Space Grotesk)
- **Backend:** AWS Lambda (TypeScript) for YouTube playlist API
- **Hosting:** S3 + CloudFront, Route 53
- **Testing:** Jest 30, React Testing Library (127 tests)
- **CI/CD:** GitHub Actions — auto-deploys on push to `main`

## Development

```bash
npm install       # Install dependencies
npm run dev       # Start Vite dev server (http://localhost:5173)
npm test          # Run all tests
npm run build     # Production build
```

Requires **Node.js 20.19+** (Vite 7 requirement). Use `nvm use 20.19.6` if needed.

## Deployment

Pushes to `main` trigger automatic deployment via GitHub Actions:
1. Frontend builds and syncs to S3, then invalidates CloudFront cache
2. Lambda compiles TypeScript, zips, and updates the function

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `S3_BUCKET_NAME` | S3 bucket for frontend |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID |
| `LAMBDA_FUNCTION_NAME` | Lambda function name |

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
3. Push to `main` (auto-deploys)

## License

ISC
