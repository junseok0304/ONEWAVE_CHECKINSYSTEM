# 배포 체크리스트

배포 전에 다음 항목들을 확인하세요.

## 사전 준비 (배포 전 로컬에서)

### 코드 준비
- [ ] 모든 코드 변경사항이 git에 커밋되었는가?
- [ ] 환경 변수가 올바르게 설정되었는가?
- [ ] 프론트엔드 빌드가 성공하는가? (`npm run build`)
- [ ] 백엔드가 정상 작동하는가? (`npm start`)
- [ ] 테스트가 모두 통과하는가?

### 배포 파일 확인
- [ ] `docker-compose.yml` 파일이 있는가?
- [ ] `Dockerfile`이 프론트엔드에 있는가?
- [ ] `Dockerfile`이 백엔드에 있는가?
- [ ] `nginx.conf` 파일이 있는가?
- [ ] `.dockerignore` 파일들이 있는가?
- [ ] `.env.production` 파일이 있는가?

### 환경 변수
- [ ] Firebase 프로젝트 ID가 올바른가?
- [ ] Firebase 개인 키가 올바른가?
- [ ] Firebase 서비스 계정 이메일이 올바른가?
- [ ] 마스터 비밀번호가 설정되었는가?
- [ ] 키오스크 비밀번호가 설정되었는가?
- [ ] API URL이 HTTPS인가? (https://checkin.omong.kr/api)

## 서버 준비 (배포 전 서버에서)

### 시스템 설정
- [ ] Ubuntu 18.04 이상이 설치되었는가?
- [ ] Docker가 설치되었는가?
- [ ] Docker Compose가 설치되었는가?
- [ ] Nginx가 설치되었는가?
- [ ] 충분한 디스크 공간이 있는가? (최소 5GB 권장)

### 방화벽 및 포트
- [ ] 포트 80이 열려있는가?
- [ ] 포트 443이 열려있는가?
- [ ] 포트 3000이 내부에서만 사용되는가?
- [ ] 포트 8080이 내부에서만 사용되는가?

### SSL 인증서
- [ ] SSL 인증서가 발급되었는가? (`sudo certbot certificates`)
- [ ] 인증서 경로가 올바른가? (/etc/letsencrypt/live/checkin.omong.kr/)
- [ ] 인증서가 유효한가? (만료 기한 확인)

### 디렉토리 준비
- [ ] `/opt/qrcheckin` 디렉토리가 생성되었는가?
- [ ] 저장소가 클론되었는가?
- [ ] `.env` 파일이 생성되었는가?
- [ ] `.env` 파일에 올바른 값이 입력되었는가?

## 배포 실행

### 서버에 배포
```bash
cd /opt/qrcheckin
docker-compose up -d
```

### 배포 후 확인
- [ ] 모든 컨테이너가 실행 중인가? (`docker-compose ps`)
- [ ] 백엔드 로그에 에러가 없는가? (`docker-compose logs backend`)
- [ ] 프론트엔드 로그에 에러가 없는가? (`docker-compose logs frontend`)
- [ ] 헬스 체크가 통과하는가? (`curl https://checkin.omong.kr/health`)

## 기능 테스트

### 접근성 테스트
- [ ] HTTPS로 접속 가능한가? (https://checkin.omong.kr)
- [ ] HTTP는 HTTPS로 리다이렉트되는가?
- [ ] 메인 페이지가 로드되는가?
- [ ] 스타일이 올바르게 적용되는가?

### 기능 테스트
- [ ] 관리자 페이지에 접속 가능한가? (https://checkin.omong.kr/admin)
- [ ] 관리자 비밀번호로 로그인 가능한가?
- [ ] 키오스크 페이지에 접속 가능한가? (https://checkin.omong.kr/kiosk)
- [ ] 키오스크 비밀번호로 로그인 가능한가?

### API 테스트
- [ ] GET /api/participants 응답하는가?
- [ ] GET /api/search?phoneLast4=0304 응답하는가?
- [ ] POST /api/checkin 응답하는가?
- [ ] 인증이 올바르게 작동하는가?

### 데이터베이스 테스트
- [ ] 참가자 데이터가 정상적으로 로드되는가?
- [ ] 체크인/체크아웃 데이터가 저장되는가?
- [ ] 메모가 저장되는가?

## 배포 후 모니터링

### 첫 24시간
- [ ] 에러 로그를 모니터링하는가?
- [ ] 메모리 사용량이 정상인가?
- [ ] 디스크 사용량이 정상인가?
- [ ] 사용자들의 피드백이 없는가?

### 정기 점검
- [ ] 주 1회 로그 검토
- [ ] 월 1회 SSL 인증서 상태 확인
- [ ] 월 1회 백업 확인

## 롤백 계획

배포 후 문제가 발생한 경우:

### 즉시 조치
```bash
# 현재 상태 저장
git log --oneline -5

# 이전 버전으로 롤백
git checkout <previous-commit>
docker-compose build
docker-compose up -d
```

### 컨테이너 재시작
```bash
docker-compose restart
```

### 전체 재배포
```bash
docker-compose down
rm -rf backups/*
git pull origin main
docker-compose up -d
```

## 비상 연락처
- Firebase 지원: https://firebase.google.com/support
- Let's Encrypt 지원: https://letsencrypt.org/
- Docker 지원: https://www.docker.com/
