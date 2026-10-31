'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { RubricDefinition, RubricCriterion, RubricLevel } from '@/features/assessments/types/rubric.types';

export interface RubricBuilderProps {
  itemMaxPoints: number;
  initialRubric?: RubricDefinition | null;
  onChange: (rubric: RubricDefinition | null) => void;
  readOnly?: boolean;
}

const DEFAULT_LEVELS: RubricLevel[] = [
  { levelName: 'Xuất sắc', scorePercent: 100, description: 'Thể hiện đầy đủ, chính xác và có chiều sâu' },
  { levelName: 'Đạt', scorePercent: 75, description: 'Đạt yêu cầu cơ bản, có thể thiếu sót nhỏ' },
  { levelName: 'Cần cải thiện', scorePercent: 50, description: 'Chưa đạt yêu cầu, thiếu nhiều luận điểm chính' },
  { levelName: 'Chưa đạt', scorePercent: 0, description: 'Không thực hiện hoặc sai lệch hoàn toàn' },
];

export function RubricBuilder({
  itemMaxPoints,
  initialRubric,
  onChange,
  readOnly = false,
}: RubricBuilderProps) {
  const [isEnabled, setIsEnabled] = useState<boolean>(!!initialRubric);
  const [title, setTitle] = useState<string>(initialRubric?.title || 'Rubric Đánh Giá Tiêu Chí');
  const [description, setDescription] = useState<string>(initialRubric?.description || '');
  const [criteria, setCriteria] = useState<RubricCriterion[]>(
    initialRubric?.criteria && initialRubric.criteria.length > 0
      ? initialRubric.criteria
      : [
          {
            name: 'Mức độ chính xác & đầy đủ',
            maxPoints: itemMaxPoints || 10,
            weightPercent: 100,
            orderIndex: 0,
            levels: [...DEFAULT_LEVELS],
          },
        ]
  );

  const [expandedCriteria, setExpandedCriteria] = useState<Record<number, boolean>>({
    0: true,
  });

  // Calculate sum of maxPoints
  const sumMaxPoints = criteria.reduce((acc, c) => acc + (Number(c.maxPoints) || 0), 0);
  const isSumValid = Math.abs(sumMaxPoints - itemMaxPoints) <= 0.01;

  // Sync to parent whenever state changes
  useEffect(() => {
    if (!isEnabled) {
      onChange(null);
      return;
    }

    const rubricData: RubricDefinition = {
      itemId: initialRubric?.itemId || '00000000-0000-0000-0000-000000000000',
      title: title.trim() || 'Rubric Đánh Giá Tiêu Chí',
      description: description.trim() || undefined,
      criteria,
    };

    onChange(rubricData);
  }, [isEnabled, title, description, criteria]);

  // Toggle enable rubric
  const handleToggleEnable = () => {
    if (readOnly) return;
    const next = !isEnabled;
    setIsEnabled(next);
  };

  // Add criterion
  const handleAddCriterion = () => {
    if (readOnly) return;
    const remainingPoints = Math.max(0, itemMaxPoints - sumMaxPoints);
    const newCrit: RubricCriterion = {
      name: `Tiêu chí ${criteria.length + 1}`,
      maxPoints: remainingPoints > 0 ? remainingPoints : 2,
      weightPercent: 100,
      orderIndex: criteria.length,
      levels: [...DEFAULT_LEVELS],
    };
    const next = [...criteria, newCrit];
    setCriteria(next);
    setExpandedCriteria((prev) => ({ ...prev, [next.length - 1]: true }));
  };

  // Remove criterion
  const handleRemoveCriterion = (idx: number) => {
    if (readOnly || criteria.length <= 1) return;
    const next = criteria.filter((_, i) => i !== idx);
    setCriteria(next);
  };

  // Update criterion field
  const handleUpdateCriterion = (idx: number, field: keyof RubricCriterion, value: any) => {
    if (readOnly) return;
    const next = [...criteria];
    next[idx] = { ...next[idx], [field]: value };
    setCriteria(next);
  };

  // Add level
  const handleAddLevel = (cIdx: number) => {
    if (readOnly) return;
    const next = [...criteria];
    const crit = next[cIdx];
    crit.levels = [
      ...crit.levels,
      { levelName: 'Mức mới', scorePercent: 50, description: 'Mô tả mức độ mới' },
    ];
    setCriteria(next);
  };

  // Remove level
  const handleRemoveLevel = (cIdx: number, lIdx: number) => {
    if (readOnly || criteria[cIdx].levels.length <= 2) return;
    const next = [...criteria];
    next[cIdx].levels = next[cIdx].levels.filter((_, i) => i !== lIdx);
    setCriteria(next);
  };

  // Update level field
  const handleUpdateLevel = (
    cIdx: number,
    lIdx: number,
    field: keyof RubricLevel,
    value: any
  ) => {
    if (readOnly) return;
    const next = [...criteria];
    const lvls = [...next[cIdx].levels];
    lvls[lIdx] = { ...lvls[lIdx], [field]: value };
    next[cIdx].levels = lvls;
    setCriteria(next);
  };

  return (
    <div className="space-y-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 transition-colors">
      {/* Header & Toggle */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-600 dark:text-blue-400" strokeWidth={1.75} />
          <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
            Rubric Đánh Giá Đa Tiêu Chí
          </h4>
        </div>

        {!readOnly && (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={handleToggleEnable}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
            />
            <span className="text-xs text-slate-700 dark:text-zinc-300 font-medium">
              Kích hoạt Rubric có cấu trúc
            </span>
          </label>
        )}
      </div>

      {!isEnabled ? (
        <p className="text-xs text-slate-500 dark:text-zinc-400 italic">
          Chưa bật rubric cấu trúc cho câu hỏi này. Điểm sẽ được chấm tự do theo điểm tối đa câu hỏi.
        </p>
      ) : (
        <div className="space-y-4">
          {/* Validation Status Banner */}
          <div
            className={`p-2.5 rounded-md text-xs flex items-center justify-between border ${
              isSumValid
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {isSumValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.75} />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={1.75} />
              )}
              <span>
                {isSumValid
                  ? `Khớp thang điểm: Tổng điểm tiêu chí (${sumMaxPoints}) = Điểm câu hỏi (${itemMaxPoints})`
                  : `Chưa khớp thang điểm: Tổng điểm tiêu chí (${sumMaxPoints}) ≠ Điểm câu hỏi (${itemMaxPoints})`}
              </span>
            </div>
            <span className="font-mono font-bold">{sumMaxPoints} / {itemMaxPoints} điểm</span>
          </div>

          {/* Rubric Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Tiêu đề Rubric
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Đánh giá xử lý tình huống bảo mật"
                className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-sky-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Mô tả chung (tùy chọn)
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Hướng dẫn chung cho người chấm hoặc AI"
                className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-sky-600"
              />
            </div>
          </div>

          {/* Criteria List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                Danh sách tiêu chí ({criteria.length})
              </span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleAddCriterion}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-sky-50 dark:bg-blue-950/60 text-sky-700 dark:text-blue-400 hover:bg-sky-100 border border-sky-200 dark:border-blue-900 transition-colors"
                >
                  <Plus className="w-3 h-3" strokeWidth={1.75} />
                  <span>Thêm tiêu chí</span>
                </button>
              )}
            </div>

            {criteria.map((crit, cIdx) => {
              const isExpanded = !!expandedCriteria[cIdx];
              return (
                <div
                  key={cIdx}
                  className="rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 overflow-hidden"
                >
                  {/* Criterion Header Bar */}
                  <div className="p-3 flex items-center justify-between gap-3 bg-slate-100/60 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCriteria((prev) => ({
                            ...prev,
                            [cIdx]: !prev[cIdx],
                          }))
                        }
                        className="text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 p-0.5"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" strokeWidth={1.75} />
                        ) : (
                          <ChevronDown className="w-4 h-4" strokeWidth={1.75} />
                        )}
                      </button>

                      <input
                        type="text"
                        disabled={readOnly}
                        value={crit.name}
                        onChange={(e) => handleUpdateCriterion(cIdx, 'name', e.target.value)}
                        className="text-xs font-bold text-slate-900 dark:text-zinc-100 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-zinc-700 focus:border-sky-600 focus:outline-none flex-1 truncate"
                        placeholder="Tên tiêu chí..."
                      />
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-300">
                        <span className="text-[11px] text-slate-500">Điểm tối đa:</span>
                        <input
                          type="number"
                          disabled={readOnly}
                          min={0.5}
                          max={itemMaxPoints}
                          step={0.5}
                          value={crit.maxPoints}
                          onChange={(e) =>
                            handleUpdateCriterion(cIdx, 'maxPoints', parseFloat(e.target.value) || 0)
                          }
                          className="w-14 text-xs font-mono font-bold text-center px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100"
                        />
                      </div>

                      {!readOnly && criteria.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCriterion(cIdx)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Xóa tiêu chí"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Criterion Body: Levels List */}
                  {isExpanded && (
                    <div className="p-3 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                        <span>Các mức độ đánh giá ({crit.levels.length})</span>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => handleAddLevel(cIdx)}
                            className="text-sky-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Thêm mức</span>
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {crit.levels.map((lvl, lIdx) => (
                          <div
                            key={lIdx}
                            className="grid grid-cols-12 gap-2 p-2 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 items-center text-xs"
                          >
                            <div className="col-span-3">
                              <input
                                type="text"
                                disabled={readOnly}
                                value={lvl.levelName}
                                onChange={(e) =>
                                  handleUpdateLevel(cIdx, lIdx, 'levelName', e.target.value)
                                }
                                placeholder="Tên mức..."
                                className="w-full font-semibold px-2 py-1 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100"
                              />
                            </div>

                            <div className="col-span-2 flex items-center gap-1">
                              <input
                                type="number"
                                disabled={readOnly}
                                min={0}
                                max={100}
                                value={lvl.scorePercent}
                                onChange={(e) =>
                                  handleUpdateLevel(
                                    cIdx,
                                    lIdx,
                                    'scorePercent',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-14 text-center font-mono font-semibold px-1.5 py-1 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100"
                              />
                              <span className="text-[11px] text-slate-500 font-mono">%</span>
                            </div>

                            <div className="col-span-6">
                              <input
                                type="text"
                                disabled={readOnly}
                                value={lvl.description}
                                onChange={(e) =>
                                  handleUpdateLevel(cIdx, lIdx, 'description', e.target.value)
                                }
                                placeholder="Mô tả cụ thể hành vi đạt được..."
                                className="w-full px-2 py-1 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 placeholder:text-slate-400"
                              />
                            </div>

                            <div className="col-span-1 flex justify-end">
                              {!readOnly && crit.levels.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLevel(cIdx, lIdx)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded"
                                  title="Xóa mức"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
