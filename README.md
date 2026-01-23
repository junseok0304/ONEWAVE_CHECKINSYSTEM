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
NEXT_PUBLIC_MASTER_PASSWORD=your-secure-master-password
NEXT_PUBLIC_KIOSK_PASSWORD=your-kiosk-password
```

**주의**: `NEXT_PUBLIC_`로 시작하는 변수는 클라이언트에 노출됩니다. 개발 환경에서만 간단한 비밀번호를 사용하세요.

#### 3-3. 프론트엔드 실행

```bash
npm run dev
```

출력 예:
```
  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
```

### 4. 접근 가능한 페이지

- **키오스크**: http://localhost:3000/kiosk/agreement
- **관리자 로그인**: http://localhost:3000/admin (마스터 비밀번호)
- **API 문서**: http://localhost:8080/api (API 온라인 확인)

## 📡 API 엔드포인트

### 공개 엔드포인트

#### `GET /api`
API 서버 상태 확인
```bash
curl http://localhost:8080/api
```

#### `GET /api/search?phoneLast4=XXXX`
휴대폰 번호 끝 4자리로 참가자 검색
```bash
curl "http://localhost:8080/api/search?phoneLast4=2222"
```

응답:
```json
[
  {
    "id": "01022222222",
    "name": "홍길동",
    "phone_number": "01022222222",
    "checked_in_status": false,
    "team_number": "3",
    "status": "APPROVED"
  }
]
```

#### `POST /api/checkin`
체크인 처리
```bash
curl -X POST http://localhost:8080/api/checkin \
  -H "Content-Type: application/json" \
  -d '{"participantId":"01022222222"}'
```

### 보호된 엔드포인트 (마스터 비밀번호 필요)

#### `GET /api/participants`
전체 참가자 목록 조회
```bash
curl "http://localhost:8080/api/participants" \
  -H "x-api-key: your-master-password"
```

#### `PUT /api/participants/:participantId`
참가자 정보 수정 (메모, 체크아웃 등)
```bash
curl -X PUT "http://localhost:8080/api/participants/01022222222" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-master-password" \
  -d '{"memo":"테스트 메모","checked_in_status":true}'
```

## 🔒 보안

### 환경 변수 관리
- `.env` 파일은 **절대 GitHub에 커밋하지 마세요**
- `.gitignore`에 `.env` 파일이 제외되도록 설정했습니다
- 프로덕션 배포 시 환경 변수를 서버 환경에서 직접 설정하세요

### Firebase 보안
- 서비스 계정 JSON 파일을 **안전하게 관리**하세요
- `.gitignore`에 `*-firebase-adminsdk-*.json` 패턴으로 제외했습니다
- 서버 환경에서만 접근 가능하도록 설정하세요

### 비밀번호 정책
- 프로덕션 환경에서는 **강력한 비밀번호**를 사용하세요
- 관리자용 비밀번호와 키오스크용 비밀번호를 구분하세요
- 정기적으로 비밀번호를 변경하세요

## 📊 Firestore 데이터 구조

### `participants` 컬렉션

```javascript
{
  id: "01022222222",           // 휴대폰 번호 (Primary Key)
  name: "홍길동",               // 이름
  phone_number: "01022222222", // 휴대폰 번호
  team_number: "3",            // 팀 번호
  part: "FE",                  // 파트 (FE/BE/etc)
  status: "APPROVED",          // Discord 인증 상태 (APPROVED/PENDING/REJECTED)
  checked_in_status: true,     // 체크인 여부
  checkedInAt: Timestamp,      // 체크인 시간
  checkedOutAt: Timestamp,     // 체크아웃 시간
  memo: "메모",                // 운영진 메모
  checkedOutMemo: "퇴장 메모",  // 체크아웃 메모
  updatedAt: Timestamp         // 마지막 수정 시간
}
```

## 🐛 트러블슈팅

### 1. "포트 8080이 이미 사용 중입니다" 오류

포트를 변경하거나 기존 프로세스를 종료하세요:

```bash
# 포트 8080 사용 프로세스 확인
lsof -i :8080

# 프로세스 종료
kill -9 <PID>

# 또는 다른 포트 사용
PORT=8081 npm start
```

### 2. Firebase 인증 오류

```
Error: Failed to parse service account credentials
```

해결 방법:
- `GOOGLE_APPLICATION_CREDENTIALS` 경로 확인
- JSON 파일이 올바른 위치에 있는지 확인
- Firebase Admin SDK 버전 업데이트

```bash
npm install --save firebase-admin@latest
```

### 3. CORS 오류

```
Access to XMLHttpRequest has been blocked by CORS policy
```

해결 방법:
- `.env`의 `CORS_ORIGIN` 확인
- 프론트엔드 도메인이 올바르게 설정되었는지 확인

### 4. 환경 변수가 로드되지 않음

```bash
# 환경 변수 파일 확인
cat .env

# 백엔드 재시작
npm start
```

## 📝 개발 가이드

### 로컬 개발 환경 실행

터미널 1 (백엔드):
```bash
cd backend
npm start
```

터미널 2 (프론트엔드):
```bash
cd frontend
npm run dev
```

### 코드 구조

#### Frontend 페이지 라우팅
- `/kiosk/agreement` - 약관 동의 페이지
- `/kiosk/checkin` - 체크인 화면
- `/kiosk/success` - 체크인 성공 (일반 참가자)
- `/kiosk/success-staff` - 체크인 성공 (운영진)
- `/admin` - 관리자 대시보드
- `/admin/participants` - 참가자 목록 관리

#### Backend 라우트
```javascript
GET  /                          // 서버 상태
GET  /participants              // 참가자 목록 (보호됨)
GET  /search?phoneLast4=XXXX    // 참가자 검색
POST /checkin                   // 체크인 처리
PUT  /participants/:id          // 참가자 정보 수정 (보호됨)
```

## 📦 배포

### Vercel (프론트엔드)

1. GitHub에 푸시
2. Vercel 연결
3. 환경 변수 설정 (`.env.local` 내용)
4. 배포

### Heroku/Railway (백엔드)

1. Firebase 서비스 계정 JSON을 환경 변수로 설정
2. `.env` 변수들을 서버 환경에 설정
3. 배포

## 🤝 기여

버그 리포트나 기능 제안은 GitHub Issues를 통해 제출해주세요.

## 📄 라이선스

MIT License

## 👥 팀

ONEWAVE Hackathon Team

## 📞 지원

문제 발생 시 GitHub Issues를 통해 리포트해주세요.
