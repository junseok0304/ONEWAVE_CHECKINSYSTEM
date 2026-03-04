import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./your-firebase-adminsdk.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'test-checkin-c8dcb',
});

const db = admin.firestore();

async function addKimToEvent() {
    try {
        const date = '2026-02-25';
        const phoneKey = '01012340304';
        
        const eventDoc = await db.collection('events').doc(date).get();
        
        if (!eventDoc.exists) {
            console.log('Event not found');
            process.exit(1);
        }
        
        const eventData = eventDoc.data();
        const participants = eventData.participants || [];
        
        if (participants.includes(phoneKey)) {
            console.log('김중복은 이미 participants에 포함됨');
        } else {
            // 배열에 추가
            participants.push(phoneKey);
            
            await db.collection('events').doc(date).update({
                participants: participants
            });
            
            console.log(`✅ 김중복(${phoneKey})이 이벤트의 participants에 추가됨`);
        }
        
        console.log(`총 ${participants.length}명`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addKimToEvent();
