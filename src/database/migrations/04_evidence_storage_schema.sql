-- ==============================================================================
-- NEXA SCHEMA MIGRATION 04: STORAGE BUCKET & PRACTICAL EVIDENCE ASSESSMENT
-- ==============================================================================

-- 1. Create Supabase Storage Bucket for Evidence
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'assessment-evidence',
    'assessment-evidence',
    true, -- Allow direct URL preview for evaluators
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'application/zip', 'application/x-zip-compressed']
) ON CONFLICT (id) DO UPDATE SET
    public = TRUE,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'application/zip', 'application/x-zip-compressed'];

-- 2. Storage RLS Policies
DROP POLICY IF EXISTS "Authenticated users can upload assessment evidence" ON storage.objects;
CREATE POLICY "Authenticated users can upload assessment evidence"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'assessment-evidence');

DROP POLICY IF EXISTS "Public and Evaluators can view assessment evidence" ON storage.objects;
CREATE POLICY "Public and Evaluators can view assessment evidence"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'assessment-evidence');

DROP POLICY IF EXISTS "Users can update own assessment evidence" ON storage.objects;
CREATE POLICY "Users can update own assessment evidence"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'assessment-evidence');
