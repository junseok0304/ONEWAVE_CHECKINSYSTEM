#!/bin/bash

# API 테스트 스크립트
# 사용법: ./test-api.sh

API_BASE="http://localhost:8081/api"
TODAY=$(date +%Y-%m-%d)

echo "============================================"
echo "관리자 페이지 API 테스트"
echo "============================================"
echo ""

# 1. 이벤트 목록 조회
echo "1️⃣  GET /api/events - 모든 이벤트 목록"
echo "요청: curl -X GET $API_BASE/events"
echo "응답:"
curl -X GET "$API_BASE/events" -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "실패 (응답 파싱 오류)"
echo ""
echo ""

# 2. 특정 날짜 이벤트 상세 조회
echo "2️⃣  GET /api/events/:date - 특정 이벤트 상세"
echo "요청: curl -X GET $API_BASE/events/$TODAY"
echo "응답:"
curl -X GET "$API_BASE/events/$TODAY" -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "실패 (이벤트 없음 또는 오류)"
echo ""
echo ""

# 3. 이벤트 생성 (setup API 사용)
echo "3️⃣  POST /api/event/setup - 이벤트 생성"
echo "요청: curl -X POST $API_BASE/event/setup -d '{\"date\": \"$TODAY\", \"eventName\": \"테스트 이벤트\", \"eventType\": \"allMembers\"}'"
echo "응답:"
curl -X POST "$API_BASE/event/setup" \
  -H "Content-Type: application/json" \
  -d "{\"date\": \"$TODAY\", \"eventName\": \"테스트 이벤트\", \"eventType\": \"allMembers\"}" | jq '.' 2>/dev/null || echo "실패"
echo ""
echo ""

# 4. 이벤트 수정
echo "4️⃣  PATCH /api/events/:date - 이벤트 수정"
echo "요청: curl -X PATCH $API_BASE/events/$TODAY -d '{\"eventName\": \"수정된 이벤트\"}'"
echo "응답:"
curl -X PATCH "$API_BASE/events/$TODAY" \
  -H "Content-Type: application/json" \
  -d "{\"eventName\": \"수정된 이벤트\"}" | jq '.' 2>/dev/null || echo "실패"
echo ""
echo ""

# 5. 멤버 목록 조회
echo "5️⃣  GET /api/members - 모든 멤버 목록"
echo "요청: curl -X GET $API_BASE/members"
echo "응답 (처음 3개만 표시):"
curl -X GET "$API_BASE/members" -H "Content-Type: application/json" | jq '.members[0:3]' 2>/dev/null || echo "실패"
echo ""
echo ""

# 6. 수동 체크인 테스트 (실제 phoneKey 필요)
echo "6️⃣  POST /api/checkin/manual - 수동 체크인"
echo "주의: 실제 phoneKey로 테스트 필요"
echo "예시 요청:"
echo "curl -X POST $API_BASE/checkin/manual \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"phoneKey\": \"01041280304\", \"date\": \"$TODAY\"}'"
echo ""
echo ""

# 7. 체크인 취소 테스트
echo "7️⃣  DELETE /api/checkin/:date/:phoneKey - 체크인 취소"
echo "주의: 실제 phoneKey로 테스트 필요"
echo "예시 요청:"
echo "curl -X DELETE $API_BASE/checkin/$TODAY/01041280304 \\"
echo "  -H 'Content-Type: application/json'"
echo ""
echo ""

# 8. 메모 수정 테스트
echo "8️⃣  PATCH /api/checkin/:date/:phoneKey/memo - 메모 수정"
echo "주의: 실제 phoneKey로 테스트 필요"
echo "예시 요청:"
echo "curl -X PATCH $API_BASE/checkin/$TODAY/01041280304/memo \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"memo\": \"테스트 메모\"}'"
echo ""
echo ""

# 9. 실시간 체크인 현황
echo "9️⃣  GET /api/realtime/checkin - 실시간 체크인 현황"
echo "요청: curl -X GET $API_BASE/realtime/checkin"
echo "응답:"
curl -X GET "$API_BASE/realtime/checkin" -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "실패"
echo ""
echo ""

# 10. 대시보드 통계
echo "🔟 GET /api/dashboard/stats - 대시보드 통계"
echo "요청: curl -X GET $API_BASE/dashboard/stats"
echo "응답:"
curl -X GET "$API_BASE/dashboard/stats" -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "실패"
echo ""
echo ""

echo "============================================"
echo "테스트 완료"
echo "============================================"
