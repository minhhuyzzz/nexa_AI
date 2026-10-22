import { describe, it, expect } from 'vitest';
import { parseCSV, parseCSVLine } from './csv-helper';

describe('CSV Helper Unit Tests', () => {
  it('parses CSV line with quoted commas correctly', () => {
    const line = '1.1,MCQ,"Câu hỏi có dấu phẩy, thử nghiệm",A,B,C,D,A';
    const parsed = parseCSVLine(line);
    expect(parsed[0]).toBe('1.1');
    expect(parsed[1]).toBe('MCQ');
    expect(parsed[2]).toBe('Câu hỏi có dấu phẩy, thử nghiệm');
    expect(parsed[7]).toBe('A');
  });

  it('parses full CSV content into structured items without difficulty_level', () => {
    const csvContent = `skill_code,type,prompt,option_a,option_b,option_c,option_d,correct_answer,explanation,rubric_guide,points,target_competencies
1.1,MCQ,Câu 1 là gì?,Lựa chọn 1,Lựa chọn 2,Lựa chọn 3,Lựa chọn 4,A,Giải thích câu 1,,10,"1.1"
2.3,SCENARIO,"Tình huống giao tiếp, xử lý xung đột",Cách A,Cách B,Cách C,Cách D,B,Giải thích câu 2,,15,"2.3, 2.4"
3.1,PRACTICAL,Bài thực hành tạo nội dung,,,,,,,Rubric hướng dẫn,20,"3.1"`;

    const items = parseCSV(csvContent);
    expect(items.length).toBe(3);

    // Item 1
    expect(items[0].skill_code).toBe('1.1');
    expect(items[0].type).toBe('MCQ');
    expect(items[0].prompt).toBe('Câu 1 là gì?');
    expect(items[0].option_a).toBe('Lựa chọn 1');
    expect(items[0].correct_answer).toBe('A');
    expect(items[0].is_multi_competency).toBe(false);

    // Item 2 (Multi-competency)
    expect(items[1].skill_code).toBe('2.3');
    expect(items[1].type).toBe('SCENARIO');
    expect(items[1].is_multi_competency).toBe(true);
    expect(items[1].target_competencies).toEqual(['2.3', '2.4']);

    // Item 3 (Practical)
    expect(items[2].type).toBe('PRACTICAL');
    expect(items[2].rubric_guide).toBe('Rubric hướng dẫn');
  });
});
