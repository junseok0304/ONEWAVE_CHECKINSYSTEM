#!/bin/bash

# 배포 스크립트
# 사용법: ./deploy.sh [명령어]
# 명령어: build, start, stop, restart, logs, update, clean

set -e

PROJECT_DIR="/opt/qrcheckin"
REPO_URL="<your-git-repo-url>"
BRANCH="main"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 함수 정의
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 프로젝트 디렉토리로 이동
cd "$PROJECT_DIR" || exit 1

case "$1" in
    build)
        log_info "이미지 빌드 중..."
        docker-compose build
        log_info "빌드 완료"
        ;;
    start)
        log_info "서비스 시작 중..."
        docker-compose up -d
        log_info "서비스 시작 완료"
        log_info "상태 확인 중..."
        sleep 5
        docker-compose ps
        ;;
    stop)
        log_info "서비스 중지 중..."
        docker-compose down
        log_info "서비스 중지 완료"
        ;;
    restart)
        log_info "서비스 재시작 중..."
        docker-compose restart
        log_info "서비스 재시작 완료"
        ;;
    logs)
        log_info "로그 출력 중... (Ctrl+C로 중단)"
        docker-compose logs -f
        ;;
    logs-backend)
        log_info "백엔드 로그 출력 중... (Ctrl+C로 중단)"
        docker-compose logs -f backend
        ;;
    logs-frontend)
        log_info "프론트엔드 로그 출력 중... (Ctrl+C로 중단)"
        docker-compose logs -f frontend
        ;;
    update)
        log_info "최신 코드 가져오는 중..."
        git pull origin "$BRANCH"
        log_info "이미지 빌드 중..."
        docker-compose build
        log_info "서비스 재시작 중..."
        docker-compose up -d
        log_info "업데이트 완료"
        log_info "상태 확인 중..."
        sleep 5
        docker-compose ps
        ;;
    clean)
        log_warn "사용하지 않는 Docker 리소스 정리 중..."
        read -p "정말 진행하시겠습니까? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker system prune -a
            log_info "정리 완료"
        else
            log_info "취소됨"
        fi
        ;;
    status)
        log_info "서비스 상태:"
        docker-compose ps
        log_info ""
        log_info "디스크 사용량:"
        df -h "$PROJECT_DIR"
        ;;
    backup)
        log_info "데이터 백업 중..."
        BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        cp .env "$BACKUP_DIR/"
        log_info "백업 완료: $BACKUP_DIR"
        ;;
    *)
        echo "QR Checkin 배포 스크립트"
        echo ""
        echo "사용법: $0 [명령어]"
        echo ""
        echo "명령어:"
        echo "  build              - Docker 이미지 빌드"
        echo "  start              - 서비스 시작"
        echo "  stop               - 서비스 중지"
        echo "  restart            - 서비스 재시작"
        echo "  logs               - 모든 로그 출력"
        echo "  logs-backend       - 백엔드 로그만 출력"
        echo "  logs-frontend      - 프론트엔드 로그만 출력"
        echo "  update             - 코드 업데이트 및 재배포"
        echo "  clean              - Docker 리소스 정리"
        echo "  status             - 서비스 상태 확인"
        echo "  backup             - 설정 백업"
        echo ""
        exit 1
        ;;
esac
