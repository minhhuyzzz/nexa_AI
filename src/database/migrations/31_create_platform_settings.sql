-- ==============================================================================
-- NEXA MIGRATION 31: PLATFORM SETTINGS & PERSISTENT CONFIGURATION (AI-02)
-- ==============================================================================
-- Stores system-wide configuration (such as AI Gateway settings, model routing,
-- and feature flags) persistently in PostgreSQL rather than ephemeral local files.

CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON public.platform_settings(key);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.platform_settings TO authenticated;

DROP POLICY IF EXISTS "Platform admins can manage platform settings" ON public.platform_settings;
CREATE POLICY "Platform admins can manage platform settings" ON public.platform_settings
    FOR ALL TO authenticated
    USING (public.is_admin_or_service())
    WITH CHECK (public.is_admin_or_service());
