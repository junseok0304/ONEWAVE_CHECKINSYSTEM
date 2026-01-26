# QR Checkin 배포 가이드

## 개요
Ubuntu 서버에 Docker Compose와 Nginx를 사용한 배포 설정입니다.

## 사전 요구사항
- Ubuntu 서버 (18.04 이상)
- Docker & Docker Compose 설치됨
- Nginx 설치됨
- SSL 인증서 (Let's Encrypt)

## 배포 단계

### 1. 서버 준비 (한 번만 수행)

#### 1-1. 프로젝트 디렉토리 생성
```bash
mkdir -p /opt/qrcheckin
cd /opt/qrcheckin
```

#### 1-2. 프로젝트 클론
```bash
git clone <your-repo-url> .
```

#### 1-3. 환경 변수 설정
```bash
cp .env.production .env
# 실제 값으로 수정
nano .env
```

필요한 환경 변수:
- `FIREBASE_PROJECT_ID`: Firebase 프로젝트 ID
- `FIREBASE_PRIVATE_KEY`: Firebase 서비스 계정 개인 키
- `FIREBASE_CLIENT_EMAIL`: Firebase 서비스 계정 이메일
- `MASTER_PASSWORD`: 관리자 비밀번호
- `KIOSK_PASSWORD`: 키오스크 비밀번호

#### 1-4. SSL 인증서 설정 (Let's Encrypt)
```bash
sudo apt-get install certbot python3-certbot-nginx -y

# 첫 인증서 발급
sudo certbot certonly --standalone -d checkin.omong.kr

# 자동 갱신 설정 (기본값으로 자동 활성화)
sudo certbot renew --dry-run
```

#### 1-5. Nginx 설정
```bash
# Nginx 기본 설정 백업
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# 프로젝트의 nginx.conf를 Nginx sites-available에 복사
sudo cp nginx.conf /etc/nginx/sites-available/qrcheckin

# sites-enabled 심링크
sudo ln -s /etc/nginx/sites-available/qrcheckin /etc/nginx/sites-enabled/

# Nginx 문법 확인
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

### 2. 애플리케이션 시작

#### 2-1. Docker Compose로 실행
```bash
cd /opt/qrcheckin

# 백그라운드에서 실행
docker-compose up -d

# 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f
```

#### 2-2. 서비스 상태 확인
```bash
# 백엔드 헬스 체크
curl http://localhost:8080/

# 프론트엔드 헬스 체크
curl http://localhost:3000/

# Nginx를 통한 확인
curl https://checkin.omong.kr/health
```

### 3. 유지보수

#### 로그 확인
```bash
# 모든 서비스 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f backend
docker-compose logs -f frontend

# Nginx 로그
sudo tail -f /var/log/nginx/qrcheckin_access.log
sudo tail -f /var/log/nginx/qrcheckin_error.log
```

#### 업데이트
```bash
cd /opt/qrcheckin

# 최신 코드 가져오기
git pull origin main

# 이미지 다시 빌드
docker-compose build

# 서비스 재시작
docker-compose up -d
```

#### 서비스 중지
```bash
docker-compose down
```

#### 전체 재시작
```bash
docker-compose restart
```

### 4. 문제 해결

#### 포트 충돌
```bash
# 포트 사용 확인
sudo lsof -i :3000
sudo lsof -i :8080
sudo lsof -i :80
sudo lsof -i :443
```

#### 디스크 공간 정리
```bash
# 사용하지 않는 Docker 이미지/컨테이너 정리
docker system prune -a
```

#### 환경 변수 재설정
```bash
# .env 파일 수정 후
docker-compose down
docker-compose up -d
```

#### SSL 인증서 갱신
```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### 5. 시스템 서비스로 등록 (선택사항)

Systemd 서비스로 자동 시작 설정:

```bash
sudo nano /etc/systemd/system/qrcheckin.service
```

다음 내용 추가:
```ini
[Unit]
Description=QR Checkin Docker Compose
After=docker.service
Requires=docker.service

[Service]
Type=simple
WorkingDirectory=/opt/qrcheckin
ExecStart=/usr/bin/docker-compose up
ExecStop=/usr/bin/docker-compose down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

활성화:
```bash
sudo systemctl daemon-reload
sudo systemctl enable qrcheckin
sudo systemctl start qrcheckin
```

### 6. 모니터링 설정 (선택사항)

#### 디스크 공간 모니터링
```bash
df -h /opt/qrcheckin
```

#### 프로세스 모니터링
```bash
docker stats
```

## 주요 포트 정보
- HTTP: 80
- HTTPS: 443
- 백엔드 (내부): 8080
- 프론트엔드 (내부): 3000

## 도메인 및 접근 방법
- 메인 도메인: https://checkin.omong.kr
- API: https://checkin.omong.kr/api/*
- 관리자: https://checkin.omong.kr/admin
- 키오스크: https://checkin.omong.kr/kiosk

## 문제 발생 시 체크리스트
- [ ] 환경 변수 설정 확인 (.env 파일)
- [ ] Firebase 자격증명 확인
- [ ] SSL 인증서 유효성 확인 (`sudo certbot certificates`)
- [ ] Nginx 로그 확인
- [ ] Docker Compose 로그 확인
- [ ] 디스크 공간 확인
- [ ] 네트워크 연결 확인

## 배포 후 테스트 체크리스트
- [ ] HTTPS 접속 확인
- [ ] 메인 페이지 로드 확인
- [ ] 관리자 로그인 확인
- [ ] 키오스크 페이지 확인
- [ ] API 엔드포인트 응답 확인
- [ ] 데이터베이스 연결 확인
- [ ] 정적 파일 로딩 확인
