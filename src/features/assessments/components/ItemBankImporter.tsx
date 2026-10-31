'use client';

import { useState } from 'react';
import {
  Upload,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  Loader2,
  X,
  HelpCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface ParsedItem {
  id: string;
  itemCode: string;
  prompt: string;
  type: 'MCQ' | 'SCENARIO' | 'PRACTICAL_FILE' | 'DIGITAL_LINK';
  domain: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  defaultPoints: number;
  options: Array<{ content: string; isCorrect: boolean }>;
  isValid: boolean;
  errors: string[];
}

interface ItemBankImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export function ItemBankImporter({ isOpen, onClose, onImportSuccess }: ItemBankImporterProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [inputText, setInputText] = useState(
    `Câu 1: Đâu là nguyên tắc an toàn quan trọng nhất khi nhận được liên kết yêu cầu xác thực ngân hàng qua SMS?
A. Nhập thông tin ngay để tránh bị khóa tài khoản
B. Tuyệt đối không bấm vào liên kết, liên hệ tổng đài chính thức của ngân hàng để xác minh
C. Chuyển tiếp tin nhắn cho bạn bè để kiểm tra giúp
D. Bấm vào liên kết xem giao diện có giống website thật không
Đáp án: B
Miền: D4
Độ khó: INTERMEDIATE
Điểm: 10

Câu 2: Công cụ nào sau đây được thiết kế chuyên biệt để cộng tác thời gian thực trên bảng tính?
A. Google Sheets
B. Notepad
C. Adobe Photoshop
D. VLC Media Player
Đáp án: A
Miền: D2
Độ khó: BEGINNER
Điểm: 10`
  );

  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParse = () => {
    setIsParsing(true);
    setSubmitError(null);

    try {
      const blocks = inputText
        .split(/(?:^|\n)(?=Câu\s+\d+:)/i)
        .map((b) => b.trim())
        .filter(Boolean);

      const items: ParsedItem[] = blocks.map((block, idx) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        const firstLine = lines[0] || '';
        const prompt = firstLine.replace(/^Câu\s+\d+:\s*/i, '').trim();

        const options: Array<{ content: string; isCorrect: boolean }> = [];
        let correctLetter = '';
        let domain = 'D1';
        let difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' = 'INTERMEDIATE';
        let points = 10;
        const errors: string[] = [];

        lines.slice(1).forEach((line) => {
          if (/^[A-D]\.\s+/i.test(line)) {
            const letter = line[0].toUpperCase();
            const content = line.replace(/^[A-D]\.\s+/i, '').trim();
            options.push({ content, isCorrect: false });
          } else if (/^Đáp án:\s*([A-D])/i.test(line)) {
            const match = line.match(/^Đáp án:\s*([A-D])/i);
            if (match) correctLetter = match[1].toUpperCase();
          } else if (/^Miền:\s*(D[1-5])/i.test(line)) {
            const match = line.match(/^Miền:\s*(D[1-5])/i);
            if (match) domain = match[1].toUpperCase();
          } else if (/^Độ khó:\s*(BEGINNER|INTERMEDIATE|ADVANCED|EXPERT)/i.test(line)) {
            const match = line.match(/^Độ khó:\s*(BEGINNER|INTERMEDIATE|ADVANCED|EXPERT)/i);
            if (match) difficulty = match[1].toUpperCase() as any;
          } else if (/^Điểm:\s*(\d+)/i.test(line)) {
            const match = line.match(/^Điểm:\s*(\d+)/i);
            if (match) points = parseInt(match[1], 10) || 10;
          }
        });

        if (correctLetter) {
          const letterIndex = correctLetter.charCodeAt(0) - 65;
          if (options[letterIndex]) {
            options[letterIndex].isCorrect = true;
          } else {
            errors.push(`Đáp án ${correctLetter} không khớp với các phương án hiện có`);
          }
        } else if (options.length > 0) {
          errors.push('Chưa xác định đáp án đúng');
        }

        if (!prompt) errors.push('Thiếu nội dung câu hỏi');
        if (options.length > 0 && options.length < 2) errors.push('Trắc nghiệm cần tối thiểu 2 phương án');

        return {
          id: `temp-${idx}`,
          itemCode: `QB-${Date.now().toString(36).toUpperCase()}-${idx + 1}`,
          prompt,
          type: options.length > 0 ? 'MCQ' : 'SCENARIO',
          domain,
          difficulty,
          defaultPoints: points,
          options,
          isValid: errors.length === 0,
          errors,
        };
      });

      setParsedItems(items);
      setStep(2);
    } catch (err: any) {
      setSubmitError(err.message || 'Lỗi khi phân tích nội dung');
    } finally {
      setIsParsing(false);
    }
  };

  const handleCommitImport = async () => {
    const validItems = parsedItems.filter((i) => i.isValid);
    if (validItems.length === 0) {
      setSubmitError('Không có câu hỏi hợp lệ nào để nhập kho');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const supabase = createClient();
      const recordsToInsert = validItems.map((item) => ({
        code: item.itemCode,
        prompt: item.prompt,
        type: item.type,
        difficulty_level: item.difficulty,
        default_points: item.defaultPoints,
        options: item.options.length > 0 ? item.options : null,
      }));

      const { error } = await supabase.from('question_bank_items').insert(recordsToInsert);
      if (error) {
        throw new Error(error.message);
      }

      onImportSuccess();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || 'Lỗi khi lưu câu hỏi vào cơ sở dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-950 rounded-md border border-slate-200 dark:border-zinc-800 shadow-md max-w-3xl w-full max-h-[90vh] flex flex-col text-slate-900 dark:text-zinc-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-sm font-bold">Nhập Câu Hỏi Hàng Loạt Vào Ngân Hàng</h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {step === 1 ? 'Bước 1: Dán nội dung định dạng chuẩn' : 'Bước 2: Xác minh & Xem trước từng câu'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {submitError && (
            <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Nội dung câu hỏi (Tuân theo mẫu: Câu 1, Phương án A/B/C/D, Đáp án, Miền, Điểm)
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={14}
                className="w-full p-3.5 text-xs font-mono bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md focus:border-blue-600 focus:outline-none leading-relaxed"
                placeholder="Dán nội dung câu hỏi tại đây..."
              />
              <div className="p-3 rounded-md bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-400 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                <span>
                  Hệ thống tự động phát hiện cú pháp câu hỏi trắc nghiệm, phân loại miền DigComp và trích xuất đáp án đúng mà không gây lỗi dữ liệu.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-zinc-850">
                <span className="font-semibold">
                  Tổng số câu hỏi phân tích:{' '}
                  <span className="text-blue-600 font-mono">{parsedItems.length}</span>
                </span>
                <span className="text-emerald-600 font-semibold font-mono">
                  {parsedItems.filter((i) => i.isValid).length} câu hợp lệ
                </span>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {parsedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-md border text-xs transition-colors ${
                      item.isValid
                        ? 'bg-slate-50/70 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800'
                        : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-zinc-100">
                          Câu {idx + 1}:
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300">
                          {item.domain}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono">
                          {item.defaultPoints}đ
                        </span>
                      </div>
                      {item.isValid ? (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Hợp lệ</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-rose-600 font-semibold">
                          {item.errors.join(', ')}
                        </div>
                      )}
                    </div>

                    <p className="font-medium text-slate-800 dark:text-zinc-200 mb-2 leading-relaxed">
                      {item.prompt}
                    </p>

                    {item.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
                        {item.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-1.5 rounded flex items-center gap-2 ${
                              opt.isCorrect
                                ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold border border-emerald-300/80'
                                : 'text-slate-600 dark:text-zinc-400'
                            }`}
                          >
                            <span className="w-4 font-mono font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                            <span className="truncate">{opt.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-900/40">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-600 dark:text-zinc-400"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleParse}
                disabled={isParsing || !inputText.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Xác minh &amp; Xem trước</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-md border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-600 dark:text-zinc-400"
              >
                Quay lại sửa nội dung
              </button>
              <button
                type="button"
                onClick={handleCommitImport}
                disabled={isSubmitting || parsedItems.filter((i) => i.isValid).length === 0}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>
                  Lưu {parsedItems.filter((i) => i.isValid).length} câu hỏi vào Ngân hàng
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
