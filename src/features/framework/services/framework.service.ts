import type { SupabaseClient } from '@supabase/supabase-js';

export interface FrameworkVersionInfo {
  id: string;
  code: string;
  title: string;
  version: string;
  status: string;
  isLocked: boolean;
}

export class FrameworkService {
  /**
   * Kiểm tra xem khung năng lực có đang bị khóa (bảo vệ toàn vẹn lịch sử)
   * do đã có học viên thực hiện bài khảo thí hay không.
   */
  static async isFrameworkLocked(
    supabase: SupabaseClient,
    frameworkId: string
  ): Promise<{ isLocked: boolean; historicalSubmissionsCount: number }> {
    const { count } = await supabase
      .from('assessment_submissions')
      .select('id', { count: 'exact', head: true });

    const totalSubs = count ?? 0;
    return {
      isLocked: totalSubs > 0,
      historicalSubmissionsCount: totalSubs,
    };
  }

  /**
   * Tạo phiên bản mới cho khung năng lực (v1.1, v2.0)
   * Sao chép toàn bộ 5 miền và các kỹ năng thành phần để cho phép hiệu chỉnh
   * mà không làm sai lệch điểm số hay bằng chứng của các bài thi quá khứ.
   */
  static async createNewVersion(
    supabase: SupabaseClient,
    currentFrameworkId: string,
    nextVersion: string,
    description?: string
  ) {
    // 1. Fetch current active framework
    const { data: currentFw, error: fwErr } = await supabase
      .from('assessment_frameworks')
      .select('*')
      .eq('id', currentFrameworkId)
      .single();

    if (fwErr || !currentFw) {
      throw new Error('Không tìm thấy khung năng lực hiện tại');
    }

    // 2. Archive current framework
    await supabase
      .from('assessment_frameworks')
      .update({ status: 'ARCHIVED' })
      .eq('id', currentFrameworkId);

    // 3. Create new framework record
    const { data: newFw, error: createFwErr } = await supabase
      .from('assessment_frameworks')
      .insert({
        code: `${currentFw.code}_V${nextVersion.replace(/\./g, '_')}`,
        title: currentFw.title,
        version: nextVersion,
        description: description || `Phiên bản nâng cấp ${nextVersion} kế thừa từ ${currentFw.version}`,
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (createFwErr || !newFw) {
      throw new Error(`Không thể khởi tạo phiên bản khung mới: ${createFwErr?.message}`);
    }

    // 4. Clone domains & competencies
    const { data: domains } = await supabase
      .from('competency_domains')
      .select('*, competencies(*)')
      .eq('framework_id', currentFrameworkId)
      .order('domain_index', { ascending: true });

    if (domains && domains.length > 0) {
      for (const d of domains) {
        const { data: newDomain, error: domErr } = await supabase
          .from('competency_domains')
          .insert({
            framework_id: newFw.id,
            domain_index: d.domain_index,
            code: d.code,
            title: d.title,
            description: d.description,
          })
          .select()
          .single();

        if (newDomain && Array.isArray(d.competencies)) {
          const compInserts = d.competencies.map((c: any) => ({
            domain_id: newDomain.id,
            skill_code: c.skill_code,
            title: c.title,
            description: c.description,
            target_level: c.target_level,
            display_order: c.display_order,
          }));

          if (compInserts.length > 0) {
            await supabase.from('competencies').insert(compInserts);
          }
        }
      }
    }

    return newFw;
  }
}
