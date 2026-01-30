# Multi-stage build - Backend
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production

# Multi-stage build - Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .

# .env.production 파일이 있으면 사용하기 위해 빌드 시 포함
COPY frontend/.env.production .env.production 2>/dev/null || true

RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Backend 설정
COPY --from=backend-builder /app/backend/node_modules /app/backend/node_modules
COPY backend /app/backend

# Frontend 빌드 결과 (필요시)
COPY --from=frontend-builder /app/frontend/.next /app/frontend/.next
COPY --from=frontend-builder /app/frontend/node_modules /app/frontend/node_modules
COPY frontend/package*.json /app/frontend/

# 헬스 체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8081', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 8081 3000

# 동시 실행을 위해 concurrently 설치
RUN npm install -g concurrently

# Backend와 Frontend 동시 실행 (Frontend는 포트 3001 사용)
CMD ["sh", "-c", "concurrently 'node backend/src/server.js' 'cd frontend && PORT=3001 npm start'"]
