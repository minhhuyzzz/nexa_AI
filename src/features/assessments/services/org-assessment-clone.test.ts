import { describe, it, expect } from 'vitest';

describe('Organization Assessment Cloning Logic', () => {
  interface MockItemOption {
    id: string;
    content: string;
    is_correct: boolean;
  }

  interface MockAssessmentItem {
    id: string;
    prompt: string;
    type: string;
    points: number;
    options: MockItemOption[];
  }

  interface MockAssessment {
    id: string;
    title: string;
    description: string;
    duration_minutes: number;
    passing_score: number;
    is_published: boolean;
    organization_id: string | null;
    items: MockAssessmentItem[];
  }

  function cloneAssessmentForOrg(
    source: MockAssessment,
    targetOrgId: string,
    userId: string
  ): MockAssessment {
    const clonedItems: MockAssessmentItem[] = source.items.map((item, idx) => ({
      id: `cloned-item-${idx + 1}`,
      prompt: item.prompt,
      type: item.type,
      points: item.points,
      options: item.options.map((opt, oIdx) => ({
        id: `cloned-opt-${idx + 1}-${oIdx + 1}`,
        content: opt.content,
        is_correct: opt.is_correct,
      })),
    }));

    return {
      id: `cloned-asm-${Date.now()}`,
      title: `${source.title} (Bản sao)`,
      description: source.description,
      duration_minutes: source.duration_minutes,
      passing_score: source.passing_score,
      is_published: false, // Must start as draft
      organization_id: targetOrgId,
      items: clonedItems,
    };
  }

  it('sao chép thành công đề thi chuẩn thành đề nội bộ tổ chức ở trạng thái bản nháp', () => {
    const systemAssessment: MockAssessment = {
      id: 'sys-01',
      title: 'Đánh Giá Năng Lực Số Chuẩn 5 Miền',
      description: 'Bài khảo thí chuẩn hệ thống',
      duration_minutes: 45,
      passing_score: 70,
      is_published: true,
      organization_id: null,
      items: [
        {
          id: 'item-1',
          prompt: 'Câu hỏi D1',
          type: 'MCQ',
          points: 10,
          options: [
            { id: 'opt-1', content: 'Đáp án A', is_correct: true },
            { id: 'opt-2', content: 'Đáp án B', is_correct: false },
          ],
        },
      ],
    };

    const cloned = cloneAssessmentForOrg(systemAssessment, 'org-fpt', 'user-123');

    expect(cloned.id).not.toBe(systemAssessment.id);
    expect(cloned.title).toBe('Đánh Giá Năng Lực Số Chuẩn 5 Miền (Bản sao)');
    expect(cloned.is_published).toBe(false);
    expect(cloned.organization_id).toBe('org-fpt');
    expect(cloned.items).toHaveLength(1);
    expect(cloned.items[0].id).not.toBe(systemAssessment.items[0].id);
    expect(cloned.items[0].options[0].id).not.toBe(systemAssessment.items[0].options[0].id);
    expect(cloned.items[0].options[0].content).toBe('Đáp án A');
    expect(cloned.items[0].options[0].is_correct).toBe(true);
  });
});
