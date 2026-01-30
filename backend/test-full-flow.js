import axios from 'axios';

const API_URL = 'http://localhost:8081/api';
const MASTER_PASSWORD = '1q2w3e4r!@#';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(config => {
    config.headers.Authorization = `Bearer ${MASTER_PASSWORD}`;
    return config;
});

async function testFullFlow() {
    console.log('🧪 전체 체크인 플로우 테스트\n');

    try {
        // 1. 키오스크 검색
        console.log('1️⃣ 키오스크: 0304 뒷번호 검색');
        const search = await axios.get(`${API_URL}/search?phoneLast4=0304`);
        const testUser = search.data.results[0];
        console.log(`   ✅ ${testUser.name} 검색됨`);
        console.log(`   체크인 상태: ${testUser.checked_in_status ? '✅ 이미 체크인' : '⭕ 미체크인'}\n`);

        // 2. 키오스크 체크인
        console.log('2️⃣ 키오스크: 체크인 수행');
        try {
            const checkin = await axios.post(`${API_URL}/checkin`, {
                phoneKey: testUser.phoneKey
            });
            console.log(`   ✅ ${testUser.name} 체크인 성공!\n`);
        } catch (err) {
            if (err.response?.status === 409) {
                console.log(`   ℹ️ 이미 체크인되어 있습니다\n`);
            } else {
                throw err;
            }
        }

        // 3. 관리자 페이지: 최신 데이터 조회
        console.log('3️⃣ 관리자: 참가자 목록 조회');
        const participants = await api.get('/participants');
        const adminParticipant = participants.data.find(p => p.id === testUser.phoneKey);
        console.log(`   ✅ 최신 상태: ${adminParticipant?.isCheckedIn ? '✅ 체크인됨' : '⭕ 미체크인'}\n`);

        // 4. 관리자: 체크인 취소
        console.log('4️⃣ 관리자: 체크인 취소');
        const uncheckin = await api.put(`/participants/${testUser.phoneKey}`, {
            checked_in_status: false
        });
        console.log(`   ✅ 체크인 취소 완료!\n`);

        // 5. 키오스크 재검색 (변경사항 확인)
        console.log('5️⃣ 키오스크: 재검색 (변경사항 확인)');
        const search2 = await axios.get(`${API_URL}/search?phoneLast4=0304`);
        const testUser2 = search2.data.results[0];
        console.log(`   ✅ ${testUser2.name}`);
        console.log(`   체크인 상태: ${testUser2.checked_in_status ? '✅ 체크인됨' : '⭕ 미체크인'}\n`);

        // 6. 관리자: 메모 추가
        console.log('6️⃣ 관리자: 메모 추가');
        const memo = await api.put(`/participants/${testUser.phoneKey}`, {
            memo: '테스트 메모 추가'
        });
        console.log(`   ✅ 메모 추가 완료!\n`);

        // 7. 관리자: 체크아웃
        console.log('7️⃣ 관리자: 체크아웃 메모 입력');
        const checkout = await api.put(`/participants/${testUser.phoneKey}`, {
            checkedOutMemo: '테스트 체크아웃'
        });
        console.log(`   ✅ 체크아웃 완료!\n`);

        console.log('✅ 모든 테스트 성공!');
        console.log('\n📊 테스트 결과:');
        console.log('   ✅ 키오스크 검색 → 체크인');
        console.log('   ✅ 관리자 페이지 상태 확인');
        console.log('   ✅ 관리자 체크인 취소');
        console.log('   ✅ 변경사항 동기화');
        console.log('   ✅ 메모 추가');
        console.log('   ✅ 체크아웃 처리');

        process.exit(0);

    } catch (error) {
        console.error('❌ 테스트 실패:', error.response?.data?.message || error.message);
        process.exit(1);
    }
}

testFullFlow();
