# 빌드 단계
FROM node:20-alpine AS builder

WORKDIR /app

# 빌드 시점에 환경 변수 주입
ARG NEXT_PUBLIC_API_BASE_URL=http://backend:8080/api
ARG NEXT_PUBLIC_MASTER_PASSWORD=1q2w3e4r!@#
ARG NEXT_PUBLIC_KIOSK_PASSWORD=omonghackathon

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_MASTER_PASSWORD=$NEXT_PUBLIC_MASTER_PASSWORD
ENV NEXT_PUBLIC_KIOSK_PASSWORD=$NEXT_PUBLIC_KIOSK_PASSWORD

COPY package*.json ./

RUN npm install

COPY . .

# Next.js 빌드
RUN npm run build

# 실행 단계 (경량 이미지)
FROM node:20-alpine

WORKDIR /app

RUN npm install -g next

COPY package*.json ./

RUN npm install --production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/package.json ./package.json

# 포트 3000 노출
EXPOSE 3000

# 애플리케이션 시작
CMD ["npm", "start"]
