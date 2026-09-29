# Multi-stage Docker build for Football Multiplayer Game
FROM node:20-alpine AS build

WORKDIR /app

# 1. Build Frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend ./frontend
RUN cd frontend && npm run build

# 2. Production Server
FROM node:20-alpine AS production

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

COPY backend ./backend
COPY --from=build /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST_USERNAME=yuED10
ENV DEFAULT_INVITE_CODE=FUT2026

EXPOSE 4000

CMD ["node", "backend/src/server.js"]
