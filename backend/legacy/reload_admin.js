import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, 'your-firebase-adminsdk.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: 'test-checkin-c8dcb'
});

const db = admin.firestore();

function normalizePhone(phone) {
    if (!phone) return '';
    return phone.replace(/\D/g, '').slice(-11);
}

function getTypesFromTypeString(typeString) {
    const types = ['allMembers'];
    
    if (!typeString) return types;
    
    const typeList = typeString.split(',').map(t => t.trim().toLowerCase());
    
    for (const t of typeList) {
        if (t === 'allmember' || t === 'allmembers') {
            // already added
        } else if (t === 'gdgskhu') {
            if (!types.includes('gdgSKHU')) types.push('gdgSKHU');
        } else if (t === 'triples' || t === 'tripless') {
            if (!types.includes('TripleS')) types.push('TripleS');
        } else if (t) {
            if (!types.includes(t)) types.push(t);
        }
    }
    
    return types;
}

async function reloadAdmin() {
    try {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔄 participants_admin CSV 재로드');
        console.log('═══════════════════════════════════════════════════════════\n');

        // 기존 데이터 삭제
        console.log('🗑️  기존 데이터 삭제 중...');
        const snapshot = await db.collection('participants_admin').get();
        console.log(`  삭제 대상: ${snapshot.size}명`);

        for (const doc of snapshot.docs) {
            await doc.ref.delete();
        }
        console.log('  ✅ 완료\n');

        // CSV 파일 로드
        const csvPath = '/Users/junseok/Downloads/participants_admin.csv';
        
        if (!fs.existsSync(csvPath)) {
            throw new Error(`CSV 파일을 찾을 수 없습니다: ${csvPath}`);
        }

        const members = [];

        await new Promise((resolve, reject) => {
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (row) => {
                    const name = (row.name || '').trim();
                    
                    // 헤더나 빈 행 무시
                    if (!name || name === 'name') {
                        return;
                    }

                    const phoneKey = normalizePhone(row.phone);
                    
                    if (!phoneKey) {
                        console.log(`  ⚠️  "${name}" - 유효한 전화번호 없음`);
                        return;
                    }

                    const types = getTypesFromTypeString(row.type);

                    members.push({
                        phoneKey,
                        name,
                        phone: row.phone || '',
                        part: (row.part || '').trim(),
                        schoolName: (row.schoolName || '').trim(),
                        position: (row.position || '').trim(),
                        gen: (row.gen || '').trim(),
                        type: types,
                        memo: (row.memo || '').trim(),
                    });
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`📋 로드된 멤버: ${members.length}명\n`);
        console.log('🚀 Firestore에 업로드 중...\n');

        let uploadedCount = 0;

        for (const member of members) {
            try {
                await db.collection('participants_admin').doc(member.phoneKey).set({
                    name: member.name,
                    phone: member.phone,
                    part: member.part,
                    schoolName: member.schoolName,
                    position: member.position,
                    gen: member.gen,
                    type: member.type,
                    memo: member.memo,
                });

                console.log(`✅ ${member.name} - 타입: ${member.type.join(', ')}`);
                uploadedCount++;
            } catch (error) {
                console.log(`❌ ${member.name} - 오류: ${error.message}`);
            }
        }

        console.log(`\n✨ 총 ${uploadedCount}명의 participants_admin 데이터 업로드 완료!\n`);

        // 최종 확인
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📊 최종 데이터 현황:');
        const adminSnapshot = await db.collection('participants_admin').get();
        const memberSnapshot = await db.collection('participants_member').get();
        const othersSnapshot = await db.collection('participants_others').get();

        console.log(`  ✅ participants_admin: ${adminSnapshot.size}명`);
        console.log(`  ✅ participants_member: ${memberSnapshot.size}명`);
        console.log(`  ✅ participants_others: ${othersSnapshot.size}명`);
        
        const totalCount = adminSnapshot.size + memberSnapshot.size + othersSnapshot.size;
        console.log(`\n📈 총 인원: ${totalCount}명`);

        // 타입별 집계
        console.log('\n📋 타입별 분류:');
        const typeStats = {};

        [adminSnapshot, memberSnapshot, othersSnapshot].forEach(snap => {
            snap.forEach(doc => {
                const data = doc.data();
                const types = Array.isArray(data.type) ? data.type : (data.type ? [data.type] : ['allMembers']);
                types.forEach(t => {
                    typeStats[t] = (typeStats[t] || 0) + 1;
                });
            });
        });

        Object.entries(typeStats).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
            console.log(`  • ${type}: ${count}명`);
        });
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('❌ 에러:', error);
        process.exit(1);
    }
}

reloadAdmin();
