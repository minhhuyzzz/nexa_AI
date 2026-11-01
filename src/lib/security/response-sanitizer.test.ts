import { describe, it, expect } from 'vitest';
import { sanitizeResponseData, maskInternalError } from './response-sanitizer';

describe('Security: Response Sanitization & Data Leakage Prevention', () => {
  it('strips sensitive auth tokens and private fields from response objects', () => {
    const dirtyData = {
      id: 'user-123',
      email: 'user@example.com',
      nickname: 'Alex',
      tokens_revoked_at: '2026-10-31T20:00:00Z',
      password: 'secret_password_123',
      password_hash: '$2b$12$e8YQz1...',
      service_role_key: 'eyJhbGciOi...',
      raw_token: 'secret_token_abc',
      nested: {
        safe: 'public_value',
        secret_key: 'top_secret',
      },
    };

    const clean = sanitizeResponseData(dirtyData);

    expect(clean.id).toBe('user-123');
    expect(clean.email).toBe('user@example.com');
    expect(clean.nickname).toBe('Alex');
    expect(clean.nested.safe).toBe('public_value');

    // Sensitive keys must be deleted
    expect((clean as any).password).toBeUndefined();
    expect((clean as any).password_hash).toBeUndefined();
    expect((clean as any).service_role_key).toBeUndefined();
    expect((clean as any).raw_token).toBeUndefined();
    expect((clean as any).nested.secret_key).toBeUndefined();
  });

  it('masks internal database errors, table names and SQL syntax details from end-users', () => {
    const rawPostgresError = new Error(
      'relation "public.profiles" does not exist at character 15: SELECT * FROM public.profiles WHERE id = $1'
    );

    const safeMessage = maskInternalError(rawPostgresError);
    expect(safeMessage).toBe('Lỗi xử lý cơ sở dữ liệu. Vui lòng thử lại sau.');
    expect(safeMessage).not.toContain('public.profiles');
    expect(safeMessage).not.toContain('SELECT');

    // Safe custom user-facing error remains intact
    const normalError = new Error('Tổ chức này hiện đang bị tạm ngưng hoạt động.');
    expect(maskInternalError(normalError)).toBe('Tổ chức này hiện đang bị tạm ngưng hoạt động.');
  });
});
