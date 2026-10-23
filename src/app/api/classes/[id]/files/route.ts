import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth/getEffectiveUser';
import { verifyClassAccess } from '@/lib/classes/access';

const createFileSchema = z.object({
  fileName: z.string().trim().min(1, 'Tên tệp không được để trống').max(255),
  fileUrl: z.string().trim().min(1, 'Đường dẫn tệp không được để trống'),
  fileSizeBytes: z.number().int().nonnegative().default(0),
  fileType: z.enum(['PDF', 'DOCX', 'XLSX', 'IMG', 'LINK']).default('LINK'),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;
    const supabase = await createClient();
    const currentUser = await getEffectiveUser(supabase);

    if (!currentUser) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const access = await verifyClassAccess(supabase, classId, currentUser.id, currentUser.role);
    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 });
    }

    const { data: files, error } = await supabase
      .from('class_files')
      .select(`
        id,
        class_id,
        uploader_id,
        file_name,
        file_url,
        file_size_bytes,
        file_type,
        created_at,
        uploader:profiles ( id, nickname, email, avatar_url, role )
      `)
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching class files:', error);
      return NextResponse.json({ error: 'Không thể tải danh sách tài liệu' }, { status: 500 });
    }

    return NextResponse.json({ files: files || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;
    const supabase = await createClient();
    const currentUser = await getEffectiveUser(supabase);

    if (!currentUser) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const access = await verifyClassAccess(supabase, classId, currentUser.id, currentUser.role);
    if (!access.hasAccess || !access.isEvaluator) {
      return NextResponse.json({ error: 'Chỉ Người đánh giá mới có quyền tải lên tài liệu' }, { status: 403 });
    }

    const contentType = req.headers.get('content-type') || '';

    let fileName = '';
    let fileUrl = '';
    let fileSizeBytes = 0;
    let fileType: 'PDF' | 'DOCX' | 'XLSX' | 'IMG' | 'LINK' = 'LINK';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const customName = formData.get('fileName') as string | null;

      if (!file) {
        return NextResponse.json({ error: 'Không tìm thấy tệp đính kèm' }, { status: 400 });
      }

      fileName = customName?.trim() || file.name;
      fileSizeBytes = file.size;

      // Deduce file type
      const ext = fileName.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') fileType = 'PDF';
      else if (ext === 'doc' || ext === 'docx') fileType = 'DOCX';
      else if (ext === 'xls' || ext === 'xlsx') fileType = 'XLSX';
      else if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext || '')) fileType = 'IMG';
      else fileType = 'LINK';

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const safeName = `${classId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('class-files')
        .upload(safeName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError || !uploadData) {
        console.error('Storage upload error:', uploadError);
        return NextResponse.json({ error: 'Tải tệp lên máy chủ thất bại' }, { status: 500 });
      }

      const { data: publicUrlData } = supabase.storage
        .from('class-files')
        .getPublicUrl(uploadData.path);

      fileUrl = publicUrlData.publicUrl;
    } else {
      // JSON body (e.g. external link or pre-uploaded file)
      const body: unknown = await req.json();
      const parsed = createFileSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
          { status: 400 }
        );
      }
      fileName = parsed.data.fileName;
      fileUrl = parsed.data.fileUrl;
      fileSizeBytes = parsed.data.fileSizeBytes;
      fileType = parsed.data.fileType;
    }

    const { data: newFile, error: fileError } = await supabase
      .from('class_files')
      .insert({
        class_id: classId,
        uploader_id: currentUser.id,
        file_name: fileName,
        file_url: fileUrl,
        file_size_bytes: fileSizeBytes,
        file_type: fileType,
      })
      .select(`
        id,
        class_id,
        uploader_id,
        file_name,
        file_url,
        file_size_bytes,
        file_type,
        created_at,
        uploader:profiles ( id, nickname, email, avatar_url, role )
      `)
      .single();

    if (fileError || !newFile) {
      console.error('Error inserting file record:', fileError);
      return NextResponse.json({ error: 'Không thể lưu thông tin tài liệu' }, { status: 500 });
    }

    // Auto-create SYSTEM post on class stream
    await supabase.from('class_posts').insert({
      class_id: classId,
      author_id: currentUser.id,
      post_type: 'SYSTEM',
      title: 'Đã chia sẻ tài liệu mới',
      content: `Đã chia sẻ tài liệu: "${fileName}". Thành viên nhóm có thể tải xuống hoặc xem trực tiếp trong tab Tài liệu.`,
      linked_file_id: newFile.id,
    });

    return NextResponse.json({ success: true, file: newFile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ';
    console.error('Error in POST /api/classes/[id]/files:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
