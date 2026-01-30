# QRCheckin Docker 배포 가이드

## 📋 배포 전 준비사항

### 1. 원격 서버 준비

```bash
# SSH로 omong-public 서버 접속
ssh omong-public

# Docker 설치 확인
docker --version
docker-compose --version

# 배포 디렉토리 생성
mkdir -p /opt/qrcheckin
cd /opt/qrcheckin
```

### 2. 환경 변수 설정

원격 서버에서 `.env.production` 파일 생성:

```bash
ssh omong-public
cd /opt/qrcheckin
cat > .env.production << 'ENV'
# Firebase 설정
FIREBASE_PROJECT_ID=onewave-bot
GOOGLE_APPLICATION_CREDENTIALS=/opt/qrcheckin/firebase-admin.json

# 인증 설정
MASTER_PASSWORD=your-strong-password-here
KIOSK_PASSWORD=your-kiosk-password-here

# 기타 설정
CORS_ORIGIN=https://checkin.omong.kr
NODE_ENV=production
ENV
```

### 3. Firebase 서비스 계정 키 설정

원격 서버에 Firebase 서비스 계정 JSON 파일을 업로드:

```bash
# 로컬에서 원격 서버로 파일 복사
scp /path/to/firebase-admin.json omong-public:/opt/qrcheckin/

# 또는 원격 서버에서 직접 생성
ssh omong-public
cat > /opt/qrcheckin/firebase-admin.json << 'JSON'
{
  "type": "service_account",
  "project_id": "onewave-bot",
  ...
}
JSON
```

## 🚀 배포 실행

### 자동 배포 스크립트 사용

```bash
# 로컬에서 실행
cd /Users/junseok/Desktop/project/qrcheckin
./deploy.sh production omong-public
```

### 수동 배포

```bash
# 1. 원격 서버에 접속
ssh omong-public
cd /opt/qrcheckin

# 2. 최신 코드 다운로드
git clone https://github.com/your-repo/qrcheckin.git .
# 또는
git pull origin main

# 3. Docker 빌드 및 실행
docker-compose build --no-cache
docker-compose up -d

# 4. 상태 확인
docker-compose ps
docker-compose logs -f
```

## 🔍 배포 후 확인

```bash
# 서비스 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f

# API 헬스 체크
curl http://localhost:8081/api

# 컨테이너 내부 접속
docker-compose exec backend sh
```

## 📊 주요 포트

- **8081**: Backend API
- **3000**: Frontend (Next.js)

## 🔒 보안 주의사항

1. `.env.production` 파일은 git에 커밋하지 말 것
2. Firebase 키 파일은 절대 공개하지 말 것
3. 프로덕션 환경에서는 HTTPS 사용 필수
4. 방화벽 설정으로 포트 제한

## 🚨 문제 해결

### 컨테이너가 시작되지 않음

```bash
# 로그 확인
docker-compose logs

# 이미지 재빌드
docker-compose build --no-cache --pull

# 모든 컨테이너 제거 후 재시작
docker-compose down -v
docker-compose up -d
```

### 환경 변수 오류

```bash
# .env.production 파일 확인
cat .env.production

# 필수 환경 변수 확인
grep -E "FIREBASE_PROJECT_ID|MASTER_PASSWORD" .env.production
```

### Firebase 연결 오류

```bash
# Firebase 키 파일 권한 확인
ls -la firebase-admin.json

# GOOGLE_APPLICATION_CREDENTIALS 경로 확인
echo $GOOGLE_APPLICATION_CREDENTIALS
```

## 🔄 배포 후 업데이트

```bash
# 새 버전 배포
git pull origin main
docker-compose build --no-cache
docker-compose up -d

# 이전 버전으로 롤백
docker-compose down
git checkout [이전-커밋-해시]
docker-compose up -d
```

## 📝 모니터링

```bash
# 실시간 로그 모니터링
docker-compose logs -f backend

# 컨테이너 리소스 사용량
docker stats qrcheckin-backend

# 헬스 체크 상태
docker ps --filter "name=qrcheckin-backend" --format "table {{.Names}}\t{{.Status}}"
```

---

**배포 완료 후 다음을 확인하세요:**
- [ ] API가 정상 작동하는가?
- [ ] 프론트엔드가 로드되는가?
- [ ] 체크인 기능이 작동하는가?
- [ ] 로그에 에러가 없는가?
