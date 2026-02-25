# Node.js 20 LTS 기반 이미지
FROM node:20-alpine

WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm install --production

# 소스 코드 복사
COPY src ./src

# Firebase 키 경로 설정 (런타임에 제공됨)
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/firebase-key.json

# 포트 8080 노출
EXPOSE 8080

# 애플리케이션 시작
CMD ["npm", "start"]
