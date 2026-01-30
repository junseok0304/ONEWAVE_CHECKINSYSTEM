import express from 'express';
import db from './firestore.js';
import { verifyPassword } from './authMiddleware.js';

const router = express.Router();

router.get('/', (req, res) => res.json({ message: 'QRCheckin API Online' }));

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

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

// 휴대폰 번호에서 끝 4자리 추출 (010-2140-7614 → 7614)
const getPhoneLast4 = (phone) => {
    if (!phone) return '';
    return phone.replace(/-/g, '').slice(-4);
};

// 운영진 조회 (관리자용)
router.get('/members', verifyPassword, async (req, res) => {
    const snapshot = await db.collection('participants_admin').get();
    const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        return {
            phoneKey: doc.id,
            name: docData.name,
            phoneNumber: docData.phone,
            part: docData.position || '',
            school: docData.school || '',
            memo: docData.memo || '',
            email: docData.email || '',
            status: docData.status || 'APPROVED',
        };
    });
    res.json({ members: data });
});

// 참가자 조회 (관리자용) - 운영진 제외 (운영진은 participants_admin에서 별도 관리)
router.get('/participants', verifyPassword, async (req, res) => {
    const snapshot = await db.collection('participants_checkin').get();
    const data = snapshot.docs
        .map(doc => {
            const docData = doc.data();

            return {
                id: doc.id,
                email: docData.email,
                name: docData.name,
                team_number: docData.teamNumber || 0,
                part: docData.position || '',
                phone_number: docData.phone,
                status: docData.status || 'REJECTED',
                isCheckedIn: docData.checked_in_status || false,
                checkedInAt: formatTimestamp(docData.checkedInAt),
                memo: docData.memo || '',
                checkedOutAt: formatTimestamp(docData.checkedOutAt),
                checkedOutMemo: docData.checkedOutMemo || '',
            };
        })
        .filter(p => p.team_number !== 0 && p.team_number !== '0'); // 운영진 제외
    res.json(data);
});

// 휴대폰 끝 4자리로 참가자 검색 (키오스크용) - 운영진 + 참가자
router.get('/search', async (req, res) => {
    const { phoneLast4 } = req.query;

    if (!phoneLast4 || phoneLast4.length !== 4) {
        return res.status(400).json({ message: '휴대폰 번호 뒷 4자리를 입력해주세요.' });
    }

    try {
        const results = [];

        // 1. participants_checkin에서 검색 (일반 참가자)
        const checkinSnapshot = await db.collection('participants_checkin').get();
        checkinSnapshot.forEach(doc => {
            const data = doc.data();
            const phoneLastDigits = getPhoneLast4(data.phone);
            if (phoneLastDigits === phoneLast4) {
                results.push({
                    phoneKey: doc.id,
                    email: data.email,
                    name: data.name,
                    phone_number: data.phone,
                    checked_in_status: data.checked_in_status,
                    team_number: data.teamNumber,
                    status: data.status || 'REJECTED',
                });
            }
        });

        // 2. participants_admin에서 검색 (운영진)
        const adminSnapshot = await db.collection('participants_admin').get();
        adminSnapshot.forEach(doc => {
            const data = doc.data();
            const phoneLastDigits = getPhoneLast4(data.phone);
            if (phoneLastDigits === phoneLast4) {
                results.push({
                    phoneKey: doc.id,
                    email: data.email || '',
                    name: data.name,
                    phone_number: data.phone,
                    checked_in_status: false,
                    team_number: 0,
                    status: data.status || 'APPROVED',
                });
            }
        });

        if (results.length === 0) {
            return res.status(404).json({ message: '해당하는 참가자를 찾을 수 없습니다.' });
        }

        res.json({ results });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: '검색 중 오류가 발생했습니다.' });
    }
});

// 체크인 처리
// 체크인 처리 (운영진 + 참가자)
router.post('/checkin', async (req, res) => {
    const { phoneKey } = req.body;

    if (!phoneKey) {
        return res.status(400).json({ message: '참가자 정보가 필요합니다.' });
    }

    try {
        const today = getTodayString();

        // 이미 체크인했는지 확인
        const checkInDoc = await db.collection(`checkIn_${today}`).doc(phoneKey).get();
        if (checkInDoc.exists) {
            return res.status(409).json({ message: '이미 체크인됨' });
        }

        // 1. 운영진 확인 (participants_admin)
        const adminDoc = await db.collection('participants_admin').doc(phoneKey).get();
        if (adminDoc.exists) {
            const adminData = adminDoc.data();
            await db.collection(`checkIn_${today}`).doc(phoneKey).set({
                name: adminData.name,
                phoneNumber: adminData.phone,
                part: adminData.position || '',
                teamNumber: 0,
                isStaff: true,
                checkedInAt: new Date(),
            });

            return res.json({
                success: true,
                phoneKey,
                name: adminData.name,
                isStaff: true,
            });
        }

        // 2. 일반 참가자 확인 (participants_checkin)
        const participantDoc = await db.collection('participants_checkin').doc(phoneKey).get();
        if (!participantDoc.exists) {
            return res.status(404).json({ message: '참가자를 찾을 수 없습니다.' });
        }

        const participantData = participantDoc.data();

        if (participantData.checked_in_status) {
            return res.status(409).json({ message: '이미 체크인됨' });
        }

        // 3. 체크인 기록 저장
        await db.collection(`checkIn_${today}`).doc(phoneKey).set({
            name: participantData.name,
            phoneNumber: participantData.phone,
            part: participantData.position || '',
            teamNumber: participantData.teamNumber || 1,
            isStaff: false,
            checkedInAt: new Date(),
        });

        // 4. participants_checkin의 checked_in_status도 업데이트
        await db.collection('participants_checkin').doc(phoneKey).update({
            checked_in_status: true,
            checkedInAt: new Date(),
            updatedAt: new Date(),
        });

        res.json({
            success: true,
            phoneKey,
            name: participantData.name,
            isStaff: false,
        });
    } catch (error) {
        console.error('Checkin error:', error);
        res.status(500).json({ message: '체크인 중 오류가 발생했습니다.' });
    }
});

// 참가자 정보 수정 (메모, 체크인 상태 등)
// 참가자/운영진 정보 수정 (메모, 체크인 상태 등)
router.put('/participants/:participantId', verifyPassword, async (req, res) => {
    const { participantId } = req.params;
    const { memo, checked_in_status, checkedOutAt, checkedOutMemo } = req.body;

    if (!participantId) {
        return res.status(400).json({ message: '참가자 ID가 필요합니다.' });
    }

    try {
        // 1. 일반 참가자 검색
        let doc = await db.collection('participants_checkin').doc(participantId).get();
        let collection = 'participants_checkin';
        let isAdmin = false;

        // 2. 없으면 운영진 검색
        if (!doc.exists) {
            doc = await db.collection('participants_admin').doc(participantId).get();
            collection = 'participants_admin';
            isAdmin = true;
        }

        // 3. 둘 다 없으면 에러
        if (!doc.exists) {
            return res.status(404).json({ message: '참가자를 찾을 수 없습니다.' });
        }

        const updateData = { updatedAt: new Date() };
        const currentData = doc.data();

        // 운영진은 checked_in_status, checkedOutAt, checkedOutMemo 업데이트 불가능
        if (isAdmin && (checked_in_status !== undefined || checkedOutAt !== undefined || checkedOutMemo !== undefined)) {
            return res.status(400).json({ message: '운영진은 체크인 상태를 수정할 수 없습니다.' });
        }

        if (memo !== undefined) {
            updateData.memo = memo;
        }

        if (checked_in_status !== undefined) {
            updateData.checked_in_status = checked_in_status;
            if (checked_in_status && !currentData.checked_in_status) {
                updateData.checkedInAt = new Date();
            } else if (!checked_in_status && currentData.checked_in_status) {
                updateData.checkedInAt = null;
            }
        }

        if (checkedOutMemo !== undefined) {
            updateData.checkedOutMemo = checkedOutMemo;
            // 체크아웃 메모를 작성하면 현재 시간으로 체크아웃 처리
            if (checkedOutMemo && !currentData.checkedOutAt) {
                updateData.checkedOutAt = new Date();
            }
        }

        if (checkedOutAt !== undefined) {
            updateData.checkedOutAt = checkedOutAt ? new Date(checkedOutAt) : null;
        }

        await db.collection(collection).doc(participantId).update(updateData);

        res.json({ success: true, participantId });
    } catch (error) {
        console.error('Update participant error:', error);
        res.status(500).json({ message: '참가자 정보 수정 중 오류가 발생했습니다.' });
    }
});

// 대시보드 통계
router.get('/dashboard/stats', verifyPassword, async (req, res) => {
    try {
        const today = getTodayString();

        // 1. 오늘의 이벤트 조회
        const eventDoc = await db.collection('events').doc(today).get();

        if (!eventDoc.exists) {
            return res.json({
                stats: {
                    eventName: null,
                    eventType: null,
                    totalParticipants: 0,
                    todayCheckInCount: 0,
                    todayCheckInPercentage: 0,
                },
            });
        }

        const eventData = eventDoc.data();

        // 2. 오늘의 체크인 기록 조회
        const checkInSnapshot = await db.collection(`checkIn_${today}`).get();
        const todayCheckInCount = checkInSnapshot.size;

        // 3. 통계 계산
        const totalParticipants = eventData.participants.length;
        const todayCheckInPercentage = totalParticipants > 0
            ? Math.round((todayCheckInCount / totalParticipants) * 100)
            : 0;

        res.json({
            stats: {
                eventName: eventData.eventName,
                eventType: eventData.eventType,
                totalParticipants,
                todayCheckInCount,
                todayCheckInPercentage,
            },
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: '통계 조회 중 오류가 발생했습니다.' });
    }
});

// 실시간 체크인 현황 조회
router.get('/realtime/checkin', verifyPassword, async (req, res) => {
    try {
        const today = getTodayString();

        // 1. 오늘의 이벤트 조회
        const eventDoc = await db.collection('events').doc(today).get();
        if (!eventDoc.exists) {
            return res.status(404).json({ message: '오늘 예정된 이벤트가 없습니다.' });
        }

        const eventData = eventDoc.data();

        // 2. 오늘의 체크인 기록 조회
        const checkInSnapshot = await db.collection(`checkIn_${today}`).get();
        const checkedInUsers = [];
        const checkedInIds = new Set();

        checkInSnapshot.forEach(doc => {
            const data = doc.data();
            checkedInUsers.push({
                phoneKey: doc.id,
                phoneNumber: data.phoneNumber,
                name: data.name,
                part: data.part || '',
                checkedInAt: formatTimestamp(data.checkedInAt),
            });
            checkedInIds.add(doc.id);
        });

        // 3. 미체크인 사용자 조회
        const notCheckedInUsers = [];
        for (const phoneKey of eventData.participants) {
            if (!checkedInIds.has(phoneKey)) {
                const userDoc = await db.collection('dommy').doc(phoneKey).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    notCheckedInUsers.push({
                        phoneKey,
                        phoneNumber: userData.phoneNumber,
                        name: userData.name,
                        part: userData.part || '',
                    });
                }
            }
        }

        // 4. 통계 계산
        const totalCount = eventData.participants.length;
        const checkedInCount = checkedInUsers.length;
        const checkInRate = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

        res.json({
            success: true,
            data: {
                event: eventData,
                stats: {
                    eventName: eventData.eventName,
                    eventType: eventData.eventType,
                    checkedInCount,
                    totalCount,
                    checkInRate,
                },
                checkedIn: checkedInUsers,
                notCheckedIn: notCheckedInUsers,
            },
        });
    } catch (error) {
        console.error('Realtime checkin error:', error);
        res.status(500).json({ message: '실시간 현황 조회 중 오류가 발생했습니다.' });
    }
});

export default router;
