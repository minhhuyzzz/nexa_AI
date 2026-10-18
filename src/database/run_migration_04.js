const fs = require('fs');
const https = require('https');
const path = require('path');

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: '/v1/projects/rfbudggycfhbzgxhytlo/database/query',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN || ''}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (d) => body += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    console.log('1. Applying Migration: 04_evidence_storage_schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'migrations/04_evidence_storage_schema.sql'), 'utf8');
    await executeSQL(schemaSql);
    console.log('   ✓ Evidence storage bucket & policies applied successfully!');

    console.log('2. Applying Seed: 04_practical_evidence_seed.sql...');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seeds/04_practical_evidence_seed.sql'), 'utf8');
    await executeSQL(seedSql);
    console.log('   ✓ Practical evidence item and 3-criterion Rubric seed applied successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

main();
