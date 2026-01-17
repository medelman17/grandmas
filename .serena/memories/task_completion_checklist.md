# Task Completion Checklist

When completing a task in this project, follow these steps:

## 1. Code Quality
- [ ] Run `npm run lint` and fix any ESLint errors
- [ ] Ensure TypeScript compiles without errors (`npm run build`)
- [ ] Follow existing code style and naming conventions

## 2. Testing
- [ ] Manually test changes in development (`npm run dev`)
- [ ] Test on localhost:3000
- [ ] Verify all 5 grandmas respond correctly (if relevant)
- [ ] Test debate functionality (if relevant)

## 3. Build Verification
- [ ] Run `npm run build` to ensure production build succeeds
- [ ] Check for any build warnings

## 4. Pre-Commit
- [ ] Review all changed files
- [ ] Ensure no sensitive data (API keys, etc.) is committed
- [ ] Write descriptive commit message

## 5. Deployment (if applicable)
- [ ] Deploy to Vercel: `vercel --prod`
- [ ] Verify deployment works correctly

## Important Notes
- Never use mock data as a workaround
- Ensure environment variables are properly configured
- Test the parallel streaming behavior with actual AI responses
