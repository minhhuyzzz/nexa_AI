-- ==============================================================================
-- NEXA SCHEMA MIGRATION 10: CLASS COLLABORATION (POSTS, REPLIES, MESSAGES, FILES)
-- ==============================================================================

-- 1. Class Posts Table (Announcements, Discussions, System Events)
CREATE TABLE IF NOT EXISTS public.class_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.evaluator_classes(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    post_type VARCHAR(20) NOT NULL DEFAULT 'POST',
    -- 'POST'        : Bài trao đổi thường
    -- 'ANNOUNCEMENT': Thông báo quan trọng (ghim được)
    -- 'SYSTEM'      : Tự động tạo khi giao đề hoặc chia sẻ tài liệu
    is_pinned BOOLEAN DEFAULT false,
    linked_assignment_id UUID REFERENCES public.class_assignments(id) ON DELETE SET NULL,
    linked_file_id UUID, -- Sẽ thêm foreign key sau khi tạo bảng class_files
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Class Post Replies Table (Bình luận dưới bài đăng)
CREATE TABLE IF NOT EXISTS public.class_post_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.class_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Class Messages Table (Chat nhóm dạng phẳng)
CREATE TABLE IF NOT EXISTS public.class_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.evaluator_classes(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Class Files Table (Tài liệu tải lên & Liên kết chia sẻ)
CREATE TABLE IF NOT EXISTS public.class_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.evaluator_classes(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT DEFAULT 0,
    file_type VARCHAR(20) NOT NULL DEFAULT 'LINK',
    -- 'PDF' | 'DOCX' | 'XLSX' | 'IMG' | 'LINK'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Foreign key liên kết class_posts -> class_files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_post_linked_file'
    ) THEN
        ALTER TABLE public.class_posts
            ADD CONSTRAINT fk_post_linked_file
            FOREIGN KEY (linked_file_id) REFERENCES public.class_files(id) ON DELETE SET NULL;
    END IF;

    -- FK constraints to public.profiles for PostgREST resource embedding
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_class_members_profiles') THEN
        ALTER TABLE public.class_members
            ADD CONSTRAINT fk_class_members_profiles
            FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_class_posts_profiles') THEN
        ALTER TABLE public.class_posts
            ADD CONSTRAINT fk_class_posts_profiles
            FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_class_post_replies_profiles') THEN
        ALTER TABLE public.class_post_replies
            ADD CONSTRAINT fk_class_post_replies_profiles
            FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_class_messages_profiles') THEN
        ALTER TABLE public.class_messages
            ADD CONSTRAINT fk_class_messages_profiles
            FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_class_files_profiles') THEN
        ALTER TABLE public.class_files
            ADD CONSTRAINT fk_class_files_profiles
            FOREIGN KEY (uploader_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Mở rộng assessment_submissions: Thêm class_assignment_id
ALTER TABLE public.assessment_submissions
    ADD COLUMN IF NOT EXISTS class_assignment_id UUID
    REFERENCES public.class_assignments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_submissions_class_assignment
    ON public.assessment_submissions(class_assignment_id);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_class_posts_class ON public.class_posts(class_id);
CREATE INDEX IF NOT EXISTS idx_class_posts_author ON public.class_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_class_posts_pinned ON public.class_posts(class_id, is_pinned);
CREATE INDEX IF NOT EXISTS idx_class_post_replies_post ON public.class_post_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_class_messages_class ON public.class_messages(class_id);
CREATE INDEX IF NOT EXISTS idx_class_messages_created ON public.class_messages(class_id, created_at);
CREATE INDEX IF NOT EXISTS idx_class_files_class ON public.class_files(class_id);

-- 7. Table Grants
GRANT ALL ON public.class_posts TO authenticated, service_role;
GRANT ALL ON public.class_post_replies TO authenticated, service_role;
GRANT ALL ON public.class_messages TO authenticated, service_role;
GRANT ALL ON public.class_files TO authenticated, service_role;

GRANT SELECT ON public.class_posts TO anon;
GRANT SELECT ON public.class_post_replies TO anon;
GRANT SELECT ON public.class_messages TO anon;
GRANT SELECT ON public.class_files TO anon;

-- 8. Enable RLS
ALTER TABLE public.class_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_post_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_files ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for class_posts
DROP POLICY IF EXISTS "Evaluators can manage class posts" ON public.class_posts;
CREATE POLICY "Evaluators can manage class posts"
    ON public.class_posts FOR ALL
    TO authenticated
    USING (public.is_class_evaluator(class_id))
    WITH CHECK (public.is_class_evaluator(class_id));

DROP POLICY IF EXISTS "Members can view class posts" ON public.class_posts;
CREATE POLICY "Members can view class posts"
    ON public.class_posts FOR SELECT
    TO authenticated
    USING (public.is_class_member(class_id));

DROP POLICY IF EXISTS "Members can insert their own posts" ON public.class_posts;
CREATE POLICY "Members can insert their own posts"
    ON public.class_posts FOR INSERT
    TO authenticated
    WITH CHECK (public.is_class_member(class_id) AND author_id = auth.uid());

DROP POLICY IF EXISTS "Members can update their own posts" ON public.class_posts;
CREATE POLICY "Members can update their own posts"
    ON public.class_posts FOR UPDATE
    TO authenticated
    USING (public.is_class_member(class_id) AND author_id = auth.uid());

DROP POLICY IF EXISTS "Members can delete their own posts" ON public.class_posts;
CREATE POLICY "Members can delete their own posts"
    ON public.class_posts FOR DELETE
    TO authenticated
    USING (public.is_class_member(class_id) AND author_id = auth.uid());

-- 10. RLS Policies for class_post_replies
DROP POLICY IF EXISTS "Evaluators can manage all post replies" ON public.class_post_replies;
CREATE POLICY "Evaluators can manage all post replies"
    ON public.class_post_replies FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.class_posts p
            WHERE p.id = post_id AND public.is_class_evaluator(p.class_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.class_posts p
            WHERE p.id = post_id AND public.is_class_evaluator(p.class_id)
        )
    );

DROP POLICY IF EXISTS "Members can view post replies" ON public.class_post_replies;
CREATE POLICY "Members can view post replies"
    ON public.class_post_replies FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.class_posts p
            WHERE p.id = post_id AND (public.is_class_member(p.class_id) OR public.is_class_evaluator(p.class_id))
        )
    );

DROP POLICY IF EXISTS "Members can insert replies" ON public.class_post_replies;
CREATE POLICY "Members can insert replies"
    ON public.class_post_replies FOR INSERT
    TO authenticated
    WITH CHECK (
        author_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.class_posts p
            WHERE p.id = post_id AND (public.is_class_member(p.class_id) OR public.is_class_evaluator(p.class_id))
        )
    );

DROP POLICY IF EXISTS "Authors can delete their own replies" ON public.class_post_replies;
CREATE POLICY "Authors can delete their own replies"
    ON public.class_post_replies FOR DELETE
    TO authenticated
    USING (author_id = auth.uid());

-- 11. RLS Policies for class_messages
DROP POLICY IF EXISTS "Evaluators can manage class messages" ON public.class_messages;
CREATE POLICY "Evaluators can manage class messages"
    ON public.class_messages FOR ALL
    TO authenticated
    USING (public.is_class_evaluator(class_id))
    WITH CHECK (public.is_class_evaluator(class_id));

DROP POLICY IF EXISTS "Members can view class messages" ON public.class_messages;
CREATE POLICY "Members can view class messages"
    ON public.class_messages FOR SELECT
    TO authenticated
    USING (public.is_class_member(class_id));

DROP POLICY IF EXISTS "Members can send class messages" ON public.class_messages;
CREATE POLICY "Members can send class messages"
    ON public.class_messages FOR INSERT
    TO authenticated
    WITH CHECK (public.is_class_member(class_id) AND sender_id = auth.uid());

-- 12. RLS Policies for class_files
DROP POLICY IF EXISTS "Evaluators can manage class files" ON public.class_files;
CREATE POLICY "Evaluators can manage class files"
    ON public.class_files FOR ALL
    TO authenticated
    USING (public.is_class_evaluator(class_id))
    WITH CHECK (public.is_class_evaluator(class_id));

DROP POLICY IF EXISTS "Members can view class files" ON public.class_files;
CREATE POLICY "Members can view class files"
    ON public.class_files FOR SELECT
    TO authenticated
    USING (public.is_class_member(class_id));

-- 13. Demo / Anon policies (matches migration 08)
DROP POLICY IF EXISTS "Anon demo can access posts" ON public.class_posts;
CREATE POLICY "Anon demo can access posts"
    ON public.class_posts FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon demo can access replies" ON public.class_post_replies;
CREATE POLICY "Anon demo can access replies"
    ON public.class_post_replies FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon demo can access messages" ON public.class_messages;
CREATE POLICY "Anon demo can access messages"
    ON public.class_messages FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon demo can access files" ON public.class_files;
CREATE POLICY "Anon demo can access files"
    ON public.class_files FOR ALL TO anon USING (true) WITH CHECK (true);

-- 14. Supabase Storage Bucket setup for class-files
INSERT INTO storage.buckets (id, name, public)
VALUES ('class-files', 'class-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read access for class-files" ON storage.objects;
CREATE POLICY "Public read access for class-files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'class-files');

DROP POLICY IF EXISTS "Authenticated users can upload to class-files" ON storage.objects;
CREATE POLICY "Authenticated users can upload to class-files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'class-files');

DROP POLICY IF EXISTS "Authenticated users can delete from class-files" ON storage.objects;
CREATE POLICY "Authenticated users can delete from class-files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'class-files');

DROP POLICY IF EXISTS "Anon demo can upload to class-files" ON storage.objects;
CREATE POLICY "Anon demo can upload to class-files"
    ON storage.objects FOR INSERT
    TO anon
    WITH CHECK (bucket_id = 'class-files');
