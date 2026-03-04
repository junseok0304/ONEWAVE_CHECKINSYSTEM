import express from 'express';
import rateLimit from 'express-rate-limit';
import db from './firestore.js';
import { verifyMasterPassword } from './authMiddleware.js';

const router = express.Router();

// 기본 타입 목록 (맨 위에 정의)
const DEFAULT_TYPES = ['allMembers', 'gdgSKHU', 'gdgsswu', 'gdgSWU', 'TripleS', 'legend', '2026스쿠톤'];

// 체크인 전용 Rate Limiter
const checkinLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5분
    max: 500, // 5분에 500개 요청 허용 (초당 1.7개 평균, 매우 관대)
    message: { message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.' },
    skip: (req) => {
        // 로컬 개발 환경에서는 무시
        if (req.hostname === 'localhost' || req.hostname === '127.0.0.1') {
            return true;
        }
        return false;
    },
});

// 검색 전용 Rate Limiter
const searchLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5분
    max: 800, // 5분에 800개 요청 허용 (초당 2.7개 평균, 매우 관대)
    message: { message: '검색 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
    skip: (req) => {
        // 로컬 개발 환경에서는 무시
        if (req.hostname === 'localhost' || req.hostname === '127.0.0.1') {
            return true;
        }
        return false;
    },
});

router.get('/', (req, res) => res.json({ message: 'QRCheckin API Online' }));

// 모든 타입 조회 (기본 타입 + 커스텀 타입)
router.get('/types', async (req, res) => {
    console.log('✅ /api/types 요청 받음');
    try {
        const configDoc = await db.collection('config').doc('types').get();
        const customTypes = configDoc.exists ? (configDoc.data().customTypes || []) : [];
        const allTypes = [...DEFAULT_TYPES, ...customTypes];
        console.log('📤 타입 응답:', allTypes);
        res.json({ types: allTypes, custom: customTypes });
    } catch (error) {
        console.error('❌ Get types error:', error);
        res.status(500).json({ message: '타입 조회 중 오류가 발생했습니다.' });
    }
});

// 새 타입 추가 (인증 필요)
router.post('/types', verifyMasterPassword, async (req, res) => {
    try {
        const { typeName } = req.body;

        if (!typeName || typeof typeName !== 'string') {
            return res.status(400).json({ message: '타입명을 입력해주세요.' });
        }

        // 기본 타입이나 이미 존재하는 커스텀 타입인지 확인
        if (DEFAULT_TYPES.includes(typeName)) {
            return res.status(400).json({ message: '이미 존재하는 타입입니다.' });
        }

        const configDoc = await db.collection('config').doc('types').get();
        let customTypes = configDoc.exists ? (configDoc.data().customTypes || []) : [];

        if (customTypes.includes(typeName)) {
            return res.status(400).json({ message: '이미 존재하는 타입입니다.' });
        }

        customTypes.push(typeName);
        await db.collection('config').doc('types').set({ customTypes }, { merge: true });

        const allTypes = [...DEFAULT_TYPES, ...customTypes];
        res.json({ success: true, types: allTypes });
    } catch (error) {
        console.error('Add type error:', error);
        res.status(500).json({ message: '타입 추가 중 오류가 발생했습니다.' });
    }
});

// Firebase Timestamp를 ISO 문자열로 변환
const formatTimestamp = (timestamp) => {
    if (!timestamp) return null;
    try {
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return timestamp.toDate().toISOString();
        }
        if (timestamp instanceof Date) {
            return timestamp.toISOString();
        }
        if (typeof timestamp === 'string') {
            return new Date(timestamp).toISOString();
        }
        return null;
    } catch (e) {
        return null;
    }
};

// 휴대폰 번호에서 끝 4자리 추출 (010-2140-7614 → 7614)
const getPhoneLast4 = (phone) => {
    if (!phone) return '';
    return phone.replace(/-/g, '').slice(-4);
};

// 3개 컬렉션 목록
const MEMBER_COLLECTIONS = ['participants_admin', 'participants_member', 'participants_others'];

// 특정 phoneKey로 멤버 검색 (3개 컬렉션에서)
const findMemberByPhoneKey = async (phoneKey) => {
    for (const collectionName of MEMBER_COLLECTIONS) {
        const doc = await db.collection(collectionName).doc(phoneKey).get();
        if (doc.exists) {
            return { data: doc.data(), collection: collectionName };
        }
    }
    return null;
};

// 모든 멤버 조회 (3개 컬렉션)
const getAllMembers = async () => {
    const members = [];

    for (const collectionName of MEMBER_COLLECTIONS) {
        const snapshot = await db.collection(collectionName).get();
        snapshot.forEach(doc => {
            members.push({
                phoneKey: doc.id,
                ...doc.data(),
                collection: collectionName,
            });
        });
    }

    return members;
};

// 휴대폰 끝 4자리로 참가자 검색 (키오스크용)
router.get('/search', searchLimiter, async (req, res) => {
    const { phoneLast4 } = req.query;

    if (!phoneLast4 || phoneLast4.length !== 4) {
        return res.status(400).json({ message: '휴대폰 번호 뒷 4자리를 입력해주세요.' });
    }

    try {
        const today = getTodayString();

        // 오늘의 이벤트 정보 조회
        const eventDoc = await db.collection('events').doc(today).get();
        let eventType = 'allMembers';
        if (eventDoc.exists) {
            eventType = eventDoc.data().eventType;
        }

        // 3개 컬렉션에서 검색
        const results = [];
        const checkInSnapshot = await db.collection(`checkIn_${today}`).get();
        const checkedInKeys = new Set(checkInSnapshot.docs.map(doc => doc.id));

        for (const collectionName of MEMBER_COLLECTIONS) {
            const snapshot = await db.collection(collectionName).get();

            for (const doc of snapshot.docs) {
                const data = doc.data();
                // phone 또는 phoneNumber 필드 지원
                const phone = data.phone || data.phoneNumber;
                if (!phone) continue;

                const phoneLastDigits = phone.replace(/-/g, '').slice(-4);

                if (phoneLastDigits === phoneLast4) {
                    // 이벤트 타입 기준 필터링
                    const memberTypes = Array.isArray(data.type) ? data.type : (data.type ? [data.type] : ['allMembers']);
                    const isTypeMatching = eventType === 'allMembers' || memberTypes.includes(eventType);

                    if (!isTypeMatching) {
                        continue; // 타입이 맞지 않으면 건너뛰기
                    }

                    // 체크인 여부 확인 (미리 로드한 셋에서 확인)
                    const isCheckedIn = checkedInKeys.has(doc.id);
                    // 운영진 여부 확인 (staff 또는 volunteer 타입인 경우)
                    const isStaff = memberTypes.includes('staff') || memberTypes.includes('volunteer');

                    results.push({
                        phoneKey: doc.id,
                        name: data.name,
                        phoneNumber: data.phone || data.phoneNumber,
                        part: data.part,
                        position: data.position,
                        gen: data.gen,
                        type: memberTypes,
                        isCheckedIn,
                        isStaff,
                        collection: collectionName,
                    });
                }
            }
        }

        if (results.length === 0) {
            return res.status(404).json({ message: '해당하는 멤버를 찾을 수 없습니다.' });
        }

        res.json({ success: true, results });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: '검색 중 오류가 발생했습니다.' });
    }
});

// 오늘 날짜 포맷팅 (YYYY-MM-DD)
const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

// 이벤트 설정 (관리자용)
router.post('/event/setup', verifyMasterPassword, async (req, res) => {
    const { date, eventName, eventType } = req.body;

    if (!date || !eventName || !eventType) {
        return res.status(400).json({ message: '날짜, 이벤트명, 타입이 필요합니다.' });
    }

    try {
        const participants = [];
        const collections = ['participants_admin', 'participants_member', 'participants_others'];

        // 3개 컬렉션에서 모든 멤버 조회
        for (const collectionName of collections) {
            const snapshot = await db.collection(collectionName).get();

            snapshot.forEach(doc => {
                const data = doc.data();
                const types = Array.isArray(data.type) ? data.type : [data.type];

                // eventType이 'allMembers'이거나 types 배열에 포함되면 추가
                if (eventType === 'allMembers' || types.includes(eventType)) {
                    participants.push(doc.id);
                }
            });
        }


        // 이벤트 생성
        await db.collection('events').doc(date).set({
            eventName,
            eventType,
            date,
            participants,
            createdAt: new Date(),
        });

        res.json({ success: true, date, participantCount: participants.length });
    } catch (error) {
        console.error('Event setup error:', error);
        res.status(500).json({ message: '이벤트 생성 중 오류가 발생했습니다.' });
    }
});

// 오늘의 이벤트 조회 (없으면 자동 생성)
router.get('/event/today', async (req, res) => {
    try {
        const today = getTodayString();
        const doc = await db.collection('events').doc(today).get();

        if (!doc.exists) {
            // 이벤트가 없으면 자동 생성
            const participants = [];
            const collections = ['participants_admin', 'participants_member', 'participants_others'];

            // 3개 컬렉션에서 모든 멤버 조회
            for (const collectionName of collections) {
                const snapshot = await db.collection(collectionName).get();
                snapshot.forEach(memberDoc => {
                    participants.push(memberDoc.id);
                });
            }

            const newEvent = {
                eventName: `GDG 행사 (${today})`,
                eventType: 'allMembers',
                date: today,
                participants,
                createdAt: new Date(),
            };

            await db.collection('events').doc(today).set(newEvent);

            return res.json({ event: newEvent, autoCreated: true });
        }

        res.json({ event: doc.data(), autoCreated: false });
    } catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({ message: '이벤트 조회 중 오류가 발생했습니다.' });
    }
});


// 체크인 처리
router.post('/checkin', checkinLimiter, async (req, res) => {
    const { phoneKey } = req.body;

    if (!phoneKey) {
        return res.status(400).json({ message: '전화번호가 필요합니다.' });
    }

    try {
        const memberResult = await findMemberByPhoneKey(phoneKey);

        if (!memberResult) {
            return res.status(404).json({ message: '멤버를 찾을 수 없습니다.' });
        }

        const today = new Date().toISOString().split('T')[0];
        const memberData = memberResult.data;

        // 오늘의 이벤트 타입 확인
        const eventDoc = await db.collection('events').doc(today).get();
        if (eventDoc.exists) {
            const eventType = eventDoc.data().eventType;
            const memberTypes = Array.isArray(memberData.type) ? memberData.type : (memberData.type ? [memberData.type] : ['allMembers']);

            // 타입이 맞지 않으면 체크인 불가
            if (eventType !== 'allMembers' && !memberTypes.includes(eventType)) {
                return res.status(403).json({ message: '이 이벤트에 참가할 수 없는 멤버입니다.' });
            }
        }

        const checkInCollection = db.collection(`checkIn_${today}`);

        // 이미 체크인했는지 확인 (phoneKey로 직접 조회 - 더 효율적)
        const existingCheckIn = await checkInCollection.doc(phoneKey).get();

        if (existingCheckIn.exists) {
            return res.status(409).json({ message: '이미 체크인됨' });
        }

        // 체크인 기록 저장
        await checkInCollection.doc(phoneKey).set({
            phoneKey,
            phone: memberData.phone || memberData.phoneNumber,
            name: memberData.name,
            part: memberData.part,
            checkedInAt: new Date(),
            isManual: false,
            checkInMemo: '',
            userMemo: memberData.memo || '',
        });

        res.json({ success: true, phoneKey, name: memberData.name });
    } catch (error) {
        console.error('Checkin error:', error);
        res.status(500).json({ message: '체크인 중 오류가 발생했습니다.' });
    }
});


// ============ 새로운 통합 API 엔드포인트 ============

// 모든 멤버 목록 조회 (최적화)
// POST /api/members - 멤버 추가
router.post('/members', verifyMasterPassword, async (req, res) => {
    const { phoneKey, name, phoneNumber, part, school, schoolName, types, type, position, gen, _collection, collection } = req.body;

    if (!phoneKey || !name || !phoneNumber || !part) {
        return res.status(400).json({ message: '필수 정보가 부족합니다.' });
    }

    try {
        // 어느 컬렉션에 저장할지 결정
        const targetCollection = _collection || collection || 'participants_member';

        // 이미 존재하는지 확인
        const existingDoc = await db.collection(targetCollection).doc(phoneKey).get();
        if (existingDoc.exists) {
            return res.status(409).json({ message: '이미 존재하는 멤버입니다.' });
        }

        // 멤버 추가 (기존 멤버 구조와 통일)
        const memberTypes = types || type;
        await db.collection(targetCollection).doc(phoneKey).set({
            phoneKey,
            name,
            phone: phoneNumber,
            part,
            school: schoolName || school || '',
            type: Array.isArray(memberTypes) ? memberTypes : (memberTypes ? [memberTypes] : ['allMembers']),
            position: position || '',
            gen: gen || '',
            memo: '',
            createdAt: new Date(),
        });

        res.json({ success: true, message: '멤버가 추가되었습니다.' });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ message: '멤버 추가 중 오류가 발생했습니다.' });
    }
});

// GET /api/members - 정회원 목록 조회
router.get('/members', verifyMasterPassword, async (req, res) => {
    try {
        const snapshot = await db.collection('participants_member').get();
        const members = snapshot.docs.map(doc => ({
            phoneKey: doc.id,
            collection: 'participants_member',
            ...doc.data(),
        }));

        console.log(`📋 멤버 목록 조회: ${members.length}명`);
        res.json({ success: true, members, count: members.length });
    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({ message: '멤버 조회 중 오류가 발생했습니다.' });
    }
});

// GET /api/admin-members - 관리자 멤버 목록 조회
router.get('/admin-members', verifyMasterPassword, async (req, res) => {
    try {
        const snapshot = await db.collection('participants_admin').get();
        const members = snapshot.docs.map(doc => ({
            phoneKey: doc.id,
            collection: 'participants_admin',
            ...doc.data(),
        }));

        console.log(`📋 Admin 멤버 목록 조회: ${members.length}명`);
        res.json({ success: true, members, count: members.length });
    } catch (error) {
        console.error('Get admin members error:', error);
        res.status(500).json({ message: 'Admin 멤버 조회 중 오류가 발생했습니다.' });
    }
});

// GET /api/others-members - 외부 멤버 목록 조회
router.get('/others-members', verifyMasterPassword, async (req, res) => {
    try {
        const snapshot = await db.collection('participants_others').get();
        const members = snapshot.docs.map(doc => ({
            phoneKey: doc.id,
            collection: 'participants_others',
            ...doc.data(),
        }));

        console.log(`📋 Others 멤버 목록 조회: ${members.length}명`);
        res.json({ success: true, members, count: members.length });
    } catch (error) {
        console.error('Get others members error:', error);
        res.status(500).json({ message: 'Others 멤버 조회 중 오류가 발생했습니다.' });
    }
});

// 특정 멤버 상세정보 (타입, 체크인 상태 포함)
router.get('/members/:phoneKey', verifyMasterPassword, async (req, res) => {
    const { phoneKey } = req.params;

    try {
        const memberResult = await findMemberByPhoneKey(phoneKey);

        if (!memberResult) {
            return res.status(404).json({ message: '멤버를 찾을 수 없습니다.' });
        }

        const memberData = memberResult.data;
        const today = new Date().toISOString().split('T')[0];

        // 오늘 이벤트의 체크인 상태 확인
        const todayCheckInCollection = db.collection(`checkIn_${today}`);
        const checkInSnapshot = await todayCheckInCollection.doc(phoneKey).get();

        const isCheckedInToday = checkInSnapshot.exists;

        res.json({
            success: true,
            phoneKey,
            collection: memberResult.collection,
            ...memberData,
            isCheckedInToday,
        });
    } catch (error) {
        console.error('Get member detail error:', error);
        res.status(500).json({ message: '멤버 상세정보 조회 중 오류가 발생했습니다.' });
    }
});

// 멤버 정보 수정 (타입 변경 포함)
router.patch('/members/:phoneKey', verifyMasterPassword, async (req, res) => {
    const { phoneKey } = req.params;
    const { type, ...otherData } = req.body;

    try {
        const updateData = { ...otherData };

        if (type !== undefined) {
            // type을 배열로 처리
            if (Array.isArray(type)) {
                updateData.type = type;
            } else {
                updateData.type = [type];
            }
        }

        await db.collection('participants_member').doc(phoneKey).update(updateData);

        const updatedDoc = await db.collection('participants_member').doc(phoneKey).get();
        res.json({
            success: true,
            phoneKey,
            collection: 'participants_member',
            data: updatedDoc.data(),
        });
    } catch (error) {
        console.error('Update member error:', error);
        res.status(500).json({ message: '멤버 정보 수정 중 오류가 발생했습니다.' });
    }
});

// PATCH /api/admin-members/:phoneKey - 운영진 멤버 정보 수정
router.patch('/admin-members/:phoneKey', verifyMasterPassword, async (req, res) => {
    const { phoneKey } = req.params;
    const { type, ...otherData } = req.body;

    try {
        const updateData = { ...otherData };

        if (type !== undefined) {
            if (Array.isArray(type)) {
                updateData.type = type;
            } else {
                updateData.type = [type];
            }
        }

        await db.collection('participants_admin').doc(phoneKey).update(updateData);

        const updatedDoc = await db.collection('participants_admin').doc(phoneKey).get();
        res.json({
            success: true,
            phoneKey,
            collection: 'participants_admin',
            data: updatedDoc.data(),
        });
    } catch (error) {
        console.error('Update admin member error:', error);
        res.status(500).json({ message: '관리자 멤버 정보 수정 중 오류가 발생했습니다.' });
    }
});

// PATCH /api/others-members/:phoneKey - 외부 멤버 정보 수정
router.patch('/others-members/:phoneKey', verifyMasterPassword, async (req, res) => {
    const { phoneKey } = req.params;
    const { type, ...otherData } = req.body;

    try {
        const updateData = { ...otherData };

        if (type !== undefined) {
            if (Array.isArray(type)) {
                updateData.type = type;
            } else {
                updateData.type = [type];
            }
        }

        await db.collection('participants_others').doc(phoneKey).update(updateData);

        const updatedDoc = await db.collection('participants_others').doc(phoneKey).get();
        res.json({
            success: true,
            phoneKey,
            collection: 'participants_others',
            data: updatedDoc.data(),
        });
    } catch (error) {
        console.error('Update others member error:', error);
        res.status(500).json({ message: '외부 멤버 정보 수정 중 오류가 발생했습니다.' });
    }
});

// PATCH /api/members/:phoneKey/memo - 멤버 메모 수정 (이벤트와 무관하게 멤버 DB에 저장)
router.patch('/members/:phoneKey/memo', verifyMasterPassword, async (req, res) => {
    try {
        const { phoneKey } = req.params;
        const { memo } = req.body;

        const collections = ['participants_admin', 'participants_member', 'participants_others'];
        let foundInCollection = null;

        // 3개 컬렉션에서 멤버 찾기
        for (const collectionName of collections) {
            const memberDoc = await db.collection(collectionName).doc(phoneKey).get();
            if (memberDoc.exists) {
                foundInCollection = collectionName;
                break;
            }
        }

        if (!foundInCollection) {
            return res.status(404).json({ message: '멤버를 찾을 수 없습니다.' });
        }

        await db.collection(foundInCollection).doc(phoneKey).update({
            memo: memo || '',
            memoUpdatedAt: new Date(),
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Update member memo error:', error);
        res.status(500).json({ message: '메모 수정 중 오류가 발생했습니다.' });
    }
});

// DELETE /api/members/:phoneKey - 정회원 삭제
router.delete('/members/:phoneKey', verifyMasterPassword, async (req, res) => {
    const { phoneKey } = req.params;

    try {
        await db.collection('participants_member').doc(phoneKey).delete();
        res.json({ success: true, message: '멤버가 삭제되었습니다.' });
    } catch (error) {
        console.error('Delete member error:', error);
        res.status(500).json({ message: '멤버 삭제 중 오류가 발생했습니다.' });
    }
});

// DELETE /api/admin-members/:phoneKey - 운영진 삭제
router.delete('/admin-members/:phoneKey', verifyMasterPassword, async (req, res) => {
    const { phoneKey } = req.params;

    try {
        await db.collection('participants_admin').doc(phoneKey).delete();
        res.json({ success: true, message: '운영진이 삭제되었습니다.' });
    } catch (error) {
        console.error('Delete admin member error:', error);
        res.status(500).json({ message: '운영진 삭제 중 오류가 발생했습니다.' });
    }
});

// DELETE /api/others-members/:phoneKey - 외부 참가자 삭제
router.delete('/others-members/:phoneKey', verifyMasterPassword, async (req, res) => {
    const { phoneKey } = req.params;

    try {
        await db.collection('participants_others').doc(phoneKey).delete();
        res.json({ success: true, message: '외부 참가자가 삭제되었습니다.' });
    } catch (error) {
        console.error('Delete others member error:', error);
        res.status(500).json({ message: '외부 참가자 삭제 중 오류가 발생했습니다.' });
    }
});

// 대시보드 통계
router.get('/dashboard/stats', verifyMasterPassword, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. 오늘 이벤트 정보
        const eventDoc = await db.collection('events').doc(today).get();
        const eventData = eventDoc.exists ? eventDoc.data() : null;

        // 2. 오늘 체크인 현황
        const checkInSnapshot = await db.collection(`checkIn_${today}`).get();
        const todayCheckInCount = checkInSnapshot.size;

        // 3. 전체 멤버 수 (3개 컬렉션)
        let totalMembers = 0;
        const typeStats = {};

        for (const collectionName of MEMBER_COLLECTIONS) {
            const memberSnapshot = await db.collection(collectionName).get();
            totalMembers += memberSnapshot.size;

            memberSnapshot.forEach(doc => {
                const data = doc.data();
                const userTypes = Array.isArray(data.type) ? data.type : (data.type ? [data.type] : ['allMembers']);
                userTypes.forEach(type => {
                    typeStats[type] = (typeStats[type] || 0) + 1;
                });
            });
        }

        res.json({
            success: true,
            stats: {
                date: today,
                eventName: eventData?.eventName || '이벤트 없음',
                eventType: eventData?.eventType || '-',
                totalParticipants: eventData?.participants?.length || 0,
                todayCheckInCount,
                todayCheckInPercentage: eventData ?
                    Math.round((todayCheckInCount / eventData.participants.length) * 100) : 0,
                totalMembers,
                typeStats,
            },
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: '통계 조회 중 오류가 발생했습니다.' });
    }
});

// 실시간 체크인 현황
router.get('/realtime/checkin', verifyMasterPassword, async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];

        // 해당 날짜 이벤트
        const eventDoc = await db.collection('events').doc(date).get();
        if (!eventDoc.exists) {
            return res.json({ success: true, data: null, message: '이벤트를 찾을 수 없습니다.' });
        }

        const eventData = eventDoc.data();

        // **병렬 조회로 속도 개선**
        const [checkInMemoSnapshot, checkInSnapshot, membersData] = await Promise.all([
            db.collection(`checkInMemo_${date}`).get(),
            db.collection(`checkIn_${date}`).get(),
            getAllMembers() // 모든 멤버를 Map으로 변환
        ]);

        // 특이사항메모 Map
        const checkInMemoMap = {};
        for (const doc of checkInMemoSnapshot.docs) {
            checkInMemoMap[doc.id] = doc.data().memo || '';
        }

        // 모든 멤버를 phoneKey로 인덱싱 (O(1) 접근)
        const memberMap = {};
        membersData.forEach(member => {
            memberMap[member.phoneKey] = member;
        });

        // 체크인 현황
        const checkedInMembers = [];
        const checkedInPhoneKeys = new Set();

        for (const doc of checkInSnapshot.docs) {
            // __meta__ 문서는 스킵
            if (doc.id === '__meta__') continue;

            const checkInData = doc.data();
            const memberData = memberMap[doc.id] || {};

            checkedInMembers.push({
                phoneKey: doc.id,
                name: checkInData.name,
                phoneNumber: checkInData.phone || checkInData.phoneNumber,
                part: checkInData.part,
                school: memberData.school || memberData.schoolName || '',
                type: Array.isArray(memberData.type) ? memberData.type : (memberData.type ? [memberData.type] : []),
                checkedInAt: formatTimestamp(checkInData.checkedInAt),
                userMemo: memberData.memo || '',
                checkInMemo: checkInMemoMap[doc.id] || '',
                isManual: checkInData.isManual || false,
            });
            checkedInPhoneKeys.add(doc.id);
        }

        // 미체크인 멤버 정보 (eventType과 멤버의 type 기반)
        const notCheckedInMembers = [];
        const eventType = eventData.eventType;
        const participantPhoneKeys = new Set(eventData.participants || []);

        // memberMap에서 필요한 멤버만 필터링
        for (const member of membersData) {
            const phoneKey = member.phoneKey;

            // 이벤트 참가자 목록에 없으면 스킵
            if (!participantPhoneKeys.has(phoneKey)) {
                continue;
            }

            // 이미 체크인한 멤버는 스킵
            if (checkedInPhoneKeys.has(phoneKey)) {
                continue;
            }

            const memberTypes = Array.isArray(member.type)
                ? member.type
                : (member.type ? [member.type] : ['allMembers']);

            // eventType이 'allMembers'이거나 멤버의 type에 eventType이 포함되면 추가
            if (eventType === 'allMembers' || memberTypes.includes(eventType)) {
                notCheckedInMembers.push({
                    phoneKey,
                    name: member.name,
                    phoneNumber: member.phone || member.phoneNumber,
                    part: member.part,
                    school: member.school || member.schoolName || '',
                    type: memberTypes,
                    userMemo: member.memo || '',
                    checkInMemo: checkInMemoMap[phoneKey] || '',
                });
            }
        }

        res.json({
            success: true,
            data: {
                event: eventData,
                checkedIn: checkedInMembers,
                notCheckedIn: notCheckedInMembers,
                stats: {
                    totalParticipants: eventData.participants.length,
                    checkedInCount: checkedInMembers.length,
                    notCheckedInCount: notCheckedInMembers.length,
                    percentage: Math.round((checkedInMembers.length / eventData.participants.length) * 100),
                },
            },
        });
    } catch (error) {
        console.error('Realtime checkin error:', error);
        res.status(500).json({ message: '실시간 현황 조회 중 오류가 발생했습니다.' });
    }
});

// ============ 관리자 페이지 이벤트 관리 API ============

// GET /api/events - 모든 이벤트 목록 (최신순)
router.get('/events', verifyMasterPassword, async (req, res) => {
    try {
        const snapshot = await db.collection('events').orderBy('date', 'desc').get();
        const events = [];

        for (const doc of snapshot.docs) {
            const eventData = doc.data();
            const checkInSnapshot = await db.collection(`checkIn_${doc.id}`).get();

            events.push({
                date: doc.id,
                eventName: eventData.eventName,
                eventType: eventData.eventType,
                totalParticipants: eventData.participants?.length || 0,
                checkedInCount: checkInSnapshot.size,
                checkInRate: Math.round((checkInSnapshot.size / (eventData.participants?.length || 1)) * 100),
            });
        }

        res.json({ success: true, events });
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ message: '이벤트 목록 조회 중 오류가 발생했습니다.' });
    }
});

// GET /api/events/:date - 특정 이벤트 상세
router.get('/events/:date', verifyMasterPassword, async (req, res) => {
    try {
        const eventDoc = await db.collection('events').doc(req.params.date).get();
        if (!eventDoc.exists) {
            return res.status(404).json({ message: '이벤트 없음' });
        }

        const eventData = eventDoc.data();
        const [checkInMemoSnapshot, checkInSnapshot, membersData] = await Promise.all([
            db.collection(`checkInMemo_${req.params.date}`).get(),
            db.collection(`checkIn_${req.params.date}`).get(),
            getAllMembers(),
        ]);

        const checkInMemoMap = {};
        for (const doc of checkInMemoSnapshot.docs) {
            checkInMemoMap[doc.id] = doc.data().memo || '';
        }

        const memberMap = {};
        membersData.forEach(member => {
            memberMap[member.phoneKey] = member;
        });

        const checkedInMembers = [];
        const checkedInPhoneKeys = new Set();

        checkInSnapshot.forEach(doc => {
            if (doc.id === '__meta__') return;

            const data = doc.data();
            const member = memberMap[doc.id] || {};
            checkedInPhoneKeys.add(doc.id);
            checkedInMembers.push({
                phoneKey: doc.id,
                name: data.name,
                phoneNumber: data.phone || data.phoneNumber,
                part: data.part,
                school: member.school || member.schoolName || '',
                type: Array.isArray(member.type) ? member.type : (member.type ? [member.type] : ['allMembers']),
                checkedInAt: formatTimestamp(data.checkedInAt),
                userMemo: member.memo || '',
                checkInMemo: checkInMemoMap[doc.id] || '',
                isManual: data.isManual || false,
            });
        });

        const notCheckedInMembers = [];
        for (const phoneKey of eventData.participants || []) {
            if (checkedInPhoneKeys.has(phoneKey)) continue;

            const member = memberMap[phoneKey];
            if (!member) continue;

            notCheckedInMembers.push({
                phoneKey,
                name: member.name,
                phoneNumber: member.phone || member.phoneNumber,
                part: member.part,
                school: member.school || member.schoolName || '',
                type: Array.isArray(member.type) ? member.type : (member.type ? [member.type] : ['allMembers']),
                userMemo: member.memo || '',
                checkInMemo: checkInMemoMap[phoneKey] || '',
            });
        }

        res.json({
            success: true,
            data: {
                event: eventData,
                checkedIn: checkedInMembers,
                notCheckedIn: notCheckedInMembers,
                stats: {
                    totalParticipants: eventData.participants?.length || 0,
                    checkedInCount: checkedInMembers.length,
                    notCheckedInCount: notCheckedInMembers.length,
                    percentage: Math.round((checkedInMembers.length / (eventData.participants?.length || 1)) * 100),
                },
            },
        });
    } catch (error) {
        console.error('Get event detail error:', error);
        res.status(500).json({ message: '이벤트 상세 조회 중 오류가 발생했습니다.' });
    }
});

// PATCH /api/events/:date - 이벤트 수정
router.patch('/events/:date', verifyMasterPassword, async (req, res) => {
    try {
        const { eventName, eventType } = req.body;
        const updateData = { updatedAt: new Date() };

        if (eventName) updateData.eventName = eventName;

        // eventType 변경 시 participants 재계산
        if (eventType) {
            const members = await getAllMembers();
            const newParticipants = [];
            members.forEach(member => {
                const memberTypes = Array.isArray(member.type)
                    ? member.type
                    : (member.type ? [member.type] : ['allMembers']);

                if (eventType === 'allMembers' || memberTypes.includes(eventType)) {
                    newParticipants.push(member.phoneKey);
                }
            });
            updateData.eventType = eventType;
            updateData.participants = newParticipants;
        }

        await db.collection('events').doc(req.params.date).update(updateData);
        res.json({ success: true });
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({ message: '이벤트 수정 중 오류가 발생했습니다.' });
    }
});

// DELETE /api/events/:date - 이벤트 삭제 (체크인 데이터도 삭제)
router.delete('/events/:date', verifyMasterPassword, async (req, res) => {
    try {
        const checkInSnapshot = await db.collection(`checkIn_${req.params.date}`).get();
        const batch = db.batch();

        checkInSnapshot.forEach(doc => batch.delete(doc.ref));
        batch.delete(db.collection('events').doc(req.params.date));

        await batch.commit();
        res.json({ success: true });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ message: '이벤트 삭제 중 오류가 발생했습니다.' });
    }
});

// POST /api/checkin/manual - 수동 체크인
router.post('/checkin/manual', verifyMasterPassword, async (req, res) => {
    try {
        const { phoneKey, date } = req.body;

        const eventDoc = await db.collection('events').doc(date).get();
        if (!eventDoc.exists) {
            return res.status(404).json({ message: '이벤트 없음' });
        }

        const eventData = eventDoc.data();

        // 3개 컬렉션에서 멤버 찾기
        let memberData = null;
        const collections = ['participants_admin', 'participants_member', 'participants_others'];

        for (const collectionName of collections) {
            const memberDoc = await db.collection(collectionName).doc(phoneKey).get();
            if (memberDoc.exists) {
                memberData = memberDoc.data();
                break;
            }
        }

        if (!memberData) {
            return res.status(404).json({ message: '멤버 없음' });
        }

        // 참가자가 아니면 자동으로 추가
        if (!eventData.participants.includes(phoneKey)) {
            eventData.participants.push(phoneKey);
            await db.collection('events').doc(date).update({ participants: eventData.participants });
        }

        const checkInDoc = await db.collection(`checkIn_${date}`).doc(phoneKey).get();
        if (checkInDoc.exists) {
            return res.status(409).json({ message: '이미 체크인됨' });
        }

        await db.collection(`checkIn_${date}`).doc(phoneKey).set({
            phoneKey,
            name: memberData.name,
            phoneNumber: memberData.phone,
            part: memberData.part,
            checkedInAt: new Date(),
            isManual: true,
            checkInMemo: '',
            userMemo: memberData.memo || '',
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Manual checkin error:', error);
        res.status(500).json({ message: '수동 체크인 중 오류가 발생했습니다.' });
    }
});

// DELETE /api/checkin/:date/:phoneKey - 체크인 취소 (문서 삭제)
router.delete('/checkin/:date/:phoneKey', verifyMasterPassword, async (req, res) => {
    try {
        await db.collection(`checkIn_${req.params.date}`).doc(req.params.phoneKey).delete();
        res.json({ success: true });
    } catch (error) {
        console.error('Cancel checkin error:', error);
        res.status(500).json({ message: '체크인 취소 중 오류가 발생했습니다.' });
    }
});

// PATCH /api/checkin/:date/:phoneKey/memo - 메모 수정
// body: { memo, type: "checkin" | "user" }
router.patch('/checkin/:date/:phoneKey/memo', verifyMasterPassword, async (req, res) => {
    try {
        const { memo, type = 'checkin' } = req.body;
        const { phoneKey, date } = req.params;

        if (type === 'checkin') {
            // 특이사항메모 - checkInMemo_{date} 컬렉션에 저장 (체크인 여부 무관)
            await db.collection(`checkInMemo_${date}`).doc(phoneKey).set({
                memo,
                updatedAt: new Date(),
            }, { merge: true });
        } else if (type === 'user') {
            // 유저메모 - 멤버 정보에 저장
            let memberData = null;
            let foundCollection = null;
            const collections = ['participants_admin', 'participants_member', 'participants_others'];

            for (const collectionName of collections) {
                const memberDoc = await db.collection(collectionName).doc(phoneKey).get();
                if (memberDoc.exists) {
                    memberData = memberDoc.data();
                    foundCollection = collectionName;
                    break;
                }
            }

            if (memberData && foundCollection) {
                await db.collection(foundCollection).doc(phoneKey).update({
                    memo,
                    memoUpdatedAt: new Date(),
                });
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Update memo error:', error);
        res.status(500).json({ message: '메모 수정 중 오류가 발생했습니다.' });
    }
});

export default router;
