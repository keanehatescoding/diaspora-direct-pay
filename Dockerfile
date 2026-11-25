# Production image: build with the lockfile, then run only the built app.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
# Only the Next.js cache needs to be writable at runtime; keep source and
# dependencies root-owned and read-only to the service user.
RUN mkdir -p /app/.next/cache && chown -R node:node /app/.next
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "const p=process.env.PORT||'3000'; fetch('http://127.0.0.1:'+p+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Apply migrations before serving. DATABASE_URL is supplied by the platform.
CMD ["sh", "-c", "npm run db:migrate && npm start"]
