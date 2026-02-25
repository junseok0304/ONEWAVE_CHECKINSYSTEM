import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./your-firebase-adminsdk.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'test-checkin-c8dcb',
});

const db = admin.firestore();

async function migrateSchoolField() {
    try {
        const collections = ['participants_member', 'participants_admin', 'participants_others'];
        let totalUpdated = 0;
        
        for (const collectionName of collections) {
            console.log(`\nProcessing ${collectionName}...`);
            
            const snapshot = await db.collection(collectionName).get();
            
            for (const doc of snapshot.docs) {
                const data = doc.data();
                
                // schoolName이 있고 school이 없으면 변환
                if (data.schoolName && !data.school) {
                    await doc.ref.update({
                        school: data.schoolName,
                        schoolName: admin.firestore.FieldValue.delete()
                    });
                    
                    console.log(`  ✅ ${data.name}: schoolName → school`);
                    totalUpdated++;
                } else if (data.schoolName && data.school) {
                    // 둘 다 있으면 schoolName 제거
                    await doc.ref.update({
                        schoolName: admin.firestore.FieldValue.delete()
                    });
                    console.log(`  ✅ ${data.name}: schoolName 제거`);
                    totalUpdated++;
                }
            }
        }
        
        console.log(`\n✅ 총 ${totalUpdated}명의 멤버가 마이그레이션됨`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

migrateSchoolField();
