-- ==============================================================================
-- NEXA MIGRATION 09: NICKNAME IDENTITY & AUTH PROFILE TRIGGER
-- ==============================================================================
-- Mục tiêu:
--   1. Đổi `profiles.username` -> `profiles.nickname` (biệt danh công khai, duy nhất).
--   2. Tự tạo `profiles` khi có user mới trong `auth.users` (email/password + Google).
--   3. Cung cấp hàm kiểm tra trùng biệt danh cho API đăng ký.
--
-- Thứ tự áp dụng: chạy file này TRƯỚC khi deploy code mới.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Đổi tên cột username -> nickname
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'username'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'nickname'
    ) THEN
        ALTER TABLE public.profiles RENAME COLUMN username TO nickname;
    END IF;
END $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN NOT NULL DEFAULT true;

-- ------------------------------------------------------------------------------
-- 2. Backfill biệt danh cho dữ liệu cũ
-- ------------------------------------------------------------------------------
UPDATE public.profiles
SET nickname = regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9_]', '', 'g')
WHERE nickname IS NULL OR btrim(nickname) = '';

UPDATE public.profiles
SET nickname = 'user_' || left(replace(id::text, '-', ''), 6)
WHERE nickname IS NULL OR char_length(btrim(nickname)) < 2;

-- Dedupe: giữ bản ghi cũ nhất, các bản trùng thêm hậu tố số
WITH ranked AS (
    SELECT id,
           nickname,
           ROW_NUMBER() OVER (
               PARTITION BY lower(btrim(nickname))
               ORDER BY created_at, id
           ) AS rn
    FROM public.profiles
)
UPDATE public.profiles p
SET nickname = left(ranked.nickname, 24) || '_' || ranked.rn::text
FROM ranked
WHERE p.id = ranked.id AND ranked.rn > 1;

-- ------------------------------------------------------------------------------
-- 3. Ràng buộc độ dài 2-30 ký tự và duy nhất (không phân biệt hoa/thường)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ALTER COLUMN nickname SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_nickname_length_check') THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_nickname_length_check
        CHECK (char_length(btrim(nickname)) BETWEEN 2 AND 30);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_nickname_unique_idx
ON public.profiles (lower(btrim(nickname)));

-- ------------------------------------------------------------------------------
-- 4. Sinh biệt danh không trùng (dùng cho Google OAuth và backfill)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.make_unique_nickname(p_base TEXT, p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_base TEXT;
    v_candidate TEXT;
    v_suffix INT := 0;
BEGIN
    v_base := btrim(coalesce(p_base, ''));
    IF v_base = '' OR char_length(v_base) < 2 THEN
        v_base := 'user_' || left(replace(p_user_id::text, '-', ''), 6);
    END IF;
    v_base := left(v_base, 24);

    v_candidate := v_base;
    WHILE EXISTS (
        SELECT 1 FROM public.profiles
        WHERE lower(btrim(nickname)) = lower(v_candidate)
          AND id <> p_user_id
    ) LOOP
        v_suffix := v_suffix + 1;
        v_candidate := v_base || '_' || v_suffix::text;
        IF v_suffix > 99 THEN
            v_candidate := v_base || '_' || left(replace(p_user_id::text, '-', ''), 4);
            EXIT;
        END IF;
    END LOOP;

    RETURN v_candidate;
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. Tự tạo profile cho mọi user mới (email/password và Google OAuth)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_nickname TEXT;
    v_full_name TEXT;
    v_is_onboarded BOOLEAN;
BEGIN
    v_role := upper(btrim(coalesce(NEW.raw_user_meta_data->>'role', '')));
    IF v_role NOT IN ('LEARNER', 'EVALUATOR') THEN
        v_role := 'LEARNER';
    END IF;

    -- Nếu user metadata có is_onboarded = true thì nhận, ngược lại (Google OAuth) mặc định false
    v_is_onboarded := coalesce((NEW.raw_user_meta_data->>'is_onboarded')::boolean, false);

    v_nickname := coalesce(
        NULLIF(btrim(NEW.raw_user_meta_data->>'nickname'), ''),
        split_part(coalesce(NEW.email, ''), '@', 1)
    );

    v_full_name := coalesce(
        NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''),
        NULLIF(btrim(NEW.raw_user_meta_data->>'name'), ''),
        NULLIF(btrim(NEW.raw_user_meta_data->>'nickname'), ''),
        'Người dùng Nexa'
    );

    INSERT INTO public.profiles (id, email, full_name, nickname, avatar_url, role, is_onboarded)
    VALUES (
        NEW.id,
        lower(coalesce(NEW.email, '')),
        v_full_name,
        public.make_unique_nickname(v_nickname, NEW.id),
        coalesce(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
        v_role,
        v_is_onboarded
    )
    ON CONFLICT (id) DO NOTHING;

    -- Tự tạo evaluator_profiles nếu người dùng chọn vai trò EVALUATOR và đã hoàn tất onboarding
    IF v_role = 'EVALUATOR' AND v_is_onboarded = true THEN
        INSERT INTO public.evaluator_profiles (user_id, status)
        VALUES (NEW.id, 'PENDING')
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 6. Backfill profile cho user cũ chưa có hồ sơ
-- ------------------------------------------------------------------------------
INSERT INTO public.profiles (id, email, full_name, nickname, avatar_url, role)
SELECT
    u.id,
    lower(coalesce(u.email, '')),
    coalesce(
        NULLIF(btrim(u.raw_user_meta_data->>'full_name'), ''),
        NULLIF(btrim(u.raw_user_meta_data->>'name'), ''),
        NULLIF(btrim(u.raw_user_meta_data->>'nickname'), ''),
        'Người dùng Nexa'
    ),
    public.make_unique_nickname(split_part(coalesce(u.email, ''), '@', 1), u.id),
    coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture'),
    'LEARNER'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------------------
-- 7. Hàm kiểm tra trùng biệt danh (gọi được từ API đăng ký với anon key)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_nickname_available(p_nickname TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE 
        WHEN p_nickname IS NULL OR char_length(btrim(p_nickname)) < 2 OR char_length(btrim(p_nickname)) > 30 THEN FALSE
        ELSE NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE lower(btrim(nickname)) = lower(btrim(p_nickname))
        )
    END;
$$;

GRANT EXECUTE ON FUNCTION public.is_nickname_available(TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 8. Dọn RPC đăng ký cũ (đã thay bằng auth.signUp + trigger)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT p.oid::regprocedure AS signature
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'register_new_user'
    LOOP
        EXECUTE 'DROP FUNCTION ' || r.signature || ' CASCADE';
    END LOOP;
END $$;

