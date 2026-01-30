#!/bin/bash

# 배포 스크립트
# 사용법: ./deploy.sh [환경] [호스트]
# 예: ./deploy.sh production omong-public

set -e

ENVIRONMENT=${1:-production}
HOST=${2:-omong-public}
PROJECT_NAME="qrcheckin"
DEPLOY_PATH="/opt/qrcheckin"

echo "🚀 Docker 배포 시작"
echo "환경: $ENVIRONMENT"
echo "호스트: $HOST"
echo "=================="

# 1. 현재 변경사항 커밋 확인
echo "✓ Git 상태 확인..."
if [[ -n $(git status -s) ]]; then
    echo "❌ 변경사항이 있습니다. 먼저 커밋해주세요."
    git status
    exit 1
fi

# 2. 최신 코드 푸시
echo "📤 코드를 원격 저장소에 푸시..."
git push origin main

# 3. 원격 서버에 배포
echo "🔗 원격 서버에 연결 중..."

ssh $HOST << DEPLOY_SCRIPT
set -e

echo "📁 배포 디렉토리 생성..."
mkdir -p $DEPLOY_PATH
cd $DEPLOY_PATH

echo "📥 최신 코드 다운로드..."
if [ -d ".git" ]; then
    git fetch origin
    git reset --hard origin/main
else
    git clone $(git -C /Users/junseok/Desktop/project/$PROJECT_NAME remote get-url origin) .
fi

echo "🔐 환경 변수 파일 설정..."
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production 파일이 없습니다."
    echo "원격 서버에서 다음 파일을 생성해주세요: $DEPLOY_PATH/.env.production"
    echo ""
    echo "필요한 환경 변수:"
    cat << 'ENV'
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-admin.json
MASTER_PASSWORD=your-password
KIOSK_PASSWORD=your-password
CORS_ORIGIN=https://checkin.omong.kr
NODE_ENV=production
ENV
    exit 1
fi

echo "🐳 Docker 컨테이너 중지 및 제거..."
docker-compose down || true

echo "🔨 Docker 이미지 빌드..."
docker-compose build --no-cache

echo "🚀 Docker 컨테이너 시작..."
docker-compose up -d

echo "⏳ 서비스 헬스 체크..."
sleep 10

if docker-compose ps | grep -q "healthy"; then
    echo "✅ 배포 완료!"
    echo ""
    echo "서비스 상태:"
    docker-compose ps
else
    echo "⚠️  서비스가 시작되지 않았습니다. 로그 확인:"
    docker-compose logs
    exit 1
fi

DEPLOY_SCRIPT

echo ""
echo "✅ 배포가 완료되었습니다!"
echo "📍 서비스 URL:"
echo "   - Backend API: http://omong-public:8081/api"
echo "   - Frontend: http://omong-public:3000"
echo ""
echo "📊 로그 확인:"
echo "   ssh omong-public 'cd /opt/qrcheckin && docker-compose logs -f'"

