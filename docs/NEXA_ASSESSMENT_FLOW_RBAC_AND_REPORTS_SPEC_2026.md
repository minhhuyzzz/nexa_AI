# NEXA AI — ĐẶC TẢ CHUẨN HÓA LUỒNG KHẢO THÍ, KẾT QUẢ VÀ BÁO CÁO

> Ngày phê duyệt: 05/11/2026  
> Tình trạng: Approved Specification  
> Phạm vi: Personal Workspace, Organization Workspace, Phân quyền RBAC, Chấm điểm Rubric & Báo cáo khảo thí  

---

## 1. Nguyên Tắc Kiến Trúc Sản Phẩm

NEXA AI vận hành theo mô hình chuẩn mực:

$$\textbf{3 vai trò — 2 Không gian Dashboard — 1 Tài khoản duy nhất}$$

```
                ┌──────────────────────────────────────┐
                │      MỘT TÀI KHOẢN (1 EMAIL)         │
                └──────────────────┬───────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
┌───────────────────────────────┐           ┌───────────────────────────────┐
│      PERSONAL DASHBOARD       │           │    ORGANIZATION DASHBOARD     │
│       (/personal/*)           │           │       (/org/[slug]/*)         │
├───────────────────────────────┤           ├───────────────────────────────┤
│ • Dành cho: TẤT CẢ NGƯỜI DÙNG │           │ • Dành cho: CHỈ ADMIN &       │
│ • MEMBER ở cố định tại đây   │           │   ASSESSOR                    │
│ • Nhận bài qua Chuông &       │           │ • MEMBER KHÔNG có quyền vào   │
│   "Bài được giao"             │           │ • Quản lý Lớp & Giảng viên    │
│ • Hồ sơ 5 miền cá nhân        │           │ • Kho đề & Báo cáo khảo thí   │
└───────────────────────────────┘           └───────────────────────────────┘
```

### 1.1. Ba vai trò trong tổ chức

1. **ADMIN — Chủ sở hữu tổ chức (`ORG_ADMIN` / `ORG_OWNER`)**
   - Là chủ sở hữu và người điều hành cao nhất của trường học/doanh nghiệp.
   - Quản lý danh mục thành viên, mời giảng viên, khởi tạo lớp học và phân công giảng viên phụ trách lớp.
   - Quản lý ngân hàng đề và các hoạt động khảo thí toàn trường.
   - Theo dõi, chấm bài và xem báo cáo tổng thể toàn tổ chức.
   - Quản lý gói dịch vụ, hạn mức AI và cài đặt tổ chức.
   - *Lưu ý:* Form mời thành viên thông thường không hỗ trợ mời thêm Chủ sở hữu; chuyển nhượng quyền sở hữu là nghiệp vụ quản trị riêng.

2. **ASSESSOR — Giảng viên / Giám khảo (`ASSESSOR`)**
   - Có quyền sử dụng cả 2 không gian (Personal + Organization).
   - Truy cập Organization Dashboard nhưng **bị giới hạn nghiêm ngặt theo phạm vi Lớp được phân công**:
     - Xem và quản lý các đợt khảo thí của lớp mình phụ trách.
     - Chấm bài tự luận và thực hành theo Rubric cho học sinh của lớp mình.
     - Xem kết quả và báo cáo năng lực 5 miền trong phạm vi các lớp được giao.
   - **Bị khóa/ẩn:** Quản lý thành viên toàn trường, Cài đặt tổ chức, Thanh toán/Gói B2B, Lớp của giảng viên khác.
   - Nếu chưa được phân công lớp nào, hệ thống hiển thị màn hình thông báo: *"Bạn chưa được phân công lớp phụ trách. Vui lòng liên hệ Quản trị viên tổ chức."*
   - Quyền tự tạo đề và mở phòng Live sẽ được quản lý theo đợt phân công, không cấp toàn quyền toàn trường.

3. **MEMBER — Thành viên / Người học (`MEMBER`)**
   - **Chỉ sử dụng Personal Dashboard.**
   - Không xuất hiện Workspace Switcher để chuyển sang Organization Workspace (tránh lạc vào giao diện quản trị rỗng).
   - Nhận thông báo bài thi mới qua biểu tượng **Chuông thông báo (Notification Bell)**.
   - Xem và làm bài tập tại menu có sẵn: **`Bài được giao` (`/personal/submissions`)**.
   - Xem lớp mình tham gia tại mục **`Lớp & Nhóm` (`/personal/groups`)**.
   - Điểm số hợp lệ tự động tích lũy vào **Hồ sơ năng lực 5 miền cá nhân (`/personal/competency`)**.
   - Không bị ảnh hưởng đến các bài thi tự luyện và dữ liệu riêng tư khác ngoài tổ chức.

---

## 2. Chuẩn Hóa Quy Trình Khảo Thí & Phân Định Trạng Thái

NEXA hỗ trợ hai hình thức khảo thí:
1. **Phòng thi Live trực tiếp (Live Exam Room).**
2. **Đợt đánh giá có thời hạn (Assessment Campaign / Homework).**

Hai hình thức này sử dụng chung quy trình nộp bài, chấm điểm và tổng hợp kết quả. Điểm khác biệt chỉ nằm ở cách tổ chức phiên thi và chính sách thời điểm công bố.

### 2.1. Phân định độc lập giữa Trạng thái Chấm và Trạng thái Công bố

Tuyệt đối không đồng nhất *"Đã nộp bài"* với *"Đã chấm xong"*, và không đồng nhất *"Đã chấm xong"* với *"Đã công bố"*.

```
Trạng thái Chấm bài:   [ Chưa nộp ] ──► [ Đã nộp — Chờ chấm ] ──► [ Đã chấm xong ]
                                                                       │
Trạng thái Công bố:                     [ Chưa công bố ] ──────────────┴──────► [ Đã công bố ]
```

#### A. Trạng thái Chấm bài:
- **Chưa nộp:** Thí sinh chưa gửi bài làm.
- **Đã nộp — Chờ chấm:** Bài làm đã được lưu an toàn. Các câu trắc nghiệm được hệ thống tự chấm; một hoặc nhiều câu tự luận/thực hành đang nằm trong hàng đợi chờ Giảng viên chấm Rubric. Chưa có điểm tổng kết chính thức.
- **Đã chấm xong:** Tất cả câu hỏi (cả trắc nghiệm lẫn tự luận) đã có điểm thẩm định hợp lệ. Điểm tổng và điểm 5 miền đã được tính toán đầy đủ.

#### B. Trạng thái Công bố kết quả:
- **Chưa công bố:** Thí sinh chỉ thấy thông báo nộp bài thành công và trạng thái chờ; không nhìn thấy điểm số, thứ hạng hay đáp án. ADMIN và ASSESSOR có quyền xem trước để đối soát và duyệt điểm.
- **Đã công bố:** Thí sinh được phép xem các thông tin theo chính sách mà người tổ chức cho phép (Điểm tổng, điểm 5 miền, bảng xếp hạng, đáp án & giải thích).

---

## 3. Luồng Kết Quả Cho Thí Sinh (Personal & Live)

| Tình trạng bài thi | Thí sinh nhìn thấy trên giao diện |
| :--- | :--- |
| **Vừa nộp bài (Live hoặc Đợt thi)** | Dấu tích xanh xác nhận: *"Nộp bài thành công"*, thời gian nộp, số câu đã trả lời. |
| **Bài có câu tự luận chờ chấm** | Thẻ trạng thái: *"Đã nộp — Đang chờ chấm bài Rubric"*. Không hiển thị điểm tổng bán phần. |
| **Đã chấm xong nhưng chưa công bố** | Thẻ trạng thái: *"Đã chấm xong — Chờ người tổ chức công bố kết quả"*. Nút xem điểm bị khóa. |
| **Đã công bố kết quả** | Điểm tổng kết (/100), kết quả chi tiết từng câu hỏi khách quan, điểm rubric tự luận. |
| **Host cho phép xem xếp hạng** | Hiển thị vị trí thứ hạng của mình (Top 1, Top 2, Top 3...). **Chỉ công bố thứ hạng khi 100% bài trong phiên đã chấm xong.** |
| **Host cho phép xem đáp án** | Hiển thị đáp án đúng và lời giải thích chuyên môn. |
| **Hồ sơ năng lực 5 miền** | Hiển thị nút *"Xem hồ sơ năng lực"* dẫn về `/personal/competency`. **Hệ thống tự động tích hợp điểm vào 5 miền, không bắt người dùng bấm "Cập nhật thủ công".** |

### Quy tắc hiển thị 5 miền:
- Miền có đủ bằng chứng đánh giá hợp lệ: Hiển thị điểm số và cấp độ năng lực tương ứng.
- Miền chưa có câu hỏi/bằng chứng: Hiển thị nhãn *"Chưa đủ dữ liệu"*; **tuyệt đối không quy đổi `null` thành `0` để vẽ Radar giả**.

---

## 4. Tái Cấu Trúc Khảo Thí & Báo Cáo Trong Organization

Không tạo thêm nhiều trang hay route trùng lặp (không tạo `/org/[slug]/reports`). Tái cấu trúc và nâng cấp 2 phân hệ hiện có:

### 4.1. Ngân Hàng Đề Khảo Thí (`/org/[slug]/assessments`)
- Bỏ các nhãn kỹ thuật gây hoang mang (`Chuẩn hóa hệ thống`, `Nội bộ tổ chức`).
- Tổ chức thành 3 tab rõ ràng:
  1. **Đề của tổ chức (Đã tạo):** Đề do trường tự soạn hoặc nhân bản, có quyền Chỉnh sửa / Xóa.
  2. **Đề mẫu NEXA (Thư viện chuẩn):** Đề chuẩn mẫu toàn sàn (Baseline Assessment), có huy hiệu *"Đề mẫu hệ thống"*, cung cấp 2 hành động: **[Tạo đợt thi ngay]** hoặc **[Nhân bản để chỉnh sửa]**.
  3. **Bản nháp:** Đề đang soạn chưa công bố.

### 4.2. Hoạt Động Khảo Thí & Báo Cáo (`/org/[slug]/campaigns` & `analytics`)
Tổ chức giao diện theo **2 Cấp độ chuẩn SaaS**:

#### Cấp 1 — Danh sách các Hoạt động Khảo thí:
- Dạng bảng thống nhất:
  - Tên hoạt động & Hình thức (*Phòng thi Live* hoặc *Đợt giao bài*).
  - Lớp học được phân công.
  - Thời gian bắt đầu và hạn nộp.
  - Tiến độ nộp bài: Số bài đã nộp / Số thí sinh **thực tế được giao** (không lấy tổng thành viên toàn trường).
  - Số bài chờ chấm Rubric (kèm nút chấm bài nhanh).
  - Trạng thái phiên thi (*Đang diễn ra*, *Chờ chấm bài*, *Đã hoàn tất*).
  - Hành động: *[Xem báo cáo chi tiết]*, *[Chấm bài]*, *[Tạo đợt mới từ đợt này]* (không mở lại đợt cũ đã đóng để tránh sai lệch dữ liệu lịch sử).

#### Cấp 2 — Báo cáo Chi tiết của Hoạt động Khảo thí:
- **4 Thẻ số liệu KPI cốt lõi:**
  1. Thí sinh được giao & tỷ lệ tham gia thực tế.
  2. Tỷ lệ hoàn thành đúng hạn.
  3. Điểm trung bình của các bài đã chấm xong hoàn tất.
  4. Tỷ lệ đạt chuẩn năng lực số ($\ge 70\%$) của các bài đã chấm xong.
- **Biểu đồ Radar Năng Lực Số Tập Thể:** Phản ánh điểm trung bình các miền có đủ dữ liệu của lớp.
- **Bảng Kết Quả Chi Tiết Thí Sinh:** Họ tên, Lớp, Trạng thái nộp, Trạng thái chấm, Điểm tổng, Điểm 5 miền, Nút xem bài làm & Chấm Rubric.
- **Xuất Báo Cáo:** Xuất file CSV / Excel bảng điểm lớp học.

---

## 5. Quy Chuẩn Form Mời Thành Viên (Khôi phục form 2 tab)

Khôi phục component [`InviteMemberModal.tsx`](file:///c:/nexa/src/components/dashboard/org/members/InviteMemberModal.tsx) về cấu trúc tinh gọn 2 tab, loại bỏ toàn bộ phần minh họa radar SVG và mã PIN 6 giờ phức tạp:

```
┌────────────────────────────────────────────────────────┐
│ Mời thành viên — Trường FPT Polytechnic           [✕] │
├────────────────────────────────────────────────────────┤
│   [ 🔑 Mã mời & Liên kết ]   [ ✉️ Mời qua Email ]     │
├────────────────────────────────────────────────────────┤
│  Mã định danh tham gia tổ chức:                        │
│  [ FPT-POLY                          ] [ Sao chép ]    │
│                                                        │
│  Liên kết tham gia trực tiếp:                          │
│  [ http://localhost:3000/join/org/FPT-POLY ] [ Chép ]  │
│                                                        │
│  * Thành viên tham gia qua Mã/Link mặc định là MEMBER │
└────────────────────────────────────────────────────────┘
```

* **Tab 1: Mã mời & Liên kết trực tiếp:**
  - Hiển thị Mã mời cố định và Link trực tiếp.
  - Người tham gia qua mã/link này **mặc định nhận vai trò MEMBER** (học sinh), không cấp quyền giảng viên qua link công khai.
* **Tab 2: Mời đích danh qua Email:**
  - Nhập địa chỉ email người được mời.
  - Chọn 1 trong 2 vai trò:
    1. **Giảng viên (`ASSESSOR`)**: Quản lý và chấm bài lớp được giao.
    2. **Thành viên (`MEMBER`)**: Học tập và làm bài thi.
  - Nút: *"Gửi thư mời qua email"*. (Không bắt buộc phải gán lớp ngay; Admin có thể phân công lớp sau trong mục Quản lý lớp).

---

## 6. Danh Mục Các Lỗ Hổng & Điểm Kỹ Thuật Cần Khắc Phục (P0 $\rightarrow$ P2)

### P0 — Bảo Mật & Toàn Vẹn Dữ Liệu
1. **P0.1: Chống rò rỉ điểm số tại API Live Status**  
   File: [`src/app/api/rooms/status/route.ts`](file:///c:/nexa/src/app/api/rooms/status/route.ts)  
   *Lỗi:* Trả về điểm số của từng thí sinh trong danh sách `participants` ngay cả khi Host chưa bấm `results_published`.  
   *Sửa:* Lọc bỏ trường `score` và `rank` trong response trả về phía client nếu `results_published === false` và người gọi không phải là Host.
2. **P0.2: Cách ly dữ liệu bài làm cá nhân khỏi Báo cáo Tổ chức**  
   File: [`src/app/(dashboard)/org/[slug]/analytics/page.tsx`](file:///c:/nexa/src/app/(dashboard)/org/[slug]/analytics/page.tsx)  
   *Lỗi:* Truy vấn bài nộp chỉ dựa vào `assessment_id`, có nguy cơ kéo nhầm bài thi tự luyện cá nhân của học sinh ngoài tổ chức vào báo cáo của trường.  
   *Sửa:* Bắt buộc lọc theo `organization_id` và `campaign_id` / `class_id` cụ thể của đợt thi trường giao.
3. **P0.3: Không quy đổi câu chưa chấm (`null`) thành điểm 0**  
   File: [`src/features/competency/services/domain-assessment-summary.service.ts`](file:///c:/nexa/src/features/competency/services/domain-assessment-summary.service.ts)  
   *Lỗi:* Code đang sử dụng `Number(ans.score_awarded || 0)` khiến câu tự luận đang chờ chấm bị gán điểm 0 làm tụt điểm Radar 5 miền.  
   *Sửa:* Giữ nguyên giá trị `null` đối với câu chưa chấm, chỉ tổng hợp miền khi toàn bộ câu hỏi của miền đó đã có điểm thẩm định hợp lệ.

### P1 — Phân Quyền & Đồng Bộ Nghiệp Vụ
1. **P1.1: Mở quyền truy cập Organization cho `ASSESSOR`**  
   File: [`src/lib/auth/org-guard.ts`](file:///c:/nexa/src/lib/auth/org-guard.ts)  
   *Sửa:* Thêm `ASSESSOR` vào quyền `VIEW_WORKSPACE`. Trên giao diện và API, giới hạn dữ liệu chỉ hiển thị các lớp mà `evaluator_classes.instructor_id = user.id` (hoặc `evaluator_id = user.id`).
2. **P1.2: Ẩn Workspace Switcher đối với `MEMBER`**  
   File: [`src/components/dashboard/WorkspaceSwitcher.tsx`](file:///c:/nexa/src/components/dashboard/WorkspaceSwitcher.tsx)  
   *Sửa:* Lọc danh sách tổ chức, chỉ cho phép chuyển đổi sang Org nếu vai trò là `ORG_ADMIN`, `ORG_OWNER` hoặc `ASSESSOR`. Học sinh (`MEMBER`) không hiển thị menu switch sang Org.
3. **P1.3: Đồng bộ trường phân công Giảng viên phụ trách lớp**  
   Đồng bộ logic giữa `instructor_id` (migration 37), `evaluator_id` và mảng `assessor_ids` trong API chấm bài [`src/app/api/organizations/[orgId]/grading/route.ts`](file:///c:/nexa/src/app/api/organizations/[orgId]/grading/route.ts).

### P2 — Trải Nghiệm Giao Diện Tinh Gọn (Anti-Slop & SaaS)
1. **P2.1: Dọn dẹp Personal Dashboard**  
   Xóa bỏ component `OrgAssignmentsWidget` khỏi [`src/app/(dashboard)/personal/dashboard/page.tsx`](file:///c:/nexa/src/app/(dashboard)/personal/dashboard/page.tsx). Giữ nguyên trang chủ sạch sẽ tập trung vào Hồ sơ 5 miền, chuyển toàn bộ thông báo bài thi sang Chuông thông báo và menu `Bài được giao`.
2. **P2.2: Tái cấu trúc `InviteMemberModal.tsx`**  
   Thu gọn từ 804 dòng về form 2 tab đơn giản như thiết kế mục 5.
3. **P2.3: Chuẩn hóa trang Ngân hàng đề Org (`OrgAssessmentsListView.tsx`)**  
   Đổi nhãn thành *Đề của tổ chức*, *Đề mẫu NEXA (có nút Tạo đợt & Nhân bản)*, *Bản nháp*.
