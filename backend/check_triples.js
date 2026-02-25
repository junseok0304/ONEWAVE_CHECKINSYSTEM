import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

const csvDir = '/Users/junseok/Downloads';

const files = [
    'participants_admin.csv',
    'participants_member.csv',
    'participants_others.csv'
];

let totalTripleS = 0;

for (const fileName of files) {
    const filePath = path.join(csvDir, fileName);
    
    if (!fs.existsSync(filePath)) {
        console.log(`❌ ${fileName} 파일을 찾을 수 없습니다.\n`);
        continue;
    }

    console.log(`📄 ${fileName}`);

    let count = 0;
    const triples = [];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            const name = (row.name || '').trim();
            const type = (row.type || '').toLowerCase();
            
            if (name && name !== 'name' && (type.includes('triple') || type.includes('triples'))) {
                count++;
                triples.push(name);
            }
        })
        .on('end', () => {
            console.log(`  TripleS: ${count}명`);
            if (count <= 10) {
                triples.forEach(name => console.log(`    • ${name}`));
            }
            console.log('');
            totalTripleS += count;
        });
}

setTimeout(() => {
    console.log(`═══════════════════════════════════════════`);
    console.log(`📊 총 TripleS: ${totalTripleS}명`);
    process.exit(0);
}, 1500);
