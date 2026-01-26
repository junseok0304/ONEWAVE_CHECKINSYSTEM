# 빠른 배포 가이드 (Quick Start)

checkin.omong.kr 도메인에 배포하는 방법

## 1단계: 서버에 접속

```bash
ssh ubuntu@your-server-ip
```

## 2단계: 프로젝트 설정

```bash
# 디렉토리 생성
mkdir -p /opt/qrcheckin
cd /opt/qrcheckin

# 프로젝트 클론
git clone <your-repo-url> .

# 환경 변수 설정
cp .env.production .env

# 텍스트 에디터로 .env 파일 수정 (Firebase 정보, 비밀번호 등)
nano .env
```

### .env 파일에 수정할 항목:
- FIREBASE_PROJECT_ID
- FIREBASE_PRIVATE_KEY
- FIREBASE_CLIENT_EMAIL
- MASTER_PASSWORD
- KIOSK_PASSWORD

## 3단계: SSL 인증서 설정

```bash
# Let's Encrypt 설치
sudo apt-get install certbot python3-certbot-nginx -y

# 인증서 발급
sudo certbot certonly --standalone -d checkin.omong.kr

# 자동 갱신 설정 (이미 기본으로 설정됨)
sudo certbot renew --dry-run
```

## 4단계: Nginx 설정

```bash
# Nginx 설정 파일 복사
sudo cp /opt/qrcheckin/nginx.conf /etc/nginx/sites-available/qrcheckin

# 심링크 생성
sudo ln -s /etc/nginx/sites-available/qrcheckin /etc/nginx/sites-enabled/

# 문법 확인
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

## 5단계: Docker 서비스 시작

```bash
cd /opt/qrcheckin

# 배포 스크립트에 실행 권한 부여
chmod +x deploy.sh

# 서비스 시작
./deploy.sh start

# 상태 확인
./deploy.sh status
```

## 6단계: 배포 확인

```bash
# HTTPS 접속 테스트
curl https://checkin.omong.kr/health

# 로그 확인
./deploy.sh logs
```

## 완료!

이제 https://checkin.omong.kr 에서 애플리케이션에 접속할 수 있습니다.

---

## 유용한 명령어

```bash
# 배포 스크립트 사용법
./deploy.sh build              # 이미지 빌드
./deploy.sh start              # 서비스 시작
./deploy.sh restart            # 서비스 재시작
./deploy.sh stop               # 서비스 중지
./deploy.sh logs               # 모든 로그 출력
./deploy.sh logs-backend       # 백엔드 로그만
./deploy.sh logs-frontend      # 프론트엔드 로그만
./deploy.sh update             # 코드 업데이트 & 재배포
./deploy.sh status             # 상태 확인

# 직접 Docker Compose 사용
docker-compose ps              # 컨테이너 상태
docker-compose logs -f         # 실시간 로그
docker-compose restart         # 재시작
```

## 문제 해결

### 포트가 이미 사용 중인 경우
```bash
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :3000
sudo lsof -i :8080

# 프로세스 종료 (필요시)
sudo kill -9 <PID>
```

### 디스크 부족
```bash
df -h
./deploy.sh clean
```

### 컨테이너 오류
```bash
./deploy.sh logs
docker-compose ps
# 상태 확인 후 필요시
docker-compose down
docker-compose up -d
```

### SSL 인증서 갱신
```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

## 정기 유지보수

### 매일
```bash
./deploy.sh logs | grep -i error  # 에러 확인
```

### 매주
```bash
./deploy.sh status                # 디스크/메모리 확인
docker stats                      # CPU/메모리 모니터링
```

### 매달
```bash
sudo certbot certificates         # SSL 인증서 만료 확인
docker system prune -a            # 사용하지 않는 이미지 정리
```

## 코드 업데이트 배포

새로운 버전을 배포하려면:

```bash
cd /opt/qrcheckin

# 방법 1: 배포 스크립트 사용
./deploy.sh update

# 방법 2: 수동 배포
git pull origin main
docker-compose build
docker-compose up -d
```

## 긴급 롤백

배포 후 문제가 발생한 경우:

```bash
cd /opt/qrcheckin

# 이전 버전으로 돌아가기
git revert HEAD
docker-compose build
docker-compose up -d
```

더 자세한 정보는 `DEPLOYMENT.md`를 참고하세요.
