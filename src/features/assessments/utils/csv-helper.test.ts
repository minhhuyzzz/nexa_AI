import { describe, it, expect } from 'vitest';
import {
  parseCSV,
  parseCSVLine,
  parseDomainString,
  parseMCQCSV,
  parseScenarioCSV,
  parsePracticalCSV,
} from './csv-helper';

describe('CSV Helper Unit & Boundary Tests', () => {
  it('parses CSV line with quoted commas correctly', () => {
    const line = '1,MCQ,"Câu hỏi có dấu phẩy, thử nghiệm",A,B,C,D,A';
    const parsed = parseCSVLine(line);
    expect(parsed[0]).toBe('1');
    expect(parsed[1]).toBe('MCQ');
    expect(parsed[2]).toBe('Câu hỏi có dấu phẩy, thử nghiệm');
    expect(parsed[7]).toBe('A');
  });

  it('parses domain string into integer array correctly', () => {
    expect(parseDomainString('1').domains).toEqual([1]);
    expect(parseDomainString('1, 2').domains).toEqual([1, 2]);
    expect(parseDomainString('Miền 3; Miền 4').domains).toEqual([3, 4]);
    expect(parseDomainString('1.1').domains).toEqual([1]);

    // Boundary check: invalid domain
    expect(parseDomainString('9').error).toBeDefined();
    expect(parseDomainString('ABC').error).toBeDefined();
  });

  it('parses MCQ CSV with domain validation', () => {
    const csvContent = `domain,prompt,option_a,option_b,option_c,option_d,correct_answer,explanation,points
1,Công cụ tìm kiếm?,Google,Wiki,Bing,Adobe,A,Giải thích,10
"1, 2",Chia sẻ dữ liệu?,Cách A,Cách B,Cách C,Cách D,B,Giải thích,15`;

    const result = parseMCQCSV(csvContent);
    expect(result.errors.length).toBe(0);
    expect(result.items.length).toBe(2);

    expect(result.items[0].domains).toEqual([1]);
    expect(result.items[0].correct_answer).toBe('A');
    expect(result.items[0].type).toBe('MCQ');

    expect(result.items[1].domains).toEqual([1, 2]);
    expect(result.items[1].is_multi_competency).toBe(true);
  });

  it('parses Practical CSV with flat rubric columns', () => {
    const csvContent = `domain,prompt,submission_type,criterion_1_name,criterion_1_weight,criterion_2_name,criterion_2_weight,points
3,Thiết kế infographic,BOTH,Đúng trọng tâm,50,Trực quan,50,20`;

    const result = parsePracticalCSV(csvContent);
    expect(result.errors.length).toBe(0);
    expect(result.items.length).toBe(1);

    const practical = result.items[0];
    expect(practical.type).toBe('PRACTICAL');
    expect(practical.submission_type).toBe('BOTH');
    expect(practical.rubric_criteria).toEqual([
      { name: 'Đúng trọng tâm', weight: 50 },
      { name: 'Trực quan', weight: 50 },
    ]);
    expect(practical.rubric_guide).toContain('Đúng trọng tâm (50%)');
  });

  // Boundary Test 1: Upload wrong file format
  it('boundary test: rejects MCQ file in Practical parser', () => {
    const mcqCsv = `domain,prompt,option_a,option_b,option_c,option_d,correct_answer
1,Câu hỏi trắc nghiệm,A,B,C,D,A`;

    const result = parsePracticalCSV(mcqCsv);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Trắc nghiệm');
  });

  // Boundary Test 2: Reports line number for invalid domain
  it('boundary test: reports line number for invalid domain', () => {
    const badCsv = `domain,prompt,option_a,option_b,option_c,option_d,correct_answer
1,Câu hỏi 1,A,B,C,D,A
99,Câu hỏi 2 với miền sai,A,B,C,D,B`;

    const result = parseMCQCSV(badCsv);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toContain('Dòng 3');
    expect(result.errors[0]).toContain('99');
  });

  it('retains backward compatibility for legacy parseCSV', () => {
    const legacyCsv = `skill_code,type,prompt,option_a,option_b,option_c,option_d,correct_answer
1.1,MCQ,Câu hỏi cũ,A,B,C,D,A`;

    const items = parseCSV(legacyCsv);
    expect(items.length).toBe(1);
    expect(items[0].domain).toBe(1);
    expect(items[0].skill_code).toBe('1.1');
  });
});
