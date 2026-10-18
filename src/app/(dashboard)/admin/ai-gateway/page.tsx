import {
  Cpu,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export default function AdminAIGatewayPage() {
  const providers = [
    {
      name: 'Google Gemini',
      providerKey: 'GOOGLE_GEMINI',
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      status: 'ACTIVE',
      latency: '~650ms',
      costPer1k: '0.0001$',
      role: 'Chấm Rubric (App 1) & Phân tích Năng lực / Lộ trình (Apps 2, 3, 4, 5)',
    },
    {
      name: 'Anthropic Claude',
      providerKey: 'ANTHROPIC_CLAUDE',
      model: 'claude-3-5-sonnet',
      status: 'STANDBY',
      latency: '~850ms',
      costPer1k: '0.003$',
      role: 'Dự phòng thẩm định phức hợp & Thẩm định chéo Rubric',
    },
    {
      name: 'OpenAI GPT-4o',
      providerKey: 'OPENAI',
      model: 'gpt-4o-mini',
      status: 'STANDBY',
      latency: '~720ms',
      costPer1k: '0.00015$',
      role: 'Dự phòng xử lý song song & Phân tích ngôn ngữ tự nhiên',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              HỆ THỐNG ĐIỀU PHỐI AI
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quản Trị Cổng Kết Nối AI &amp; An Toàn Dữ Liệu
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kiểm soát kết nối các mô hình AI (Google Gemini, Anthropic Claude, OpenAI), đảm bảo bảo mật thông tin và tối ưu hóa tài nguyên.
          </p>
        </div>
      </div>

      {/* Security & Efficiency Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-md bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Lock className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
            Bộ Lọc Khử Sạch Dữ Liệu Cá Nhân (Bảo Mật Quyền Riêng Tư)
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Mọi thông tin cá nhân như Email, Số điện thoại, Số định danh công dân đều được khử sạch và ẩn danh hóa tự động trước khi gửi tới các mô hình AI để bảo đảm quyền riêng tư tuyệt đối cho người học.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-700 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Hệ thống khử khuẩn thông tin cá nhân hoạt động tự động 24/7</span>
          </div>
        </div>

        <div className="p-5 rounded-md bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Zap className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            Cơ Chế Kích Hoạt AI Theo Nhu Cầu Thực Tế (On-Demand)
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Hệ thống phân tách chấm điểm trắc nghiệm khách quan tức thì mà không cần AI. AI chỉ được kích hoạt khi người học hoặc giảng viên chủ động bấm nút yêu cầu phân tích chuyên sâu hay nhận xét bài thực hành.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-sky-700 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Tối ưu hóa ngân sách &bull; Không lãng phí tài nguyên máy tính</span>
          </div>
        </div>
      </div>

      {/* Model Providers Matrix */}
      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Trạng Thái Nhà Cung Cấp Mô Hình (Model Provider Adapters)
        </h2>

        <div className="space-y-3">
          {providers.map((p) => {
            const isActive = p.status === 'ACTIVE';

            return (
              <div
                key={p.providerKey}
                className="p-4 rounded-md border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                      {p.model}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? 'bg-emerald-600' : 'bg-slate-400'
                        }`}
                      />
                      {p.status}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">{p.role}</p>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">ĐỘ TRỄ TRUNG BÌNH</span>
                    <span className="text-slate-800 font-semibold">{p.latency}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">CHI PHÍ ƯỚC TÍNH</span>
                    <span className="text-slate-800 font-semibold">{p.costPer1k}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
