import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./your-firebase-adminsdk.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'test-checkin-c8dcb',
});

const db = admin.firestore();

async function fixKimData() {
    try {
        const phoneKey = '01012340304';
        const collections = ['participants_member', 'participants_admin', 'participants_others'];
        
        for (const collectionName of collections) {
            const doc = await db.collection(collectionName).doc(phoneKey).get();
            
            if (doc.exists) {
                const data = doc.data();
                console.log(`Found in ${collectionName}:`, data);
                
                // phoneNumber → phone, schoolName → school로 변환
                const updates = {
                    phone: data.phoneNumber || data.phone,
                    school: data.schoolName || data.school || '',
                };
                
                await db.collection(collectionName).doc(phoneKey).update(updates);
                
                // phoneNumber와 schoolName 필드 제거
                await db.collection(collectionName).doc(phoneKey).update({
                    phoneNumber: admin.firestore.FieldValue.delete(),
                    schoolName: admin.firestore.FieldValue.delete(),
                });
                
                console.log(`✅ Updated ${collectionName}`);
                break;
            }
        }
        
        console.log('✅ Fix completed');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixKimData();
