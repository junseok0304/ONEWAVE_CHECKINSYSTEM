# 데이터베이스 마이그레이션 가이드

## 📊 마이그레이션 개요

**목표**: 이메일 기반 사용자 데이터베이스를 체크인 시스템에 통합

**변경 사항**:
- 기존 `participants` 컬렉션 → `participants_checkin` 컬렉션으로 전환
- 휴대폰 번호: 키 (`01022222222` → `010-2140-7614`)
- 이메일 컬렉션 데이터 복제 + 체크인 필드 추가

---

## ⚠️ 마이그레이션 전 체크리스트

```
☐ 1. 기존 participants 컬렉션 데이터 백업 확인
☐ 2. 이메일 컬렉션이 asia-northeast3에 준비되어 있는지 확인
☐ 3. 백엔드 코드 수정 완료 확인
☐ 4. 마이그레이션 스크립트 검토
```

---

## 🚀 마이그레이션 실행 방법

### Step 1: 마이그레이션 스크립트 실행

```bash
cd backend
node migrate.js
```

**결과 예시**:
```
🚀 마이그레이션 시작...

📖 이메일 컬렉션에서 데이터 읽는 중...
✅ 250명의 데이터 발견

✅ 이민수 (01021407614) - 마이그레이션 완료
✅ 홍길동 (01022222222) - 마이그레이션 완료
...

==================================================
📊 마이그레이션 완료
==================================================
✅ 성공: 250명
❌ 실패: 0명

🎉 마이그레이션 완료!
```

### Step 2: Firebase 확인

Firestore Console에서 다음 확인:

```
✅ participants_checkin 컬렉션이 생성됨
✅ 휴대폰 번호 (010-XXXX-XXXX → 010XXXXXX)가 document ID로 사용됨
✅ 각 document에 email, phone, name, teamNumber, status 등 필드 포함
✅ checked_in_status: false (초기값)
```

### Step 3: 백엔드 재시작

```bash
npm start
```

### Step 4: API 테스트

```bash
# 키오스크 검색 테스트
curl "http://localhost:8080/api/search?phoneLast4=7614"

# 결과:
# [
#   {
#     "id": "01021407614",
#     "email": "01minsuok@gmail.com",
#     "name": "이민수",
#     "phone_number": "010-2140-7614",
#     "checked_in_status": false,
#     "team_number": 7,
#     "status": "APPROVED"
#   }
# ]
```

---

## 📋 데이터 구조

### participants_checkin 컬렉션

```javascript
{
  id: "01021407614",  // Document ID (휴대폰 번호에서 하이폰 제거)

  // 이메일 컬렉션에서 복제
  email: "01minsuok@gmail.com",
  phone: "010-2140-7614",
  name: "이민수",
  teamNumber: 7,
  position: "BE",
  status: "APPROVED",
  isVerified: true,
  discordId: "676663254143205400",

  // 체크인 전용 필드
  checked_in_status: false,
  checkedInAt: null,
  checkedOutAt: null,
  memo: "",
  checkedOutMemo: "",

  // 타임스탐프
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🔄 향후 새 참가자 추가 시 마이그레이션

이메일 컬렉션에 새로운 참가자가 추가되면, `migrate.js`를 다시 실행하세요:

```bash
node migrate.js
```

**주의**: 기존 데이터는 overwrite되지 않습니다.
- 새 참가자: 추가됨
- 기존 참가자: 업데이트되지 않음 (체크인 상태 보존)

---

## ✅ 마이그레이션 완료 확인

### 1️⃣ 기존 데이터 유지 확인

```bash
# 기존 participants 컬렉션 (백업용으로 유지됨)
curl -H "x-api-key: MASTER_PASSWORD" \
  http://localhost:8080/api/old-participants  # 엔드포인트 추가 가능

# 새 participants_checkin 컬렉션
curl -H "x-api-key: MASTER_PASSWORD" \
  http://localhost:8080/api/participants
```

### 2️⃣ 체크인 기능 테스트

1. 키오스크 접속: http://localhost:3000/kiosk/agreement
2. 휴대폰 끝 4자리 입력 (예: 7614)
3. 참가자 선택
4. 체크인 완료 확인

### 3️⃣ 관리자 대시보드 확인

- http://localhost:3000/admin 접속
- 마스터 비밀번호 입력
- 참가자 목록 표시 확인

---

## 🐛 문제 해결

### 마이그레이션 실패

```bash
❌ 오류: PERMISSION_DENIED

해결:
1. Firebase 서비스 계정 JSON 확인
2. Firestore 권한 확인 (읽기/쓰기)
3. 데이터베이스 위치 확인 (asia-northeast3)
```

### "컬렉션을 찾을 수 없습니다" 오류

```bash
❌ 검색 결과 없음

확인:
1. 이메일 컬렉션 이름이 정확한지 확인
2. 참가자 데이터가 이메일 컬렉션에 있는지 확인
3. phone 필드 포맷 확인 (010-XXXX-XXXX 형식)
```

### 휴대폰 번호가 안 나올 때

```bash
❌ API 응답에 phone 필드 없음

확인:
1. 마이그레이션 스크립트가 완료됨
2. participants_checkin 컬렉션에 데이터 있음
3. 백엔드 재시작 완료
```

---

## 📝 마이그레이션 로그

마이그레이션 기록을 남기려면:

```bash
# 로그 저장
node migrate.js > migration.log 2>&1

# 로그 확인
cat migration.log
```

---

## 🔄 롤백 (필요시)

문제 발생 시 롤백:

```bash
# 1. 기존 participants 컬렉션 복구
#    (백업하신 데이터가 있다면 복구 가능)

# 2. 백엔드 코드를 이전 버전으로 복구
git revert <commit-hash>

# 3. 백엔드 재시작
npm start
```

---

## ✨ 완료 후 확인 사항

```
✅ participants_checkin 컬렉션 데이터 확인
✅ 키오스크 검색 기능 정상
✅ 체크인 기능 정상
✅ 관리자 대시보드 표시 정상
✅ 기존 체크인 데이터 보존 확인
```

모두 완료되었으면 마이그레이션 성공입니다! 🎉
