# TODO List for Sishu Arogaya Development

## Completed Tasks
- [x] Replace npx with npm usage: Verified no `npx` commands in source code/package.json/scripts. Project already uses npm run scripts exclusively (e.g., npm run dev using concurrently/nodemon/vite).

## Pending Tasks
1. Set up MongoDB connection (fix MONGO_URI loading - install server deps)
2. Test new diet features (seedDiet.js, DietPlan page)
3. Fix GitHub CLI PATH (restart VSCode after winget install)
4. Create PR for changes

## Next Steps
- Run `npm run dev` at root
- Register/login at http://localhost:5173
- Test diet plan endpoints
