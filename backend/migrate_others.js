import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, 'your-firebase-adminsdk.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: 'test-checkin-c8dcb'
});

const db = admin.firestore();

// 외부 참가자 데이터 (participants_others)
const externalParticipants = [
    { name: '채서린', email: 'add6847@naver.com', phone: '010-4504-7739', part: 'MOBILE', schoolName: '서울여자대학교', type: 'allMember,gdgSWU,TripleS', position: 'Organizer', gen: '25-26', memo: '' },
    { name: '임다인', email: '20221407@sungshin.ac.kr', phone: '010-9996-3359', part: 'AI', schoolName: '성신여자대학교', type: 'allMember,gdgSSWU,TripleS', position: 'Organizer', gen: '25-26', memo: '' },
    { name: '홍지현', email: 'hjh20030615@gmail.com', phone: '010-5160-1768', part: 'MOBILE', schoolName: '성신여자대학교', type: 'allMember,gdgSSWU,TripleS', position: 'Organizer', gen: '25-26', memo: '' },
    { name: '김채영', email: 'cxh0kk@gmail.com', phone: '010-9243-6693', part: 'PM', schoolName: '서울여자대학교', type: 'allMember,gdgSWU,TripleS', position: 'TeamMember', gen: '25-26', memo: '' },
    { name: '김현진', email: 'khjessica8875@gmail.com', phone: '010-8875-4718', part: 'DevRel', schoolName: '서울여자대학교', type: 'allMember,gdgSWU,TripleS', position: 'TeamMember', gen: '25-26', memo: '' },
    { name: '양세은', email: 'yse2395@naver.com', phone: '010-2395-8179', part: 'AI', schoolName: '성신여자대학교', type: 'allMember,gdgSSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
    { name: '권나영', email: 'qaz12k@gmail.com', phone: '010-6472-9360', part: 'DESIGN', schoolName: '서울여자대학교', type: 'allMember,gdgSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
    { name: '김성연', email: 'seongyeon0810@naver.com', phone: '010-2789-3703', part: 'WEB', schoolName: '성신여자대학교', type: 'allMember,gdgSSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
    { name: '이은우', email: '20230029@sungshin.ac.kr', phone: '010-9179-3841', part: 'BACKEND', schoolName: '성신여자대학교', type: 'allMember,gdgSSWU,TripleS', position: 'TeamMember', gen: '25-26', memo: '' },
    { name: '박세빈', email: 'pjjanguou@gmail.com', phone: '010-7370-5370', part: 'BACKEND', schoolName: '서울여자대학교', type: 'allMember,gdgSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
    { name: '김민서', email: 'bonmot777@gmail.com', phone: '010-5479-1559', part: 'DESIGN', schoolName: '서울여자대학교', type: 'allMember,gdgSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
    { name: '정서현', email: 'seohyun040128@naver.com', phone: '010-4730-3576', part: 'BACKEND', schoolName: '성신여자대학교', type: 'allMember,gdgSSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
    { name: '심수아', email: '20221107@sungshin.ac.kr', phone: '010-4660-6771', part: 'WEB', schoolName: '성신여자대학교', type: 'allMember,gdgSSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
    { name: '이정원', email: 'bellajw292@gmail.com', phone: '010-4127-4267', part: 'WEB', schoolName: '성신여자대학교', type: 'allMember,gdgSSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
    { name: '최어진', email: 'eojjiin4477@gmail.com', phone: '010-7321-5918', part: 'BACKEND', schoolName: '서울여자대학교', type: 'allMember,gdgSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
    { name: '김서정', email: 'ninthsgrsj@gmail.com', phone: '010-7399-7958', part: 'BACKEND', schoolName: '성신여자대학교', type: 'allMember,gdgSSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
    { name: '안예지', email: 'yejian244@gmail.com', phone: '010-8673-1720', part: 'MOBILE', schoolName: '서울여자대학교', type: 'allMember,gdgSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
    { name: '최희정', email: 'hee2003003@gmail.com', phone: '010-6829-0921', part: 'PM', schoolName: '성신여자대학교', type: 'allMember,gdgSSWU,TripleS', position: 'TeamMember', gen: '25-26', memo: '' },
    { name: '김승연', email: 'ssyykim03@naver.com', phone: '010-2078-5894', part: 'WEB', schoolName: '성신여자대학교', type: 'allMember,gdgSSWU,TripleS', position: 'TeamMember', gen: '25-26', memo: '' },
    { name: '박예린', email: 'rynyerin1019@gmail.com', phone: '010-4662-3922', part: 'AI', schoolName: '성신여자대학교', type: 'allMember,gdgSSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
    { name: '전지연', email: 'whiteblue89123@naver.com', phone: '010-5870-1315', part: 'BACKEND', schoolName: '성신여자대학교', type: 'allMember,gdgSSWU,TripleS', position: 'TeamMember', gen: '25-26', memo: '' },
    { name: '김도윤', email: 'abkimdoyo25@gmail.com', phone: '010-8987-0464', part: 'AI', schoolName: '성신여자대학교', type: 'allMember,gdgSSWU,TripleS', position: 'TeamMember', gen: '25-26', memo: '' },
    { name: '홍서연', email: 'seongyoung1122@gmail.com', phone: '010-4019-0280', part: 'DESIGN', schoolName: '서울여자대학교', type: 'allMember,gdgSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
    { name: '안다현', email: '20241010@sungshin.ac.kr', phone: '010-2299-4898', part: 'MOBILE', schoolName: '성신여자대학교', type: 'allMember,gdgSSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
    { name: '전유나', email: 'trueyn03@gmail.com', phone: '010-5054-2298', part: 'AI', schoolName: '성신여자대학교', type: 'allMember,gdgSSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
    { name: '김연지', email: 'yeonji300103@swu.ac.kr', phone: '010-7769-0103', part: 'MOBILE', schoolName: '서울여자대학교', type: 'allMember,gdgSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
    { name: '배나현', email: 'qoskgus020727@gmail.com', phone: '010-8608-6467', part: 'AI', schoolName: '서울여자대학교', type: 'allMember,gdgSWU,TripleS', position: 'TeamMember', gen: '25-26', memo: '' },
    { name: '고시은', email: 'sieun1156@naver.com', phone: '010-4078-5939', part: 'WEB', schoolName: '서울여자대학교', type: 'allMember,gdgSWU', position: 'Member', gen: '25-26', memo: '' },
    { name: '오나현', email: 'hyeona7795@naver.com', phone: '010-5492-7524', part: 'MOBILE', schoolName: '서울여자대학교', type: 'allMember,gdgSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
    { name: '성민주', email: 'minju2928@naver.com', phone: '010-6410-7546', part: 'BACKEND', schoolName: '서울여자대학교', type: 'allMember,gdgSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
    { name: '이현경', email: 'blue87083@gmail.com', phone: '010-3446-5545', part: 'BACKEND', schoolName: '성신여자대학교', type: 'allMember,gdgSSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
    { name: '손정민', email: 'suruna1026@gmail.com', phone: '010-5355-0433', part: 'BACKEND', schoolName: '성신여자대학교', type: 'allMember,gdgSSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
    { name: '김승은', email: 'siakim1203@gmail.com', phone: '010-9160-8683', part: 'PM', schoolName: '서울여자대학교', type: 'allMember,gdgSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
    { name: '이예나', email: 'yena040814@gmail.com', phone: '010-5843-1288', part: 'DESIGN', schoolName: '서울여자대학교', type: 'allMember,gdgSWU,TripleS', position: 'Member', gen: '25-26', memo: '' },
];

async function migrateData() {
    try {
        console.log('🚀 participants_others로 데이터 적재 시작...\n');

        let successCount = 0;
        for (const participant of externalParticipants) {
            // phone에서 하이픈을 제거하여 phoneKey 생성 (010 형식)
            const phoneKey = participant.phone.replace(/-/g, '');

            // type을 배열로 변환 (쉼표로 구분)
            const types = participant.type
                .split(',')
                .map(t => t.trim().toLowerCase())
                .map(t => {
                    // 타입명 정규화
                    if (t === 'allmember') return 'allMembers';
                    if (t === 'gdgswu') return 'gdgSKHU';
                    if (t === 'gdgssuwu') return 'gdgSKHU';
                    if (t === 'triples') return 'tripleS';
                    return t;
                })
                .filter(t => t); // 빈 문자열 제거

            await db.collection('participants_others').doc(phoneKey).set({
                phoneKey,
                name: participant.name,
                email: participant.email,
                phone: participant.phone,
                phoneNumber: participant.phone, // 호환성
                part: participant.part,
                schoolName: participant.schoolName,
                position: participant.position,
                gen: participant.gen,
                types: types.length > 0 ? types : ['allMembers'],
                memo: participant.memo || '',
                createdAt: new Date(),
            });

            console.log(`✅ ${participant.name} (${phoneKey}) 추가됨 - 타입: [${types.join(', ')}]`);
            successCount++;
        }

        console.log(`\n✨ 총 ${successCount}명의 외부 참가자 데이터 적재 완료!`);

        // 검증
        const snapshot = await db.collection('participants_others').get();
        console.log(`📊 현재 participants_others 총 멤버 수: ${snapshot.size}명\n`);

        // 샘플 데이터 확인
        console.log('📋 샘플 데이터:');
        const firstDoc = snapshot.docs[0];
        console.log(firstDoc.id, JSON.stringify(firstDoc.data(), null, 2));

        process.exit(0);
    } catch (error) {
        console.error('❌ 에러:', error);
        process.exit(1);
    }
}

migrateData();
