# GDG Check-in

행사 현장에서 쓰는 체크인 키오스크 프로젝트입니다.  
참가자는 키오스크에서 휴대폰 번호 뒤 4자리로 본인을 찾아 체크인하고, 운영진은 관리자 페이지에서 이벤트와 멤버, 체크인 현황을 관리합니다.

## 현재 구성

- `frontend`
  Next.js 기반 프론트엔드
- `backend`
  Express + Firestore 기반 API 서버
- `backend/legacy`
  예전에 한 번씩 썼던 마이그레이션/정리 스크립트 모아둔 폴더

## 주요 화면

- `/kiosk`
  키오스크 메인
- `/kiosk/agreement`
  개인정보 동의
- `/kiosk/checkin`
  번호 입력 / 후보 선택 / 체크인
- `/admin`
  관리자 페이지
- `/admin/events`
  이벤트 관리
- `/admin/members`
  멤버 관리
- `/admin/checkin`
  타입 관리

## 비밀번호 / 인증

- `ADMIN_UI_PASSWORD`
  관리자 페이지 들어갈 때 입력하는 비밀번호
- `MASTER_PASSWORD`
  프론트 서버가 백엔드 관리자 API 호출할 때만 쓰는 값
- `KIOSK_PASSWORD`
  백엔드 환경변수로 유지 중인 키오스크용 비밀번호

관리자 페이지에서 입력하는 비밀번호와 백엔드 관리자 비밀번호는 분리되어 있습니다.

## 로컬 실행

### backend

```bash
cd backend
npm install
cp .env.example .env
```

`.env` 예시:

```env
PORT=8081
FIREBASE_PROJECT_ID=your-firebase-project-id
GOOGLE_APPLICATION_CREDENTIALS=./your-firebase-adminsdk.json
MASTER_PASSWORD=change-this-master-password
KIOSK_PASSWORD=change-this-kiosk-password
CORS_ORIGIN=http://localhost:3000
```

실행:

```bash
npm run dev
```

### frontend

```bash
cd frontend
npm install
```

`frontend/.env.local` 예시:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081/api
ADMIN_UI_PASSWORD=change-this-admin-password
MASTER_PASSWORD=change-this-master-password
BACKEND_INTERNAL_URL=http://localhost:8081/api
```

실행:

```bash
npm run dev
```

## 메모

- Firebase 서비스 계정 JSON 파일은 저장소에 올리지 않습니다.
- `backend/legacy` 안의 스크립트는 일반 실행용이 아닙니다.
- 관리자 로그인은 횟수 제한이 걸려 있습니다.
- 키오스크 화면은 모바일에서도 사용할 수 있게 조정되어 있습니다.
