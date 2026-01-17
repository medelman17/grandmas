# Suggested Commands

## Development
```bash
npm run dev      # Start Next.js development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Deployment
```bash
vercel --prod    # Deploy to Vercel production
```

## Git
```bash
git status       # Check working tree status
git diff         # View unstaged changes
git add .        # Stage all changes
git commit -m "message"  # Commit changes
git push         # Push to remote
```

## System Utilities (macOS/Darwin)
```bash
ls -la           # List files with details
find . -name "*.ts"  # Find TypeScript files
grep -r "pattern" .  # Search for pattern
cat filename     # View file contents
```

## Environment
Required environment variable:
```
AI_GATEWAY_API_KEY=<vercel-ai-gateway-key>
```
Get from: Vercel Dashboard → AI Gateway → API Keys
