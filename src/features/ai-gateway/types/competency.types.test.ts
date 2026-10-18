import { describe, it, expect } from 'vitest';
import { CompetencyAnalysisOutputSchema } from './competency.types';

describe('CompetencyAnalysisOutputSchema (Zod Strict & Zero-any)', () => {
  it('should validate a valid 5-domain competency analysis response', () => {
    const validData = {
      overallLevel: 'ADVANCED' as const,
      overallSummary: 'Thí sinh có năng lực số vững vàng, đặc biệt xuất sắc ở miền giao tiếp.',
      radarData: [
        { domainCode: 'DOMAIN_1', domainName: 'Thông tin và dữ liệu', score: 75, benchmark: 70 },
        { domainCode: 'DOMAIN_2', domainName: 'Giao tiếp và hợp tác', score: 85, benchmark: 70 },
        { domainCode: 'DOMAIN_3', domainName: 'Sáng tạo nội dung số', score: 70, benchmark: 70 },
        { domainCode: 'DOMAIN_4', domainName: 'An toàn số', score: 65, benchmark: 70 },
        { domainCode: 'DOMAIN_5', domainName: 'Giải quyết vấn đề', score: 80, benchmark: 70 },
      ],
      skillGaps: [
        {
          skillCode: '4.2',
          skillName: 'Bảo vệ dữ liệu cá nhân',
          domainCode: 'DOMAIN_4',
          percentage: 55,
          rootCause: 'Chưa nắm rõ thời hạn 72h của Nghị định 13/2023',
          riskImpact: 'Rủi ro bị xử phạt hành chính khi xảy ra sự cố',
          priority: 'HIGH' as const,
        },
      ],
      strengths: 'Kỹ năng tìm kiếm dữ liệu và làm việc cộng tác đa nền tảng tốt.',
      weaknesses: 'Cần cập nhật các quy định pháp luật về bảo mật dữ liệu.',
      pedagogicalFeedback: 'Hãy hoàn thành khóa học về quy trình ứng phó 72h.',
      learningPathway: [
        {
          stepNumber: 1,
          title: 'Khắc phục lỗ hổng an toàn số',
          targetSkill: '4.2 - Bảo vệ dữ liệu',
          durationHours: 2,
          objective: 'Nắm vững quy trình 72h',
          actionText: 'Học module 4.2 và làm bài tập trắc nghiệm',
          recommendedSkillCode: '4.2',
        },
        {
          stepNumber: 2,
          title: 'Nâng cao kỹ năng sáng tạo số',
          targetSkill: '3.1 - Phát triển nội dung',
          durationHours: 3,
          objective: 'Thiết kế trực quan',
          actionText: 'Thực hành tạo infographic',
          recommendedSkillCode: '3.1',
        },
        {
          stepNumber: 3,
          title: 'Ứng dụng vào tình huống thực tế',
          targetSkill: '2.1 - Giao tiếp số',
          durationHours: 2,
          objective: 'Tương tác netiquette',
          actionText: 'Thực hành xử lý tình huống phản hồi',
          recommendedSkillCode: '2.1',
        },
        {
          stepNumber: 4,
          title: 'Đánh giá lại năng lực',
          targetSkill: 'Đánh giá tổng hợp',
          durationHours: 1,
          objective: 'Đạt điểm >= 80%',
          actionText: 'Làm bài thi đánh giá lại kỹ năng',
          recommendedSkillCode: '5.2',
        },
      ],
    };

    const parsed = CompetencyAnalysisOutputSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it('should reject invalid radar data with less than 5 domains', () => {
    const invalidData = {
      overallLevel: 'ADVANCED',
      overallSummary: 'Test',
      radarData: [
        { domainCode: 'DOMAIN_1', domainName: 'Thông tin', score: 75, benchmark: 70 },
      ],
      skillGaps: [],
      strengths: 'Good',
      weaknesses: 'None',
      pedagogicalFeedback: 'Keep going',
      learningPathway: [],
    };

    const parsed = CompetencyAnalysisOutputSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });
});
