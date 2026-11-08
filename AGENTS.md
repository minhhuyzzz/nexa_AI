# AGENTS.md — Quy tắc làm việc cho AI Coding Agent của NEXA AI

## 1. Nguyên tắc vận hành của coding agent

1. **Hiểu yêu cầu trước khi thay đổi.** Đọc những file, route, schema, test và luồng hiện có liên quan; kiểm tra implementation thực tế thay vì đoán theo tên component.
2. **Phân biệt REVIEW và TRIỂN KHAI:**
   - Khi được yêu cầu **review/đánh giá**, chỉ phân tích hiện trạng; viết **file Markdown `.md` bằng tiếng Việt**, nêu bằng chứng, đường dẫn mã nguồn, vấn đề và đề xuất thiết kế. Khuyến khích sơ đồ **Mermaid** cho luồng hiện tại và luồng đề xuất. **Không tự biến review thành kế hoạch theo Phase/PR** nếu không được yêu cầu.
   - Khi được yêu cầu **viết/chỉnh sửa code**, thực hiện đúng phạm vi, sửa tối thiểu nhưng hoàn chỉnh, kiểm thử và nêu rõ kết quả.
   - Chỉ lập `tasks/plan.md`, chia Phase, tạo PR, commit, push hoặc sửa GitHub khi có yêu cầu/ủy quyền rõ ràng cho hành động đó. Review không mặc nhiên cho phép triển khai.
3. **Tái sử dụng trước khi tạo mới.** Tìm service, API, schema, component và test hiện có; không nhân bản business logic hoặc thêm dependency chỉ vì thói quen.
4. **Không giả lập thành công.** API lỗi thì báo lỗi; thiếu dữ liệu thì trình bày thiếu dữ liệu. Không tạo số liệu, bài thi, quyền lợi hay giao dịch “mẫu” trên luồng production.
5. **Không tuyên bố đã kiểm chứng nếu chưa chạy.** Phân biệt: đã đọc source, đã chạy test, đã kiểm tra staging và đã xác nhận production. CI xanh không đồng nghĩa an toàn tuyệt đối.
6. **Bảo toàn dữ liệu.** Không chỉnh sửa migration lịch sử đã áp dụng; không xóa dữ liệu hoặc chạy migration production, thay khóa bí mật, thay cấu hình thanh toán thực, deploy/merge khi chưa được cho phép.

---

## 2. Bản chất sản phẩm: ba không gian, một danh tính

**NEXA AI là nền tảng đánh giá và phát triển năng lực số.** Điểm khác biệt là **đánh giá có bằng chứng → phát hiện khoảng trống → gợi ý học tập/đào tạo → thực hành → đánh giá lại**, không phải trang bán khóa học hoặc dashboard thống kê chung chung.

| Phạm vi | Mục đích | Đặc điểm quyền |
| --- | --- | --- |
| **Personal** — `/personal/*` | Người dùng làm bài, theo dõi 5 miền, học tập, chứng chỉ, tạo đề/nhóm/phòng thi trong hạn mức | Tài nguyên thuộc cá nhân và các quyền được cấp cho tài nguyên cụ thể |
| **Organization Business** — `/org/[slug]/*` | Trường học/doanh nghiệp vận hành lớp, thành viên, đợt đánh giá, chấm bài, báo cáo tập thể | Tài nguyên thuộc **một tổ chức cụ thể**; quyền theo membership, vai trò, phân công và gói dịch vụ/entitlement |
| **Platform Admin** — `/admin/*` | Chủ sở hữu NEXA điều hành nền tảng, khách hàng Business, gói, tài chính, AI, nội dung, bảo mật | Đặc quyền cấp nền tảng; **không phải** quyền mua được bằng Personal Pro/Business |

- **Một tài khoản đăng nhập** có thể vừa là người học, người tạo đề và thành viên nhiều tổ chức. Chuyển workspace là đổi **ngữ cảnh**, không đổi tài khoản hay loại tài khoản.
- **Không lấy `profiles.role = 'LEARNER' | 'EVALUATOR'` làm mô hình nghiệp vụ đích.** Các enum cũ có thể còn trong database để tương thích; tính năng được quyết định bởi **quyền trên tài nguyên + entitlement + workspace**.
- `ORG_OWNER`, `ORG_ADMIN`, `ASSESSOR`, `REPORT_VIEWER`, `MEMBER` là vai trò **của từng tổ chức**. Không bao giờ đồng nhất `ORG_ADMIN` với Platform Admin.
- Thông tin Personal, Organization A và Organization B phải cách ly. Chỉ chuyển dữ liệu hoặc chia sẻ khi có quy tắc và quyền cụ thể; việc một người tham gia tổ chức không làm tổ chức sở hữu toàn bộ dữ liệu Personal của họ.
- Sidebar có thể khác nhau theo vai trò, nhưng **ẩn nút/ẩn menu không phải kiểm tra phân quyền**.

### 2.1. Chỉ đánh giá **5 miền năng lực số**

- **Khung DigComp 2.2 / 3.0 chỉ là cơ sở học thuật và tiêu chuẩn nền tảng bên trong hệ thống.** Tuyệt đối không phô bày các thuật ngữ kỹ thuật, mã khung hay số hiệu phiên bản (`DigComp`, `DigComp 2.2`, `DigComp 3.0`...) ra ngoài giao diện người dùng (UI), tránh làm người dùng bối rối hoặc làm giao diện trở nên nặng tính giáo điều. Trên UI chỉ dùng các cách gọi tự nhiên, dễ hiểu: **"5 miền năng lực số"**, **"Khung năng lực số 5 miền"** hoặc **"Hồ sơ năng lực 5 miền"**.
- Chỉ có **5 điểm miền** được chấm, tổng hợp, hiển thị Radar, so sánh và dùng xác định lộ trình. Không thiết kế UX đánh giá 21 kỹ năng thành phần.
- Cấu trúc kỹ năng thành phần nếu vẫn có trong DB chỉ là **phân loại/ánh xạ câu hỏi và tương thích dữ liệu nội bộ**, không biến thành điểm hoặc KPI sản phẩm cho người dùng.
- `score: null` = **chưa có bằng chứng hợp lệ**; `score: 0` = **đã có đánh giá hợp lệ với kết quả 0**. Không thay `null` bằng `0`, không vẽ Radar 0% giả.
- **Không gán điểm tổng bài cho cả 5 miền**. Chỉ tính điểm miền từ câu hỏi/bằng chứng được ánh xạ và chấm hợp lệ, kèm số lượng/độ bao phủ khi cần.
- Một lần làm bài, điểm hồ sơ năng lực theo thời gian, XP, xếp hạng và chứng chỉ là **các đại lượng riêng biệt**. Chứng chỉ phải có bản ghi/quy tắc cấp phát hợp lệ; không tự mở khóa vì đủ XP hoặc mua gói.
- Ngưỡng mục tiêu như `70%` là **chính sách NEXA cấu hình**, không tự gán là chuẩn chính thức của DigComp nếu chưa có nguồn xác nhận.
- Bài đánh giá đầu vào phải là bản ghi đã phát hành, có câu hỏi và quyền làm bài thật; **không trả về ID giả** khi DB trống.

### 2.2. Lộ trình và khóa học

- Lộ trình dựa trên **miền còn thiếu bằng chứng hoặc có điểm thấp**, mục tiêu, nội dung học và thời điểm đánh giá lại.
- Có thể kết hợp **học liệu NEXA** với **khóa học bên ngoài đã được tuyển chọn/kiểm duyệt**. NEXA **không phải sàn bán khóa học, không bán hộ và không ưu tiên đề xuất trả phí**.
- AI chỉ được đề xuất **khóa học thực sự tồn tại trong catalog đã duyệt** và URL chính thức. Không bịa tên/link; catalog lỗi hoặc rỗng thì hiển thị trạng thái phù hợp, không tự bật dữ liệu fallback chưa được duyệt.
- Không tuyên bố điểm tăng là do khóa học gây ra nếu chưa có bằng chứng nhân quả. Tiến độ học ngoài NEXA phải phân biệt tự khai báo và dữ liệu xác minh được.

---

## 3. Quy chuẩn giao diện — LIGHT TRẮNG / DARK ĐEN, tránh “AI slop/AI Stop”

> **Định hướng thương hiệu:** giao diện SaaS giáo dục/học thuật hiện đại, tinh gọn, tin cậy. **Light Mode lấy trắng làm nền**, **Dark Mode lấy đen thật làm nền**. Chữ chính phải trung tính, **không dùng màu xanh làm màu chữ mặc định**. Cả ba Dashboard dùng **cùng hệ thống màu**; khác nhau ở thông tin, quyền và workflow, không tạo ba theme riêng. Tuyệt đối tránh giao diện rập khuôn kiểu “AI slop”, watermark “AI Stop”, neon, gradient rực, thẻ kính mờ quá đà hay trang trí vô nghĩa.

### 3.1. Bảng màu chính thức — Light Mode (mặc định)

| Vai trò | HEX | Sử dụng / Tailwind gợi ý |
| --- | --- | --- |
| **Nền trang** | **`#FFFFFF`** | `bg-white`, `bg-background` |
| Nền phụ | `#F8FAFC` | `bg-slate-50` cho bảng, thanh phụ, vùng phân nhóm |
| **Tiêu đề, số liệu quan trọng** | **`#171717`** | `text-neutral-900` |
| **Nội dung chính, nhãn menu** | **`#262626`** | `text-neutral-800` |
| Chữ phụ, metadata | `#64748B` | `text-slate-500`, bảo đảm độ tương phản |
| Viền, đường phân cách | `#E2E8F0` | `border-slate-200` |
| **Xanh thương hiệu mới — Cobalt** | **`#2563EB`** | `bg-blue-600`, `text-blue-600` **chỉ cho link, CTA, trạng thái chọn** |
| Xanh hover / pressed | `#1D4ED8` | `hover:bg-blue-700`, `hover:text-blue-700` |
| Xanh nền chọn nhẹ | `#EFF6FF` | `bg-blue-50` |
| Chữ trên nút xanh | `#FFFFFF` | `text-white` |

**Quy tắc màu chữ:** Không dùng đen tuyệt đối `#000000` cho toàn bộ text vì tương phản quá gắt trên trắng. Chữ chính vẫn là **đen than trung tính** `#171717` hoặc `#262626`, **không phải xanh**. Xanh chỉ là màu nhấn điều hướng/tương tác, không phủ lên heading, số liệu thống kê hay nội dung bảng.

### 3.2. Bảng màu chính thức — Dark Mode (nền đen)

| Vai trò | HEX | Sử dụng / Tailwind gợi ý |
| --- | --- | --- |
| **Nền trang** | **`#000000`** | `dark:bg-black` / token `--background` |
| Nền panel / sidebar | `#0A0A0B` | Dành cho vùng có phân cấp; sidebar có thể đen tuyệt đối |
| Nền card / dropdown | `#111114` | Card nổi trên nền đen nhờ viền, không cần glow |
| Nền hover / chọn nhẹ | `#18181B` | `dark:bg-zinc-900` |
| **Tiêu đề và chữ chính** | **`#F5F5F5`** | `dark:text-neutral-100` |
| Nội dung thường | `#E4E4E7` | `dark:text-zinc-200` |
| Chữ phụ / mô tả | `#A3A3A3` | `dark:text-neutral-400` |
| Viền / phân cách | `#27272A` | `dark:border-zinc-800` |
| **Xanh nhấn sáng (link/icon/focus)** | **`#60A5FA`** | `dark:text-blue-400`, `dark:border-blue-400` khi thích hợp |
| Nút hành động chính | `#2563EB` | `dark:bg-blue-600 dark:text-white`; hover `#1D4ED8` |
| Nền nhấn nhẹ | `#102044` | Dùng rất ít cho selected/notice có ý nghĩa |

**Dark Mode là nền đen thật, không phải nền xanh navy hoặc tím đen.** Vùng phụ chỉ nâng sáng vừa đủ để phân tách lớp, tránh các card xám quá sáng hoặc 10 lớp màu tối khác nhau. Không dùng trắng tinh `#FFFFFF` cho đoạn văn dài trên nền đen; ưu tiên `#F5F5F5` / `#E4E4E7` để dịu mắt. Xanh `#60A5FA` dành cho liên kết và điểm nhấn trên nền tối, **không dùng làm màu toàn bộ chữ chính**.

### 3.3. Quy tắc chuyển Light / Dark

- **Mặc định khi chưa có lựa chọn người dùng: Light Mode (nền trắng)**. Dark Mode chỉ kích hoạt khi người dùng chọn hoặc theo chính sách theme của sản phẩm đã có; không tự đổi toàn bộ UI chỉ vì người dùng có hệ điều hành tối nếu chưa có cơ chế đã xác nhận.
- **Dark Mode phải hỗ trợ đầy đủ** cả Personal, Organization và Platform Admin: sidebar, topbar, card, bảng, modal, tooltip, form, trạng thái loading/empty/error, biểu đồ và trạng thái focus.
- Dùng **token theme** ở `src/app/globals.css` và các biến đã tồn tại (`--background`, `--foreground`, `--card`, `--border`, `--primary`, v.v.). Nếu đang dùng `.dark`/`html.dark`, tiếp tục theo cơ chế đó; ưu tiên sửa token/chỗ tái sử dụng thay vì thêm `dark:` rải rác không kiểm soát.
- Bố cục, khoảng cách, phân cấp nội dung và hành vi phải thống nhất khi đổi theme. **Đổi màu không được thay đổi quyền truy cập, tính toán hay workflow.**
- Kiểm tra tương phản theo **WCAG AA**: chữ thường tối thiểu 4.5:1; thành phần UI/biểu tượng thiết yếu tối thiểu 3:1; có thể phân biệt trạng thái mà không chỉ dựa vào màu sắc. Xanh `#2563EB` trên trắng và xanh `#60A5FA` trên đen phù hợp cho link; nút xanh `#2563EB` dùng chữ trắng.
- Nút tắt/bật theme nếu có phải dễ tìm, đọc được bằng bàn phím và không gây nhấp nháy theme khi tải trang. Không tự cài thư viện theme mới khi cơ chế hiện có đã đáp ứng.

### 3.4. Quy tắc chống thiết kế rập khuôn “AI slop”

- **Cấm mặc định:** gradient màu mè(khi cho phép thì vẫn được), neon/glow, bóng đổ lớn, card kính mờ, icon/emoji vô nghĩa, watermark hoặc nhãn “AI Stop”. Không lạm dụng chuyển động, bộ màu cầu vồng hay trang trí mô phỏng chatbot.
- **Dùng màu có ngữ nghĩa:** đỏ cho lỗi/nguy hiểm, vàng hổ phách cho cảnh báo, xanh lá cho thành công; các màu trạng thái này là ngoại lệ có kiểm soát, không biến thành màu branding hoặc biến mỗi miền năng lực thành một màu cầu vồng.
- `lucide-react` là thư viện icon chuẩn (`strokeWidth={1.75}` khi phù hợp); **không dùng emoji làm icon sản phẩm trong JSX**. Font sans hiện có cho văn bản; `font-mono tabular-nums` khi hiển thị ID, PIN, mã tham gia, thời gian, tiền/số liệu cần căn chữ số.
- Mỗi trang cần **một hành động chính rõ ràng** và trạng thái loading/empty/error/permission denied/success tương ứng. Không tạo dashboard có nhiều thẻ đẹp nhưng thiếu việc để làm.
- Hỗ trợ responsive, focus rõ, điều hướng bàn phím, nhãn input, kích thước vùng bấm và độ tương phản đủ tốt. Không dùng màu nhạt để che nội dung quan trọng.
- **Không dựng số liệu giả** (`0`, `100%`, “đã kích hoạt”, “đã duyệt”, v.v.) khi query lỗi; phân biệt rõ không có dữ liệu, chưa được đánh giá và lỗi tải dữ liệu.

### 3.5. Quy tắc sửa code

sửa đúng chỗ, không đụng code không liên quan

không sử dụng đường viền ngang
