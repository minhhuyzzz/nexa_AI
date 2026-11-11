-- Migration 47: Auto onboard new users & bypass legacy role selection onboarding
-- Đảm bảo mọi người dùng đăng ký mới (qua Google OAuth, email, v.v.) đều tự động có is_onboarded = true
-- Tuân thủ triết lý "ba không gian, một danh tính" trong AGENTS.md, người dùng vào thẳng /personal/dashboard.

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

    -- Luôn mặc định is_onboarded = true để người dùng vào thẳng personal dashboard
    v_is_onboarded := true;

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
    ON CONFLICT (id) DO UPDATE SET
        is_onboarded = true,
        full_name = coalesce(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = coalesce(EXCLUDED.avatar_url, public.profiles.avatar_url);

    RETURN NEW;
END;
$$;

-- Đảm bảo toàn bộ tài khoản hiện có đều được đánh dấu is_onboarded = true
UPDATE public.profiles SET is_onboarded = true WHERE is_onboarded = false;
