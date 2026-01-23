import express from 'express';
import db from './firestore.js';
import { verifyPassword } from './authMiddleware.js';

const router = express.Router();

router.get('/', (req, res) => res.json({ message: 'QRCheckin API Online' }));

// 참가자 조회 (관리자용)
router.get('/participants', verifyPassword, async (req, res) => {
    const snapshot = await db.collection('participants').get();
    const data = snapshot.docs.map(doc => {
        const docData = doc.data();

        // Firebase Timestamp를 ISO 문자열로 변환
        const formatTimestamp = (timestamp) => {
            if (!timestamp) return null;
            try {
                // Firebase Timestamp 객체인 경우
                if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                    return timestamp.toDate().toISOString();
                }
                // 이미 Date 객체인 경우
                if (timestamp instanceof Date) {
                    return timestamp.toISOString();
                }
                // 문자열인 경우
                if (typeof timestamp === 'string') {
                    return new Date(timestamp).toISOString();
                }
                return null;
            } catch (e) {
                return null;
            }
        };

        return {
            id: doc.id,
            name: docData.name,
            team_number: docData.team_number || '',
            part: docData.part || '',
            phone_number: docData.phone_number,
            isCheckedIn: docData.checked_in_status || false,
            checkedInAt: formatTimestamp(docData.checkedInAt),
            memo: docData.memo || '',
            checkedOutAt: formatTimestamp(docData.checkedOutAt),
            checkedOutMemo: docData.checkedOutMemo || '',
        };
    });
    res.json(data);
});

// 휴대폰 끝 4자리로 참가자 검색 (키오스크용)
router.get('/search', async (req, res) => {
    const { phoneLast4 } = req.query;

    if (!phoneLast4 || phoneLast4.length !== 4) {
        return res.status(400).json({ message: '휴대폰 번호 뒷 4자리를 입력해주세요.' });
    }

    try {
        const snapshot = await db.collection('participants').get();
        const results = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            const phoneLastDigits = data.phone_number?.slice(-4);
            if (phoneLastDigits === phoneLast4) {
                results.push({
                    id: doc.id,
                    name: data.name,
                    phone_number: data.phone_number,
                    checked_in_status: data.checked_in_status,
                    team_number: data.team_number,
                    status: data.status || 'REJECTED',
                });
            }
        });

        if (results.length === 0) {
            return res.status(404).json({ message: '해당하는 참가자를 찾을 수 없습니다.' });
        }

        res.json(results);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: '검색 중 오류가 발생했습니다.' });
    }
});

// 체크인 처리
router.post('/checkin', async (req, res) => {
    const { participantId } = req.body;

    if (!participantId) {
        return res.status(400).json({ message: '참가자 ID가 필요합니다.' });
    }

    const doc = await db.collection('participants').doc(participantId).get();

    if (!doc.exists) {
        return res.status(404).json({ message: '참가자를 찾을 수 없습니다.' });
    }

    const data = doc.data();

    if (data.checked_in_status) {
        return res.status(409).json({ message: '이미 체크인됨' });
    }

    await db.collection('participants').doc(participantId).update({
        checked_in_status: true,
        checkedInAt: new Date(),
        updatedAt: new Date(),
    });

    res.json({ success: true, participantId, name: data.name });
});

// 참가자 정보 수정 (메모, 체크인 상태 등)
router.put('/participants/:participantId', verifyPassword, async (req, res) => {
    const { participantId } = req.params;
    const { memo, checked_in_status, checkedOutAt, checkedOutMemo } = req.body;

    if (!participantId) {
        return res.status(400).json({ message: '참가자 ID가 필요합니다.' });
    }

    const doc = await db.collection('participants').doc(participantId).get();

    if (!doc.exists) {
        return res.status(404).json({ message: '참가자를 찾을 수 없습니다.' });
    }

    const updateData = { updatedAt: new Date() };
    const currentData = doc.data();

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

    await db.collection('participants').doc(participantId).update(updateData);

    res.json({ success: true, participantId });
});

export default router;
