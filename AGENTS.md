# QUY TẮC BẮT BUỘC CHO AI CODING AGENT (NEXA SYSTEM RULES)

Bạn đang lập trình cho dự án **NEXA** — *Nền tảng đánh giá và chứng nhận phát triển năng lực số dựa trên trí tuệ nhân tại*. Trước khi sinh bất kỳ đoạn mã nào, bạn BẮT BUỘC phải tuân thủ tuyệt đối các quy tắc dưới đây:

---

## 1. LUẬT CẤM VỀ GIAO DIỆN — KHỬ SẠCH "MÙI AI" (STRICT UI RULES)

1. **Bảng màu bắt buộc (90% Trung tính - 8% Đen than - 2% Xanh học thuật):**
   - Nền chính: Trắng tinh khiết `#FFFFFF` (`bg-white` / `bg-background`).
   - Nền phụ Dashboard: Xám giấy nhạt `#F8FAFC` (`bg-slate-50`).
   - Viền thẻ & bảng: Mảnh 1px `#E2E8F0` (`border border-slate-200`), bo góc gọn `6px` (`rounded-md`).
   - Chữ chính: Đen than `#0F172A` (`text-slate-900`); Chữ phụ: Xám đá `#64748B` (`text-slate-500`).
   - **Màu nhấn duy nhất (Primary Accent):** Xanh dương học thuật `#0284C7` (`bg-sky-600 text-white hover:bg-sky-700`).
2. **DANH SÁCH CLASS TAILWIND BỊ CẤM TUYỆT Đ�I:**
   - ❌ CẤM dùng họ màu Tím/Indigo: `purple-*`, `violet-*`, `indigo-*`, `fuchsia-*`, `pink-*`.
   - ❌ CẤM dùng dải màu chuyển sắc lòe loẹt: `bg-gradient-to-*`, `from-*`, `via-*`, `to-*`.
   - ❌ CẤM dùng bóng đổ phát sáng hoặc bóng lớn: `shadow-lg`, `shadow-xl`, `shadow-2xl`, `drop-shadow-*`.
   - ❌ CẤM tô 5 màu cầu vồng lên các thẻ Miền năng lực hoặc Kỹ năng. Các miền và kỹ năng chỉ phân biệt bằng mã số `font-mono` (ví dụ: `01`, `1.1`, `4.2`) trên nền xám nhạt `bg-slate-100 text-slate-800 border-slate-200`.
3. **CẤM DÙNG EMOJI TRONG CODE GIAO DIỆN (`.tsx`):**
   - ❌ Tuyệt đối không chèn các ký tự như `🔥`, `🚀`, `⚡`, `🟢`, `🟡`, `🔴`, `🎯`, `✨` vào JSX.
   - ✅ Bắt buộc sử dụng 100% icon vector nét mảnh từ thư viện `lucide-react` (`strokeWidth={1.75}`).
   - ✅ Với 3 Cờ tin cậy AI hoặc trạng thái: Chỉ dùng chấm tròn nhỏ `6px` (`<span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />` / `bg-amber-500` / `bg-rose-600`) đi kèm văn bản.
4. **Phông chữ bắt buộc:**
   - Văn bản giao diện: `Inter` (`font-sans`).
   - Mã PIN 6 số, Mã nhóm, Điểm số, Thứ hạng, Đồng hồ đếm ngược, Mã kỹ năng, Hash SHA-256: Bắt quả dụng `JetBrains Mono` (`font-mono tabular-nums`).

---

## 2. BẢY QUY TẮC KIẾN TRÚC BẤT BIẾN (ARCHITECTURAL GUARDRAILS)

1. **1 Email = 1 Vai trò tĩnh cố định (`LEARNER` | `EVALUATOR` | `ADMIN`):**
   - Khách vãng lai tự đăng ký tại `/register` chỉ được chọn `LEARNER` hoặc `EVALUATOR` (vào thẳng gói Free để sử dụng ngay). Không có nút chuyển đổi vai trò sau khi đăng ký. Vai trò `ADMIN` dành riêng cho Chủ nền tảng.
2. **3 Bộ Shell Dashboard tách biệt hoàn toàn (`Zero-Shared Shell`):**
   - `learner/layout.tsx` chỉ dùng `LearnerSidebar`, `LearnerTopbar`, `LearnerAvatarMenu`.
   - `evaluator/layout.tsx` chỉ dùng `EvaluatorSidebar`, `EvaluatorTopbar`, `EvaluatorAvatarMenu`.
   - `admin/layout.tsx` chỉ dùng `AdminSidebar`, `AdminTopbar`, `AdminAvatarMenu`.
   - Tuyệt đối KHÔNG có Footer trong bất kỳ màn hình Dashboard nào.
3. **Không đặt ô tra cứu QR lên Landing Page hay `PublicHeader`:**
   - 4 Trang ngoài chỉ gồm: `/` (Trang chủ), `/framework` (Khung năng lực), `/pricing` (Bảng giá), `/faq` (Hướng dẫn).
   - Trang `/verify/[credentialId]` là trang Kiosk độc lập chỉ mở ra khi quét mã QR trên chứng chỉ PDF.
4. **Khung Năng lực Số Động (Dynamic Framework):**
   - Không ghi cứng số hiệu phiên bản khung năng lực lên giao diện; toàn bộ Miền năng lực và Kỹ năng thành phần phải đọc động từ bảng `assessment_frameworks`, `competency_domains`, `competencies`.
5. **Đa mô hình AI (`AIProviderAdapter`):**
   - Không gọi trực tiếp SDK của Gemini/OpenAI/Claude ở ngoài `src/features/ai-gateway/adapters/`.
   - Luôn khử sạch thông tin cá nhân (PII) trước khi gửi sang AI.
6. **CƠ CHẾ KÍCH HOẠT AI THEO YÊU CẦU (ON-DEMAND AI TRIGGER — CẤM TỰ ĐỘNG GỌI KHI NỘP BÀI):**
   - Khi người học bấm "Nộp bài" (`POST /api/assessments/[id]/submit`), hệ thống CHỈ chấm tự động bằng code thuần cho các câu hỏi khách quan (`MCQ` và nhánh chọn `SCENARIO`), lưu câu trả lời thực hành/minh chứng vào CSDL và trả kết quả ngay lập tức (`0.01s`). **TUYỆT ĐỐI KHÔNG tự động gọi API AI bên trong hàm nộp bài.**
   - AI chỉ được kích hoạt khi người dùng (Learner hoặc Evaluator) chủ động bấm nút trên giao diện thông qua 2 API tách biệt:
     1. `POST /api/ai/grade-submission`: Khi bấm nút **"Chấm bài thực hành bằng AI"** (Thực hiện Ứng dụng AI số 1: chấm Rubric 100%, trích dẫn `evidenceQuote` và tính `confidenceScore`).
     2. `POST /api/ai/analyze-competency`: Khi bấm nút **"Phân tích năng lực & Đề xuất lộ trình bằng AI"** (Thực hiện Ứng dụng AI số 2, 3, 4, 5: Điểm mạnh/yếu, Khoảng trống năng lực `< 60%`, Phản hồi cá nhân hóa và Lộ trình 4 bước).
   - Tại `/evaluator/grading`, Người đánh giá có toàn quyền tự chấm thủ công (tốn 0 lượt AI) hoặc chủ động bấm nút nhờ AI chấm gợi ý cho từng bài / nhóm bài đã chọn.
7. **TypeScript Strict & Zero-any:**
   - Tuyệt đối không dùng từ khóa `any`. Mọi dữ liệu đầu vào API và đầu ra JSON của AI phải kiểm tra bằng `zod`.

---

## 3. QUY TẮC VỀ PHÁT TRIỂN COMPONENT (COMPONENT DEVELOPMENT RULES)

1. **Ưu tiên thành phần nhỏ, có thể tái sử dụng:**
   - Mỗi component nên có một trách nhiệm duy nhất (Single Responsibility Principle)
   - Components không nên vượt quá 150 dòng code (kể cả JSX và logic)
   - Sử dụng composition thay vì inheritance để mở rộng chức năng

2. **Quản lý trạng thái nhất quán:**
   - Sử dụng React Query cho tất cả việc fetch dữ liệu từ API
   - Các trạng thái local sử dụng useState/useReducer, tránh sử dụng useState lồng�ée
   - Tránh sử dụng Context API cho trạng thái thường xuyên thay đổi (ưu tiên Zustand hoặc Jotai nếu cần chia sẻ trạng thái toàn cầu)

3. **Xử lý tải và lỗi tốt nhất:**
   - Mọi request API đều phải hiển thị trạng thái tải (skeleton loader hoặc spinner)
   - Lỗi API phải được hiển thị thông báo thân thiện với người dùng, không lộ chi tiết kỹ thuật
   - Sử dụng error boundaries để bắt lỗi không xác định trong component tree

4. **Tuân thủ 접근 tính (Accessibility):**
   - Mọi element tương tác phải có aria-label hoặc aria-describedby thích hợp
   - Đảm bảo thứ tự tab logique và khả năng điều hướng bằng bàn phím
   - Màu chữ phải đủ đối chiếu theo WCAG AA (ratio ≥ 4.5:1 cho văn bản thường)
   - Images phải có alt text mô tả doel, trừ khi là trang trí

5. **Tối ưu hiệu suất:**
   - Sử dụng React.memo, useMemo, useCallback thích hợp để tránh render lại không cần thiết
   - Lazy loading cho components và images không nằm trong viewport ban đầu
   - Code splitting dựa trên route bằng React.lazy và Suspense
   - Tránh sử dụng index làm key trong danh sách, luôn dùng id duy nhất

6. **Quản lý biểu mẫu (Form Handling):**
   - Sử dụng React Hook Form hoặc Formik cho mọi form phức tạp
   - Validate biểu mẫu tại thời điểm blur và submit, hiển thị lỗi inline
   - Tránh sử dụng các thư viện form có kích thước lớn nếu không cần thiết

7. **Quy ước đặt tên và tổ chức file:**
   - Components: PascalCase (ví dụ: UserProfile.tsx)
   - Hooks: camelCase bắt đầu bằng "use" (ví dụ: useAuth.ts)
   - Utilities: camelCase (ví dụ: formatDate.ts)
   - Styles: .module.css hoặc tailwind classes trực tiếp trong JSX (tránh CSS riêng khi có thể)
   - Tất cả file trong thư mục components phải có chỉ mục index.js để xuất ra

8. **Xử lý phản hồi từ AI:**
   - Mọi phản hồi từ AI đều phải được hiển thị với trạng thái tải rõ ràng
   - Kết quả AI phải được hiển thị dưới dạng card dễ đọc, có thể sao chép hoặc tải xuống
   - Lưu ý hiển thị độ tin cậy (confidence score) khi có
   - Cung cấp nút "Tải lại" khi AI phản hồi thất bại

---

## 4. QUY TẮC PONYTAIL TOÀN DỰ ÁN (LAZY SENIOR DEV MODE)

1. **The Smallest Complete Change (Tối giản hoàn chỉnh):**
   - Viết lượng code tối thiểu giải quyết triệt để yêu cầu.
   - Thang bậc quyết định:
     1. Tính năng này có thực sự cần tồn tại không? (YAGNI - Bỏ qua tính năng thừa thãi người dùng không yêu cầu).
     2. Đã có sẵn trong codebase chưa? (Tái sử dụng helper, component, service hiện có).
     3. Tính năng có sẵn trong Web platform / Standard library không?
     4. Thư viện đã cài đặt trong `package.json` có đáp ứng được không? Không cài thêm dependency nếu chỉ cần vài dòng code.
     5. Viết diff ngắn nhất, rõ nghĩa nhất.
2. **Deletion Beats Addition (Xóa bỏ hơn thêm mới):**
   - Dọn sạch dead code, mock thừa, file rác, wrapper/abstraction giả định tương lai.
3. **Các ranh giới KHÔNG BAO GIỜ được cắt giảm:**
   - Validation tại ranh giới dữ liệu (Zod).
   - Error handling chống mất mát dữ liệu hoặc crash màn hình.
   - Bảo mật & Khử PII.
   - Trợ năng (WCAG AA).
   - Toàn bộ Luật Cấm Giao Diện & Bảy Quy Tắc Kiến Trúc Bất Biến trong file này.
4. **Chữ ký phản hồi Ponytail:**
   - Mỗi câu trả lời kết thúc bằng 1-2 dòng tóm lược: điều gì đã được tinh giản hoặc không cần kiểm tra, cùng mọi rủi ro người dùng cần biết.