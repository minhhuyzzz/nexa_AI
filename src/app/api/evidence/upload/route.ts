import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// 25MB limit synchronized with storage.buckets file_size_limit (26214400 bytes)
const MAX_FILE_SIZE = 25 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  // Documents
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  // Images
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  // Text / Code
  'text/plain',
  'application/json',
]);

const ALLOWED_EXTENSIONS = new Set([
  'pdf',
  'docx',
  'doc',
  'xlsx',
  'xls',
  'csv',
  'pptx',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'zip',
  'rar',
  '7z',
  'txt',
  'json',
  'py',
  'sql',
]);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const isDemoPermitted =
      process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEMO_MODE === 'true';
    const demoRole = isDemoPermitted ? cookieStore.get('nexa_demo_role')?.value : undefined;

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // In demo mode or if user is logged in
    const userId = user?.id || (demoRole ? `demo-${demoRole.toLowerCase()}-user` : null);

    if (!userId && (authError || !user)) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để tải tệp minh chứng' }, { status: 401 });
    }

    // 2. Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const itemId = formData.get('itemId') as string | null;
    const submissionId = (formData.get('submissionId') as string | null) || 'draft';

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy tệp đính kèm' }, { status: 400 });
    }

    // 3. Validate File Size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Dung lượng tệp vượt quá giới hạn (Tối đa 25MB, tệp hiện tại: ${(file.size / 1024 / 1024).toFixed(1)}MB)` },
        { status: 400 }
      );
    }

    // 4. Validate MIME Type and File Extension
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const isAllowedMime = file.type ? ALLOWED_MIME_TYPES.has(file.type) : false;
    const isAllowedExt = ALLOWED_EXTENSIONS.has(fileExt);

    if (!isAllowedMime && !isAllowedExt) {
      return NextResponse.json(
        { error: 'Định dạng tệp không hợp lệ. Hệ thống hỗ trợ Word (.docx), Excel (.xlsx), PDF, ảnh và tệp nén ZIP.' },
        { status: 400 }
      );
    }

    // 5. Build clean safe path bound to authenticated user's ID
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `submissions/${userId}/${submissionId}/${itemId || 'item'}_${Date.now()}_${safeName}`;

    // 6. If testing in development demo mode without configured Supabase bucket
    if (process.env.NODE_ENV !== 'production' && !user && demoRole) {
      return NextResponse.json({
        success: true,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || `application/${fileExt}`,
        storagePath: filePath,
        url: `https://storage.nexa.edu.vn/${filePath}`,
      });
    }

    // 7. Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assessment-evidence')
      .upload(filePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    // Fail immediately if storage upload fails (no fake success return)
    if (uploadError) {
      console.error('Lỗi khi tải tệp lên Supabase Storage:', uploadError.message);
      return NextResponse.json(
        { error: `Không thể lưu tệp minh chứng: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 8. Generate Signed URL for secure private storage access (valid for 7 days)
    const { data: signedData } = await supabase.storage
      .from('assessment-evidence')
      .createSignedUrl(uploadData.path, 60 * 60 * 24 * 7);

    const fileUrl =
      signedData?.signedUrl ||
      supabase.storage.from('assessment-evidence').getPublicUrl(uploadData.path).data.publicUrl;

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || `application/${fileExt}`,
      storagePath: uploadData.path,
      url: fileUrl,
    });
  } catch (err) {
    console.error('Unexpected error in evidence upload:', err);
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
