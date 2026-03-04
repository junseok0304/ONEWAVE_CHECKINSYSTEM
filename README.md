# ONEWAVE Checkin System

QR 코드 및 휴대폰 번호 기반의 실시간 행사 참가자 체크인 시스템입니다. 키오스크 모드와 관리자 대시보드를 통해 효율적인 행사 운영을 지원합니다.

## 📋 주요 기능

### 키오스크 (Kiosk)
- 휴대폰 번호 끝 4자리로 참가자 검색
- 디스코드 인증 상태 표시 (가입함/확인중/거절됨)
- 실시간 체크인/체크아웃 처리
- 운영진 구분 표시

### 관리자 대시보드 (Admin)
- 실시간 체크인 현황 모니터링
- 팀별 체크인 상태 시각화
- 참가자 목록 조회 및 관리
- 메모 작성 및 체크아웃 처리
- 비밀번호 인증 기반 접근 제어

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 14 (React)
- **Styling**: CSS Modules
- **HTTP Client**: Fetch API
- **State Management**: React Hooks

### Backend
- **Framework**: Express.js (Node.js)
- **Database**: Google Firebase Firestore
- **Authentication**: Password-based (환경변수)
- **Deployment**: Node.js compatible server

## 📁 프로젝트 구조

```
qrcheckin/
├── frontend/           # Next.js 프론트엔드
│   ├── src/
│   │   └── app/
│   │       ├── kiosk/              # 키오스크 모드
│   │       │   ├── agreement/      # 약관 동의
│   │       │   ├── checkin/        # 체크인 화면
│   │       │   ├── success/        # 체크인 성공
│   │       │   └── error/          # 에러 화면
│   │       └── admin/              # 관리자 모드
│   │           ├── page.jsx        # 대시보드
│   │           ├── participants/   # 참가자 관리
│   │           └── layout.jsx      # 관리자 레이아웃
│   ├── .env.local
│   └── package.json
│
├── backend/            # Express.js 백엔드
│   ├── src/
│   │   ├── index.js           # 메인 진입점
│   │   ├── routes.js          # API 라우트
│   │   ├── firestore.js       # Firestore 초기화
│   │   ├── authMiddleware.js  # 인증 미들웨어
│   │   └── server.js          # 서버 설정
│   ├── .env
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

## 🚀 설치 및 실행

### 사전 요구사항
- Node.js 18+
- npm 또는 yarn
- Google Firebase Project (Firestore)
- Firebase Admin SDK 서비스 계정 JSON

### 1. 저장소 클론

```bash
git clone https://github.com/ONEWAVE/ONEWAVE_CHECKINSYSTEM.git
cd qrcheckin
```

### 2. 백엔드 설정

#### 2-1. 의존성 설치
```bash
cd backend
npm install
```

#### 2-2. 환경 변수 설정

`.env.example`을 참고하여 `.env` 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일 수정:
```env
PORT=8080
FIREBASE_PROJECT_ID=your-firebase-project-id
GOOGLE_APPLICATION_CREDENTIALS=./path-to-firebase-adminsdk.json
MASTER_PASSWORD=your-secure-master-password
KIOSK_PASSWORD=your-kiosk-password
CORS_ORIGIN=http://localhost:3000
```

#### 2-3. Firebase 서비스 계정 JSON 배치

Firebase Console에서 다운로드한 서비스 계정 JSON 파일을 `backend/` 디렉토리에 배치:

```bash
# backend 디렉토리에 JSON 파일 복사
cp /path/to/firebase-adminsdk-*.json ./
```

#### 2-4. 백엔드 실행

```bash
npm start
```

출력 예:
```
Server is running on http://localhost:8080
```

### 3. 프론트엔드 설정

#### 3-1. 의존성 설치
```bash
cd ../frontend
npm install
```

#### 3-2. 환경 변수 설정

`.env.local` 파일 수정:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
ADMIN_UI_PASSWORD=REDACTED_SECRET
MASTER_PASSWORD=your-secure-master-password
BACKEND_INTERNAL_URL=http://localhost:8080/api
```

`ADMIN_UI_PASSWORD`는 관리자 페이지 진입용 비밀번호이고, `MASTER_PASSWORD`는 프론트엔드 서버가 백엔드 관리자 API와 통신할 때만 사용하는 서버 전용 비밀번호입니다.

#### 3-3. 프론트엔드 실행

```bash
npm run dev
```

출력 예:
```
  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
```

## 🤝 기여

버그 리포트나 기능 제안은 GitHub Issues를 통해 제출해주세요.

## 👥 팀

ONEWAVE Hackathon Team

## 📞 지원

문제 발생 시 GitHub Issues를 통해 리포트해주세요.
