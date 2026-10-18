'use client';

import { useState } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Info,
} from 'lucide-react';

export default function EvaluatorAnalyticsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (format: 'csv' | 'json') => {
    setDownloading(format);
    try {
      if (format === 'csv') {
        // Generate simulated CSV file for interactive prototype
        const csvContent =
          'Mã thí sinh,Bộ đề,Điểm số,Tỷ lệ %,Thời gian (giây),Trạng thái,Miền 1,Miền 2,Miền 3,Miền 4,Miền 5\n' +
          'CAND-1001,Kỹ năng số cơ bản,85,85.0,2100,Đạt,80,90,85,80,90\n' +
          'CAND-1002,Kỹ năng số cơ bản,72,72.0,2450,Đạt,75,70,70,65,80\n' +
          'CAND-1003,Kỹ năng AI & Tự động hoá,90,90.0,1800,Đạt,90,95,90,85,90\n' +
          'CAND-1004,An toàn thông tin,64,64.0,2700,Chưa đạt,60,65,60,55,80\n';

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'nexa_khao_thi_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const jsonData = [
          { candidate_id: 'CAND-1001', score: 85, passed: true, domains: { d1: 80, d2: 90, d3: 85, d4: 80, d5: 90 } },
          { candidate_id: 'CAND-1002', score: 72, passed: true, domains: { d1: 75, d2: 70, d3: 70, d4: 65, d5: 80 } },
          { candidate_id: 'CAND-1003', score: 90, passed: true, domains: { d1: 90, d2: 95, d3: 90, d4: 85, d5: 90 } },
        ];
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'nexa_khao_thi_export.json');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      setTimeout(() => setDownloading(null), 1000);
    }
  };

  const domainStats = [
    { code: 'Miền 1', name: 'Thông tin và Dữ liệu', avg: 76.5, benchmark: 70, status: 'HIGH' },
    { code: 'Miền 2', name: 'Giao tiếp và Hợp tác', avg: 82.0, benchmark: 70, status: 'HIGH' },
    { code: 'Miền 3', name: 'Sáng tạo Nội dung số', avg: 71.2, benchmark: 70, status: 'MODERATE' },
    { code: 'Miền 4', name: 'An toàn và Bảo mật số', avg: 64.8, benchmark: 70, status: 'ATTENTION' },
    { code: 'Miền 5', name: 'Giải quyết Vấn đề số', avg: 78.4, benchmark: 70, status: 'HIGH' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              PHÂN TÍCH KHẢO THÍ
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Thống Kê Năng Lực &amp; Xuất Dữ Liệu
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi phân bố năng lực qua 5 Miền trọng tâm và xuất dữ liệu báo cáo thống kê.
          </p>
        </div>
      </div>

      {/* Domain Heatmap Overview Cards */}
      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Phân Bố Điểm Trung Bình Theo 5 Miền Năng Lực Số
          </h2>
          <span className="text-[11px] text-slate-500">
            Mốc chuẩn đạt: 70.0%
          </span>
        </div>

        <div className="space-y-3">
          {domainStats.map((d) => {
            const isBelow = d.avg < d.benchmark;

            return (
              <div
                key={d.code}
                className="p-3.5 rounded-md bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="sm:w-1/3">
                  <div className="font-bold text-slate-800">{d.name}</div>
                  <div className="text-[11px] text-slate-400">{d.code}</div>
                </div>

                <div className="sm:w-1/2 flex items-center gap-3">
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isBelow ? 'bg-amber-500' : 'bg-sky-600'
                      }`}
                      style={{ width: `${d.avg}%` }}
                    />
                  </div>
                  <span className="font-bold text-slate-800 w-12 text-right">
                    {d.avg}%
                  </span>
                </div>

                <div className="sm:w-1/6 text-right text-[11px]">
                  {isBelow ? (
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Cần bồi dưỡng
                    </span>
                  ) : (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Đạt chuẩn
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Center */}
      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Xuất Dữ Liệu Khảo Thí (CSV / Excel / JSON)
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
          Bộ dữ liệu được tự động chuẩn hóa, ẩn danh hóa thông tin cá nhân của thí sinh, sẵn sàng nạp trực tiếp vào các phần mềm phân tích dữ liệu và báo cáo thống kê.
        </p>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleDownload('csv')}
            disabled={downloading === 'csv'}
            className="px-4 py-2.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
          >
            <Download className="w-4 h-4" strokeWidth={1.75} />
            {downloading === 'csv'
              ? 'Đang kết xuất CSV...'
              : 'Tải Bảng Dữ Liệu (CSV / Excel)'}
          </button>

          <button
            onClick={() => handleDownload('json')}
            disabled={downloading === 'json'}
            className="px-4 py-2.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
          >
            <FileCode className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
            {downloading === 'json' ? 'Đang xuất JSON...' : 'Tải Định Dạng JSON Chuẩn'}
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
          <span>Bảo mật danh tính &bull; Tự động ẩn danh hóa Email, Số điện thoại và Họ tên</span>
        </div>
      </div>
    </div>
  );
}
