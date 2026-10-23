import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth/getEffectiveUser';
import { verifyClassAccess } from '@/lib/classes/access';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id: classId, fileId } = await params;
    const supabase = await createClient();
    const currentUser = await getEffectiveUser(supabase);

    if (!currentUser) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const access = await verifyClassAccess(supabase, classId, currentUser.id, currentUser.role);
    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 });
    }

    const { data: file, error: fileError } = await supabase
      .from('class_files')
      .select('id, uploader_id, file_url')
      .eq('id', fileId)
      .eq('class_id', classId)
      .single();

    if (fileError || !file) {
      return NextResponse.json({ error: 'Không tìm thấy tài liệu' }, { status: 404 });
    }

    const isUploader = file.uploader_id === currentUser.id;
    if (!isUploader && !access.isEvaluator) {
      return NextResponse.json({ error: 'Bạn không có quyền xóa tài liệu này' }, { status: 403 });
    }

    // Attempt to remove from Supabase Storage if it was uploaded to class-files
    if (file.file_url.includes('/storage/v1/object/public/class-files/')) {
      const storagePath = file.file_url.split('/storage/v1/object/public/class-files/')[1];
      if (storagePath) {
        await supabase.storage.from('class-files').remove([decodeURIComponent(storagePath)]);
      }
    }

    const { error: deleteError } = await supabase
      .from('class_files')
      .delete()
      .eq('id', fileId);

    if (deleteError) {
      return NextResponse.json({ error: 'Không thể xóa tài liệu' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
