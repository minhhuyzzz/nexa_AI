import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Tenant Security RLS Migration 25 & Role Isolation Rules', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'src/database/migrations/25_harden_user_organizations_and_admin_rls.sql'
  );

  it('file migration 25 tồn tại và có nội dung', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content.length).toBeGreaterThan(200);
  });

  it('thu hồi hoàn toàn quyền truy cập của anon khỏi bảng user_organizations', () => {
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content).toContain('REVOKE ALL ON public.user_organizations FROM anon;');
    expect(content).toContain('REVOKE ALL ON public.organizations FROM anon;');
  });

  it('thu hồi quyền INSERT, UPDATE, DELETE trực tiếp của authenticated user trên user_organizations để chống tự phong quyền', () => {
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content).toContain('REVOKE INSERT, UPDATE, DELETE ON public.user_organizations FROM authenticated;');
  });

  it('xóa bỏ triệt để các policy quá rộng auth.uid() IS NOT NULL hoặc SELECT true', () => {
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content).toContain('DROP POLICY IF EXISTS "Allow select user_organizations"');
    expect(content).toContain('DROP POLICY IF EXISTS "Allow manage user_organizations"');
    expect(content).not.toMatch(/USING\s*\(\s*true\s*\)/i);
  });

  it('định nghĩa SECURITY DEFINER helper get_user_managed_org_ids chống đệ quy RLS', () => {
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content).toContain('CREATE OR REPLACE FUNCTION public.get_user_managed_org_ids');
    expect(content).toContain('SECURITY DEFINER');
    expect(content).toContain("org_role IN ('ORG_ADMIN', 'ORG_OWNER')");
  });

  it('chính sách SELECT chỉ cho phép người dùng xem membership của chính mình hoặc tổ chức mình quản trị', () => {
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content).toContain('CREATE POLICY "user_org_select_own"');
    expect(content).toContain('USING (auth.uid() = user_id)');
    expect(content).toContain('CREATE POLICY "user_org_select_managed"');
  });

  it('chính sách organizations chỉ cho phép xem tổ chức mà user là ACTIVE member', () => {
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content).toContain('CREATE POLICY "org_select_member" ON public.organizations');
    expect(content).toContain("uo.status = 'ACTIVE'");
  });
});
