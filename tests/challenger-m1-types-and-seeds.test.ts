import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from '@/types/database.types';

describe('Milestone 1 Empirical Verification: Database Types & Canonical Seeds', () => {
  const projectRoot = path.resolve(__dirname, '..');

  describe('1. TypeScript database.types.ts Validation', () => {
    const typesFilePath = path.join(projectRoot, 'src/types/database.types.ts');

    it('database.types.ts exists and is non-empty', () => {
      expect(fs.existsSync(typesFilePath)).toBe(true);
      const stat = fs.statSync(typesFilePath);
      expect(stat.size).toBeGreaterThan(10000); // 108KB
    });

    it('exports Database, Tables, TablesInsert, TablesUpdate helper types', () => {
      // Static compile-time type assertions
      type T_AAL = Tables<'admin_audit_logs'>;
      type T_AAL_Ins = TablesInsert<'admin_audit_logs'>;
      type T_AAL_Upd = TablesUpdate<'admin_audit_logs'>;

      const dummyRow: T_AAL = {
        id: '00000000-0000-0000-0000-000000000000',
        admin_id: null,
        admin_email: 'admin@nexa.vn',
        action: 'TEST',
        target_type: 'SYSTEM',
        target_id: null,
        details: {},
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString(),
      };
      expect(dummyRow.action).toBe('TEST');
    });

    it('contains all 8 new Milestone 1 tables with valid Row/Insert/Update definitions', () => {
      type DBTables = Database['public']['Tables'];

      // Table 1: course_catalog
      type CC = DBTables['course_catalog']['Row'];
      const cc: CC = {
        id: 'test_c1',
        title: 'Test',
        provider: 'NEXA',
        official_url: 'https://nexa.vn',
        domain_codes: ['D1'],
        level: 'INTERMEDIATE',
        language: 'vi',
        format: 'Online',
        duration: '2 tuần',
        price_type: 'FREE',
        review_status: 'APPROVED',
        last_verified_at: null,
        short_description: null,
        learning_outcomes: [],
        created_at: null,
      };
      expect(cc.id).toBe('test_c1');

      // Table 2: user_course_progress
      type UCP = DBTables['user_course_progress']['Row'];
      const ucp: UCP = {
        id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000001',
        course_id: 'test_c1',
        status: 'SAVED',
        started_at: null,
        completed_at: null,
        is_self_reported: true,
        created_at: null,
        updated_at: null,
      };
      expect(ucp.status).toBe('SAVED');

      // Table 3: admin_audit_logs
      type AAL = DBTables['admin_audit_logs']['Row'];
      const aal: AAL = {
        id: '00000000-0000-0000-0000-000000000000',
        admin_id: null,
        admin_email: 'admin.nexa@gmail.com',
        action: 'UPDATE_SETTING',
        target_type: 'platform_settings',
        target_id: 'maintenance_mode',
        details: { mode: 'off' },
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString(),
      };
      expect(aal.action).toBe('UPDATE_SETTING');

      // Table 4: platform_settings
      type PS = DBTables['platform_settings']['Row'];
      const ps: PS = {
        key: 'test_key',
        value: { enabled: true },
        description: null,
        updated_by: null,
        updated_at: new Date().toISOString(),
      };
      expect(ps.key).toBe('test_key');

      // Table 5: organization_policies
      type OP = DBTables['organization_policies']['Row'];
      const op: OP = {
        organization_id: '00000000-0000-0000-0000-000000000000',
        allowed_domains: [],
        anti_cheat_enabled: true,
        fullscreen_enforced: false,
        tab_switch_limit: 3,
        time_limit_minutes: 60,
        passing_score: 70,
        auto_publish_results: true,
        show_detailed_breakdown: true,
        require_approval_for_join: false,
        allow_code_join: true,
        updated_at: new Date().toISOString(),
        updated_by: null,
      };
      expect(op.passing_score).toBe(70);

      // Table 6: feedback_tickets
      type FT = DBTables['feedback_tickets']['Row'];
      const ft: FT = {
        id: '00000000-0000-0000-0000-000000000000',
        user_id: null,
        organization_id: null,
        user_email: null,
        user_name: null,
        category: 'GENERAL',
        subject: 'Help',
        content: 'Issue details',
        status: 'OPEN',
        admin_notes: null,
        resolved_at: null,
        resolved_by: null,
        created_at: new Date().toISOString(),
      };
      expect(ft.subject).toBe('Help');

      // Table 7: ai_credit_reservations
      type ACR = DBTables['ai_credit_reservations']['Row'];
      const acr: ACR = {
        id: '00000000-0000-0000-0000-000000000000',
        request_id: 'req_123',
        payer_type: 'PERSONAL',
        payer_id: '00000000-0000-0000-0000-000000000001',
        amount: 5,
        status: 'RESERVED',
        remaining_credits: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(acr.request_id).toBe('req_123');

      // Table 8: org_audit_logs
      type OAL = DBTables['org_audit_logs']['Row'];
      const oal: OAL = {
        id: '00000000-0000-0000-0000-000000000000',
        organization_id: '00000000-0000-0000-0000-000000000001',
        actor_id: null,
        actor_email: null,
        actor_role: null,
        action: 'UPDATE',
        target_type: 'MEMBER',
        target_id: null,
        details: null,
        created_at: new Date().toISOString(),
      };
      expect(oal.action).toBe('UPDATE');
    });

    it('contains all 7 new columns added in Milestone 1', () => {
      type AssessmentsRow = Database['public']['Tables']['assessments']['Row'];
      type ProfilesRow = Database['public']['Tables']['profiles']['Row'];
      type QBIItemsRow = Database['public']['Tables']['question_bank_items']['Row'];
      type OrgsRow = Database['public']['Tables']['organizations']['Row'];

      // 1. assessments.version
      const a: Partial<AssessmentsRow> = { version: '1.0' };
      expect(a.version).toBe('1.0');

      // 2. profiles.tokens_revoked_at
      const p: Partial<ProfilesRow> = { tokens_revoked_at: null };
      expect(p.tokens_revoked_at).toBeNull();

      // 3. question_bank_items.owner_user_id
      // 4. question_bank_items.scope
      // 5. question_bank_items.rubric_definition
      const q: Partial<QBIItemsRow> = {
        owner_user_id: '00000000-0000-0000-0000-000000000000',
        scope: 'PERSONAL',
        rubric_definition: { test: 1 },
      };
      expect(q.scope).toBe('PERSONAL');

      // 6. organizations.description
      // 7. organizations.banner_url
      const o: Partial<OrgsRow> = {
        description: 'Org desc',
        banner_url: 'https://nexa.vn/banner.png',
      };
      expect(o.description).toBe('Org desc');
    });

    it('contains the 3 recreated AI credit RPC functions', () => {
      type Functions = Database['public']['Functions'];

      // 1. deduct_organization_ai_credits
      type DeductOrgArgs = Functions['deduct_organization_ai_credits']['Args'];
      const deductArgs: DeductOrgArgs = {
        p_org_id: '00000000-0000-0000-0000-000000000000',
        p_amount: 1,
      };
      expect(deductArgs.p_amount).toBe(1);

      // 2. refund_organization_ai_credits
      type RefundOrgArgs = Functions['refund_organization_ai_credits']['Args'];
      const refundOrgArgs: RefundOrgArgs = {
        p_org_id: '00000000-0000-0000-0000-000000000000',
        p_amount: 1,
      };
      expect(refundOrgArgs.p_amount).toBe(1);

      // 3. refund_ai_credits
      type RefundArgs = Functions['refund_ai_credits']['Args'];
      const refundArgs: RefundArgs = {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_amount: 1,
      };
      expect(refundArgs.p_amount).toBe(1);
    });

    it('does NOT contain orphan table test_ping or temp seed functions', () => {
      const content = fs.readFileSync(typesFilePath, 'utf8');
      expect(content).not.toContain('test_ping:');
      expect(content).not.toContain('clean_mock_assessments:');
      expect(content).not.toContain('reset_assessment_items:');
      expect(content).not.toContain('seed_120_benchmark:');
      expect(content).not.toContain('seed_baseline_assessment:');
      expect(content).not.toContain('seed_bench_part1:');
      expect(content).not.toContain('seed_bench_part2:');
      expect(content).not.toContain('seed_learning_paths:');
    });
  });

  describe('2. Canonical Seeds Invariants & SQL Validity', () => {
    const seedsDir = path.join(projectRoot, 'src/database/seeds');
    const expectedSeeds = [
      '01_framework_seed.sql',
      '02_mcq_benchmark_seed.sql',
      '03_scenario_rubric_seed.sql',
      '04_practical_evidence_seed.sql',
      '05_learning_modules_seed.sql',
      '06_course_catalog_seed.sql',
      '07_baseline_digcomp_assessment_seed.sql',
      '08_real_120_questions.sql',
    ];

    it('contains strictly the 8 canonical seed files and no fragmented leftovers', () => {
      const files = fs.readdirSync(seedsDir).sort();
      expect(files).toEqual(expectedSeeds.sort());
      expect(files.length).toBe(8);
    });

    it('all 8 seed files are non-empty and have valid SQL termination', () => {
      for (const seed of expectedSeeds) {
        const fullPath = path.join(seedsDir, seed);
        const content = fs.readFileSync(fullPath, 'utf8');
        expect(content.trim().length).toBeGreaterThan(100);

        // Check SQL structure: must terminate with semicolon
        const cleanContent = content.replace(/--.*$/gm, '').trim();
        expect(cleanContent.endsWith(';')).toBe(true);
      }
    });

    it('all 8 seed files have balanced quotes and comments', () => {
      for (const seed of expectedSeeds) {
        const fullPath = path.join(seedsDir, seed);
        const sql = fs.readFileSync(fullPath, 'utf8');

        let inDollarQuote = false;
        let inSingleQuote = false;
        let inLineComment = false;
        let inBlockComment = false;

        for (let i = 0; i < sql.length; i++) {
          const ch = sql[i];
          const next = sql[i + 1];

          if (ch === '\n') {
            inLineComment = false;
            continue;
          }
          if (inLineComment) continue;

          if (inBlockComment) {
            if (ch === '*' && next === '/') {
              inBlockComment = false;
              i++;
            }
            continue;
          }

          if (inDollarQuote) {
            if (ch === '$' && next === '$') {
              inDollarQuote = false;
              i++;
            }
            continue;
          }

          if (inSingleQuote) {
            if (ch === "'") {
              if (next === "'") {
                i++; // escaped quote ''
              } else {
                inSingleQuote = false;
              }
            }
            continue;
          }

          if (ch === '-' && next === '-') {
            inLineComment = true;
            i++;
            continue;
          }
          if (ch === '/' && next === '*') {
            inBlockComment = true;
            i++;
            continue;
          }
          if (ch === '$' && next === '$') {
            inDollarQuote = true;
            i++;
            continue;
          }
          if (ch === "'") {
            inSingleQuote = true;
            continue;
          }
        }

        expect(inSingleQuote, `${seed} has unclosed single quote`).toBe(false);
        expect(inDollarQuote, `${seed} has unclosed dollar quote`).toBe(false);
        expect(inBlockComment, `${seed} has unclosed block comment`).toBe(false);
      }
    });
  });

  describe('3. Database Runner & Migration Consolidation', () => {
    it('only run_migration.js exists and run_migration_02..04 are deleted', () => {
      const dbDir = path.join(projectRoot, 'src/database');
      const runners = fs.readdirSync(dbDir).filter((f) => f.startsWith('run_migration') && f.endsWith('.js'));
      expect(runners).toEqual(['run_migration.js']);
    });

    it('run_migration.js supports CLI arguments, default migration 46, and --all-canonical-seeds', () => {
      const runnerContent = fs.readFileSync(path.join(projectRoot, 'src/database/run_migration.js'), 'utf8');
      expect(runnerContent).toContain('migrations/46_schema_standardization_and_cleanup.sql');
      expect(runnerContent).toContain('--all-canonical-seeds');
      expect(runnerContent).toContain('seeds/01_framework_seed.sql');
      expect(runnerContent).toContain('seeds/08_real_120_questions.sql');
    });
  });
});
