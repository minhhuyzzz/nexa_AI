const fs = require('fs');
const https = require('https');
const path = require('path');

/**
 * Consolidated Database Migration & Seed Runner for NEXA AI
 * Project: NEXA (rfbudggycfhbzgxhytlo)
 *
 * Usage:
 *   node run_migration.js <relative-file-path>
 *   node run_migration.js migrations/46_schema_standardization_and_cleanup.sql
 *   node run_migration.js seeds/06_course_catalog_seed.sql
 *   node run_migration.js --all-canonical-seeds
 */

const PROJECT_REF = process.env.SUPABASE_PROJECT_ID || 'rfbudggycfhbzgxhytlo';
const SUPABASE_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
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

async function runFile(relativeFilePath) {
  const fullPath = path.resolve(__dirname, relativeFilePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`SQL file not found at: ${fullPath}`);
  }
  console.log(`Executing SQL file: ${path.relative(__dirname, fullPath)}...`);
  const sql = fs.readFileSync(fullPath, 'utf8');
  await executeSQL(sql);
  console.log(`✓ Completed: ${path.relative(__dirname, fullPath)}`);
}

async function main() {
  const args = process.argv.slice(2);
  const target = args[0];

  if (!SUPABASE_TOKEN && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[NOTICE] SUPABASE_ACCESS_TOKEN is not set in environment.');
  }

  try {
    if (!target) {
      console.log('No specific file specified. Running latest standardization migration...');
      await runFile('migrations/46_schema_standardization_and_cleanup.sql');
    } else if (target === '--all-canonical-seeds') {
      const canonicalSeeds = [
        'seeds/01_framework_seed.sql',
        'seeds/02_mcq_benchmark_seed.sql',
        'seeds/03_scenario_rubric_seed.sql',
        'seeds/04_practical_evidence_seed.sql',
        'seeds/05_learning_modules_seed.sql',
        'seeds/06_course_catalog_seed.sql',
        'seeds/07_baseline_digcomp_assessment_seed.sql',
        'seeds/08_real_120_questions.sql',
      ];
      for (const seed of canonicalSeeds) {
        await runFile(seed);
      }
    } else {
      await runFile(target);
    }
    console.log('Database runner finished successfully.');
  } catch (err) {
    console.error('Database runner execution failed:', err.message || err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { executeSQL, runFile };
