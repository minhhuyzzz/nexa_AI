# Tasks To-Do: Chuẩn Hóa Bàn Chấm Bài & Cơ Chế Chấm Điểm Đa Không Gian

## Phase 1: Chuẩn hóa Grading Engine & Bảo toàn Điểm Đề Hỗn Hợp
- [x] Task 1.1: Chuẩn hóa API chấm Org `api/organizations/[orgId]/grading` bảo toàn điểm MCQ khi duyệt câu thực hành
- [x] Task 1.2: Lọc thông minh hàng đợi Bàn chấm (chỉ đưa bài có câu hỏi cần chấm, bỏ bài 100% trắc nghiệm)

## Phase 2: Organization — Bàn Chấm Bài Theo Ngữ Cảnh
- [x] Task 2.1: Cập nhật Server Loader `org/[slug]/grading/page.tsx` hỗ trợ `classId`, `campaignId`
- [x] Task 2.2: Thêm bộ lọc Dropdown 3 chiều trên `OrgGradingClientView.tsx`
- [x] Task 2.3: Gắn liên kết theo ngữ cảnh từ trang Lớp (`classId`) và trang Đợt thi (`campaignId`)

## Phase 3: Personal — Chấm Bài Cho Nhóm Cá Nhân & Sidebar Động
- [x] Task 3.1: Thêm kiểm tra động trên `PersonalSidebar.tsx` (chỉ hiện "Bài cần chấm" khi có nhóm sở hữu)
- [x] Task 3.2: Thêm nút "Chấm bài" trong chi tiết Nhóm cá nhân trỏ đến `/personal/grading?groupId=...`
- [x] Task 3.3: Cách ly tuyệt đối dữ liệu Personal tại `api/evaluator/submissions` (loại bỏ bài tổ chức)

## Phase 4: Kiểm Thử & Xác Minh
- [x] Task 4.1: Viết test cho luồng chấm điểm hỗn hợp và bộ lọc ngữ cảnh (`grading-workbench-parity.test.ts`)
- [x] Task 4.2: Typecheck (0 lỗi) và chạy toàn bộ Vitest suite (58/58 test files passed, 395/395 passed)
- [x] Task 4.3: Xác nhận cách ly Personal vs Organization
