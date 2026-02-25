# 관리자 페이지 API 가이드

## 개요
관리자 페이지에서 사용하는 7개의 새로운 API 엔드포인트입니다.

---

## API 엔드포인트

### 1. 이벤트 목록 조회
**엔드포인트:** `GET /api/events`

**설명:** 모든 이벤트를 최신순으로 조회합니다.

**요청:**
```bash
curl -X GET http://localhost:8081/api/events \
  -H "Content-Type: application/json"
```

**응답 (200 OK):**
```json
{
  "success": true,
  "events": [
    {
      "date": "2026-01-29",
      "eventName": "테스트 이벤트",
      "eventType": "allMembers",
      "totalParticipants": 20,
      "checkedInCount": 15,
      "checkInRate": 75
    }
  ]
}
```

**오류 코드:**
- `500`: 서버 오류

---

### 2. 이벤트 상세 조회
**엔드포인트:** `GET /api/events/:date`

**설명:** 특정 날짜의 이벤트 상세 정보를 조회합니다.

**요청:**
```bash
curl -X GET http://localhost:8081/api/events/2026-01-29 \
  -H "Content-Type: application/json"
```

**응답 (200 OK):**
```json
{
  "success": true,
  "event": {
    "eventName": "테스트 이벤트",
    "eventType": "allMembers",
    "participants": ["01041280304", "01058943946"]
  },
  "checkedInMembers": [
    {
      "phoneKey": "01041280304",
      "name": "윤준석",
      "part": "BE",
      "checkedInAt": "2026-01-29T10:30:45.123Z",
      "memo": "빠른 출근"
    }
  ],
  "notCheckedInMembers": [
    {
      "phoneKey": "01058943946",
      "name": "정은혁",
      "part": "FE"
    }
  ]
}
```

**오류 코드:**
- `404`: 이벤트 없음
- `500`: 서버 오류

---

### 3. 이벤트 수정
**엔드포인트:** `PATCH /api/events/:date`

**설명:** 이벤트 정보를 수정합니다. eventType 변경 시 participants가 자동 재계산됩니다.

**요청:**
```bash
curl -X PATCH http://localhost:8081/api/events/2026-01-29 \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "수정된 이벤트명",
    "eventType": "tripleS"
  }'
```

**응답 (200 OK):**
```json
{
  "success": true
}
```

**오류 코드:**
- `500`: 서버 오류

---

### 4. 이벤트 삭제
**엔드포인트:** `DELETE /api/events/:date`

**설명:** 이벤트를 삭제합니다. 관련 체크인 데이터도 함께 삭제됩니다.

**요청:**
```bash
curl -X DELETE http://localhost:8081/api/events/2026-01-29 \
  -H "Content-Type: application/json"
```

**응답 (200 OK):**
```json
{
  "success": true
}
```

**오류 코드:**
- `500`: 서버 오류

---

### 5. 수동 체크인
**엔드포인트:** `POST /api/checkin/manual`

**설명:** 특정 멤버를 수동으로 체크인 처리합니다.

**요청:**
```bash
curl -X POST http://localhost:8081/api/checkin/manual \
  -H "Content-Type: application/json" \
  -d '{
    "phoneKey": "01041280304",
    "date": "2026-01-29"
  }'
```

**응답 (200 OK):**
```json
{
  "success": true
}
```

**오류 코드:**
- `404`: 이벤트 없음
- `403`: 참가자 아님
- `409`: 이미 체크인됨
- `500`: 서버 오류

---

### 6. 체크인 취소
**엔드포인트:** `DELETE /api/checkin/:date/:phoneKey`

**설명:** 체크인을 취소합니다. (문서 삭제)

**요청:**
```bash
curl -X DELETE http://localhost:8081/api/checkin/2026-01-29/01041280304 \
  -H "Content-Type: application/json"
```

**응답 (200 OK):**
```json
{
  "success": true
}
```

**오류 코드:**
- `500`: 서버 오류

---

### 7. 메모 수정
**엔드포인트:** `PATCH /api/checkin/:date/:phoneKey/memo`

**설명:** 체크인 멤버의 메모를 수정합니다.

**요청:**
```bash
curl -X PATCH http://localhost:8081/api/checkin/2026-01-29/01041280304/memo \
  -H "Content-Type: application/json" \
  -d '{
    "memo": "늦게 도착"
  }'
```

**응답 (200 OK):**
```json
{
  "success": true
}
```

**오류 코드:**
- `500`: 서버 오류

---

## 기존 API (참고용)

### 이벤트 생성
**엔드포인트:** `POST /api/event/setup`

**설명:** 새로운 이벤트를 생성합니다. eventType에 따라 자동으로 participants가 결정됩니다.

**요청:**
```bash
curl -X POST http://localhost:8081/api/event/setup \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-29",
    "eventName": "테스트 이벤트",
    "eventType": "allMembers"
  }'
```

**응답:**
```json
{
  "success": true,
  "date": "2026-01-29",
  "participantCount": 20
}
```

---

## 오류 처리

### 공통 오류 응답
모든 API는 오류 발생 시 다음 형식으로 응답합니다:

```json
{
  "message": "오류 메시지"
}
```

### 주요 오류 코드
- `400`: 잘못된 요청 (필수 필드 누락)
- `403`: 권한 없음 (참가자가 아님 등)
- `404`: 찾을 수 없음 (이벤트/멤버 없음)
- `409`: 충돌 (이미 체크인됨)
- `500`: 서버 오류

---

## 테스트 방법

### 스크립트를 통한 테스트
```bash
cd /Users/junseok/Desktop/project/gdgcheckin/backend
./test-api.sh
```

### 수동 테스트
```bash
# 1. 이벤트 생성
curl -X POST http://localhost:8081/api/event/setup \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-29",
    "eventName": "테스트",
    "eventType": "allMembers"
  }'

# 2. 수동 체크인 (phoneKey는 실제 값으로)
curl -X POST http://localhost:8081/api/checkin/manual \
  -H "Content-Type: application/json" \
  -d '{
    "phoneKey": "01041280304",
    "date": "2026-01-29"
  }'

# 3. 메모 수정
curl -X PATCH http://localhost:8081/api/checkin/2026-01-29/01041280304/memo \
  -H "Content-Type: application/json" \
  -d '{"memo": "테스트 메모"}'

# 4. 이벤트 상세 조회
curl -X GET http://localhost:8081/api/events/2026-01-29 \
  -H "Content-Type: application/json"
```

---

## 주요 검증 항목

### 수동 체크인 (POST /api/checkin/manual)
- ✅ phoneKey 존재 여부 확인
- ✅ 이벤트 존재 여부 확인
- ✅ 참가자 권한 확인 (eventData.participants에 포함되어야 함)
- ✅ 중복 체크인 방지 (이미 체크인된 경우 409 반환)
- ✅ isManual 플래그 저장

### 이벤트 수정 (PATCH /api/events/:date)
- ✅ eventType 변경 시 participants 자동 재계산
- ✅ types 배열이 비어있으면 필터링하지 않음
- ✅ updatedAt 타임스탐프 업데이트

### 이벤트 삭제 (DELETE /api/events/:date)
- ✅ Firestore batch를 사용한 트랜잭션 보장
- ✅ checkIn_* 컬렉션의 모든 문서 삭제
- ✅ events 컬렉션의 문서 삭제

---

## 프론트엔드와의 연동

### React Query 캐시 무효화
API 호출 후 다음 캐시가 자동으로 무효화됩니다:
- `['events']` - 이벤트 목록
- `['event', date]` - 특정 이벤트 상세
- `['realtimeCheckin']` - 실시간 체크인 현황

### 에러 처리
```javascript
try {
  await mutationFn();
} catch (error) {
  console.error('API Error:', error);
  alert(`오류: ${error.message}`);
}
```

---

## 성능 최적화

### staleTime 설정
- `/api/events` - 60초 (자주 변하지 않음)
- `/api/event/:date` - 필요시에만 조회
- `/api/realtime/checkin` - 5초 (자동 갱신)

### 대량 데이터 처리
- 멤버 100명 이상일 경우 페이지네이션 고려
- React Query의 `refetchInterval` 설정으로 자동 갱신 가능

---

## Troubleshooting

### 404 오류가 발생하는 경우
1. 백엔드가 실행 중인지 확인
2. API 베이스 URL이 올바른지 확인 (.env 파일 확인)
3. 날짜 형식이 YYYY-MM-DD인지 확인

### JSON 파싱 오류
1. 응답이 실제로 JSON인지 확인
2. HTML 오류 페이지를 받고 있는지 확인
3. Content-Type 헤더가 application/json인지 확인

### 중복 체크인 오류 (409)
1. 이미 체크인된 멤버를 다시 체크인하려고 함
2. 체크인 취소 후 다시 체크인 시도

### 참가자 아님 오류 (403)
1. 선택한 멤버가 해당 이벤트의 참가자가 아님
2. eventType 확인 (예: tripleS 이벤트인데 allMembers 멤버를 추가하려고 함)
