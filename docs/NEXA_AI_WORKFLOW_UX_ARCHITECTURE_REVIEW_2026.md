# NEXA — Rà soát hệ thống AI & đặc tả luồng tích hợp Personal · Organization · Platform Admin

> **Mã tài liệu:** `NEXA-AI-REVIEW-2026-11`  
> **Phiên bản:** 1.0 — 19/11/2026  
> **Repository:** https://github.com/minhhuyzzz/nexa_AI  
> **Snapshot tham chiếu:** nhánh `main`, commit gần nhất quan sát `1ef5a85bb898426c027fc59bd1fba180e6e0321a`  
> **Nguồn nội bộ đối chiếu:** `docs/SRS.md`, `docs/00-project-context.md`, `docs/NEXA_AI_USE_CASE_REVIEW_TOAN_HE_THONG.md`, `docs/DAC_TA_THIET_KE_LAI_ADMIN_SETTINGS_AUDIT_AI_GATEWAY.md`, bản `ai-integration-architecture.md` người dùng gửi (150 dòng) và các route/services/components liên quan.  
> **Phạm vi xác nhận:** rà soát tĩnh cây repo (1.866 file trong snapshot) và đọc tập trung code/tài liệu liên quan AI, khảo thí, chi phí, phân quyền và UI. **Không phải** kiểm tra từng dòng của mọi file, không chạy build hoặc test production; các khẳng định về UI là kết luận từ JSX/luồng tương tác, không phải kết quả kiểm thử trực quan trên trình duyệt.

---

## 1. Quyết định kiến trúc

**NEXA là nền tảng đánh giá, phát triển và chứng nhận năng lực số; AI là lớp hỗ trợ có kiểm soát, không phải chatbot thay thế hoạt động khảo thí.** Không tạo “AI Chat” thường trực trên toàn bộ sản phẩm ở giai đoạn này. Bốn tác vụ AI ưu tiên:

1. **AI Grading Assist:** Gợi ý chấm phần trả lời mở/thực hành dựa trên rubric, kèm bằng chứng và trạng thái cần người xác nhận.
2. **AI Competency Insight:** Diễn giải kết quả đã được tính bằng engine xác định; nêu điểm mạnh, khoảng trống và gợi ý hành động.
3. **AI Learning Recommendation:** Sắp thứ tự học phần/bài đánh giá lại **từ kho đã được phát hành**, không tự bịa khóa học.
4. **AI Authoring Assist:** Gợi ý bản nháp câu hỏi/rubric cho người có quyền biên soạn, không tự động phát hành.

Chỉ chạy tác vụ khi người dùng có thẩm quyền kích hoạt, trừ hoạt động deterministic không tốn LLM như tự chấm MCQ hoặc tính radar từ điểm hợp lệ. Tác vụ tổng hợp tổ chức không được đọc/tiết lộ bài cá nhân nằm ngoài quyền tổ chức.

### Bốn ranh giới bất biến

- **Lớp tính điểm:** công thức điểm, độ bao phủ, ngưỡng và điều kiện công bố là logic server, **không phải văn bản do LLM quyết định**.
- **Lớp AI:** đưa ra đề xuất, diễn giải, trích dẫn, sắp xếp nội dung và kết quả có cấu trúc; không được tự nâng quyền, tự cấp chứng nhận hay tự chốt điểm.
- **Lớp người phụ trách:** người chấm duyệt/sửa đề xuất đối với phần cần thẩm định; hệ thống lưu cả bản đề xuất và quyết định sau cùng.
- **Lớp quản trị:** Platform Admin vận hành model/policy/cost/quality toàn hệ thống, không mặc định được xem bài làm riêng tư hoặc chấm thay tổ chức.

---

## 2. Hiện trạng kỹ thuật: đã có, chưa hoàn chỉnh và đề xuất

| Hạng mục | Bằng chứng repo | Đánh giá |
|---|---|---|
| Gemini chấm rubric | `src/features/ai-gateway/adapters/gemini.adapter.ts`; `src/app/api/ai/grade-submission/route.ts` | **Có backend thực**; cần chuẩn hóa schema/đối soát kết quả và UI. |
| Gợi ý chấm AI chỉ là bản nháp | `ai_evaluations.status = DRAFT`, `grading_status = AI_DRAFT`; không ghi đè điểm final tại API chấm AI | **Nền tảng đúng**; cần thống nhất màn hình chấm. |
| Phân tích cá nhân theo yêu cầu | `/personal/competency/analysis`, `/api/ai/analyze-competency` | **Có**; phát hiện lỗi thứ tự settle credits/lưu kết quả. |
| Chấm thủ công trong Personal | `/personal/grading`, `AIGradingCard` | **Có** cho người đánh giá; cần đặt theo quyền vai trò, không tạo menu chấm cho learner thông thường. |
| Bàn chấm tổ chức | `/org/[slug]/grading`, `InContextGradingDrawer` | **Có**; hai cách áp dụng gợi ý AI không nhất quán. |
| Insights tổ chức | `/api/org/[slug]/analytics/ai-insights`, `AnalyticsInsightPanel` | **Có**; nhận summary do client gửi và trả fallback theo quy tắc khi LLM lỗi. |
| Trợ lý biên soạn | `/api/ai/authoring-assist` | **Có**; kiểm tra đăng nhập, **chưa thấy** kiểm tra cụ thể quyền biên soạn/credit trước model. |
| Quyền lợi AI credits | `QuotaEnforcementService`, ledger/deduct RPC; API grading reserve/settle/release | **Có một phần đáng giữ**; cần thống nhất các tác vụ và người chi trả. |
| Bộ chọn đa provider | `/admin/ai-gateway`, `AIConfigService` | **UI có** Google/OpenAI/Anthropic/DeepSeek/OpenRouter nhưng `adapters/index.ts` hiện mới thực thi Gemini. |
| Telemetry/cost | `ai_usage_events`, `AIUsageLoggerService`, `/api/admin/ai-gateway` | **Có** nhưng token/đơn giá đang ước lượng cứng, truy vấn tổng hợp còn rủi ro hạn dòng. |
| Cấu hình model theo tác vụ | `AIConfigService` có `rubricGrading`, `competencyAnalysis` | **Có một phần**; UI/admin chưa quản trị đủ `AUTHORING_ASSIST`, `ORG_INSIGHT` end-to-end. |
| RAG học liệu/khung năng lực | Tài liệu kiến trúc 8 lớp mô tả | **Chưa xác nhận** vector retrieval production từ những API được xem; không coi RAG là tính năng đã triển khai. |
| Evals chất lượng AI | Một số unit tests schema/validator | **Có unit tests**; chưa thấy bằng chứng bộ gold dataset đánh giá mức tương đồng người chấm hoặc kiểm thử hồi quy model trong tập đã đọc. |
| Job bất đồng bộ lâu | Các API trên gọi model trực tiếp | **Đề xuất** chỉ khi timeout/khối lượng lớn thực tế yêu cầu; không nhất thiết đầu tư từ ngày đầu. |

**Lưu ý:** trạng thái “có code” không khẳng định tính năng chạy production thành công. Các route vẫn phải thử quyền, dữ liệu, khóa model, billing, lỗi retry và luồng end-to-end.

---

## 3. Những phát hiện cần sửa (gắn đường dẫn mã nguồn)

### P0-01 — Credit được quyết toán trước khi lưu kết quả phân tích

`src/app/api/ai/analyze-competency/route.ts` gọi `settleOrReleaseCredits(..., 'SETTLE', 1)` trước khi `insert` vào `competency_analyses`. Nếu `insert` lỗi, code chỉ `console.error(saveError)` rồi vẫn trả response thành công. **Rủi ro:** khách hàng mất credit nhưng không có bản phân tích được lưu, về sau có thể trả thêm credit để thử lại.

**Yêu cầu:** lưu job + output có idempotency key, xác nhận lưu thành công rồi quyết toán, hoặc triển khai transactional saga/reconciliation có thể replay và hoàn trả. Nếu không thể đảm bảo atomic xuyên API/provider/DB, sử dụng `RESERVED → PERSISTED → SETTLED` và job bù trừ.

### P0-02 — Summary Organization do client cung cấp

`src/app/api/org/[slug]/analytics/ai-insights/route.ts` xác thực vai trò tổ chức nhưng dùng `orgName`, `evaluatedCount`, `overallScore`, `domains`, `passRate` trực tiếp từ body để tạo prompt. Chưa thấy server tự tải các aggregate đáng tin từ tenant, không thấy quota/usage logging cùng tuyến gọi này.

**Yêu cầu:** client chỉ gửi `campaignId`, `dateRange`, `classId`, filter IDs; backend kiểm tra `org_id`, tự query số liệu đã công bố và có đủ mẫu theo quy tắc. Trả kết quả có `datasetVersion`, `filters`, `sampleSize`, `isAiGenerated`, `status`, `source`.

### P0-03 — Config provider chưa nối với execution

`src/app/(dashboard)/admin/ai-gateway/page.tsx` cho chọn Gemini, OpenAI, Anthropic, DeepSeek, OpenRouter; `src/features/ai-gateway/adapters/index.ts` chỉ trả `GeminiAdapter`, với provider khác throw. Các API `/api/ai/grade-submission` và `/api/ai/analyze-competency` gọi cứng `getAIAdapter('GOOGLE_GEMINI')`.

**Yêu cầu:** trước mắt **chỉ mở Gemini** là `Supported`; các model chưa có adapter khóa với chữ `Chưa hỗ trợ`. Khi có provider thứ hai: adapter + tests + schema parity + health check + canary rồi mới mở ở Admin.

### P0-04 — Quyền tác vụ authoring assist chưa đầy đủ

`src/app/api/ai/authoring-assist/route.ts` xác thực có session và xác nhận body Zod, sau đó gọi Gemini; trong đoạn route được kiểm tra chưa thấy quyền sở hữu đề/tác giả/admin tổ chức, quyền `MANAGE_CONTENT`, hoặc reservation credits. Điều này có thể khiến người đăng nhập nhưng không có quyền biên soạn gọi endpoint tiêu thụ tài nguyên.

**Yêu cầu:** server kiểm tra role/capability, owner đề, tenant, feature entitlement, credit payer, rate limit và input bounds; lưu bản nháp thay vì publish trực tiếp.

### P0-05 — Khi AI lỗi, Organization vẫn có báo cáo như AI

Cùng route `ai-insights` trả `generateFallbackInsights(body)` với cờ `isSimulatedFallback: true` khi thiếu API key hoặc lỗi model. UI `src/features/analytics/components/AnalyticsInsightPanel.tsx` dùng nhãn “Báo cáo Phân tích Chiến lược NEXA AI” và “Đã sẵn sàng”. Dù response có cờ, tại phần JSX đã xem không có phân biệt đầy đủ.

**Yêu cầu:** nếu fallback: nhãn `Nhận định theo dữ liệu` / `Báo cáo quy tắc`, ghi `Không sử dụng AI`, không tính credit cho lượt model lỗi, không lưu là `AI_GENERATED`.

### P1-01 — UI chấm AI không nhất quán

`InContextGradingDrawer.tsx` tự gọi `setSelectedLevels(...)` ngay khi nhận gợi ý AI; `OrgGradingClientView.tsx` có nút “Áp dụng đề xuất AI” riêng, đồng thời sử dụng logic chia tỷ lệ tổng điểm AI vào từng câu mở (`openSuggested = totalScore - mcqAutoPoints`). Cách phân bổ này có nguy cơ **sai rubric**, nhất là khi kết quả API là điểm **một item** thay vì tổng bài.

**Yêu cầu:** AI trả **gợi ý từng tiêu chí cho từng `item_id`**; chỉ hiển thị trong panel đề xuất; người chấm chọn `Áp dụng gợi ý` hoặc chấm tay, sau đó `Lưu bản nháp` / `Phê duyệt kết quả`. Không tự chia tổng điểm AI theo tỷ lệ rồi ghi vào từng câu.

### P1-02 — Telemetry chưa tương thích kiểm soát chi phí thật

`AIUsageLoggerService.calculateEstimatedCost()` bỏ qua tham số model và gán giá Gemini cố định `0.075/1M input`, `0.30/1M output`; token ở `/api/ai/grade-submission` lấy theo ước lượng ký tự, ở phân tích dùng `promptTokens: 1200`. Chi phí hiển thị chỉ nên gọi là ước tính, không là bill thực tế. API admin lọc nhiều event rồi tổng hợp trong Node, có nguy cơ thiếu do giới hạn dòng truy vấn.

**Yêu cầu:** log usage provider trả về (nếu có), model/provider ID, pricing version, cache tokens, retries, cost estimate và invoice reconciliation. SQL aggregates theo kỳ/tenant/flow, không tính sum chỉ trên một page kết quả.

### P1-03 — Nhiều logic cấu hình khác nguồn chân lý

`AIConfigService` đọc cấu hình async DB nhưng cũng có `getConfig()` đồng bộ dùng in-memory/file/default; route Organization dùng `getConfig()`, một số adapter cũng dùng đường đồng bộ; API Admin lưu `platform_settings` async. Trong môi trường nhiều instance/serverless, cache và file cục bộ có thể không đồng bộ.

**Yêu cầu:** một runtime config từ DB/cache phân tán có TTL/phiên bản + secret manager; không ghi API key raw vào JSON file/source; lưu metadata provider riêng và secrets qua quản trị hạ tầng. Khi thay đổi, config version phải truy xuất được trong job log.

### P1-04 — Confidence AI không phải xác suất chính xác đã hiệu chuẩn

Prompt Gemini định nghĩa `confidenceScore` theo 0–100; một UI sử dụng `Math.round(aiResult.confidenceScore * 100)` và có nguy cơ hiển thị gấp 100 lần. Các cờ ngưỡng không đủ để chứng minh độ tin cậy khoa học khi chưa đối chiếu dữ liệu gold labels.

**Yêu cầu:** chuẩn hóa `confidenceScore` 0..1 hoặc 0..100 ở schema end-to-end, tên hiển thị `Mức chắc chắn do AI tự báo cáo` và có quy tắc bắt buộc human review theo bằng chứng/rubric, không coi điểm tự khai là xác suất đúng.

### P1-05 — Prompt/nguồn dữ liệu và ghi log quyền riêng tư

`PIIScrubberService` có sẵn nhưng chưa xác nhận được sử dụng nhất quán ở mọi route AI, đặc biệt org insights/authoring. Các tệp minh chứng có thể chứa dữ liệu cá nhân hoặc chỉ thị prompt injection.

**Yêu cầu:** trước khi gọi model, giới hạn dữ liệu cần thiết, kiểm tra file loại/kích thước, lọc PII theo policy, tách `untrusted content` khỏi instructions, kiểm tra quyền trên mỗi tài liệu trước retrieval; không log raw bài làm hay khóa API ở telemetry chung.

---

## 4. AI trong Personal Workspace — trải nghiệm đề xuất

**Tên trải nghiệm:** `Phân tích & phát triển năng lực` (đừng đặt mọi mục là “Trợ lý AI”).

### 4.1. Sau khi hoàn tất bài đánh giá

**Bước A — Kết quả đánh giá (không cần AI):**
- Người học nộp bài → server chấm câu khách quan; câu mở ở `Chờ chấm` khi chưa có đánh giá hợp lệ.
- Hiển thị điểm chỉ phần đã chấm, **không** biến phần chưa chấm thành 0 hoặc cộng điểm tổng /100 sớm.
- Radar 5 miền từ evidence được chấp nhận; nếu chưa đủ chứng cứ, hiển thị `Chưa đủ dữ liệu`.
- Nếu phần mở cần được phê duyệt, chưa đưa ra kết luận tổng năng lực/chứng nhận.

**Bước B — AI phân tích sau khi đủ dữ liệu:**
- Một hành động chính ở trang kết quả hoặc Hồ sơ năng lực: `Phân tích kết quả với AI`.
- Trước khi chạy: chi phí dự kiến **1 credit nếu policy hiện quy định**, số dư sẽ dùng, nguồn chi trả (cá nhân/tổ chức), thông báo kết quả chỉ là gợi ý.
- Kiểm tra cache theo `submission_id + grading_version + framework_version + prompt_version`; nếu bản phân tích còn hiệu lực, `Xem phân tích` không thu phí lần hai.
- Nếu credits hết: hướng dẫn xem số dư/nâng gói; không tự động popup thanh toán ngay giữa nội dung phân tích.

**Bước C — Trang kết quả AI cấu trúc 3 lớp:**

```
TỔNG QUAN NĂNG LỰC
  Mức đạt hiện tại · 5 miền · số miền đủ dữ liệu · ngày đánh giá
  [Xem minh chứng] [Làm đánh giá lại]

NHỮNG ĐIỀU CẦN CẢI THIỆN
  2–3 kỹ năng ưu tiên · điểm hiện tại · lý do · liên kết kết quả câu hỏi

LỘ TRÌNH ĐỀ XUẤT
  Học phần 1 → Học phần 2 → Luyện tập → Đánh giá lại
  [Bắt đầu học phần]           Nguồn: Kho học liệu NEXA
```

Không để radar lặp ở 3 trang hoặc ép người dùng đọc báo cáo AI dài nhiều trang. Phần `Phân tích chi tiết` dùng accordion/side panel theo domain; số liệu định lượng phải dựa engine, văn bản diễn giải chỉ dựa trên bằng chứng có nguồn.

### 4.2. Trong quá trình học

- Trang `/personal/learning-path` giữ thiết kế 5 miền và trạm năng lực hiện tại; AI **chỉ làm việc chọn ưu tiên/nêu lý do**, không tự tạo domain, bài học hay đề mới bên ngoài ngân hàng chuẩn.
- Thẻ `Vì sao nên học nội dung này?` trình bày lý do từ skill gap + evidence, có link `Xem kết quả đánh giá`.
- Bài kiểm tra lại phải gắn **đề thật** từ hệ thống, không cho AI bịa ngân hàng câu hỏi hay cấp cấp độ thành thạo bằng văn bản.
- `PTS/Level tài khoản` tách hoàn toàn khỏi `Basic / Intermediate / Advanced / Highly Advanced`.

### 4.3. Người học được giao bài từ tổ chức

- Nếu bài thuộc campaign của tổ chức, chính sách quyền xem kết quả/chấm/công bố do campaign chi phối.
- Không cho learner kích hoạt AI chấm gây can thiệp kết quả khi campaign yêu cầu giảng viên duyệt; thay bằng thông báo `Đang chờ người đánh giá` hoặc `Kết quả đã công bố`.
- Khi được phép phân tích năng lực từ bài giao, cần xác định rõ **ai trả credits**, và không để Personal tự truy cập/quét dữ liệu riêng tổ chức khác.

---

## 5. AI trong Organization Workspace — ba tác vụ, ba điểm đặt

### 5.1. Bàn chấm bài (`/org/[slug]/grading`)

**UI nên có bố cục 3 phần:**

```
[Danh sách bài chờ chấm] | [Bài làm + tệp minh chứng] | [Rubric & gợi ý AI]
                            (nội dung chính)          [Gợi ý chấm với AI]
                                                      Đề xuất theo tiêu chí
                                                      Trích bằng chứng + mức cần rà soát
                                                      [Áp dụng] [Chấm thủ công]
                                                      [Lưu nháp] [Phê duyệt kết quả]
```

- AI đặt **trong rubric panel**, không là chatbot riêng.
- Cùng một component/service cho chấm Personal Evaluator và Org; biến thể dựa trên `submissionId`, `itemId`, `scoringPolicy`, `payerOrgId`.
- Phân biệt `Bài chưa chấm` → `Có gợi ý AI` → `Đang rà soát` → `Đã chấm` → `Đã công bố` (chấm và công bố là 2 trục trạng thái).
- Đánh dấu `AI đề xuất` tại tiêu chí, không tô mọi phần thành màu xanh như đã được phê duyệt.
- Nếu AI fail, người chấm **vẫn có thể chấm thủ công**; credit được hoàn theo quy tắc.

### 5.2. Phân tích năng lực tổ chức (`/org/[slug]/analytics`)

Không đặt toàn bộ báo cáo chiến lược trong một Modal dài. Đề xuất **tab `Tổng quan` · `5 miền năng lực` · `Gợi ý bồi dưỡng`** trong trang báo cáo hiện có, hoặc side drawer rộng với đường dẫn sâu.

1. **Số liệu:** server tổng hợp số thành viên có điểm hợp lệ, trung bình, phân bố 5 miền, độ phủ, chênh lệch trước/sau.
2. **Insights deterministic:** có sẵn miễn phí, ví dụ `D4 thấp nhất trong kỳ`; nếu thiếu mẫu → `Chưa đủ dữ liệu`.
3. **AI narrative on-demand:** người quản trị bấm `Tạo nhận định & kế hoạch bồi dưỡng`; hiện credits/quyền, ghi snapshot filter.
4. **Bản báo cáo:** tóm tắt 2–3 ý, kỹ năng ưu tiên, đề xuất chuyên đề gắn kho NEXA, phân nhóm có đủ mẫu và kế hoạch đánh giá lại.
5. **Không thao túng nghiệp vụ:** AI không tự tạo campaign, giao bài, liên hệ thành viên hoặc xuất dữ liệu nghiên cứu nếu không có thao tác xác nhận và quyền tương ứng.

Nếu model lỗi, chuyển sang `Nhận định theo quy tắc` với nhãn đúng, không tính tiền như AI chạy thành công.

### 5.3. Trợ lý biên soạn đề (Studio)

- Cùng entry `Gợi ý với AI` bên trong editor đang dùng cho Personal Evaluator / Org / Platform Admin, **không tạo Editor AI thứ hai**.
- Chỉ người có quyền biên soạn nội dung mới được bấm.
- Chọn thao tác: `Gợi ý câu hỏi`, `Làm rõ yêu cầu`, `Gợi ý đáp án nhiễu`, `Gợi ý rubric`.
- Trả bản nháp để tác giả chỉnh sửa; phải có bước kiểm tra chuẩn năng lực, đáp án, rubric, phát hành.
- Mọi câu hỏi được sinh ra được đánh dấu nguồn gợi ý, prompt/model version, người duyệt, không mặc nhiên là câu hỏi hệ thống chính thức.

---

## 6. AI trong Platform Admin — một nơi điều hành thay vì nhiều nút rời rạc

**Menu chính:** `Cổng AI` (`/admin/ai-gateway`). **Không** cần thêm 5 menu con trong sidebar; sử dụng 5 tab trên cùng trang:

| Tab | Điều khiển | KPI/đặc tính |
|---|---|---|
| **Tổng quan** | Quan sát trạng thái thật và cảnh báo | Request thành công/thất bại, P95 latency, chi phí/credit, jobs lỗi, tỉ lệ cần rà soát |
| **Tác vụ AI** | Bật/tắt và chọn model theo `RUBRIC_GRADING`, `COMPETENCY_ANALYSIS`, `ORG_INSIGHT`, `AUTHORING_ASSIST` | Status support/disabled, policy thu credits, mức rủi ro, fallback hợp lệ |
| **Nhà cung cấp & mô hình** | Credentials secure, model allowlist, health check, canary và cấu hình version | Chỉ hiện provider đã chạy qua integration tests là `Sẵn sàng` |
| **Credits & ngân sách** | Theo dõi tiêu thụ Personal/Organization, reservation vs settlement, cost ceiling | Credits cấp/đã trừ/đã hoàn, chi phí model thật/ước tính, budget alert |
| **Chất lượng & nhật ký** | Evals, gold set, review flags, audit thay đổi, tìm job ID | Agreement với điểm người chấm, error types, prompt/model versions, latency, traceId |

**Quy tắc quyền:** `SUPER_ADMIN` cấu hình provider/secrets; `AI_OPERATOR` giám sát và thực thi những thao tác an toàn theo capability; `FINANCE_ADMIN` có thể xem chi phí tổng hợp; `CONTENT_ADMIN` quản lý chính sách rubric/nội dung và eval set nếu được cấp. Không coi Admin Platform là người chấm thay lớp/tổ chức.

**Giao diện gợi ý**:

```
CỔNG AI                        [7 ngày | 30 ngày] [Tất cả · Personal · Tổ chức]
Sức khỏe      Lượt xử lý      Chi phí ước tính      Cần rà soát
----------------------------------------------------------------
TÁC VỤ ĐANG HOẠT ĐỘNG              CẢNH BÁO CẦN XỬ LÝ
Chấm theo rubric  [Gemini · OK]    [Lỗi model 503 · Xem log]
Phân tích cá nhân [Gemini · OK]    [Quota tổ chức sắp chạm ngưỡng]
Insights tổ chức [Gemini · OK]    [Bản AI draft chờ duyệt]
Soạn đề           [Gemini · OK]
----------------------------------------------------------------
NHẬT KÝ: Thời gian | Tác vụ | Nguồn | Provider/Model | Status | Tokens | Cost
```

Không dùng “Hệ thống ổn định” hay “AI Gateway Active” dựa trên giá trị UI cố định. Chỉ hiển thị trạng thái có healthcheck hợp lệ và thời điểm kiểm tra.

---

## 7. Bộ AI Gateway thống nhất cho NEXA

```text
Personal / Evaluator / Organization / Platform Admin
        │   [user action, submissionId/assessmentId/campaignId]
        ▼
API route: Auth + RBAC + tenant + owner + publication policy
        ▼
AI Job Service: dedupe/idempotency + entitlement + payer
        ▼
Credit Ledger: RESERVE (atomic)
        ▼
Data Context Builder (server trusted)
  ├─ scores, rubric, framework version, available published modules
  └─ PII minimization, attachment safety, untrusted text separation
        ▼
AI Task Registry + Prompt Version + Model Allowlist
        ▼
Provider adapter (Gemini FIRST; others only after tested)
        ▼
Strict schema validation + deterministic rubric score + grounded refs
        ▼
Store output and review status (DRAFT / PENDING_REVIEW)
        ▼
Credit Ledger: SETTLE on persisted success | RELEASE on fail
        ▼
Telemetry/Audit + UI response (job/status/result)
```

**Không cần RAG cho mọi call.** Khi rubric và kết quả đã có cấu trúc, server nạp trực tiếp vào prompt và chặn phạm vi. RAG chỉ nên bổ sung khi cần tìm học liệu dài, chính sách hoặc tri thức chưa có trong structured DB. Tools/MCP/agent tự hành động không cần thiết cho việc chấm bài và phân tích điểm trong giai đoạn đầu.

### Hợp đồng tác vụ khuyến nghị

| Tác vụ | Input client hợp lệ | Context bắt buộc từ server | Output lưu trữ | Người duyệt |
|---|---|---|---|---|
| `RUBRIC_GRADING` | submissionId, itemId | Text/evidence, rubric version, điểm phần khác, owner, trạng thái chấm | Tiêu chí / điểm gợi ý / dẫn chứng / flags, `DRAFT` | Người chấm có quyền |
| `COMPETENCY_ANALYSIS` | submissionId | Điểm công bố hợp lệ, 5 miền, framework version, learning content đã xuất bản | Strengths/gaps/path IDs/rationale | Người học xem; không sửa điểm |
| `ORG_INSIGHT` | campaignId / filter IDs | Aggregate thuộc đúng tenant, cỡ mẫu, điểm đã công bố | Summary / gap actions / course IDs / snapshot | Org Owner/Admin xem, xác nhận bước hành động |
| `AUTHORING_ASSIST` | assessmentId, itemId, action | Quyền editor, draft context, framework map, gói/quota | Question/rubric draft | Tác giả/biên tập viên |

### Job / status và idempotency

- `CREATED → RESERVED → RUNNING → VALIDATING → PERSISTED → SETTLED → COMPLETED`.
- Khi lỗi: `FAILED → RELEASED` hoặc `RECONCILIATION_REQUIRED` nếu chưa biết nhà cung cấp đã trừ chi phí chưa.
- `idempotency_key` xác định bởi người chi trả + tác vụ + input snapshot + version; retry và refresh không tự trừ credits lần nữa.
- `cached_result`: chỉ hit nếu source dataset, rubric/framework/prompt/version và quyền truy cập vẫn hợp lệ; bản AI draft thay đổi sau human review phải invalid cache khi nguồn đổi.
- Luồng lâu: dùng background job + polling/SSE khi thực sự cần; không bắt buộc livestream từng token cho kết quả yêu cầu JSON nguyên khối.

---

## 8. Cơ chế tính credits và kinh tế AI

| Ngữ cảnh | Người chi trả | Quy tắc |
|---|---|---|
| Personal tự chọn đề NEXA / tự yêu cầu phân tích | Tài khoản Personal | Hiển thị số dư, số credits mỗi tác vụ trước khi xác nhận; charge sau kết quả lưu thành công |
| Bài được giao trong campaign tổ chức | Entitlement tổ chức, **nếu hợp đồng/gói/campaign quy định** | Không tự trừ tài khoản cá nhân chỉ vì member đã đăng nhập Personal |
| Chấm trong bàn chấm Org | Tổ chức | Người chấm phải có quyền, không nhân bản charge do double click/timeout |
| AI biên soạn đề cá nhân | Người biên soạn Personal | Quota/gói theo quyền editor |
| AI biên soạn đề tổ chức | Tổ chức | Quota theo tenant và quyền biên soạn |
| AI biên soạn đề chuẩn Platform | Ngân sách vận hành nội bộ | Tách khỏi credits khách hàng, ghi telemetry `system` |

Admin cần **hai sổ riêng**: (1) Credit ledger sản phẩm: cấp/trừ/hoàn; (2) Provider cost ledger: chi phí đầu vào/đầu ra/cache/model/pricing version. Không đồng nhất 1 credit với USD nhà cung cấp; đơn giá nội bộ có thể chỉnh, không hồi tố lịch sử.

---

## 9. Chính sách an toàn học thuật và quyền dữ liệu

- Đầu ra AI là **gợi ý có thể sai**; Rubric validator ở server là bắt buộc và không bảo đảm model hiểu đúng nội dung chỉ vì JSON hợp lệ.
- Không để người làm bài xem trước đáp án/feedback AI khi bài chưa nộp hoặc đề của tổ chức chưa công bố.
- Không tự động cấp chứng nhận từ AI tự suy diễn về một bài làm chưa chấm đủ.
- Chấm điểm khách quan bằng code; chấm mở AI gợi ý; quyết định chính thức theo quyền người chấm và chính sách của kỳ đánh giá.
- Không cài camera/webcam, microphone hoặc giám sát thiết bị như điều kiện dùng AI.
- Với RAG/file: mỗi đoạn/tệp đều được kiểm quyền tenant trước khi lấy, nội dung không đáng tin không được điều khiển tool hoặc thay system prompt.
- Có thể cấp quyền yêu cầu xuất/sửa/xóa dữ liệu cá nhân phù hợp chính sách pháp lý; không lưu raw prompt full-text trong log đại trà nếu chứa chứng cứ riêng tư.
- Lưu model, prompt, rubric, khung năng lực, source hash, người duyệt và version để truy xuất lịch sử AI evaluation.

---

## 10. Thiết kế UI/UX “ít AI nhưng đúng chỗ”

- **Không dùng gradient AI, icon ✨ khắp trang.** Một action chính trên mỗi trạng thái.
- Mẫu trạng thái dùng chung: `Chưa tạo` · `Đang xử lý` · `Có gợi ý` · `Chờ rà soát` · `Đã áp dụng` · `Lỗi` · `Hết credits`.
- Số thực gồm `creditsRemaining`, `creditsPerRun`, `model/lastUpdated` chỉ hiện nếu lấy đúng dữ liệu và có nguồn.
- `Đã chấm` khác `Đã công bố`; `Chưa có dữ liệu` khác `0`.
- Feedback lỗi hiển thị theo người dùng (`AI bận`, `Chưa có đủ bài chấm`, `Hết credits`) và nút hợp lệ, không hiển thị stacktrace.
- AI lâu hiển thị tiến trình job thật và cho phép rời trang rồi quay lại xem, không tự dựng tiến trình % giả.
- Trên mobile Org grading: tab `Danh sách` · `Bài làm` · `Rubric` đã có, chỉ gắn panel gợi ý AI vào Rubric; không chèn thêm thanh trượt ngang phức tạp.
- Kết quả AI gắn trực tiếp vào nguồn tham chiếu `Đề số...`, `Kỹ năng 2.1`, `Chặng ...`, `Minh chứng` để người dùng xác minh.

---

## 11. Thiết kế dữ liệu bổ sung (đề xuất, không khẳng định bảng đã tồn tại)

```sql
-- Mô hình khái niệm; cần rà soát migrations và RLS trước khi viết DDL
ai_jobs(
  id, task_type, actor_user_id, organization_id, owner_scope,
  source_id, source_version_hash, idempotency_key,
  status, model_provider, model_name, model_version,
  prompt_version, framework_version_id, rubric_version_id,
  credit_payer_type, credit_payer_id, credit_reservation_id,
  output_ref_id, error_code, created_at, completed_at
)
ai_task_policies(
  task_type, enabled, supported_provider, model_id, price_credits,
  timeout_ms, max_retries, require_human_review, active_version
)
ai_evaluation_runs(
  id, task_type, source_id, output_json, validation_state,
  review_state, reviewer_user_id, reviewed_at, final_decision,
  source_hash, prompt_version, model_version
)
ai_usage_events( -- mở rộng bảng đã có
  ... model_price_version, provider_input_tokens, provider_output_tokens,
  cached_tokens, retry_count, request_id, invoice_cost_usd
)
```

Ưu tiên **tận dụng `ai_evaluations`, `competency_analyses`, `ai_usage_events`, quota ledger đang có** trước khi thêm bảng mới. Thiết kế bổ sung chỉ khi không thể đáp ứng bằng schema hiện hành và phải migration không phá lịch sử.

---

## 12. Kế hoạch triển khai ít rủi ro

| Thứ tự | Kết quả | Đầu việc |
|---|---|---|
| **P0 — Reliability** | Không ghi sai điểm, tính tiền sai, báo cáo giả | Sửa settle/insert trong competency API; server aggregate Org AI; giới hạn quyền authoring; khóa provider chưa hỗ trợ; phân biệt fallback; test credit + owner/tenant |
| **P1 — UX Consolidation** | Personal/Org dùng một hành vi thống nhất | Chốt entry points và 4 task; sửa Org rubric AI không auto apply; bỏ chia điểm tỷ lệ; panel Personal/Org mới, dùng status chuẩn; cache/idempotency |
| **P2 — Admin AI Control** | Theo dõi & điều phối thật | `AI Gateway` 5 tabs, policy registry, model allowlist, aggregated metrics, provider usage, cost/credits/retries và alert |
| **P3 — AI Quality** | Đo được chất lượng chấm/phân tích | Bộ gold sample, review disagreements, benchmark model, prompt version, source grounding/learning modules, có kiểm thử hồi quy trước release |
| **P4 — Optional** | Mở rộng có dữ liệu chứng minh nhu cầu | Provider thứ hai, asynchronous queue khi tải lớn, RAG học liệu, canary/fallback đã kiểm thử; không làm agent tự hành động khi chưa có yêu cầu |

Không đổi tên routes public hoặc xóa những nghiệp vụ đã có như góp ý, đề cộng đồng, ngân hàng đề chuẩn, gia hạn Business, Live Room. Không đưa chỉnh sửa code trực tiếp vào production trước khi kiểm thử.

---

## 13. Test cases / Definition of Done

1. Người dùng thiếu quyền authoring gọi `/api/ai/authoring-assist` → 403, không tiêu credits.
2. User Org A gọi Org B /ai-insights bằng slug/filter của Org B → 403, không gửi dữ liệu B vào model.
3. Org insights gửi `overallScore=100` từ frontend nhưng DB score thật khác → backend tính theo DB, không sử dụng 100.
4. Gọi hai request AI cùng idempotency key đồng thời → một job và một lượt trừ credits.
5. Model trả lỗi 429/503 → retry có trần; lỗi cuối cùng giải phóng reservation; không xuất kết quả giả danh LLM.
6. Model trả JSON sai hoặc evidenceQuote không tồn tại → reject hoặc cờ cần review, không ghi điểm final.
7. Result insert lỗi sau khi model chạy → không trả `success: true`; job có thể replay và xử lý credits.
8. Bài chưa chấm hết câu mở → tổng điểm/radar kết luận/chứng chỉ không bị tạo sớm.
9. Người chấm Org thấy gợi ý AI → rubric inputs không tự thay trước khi `Áp dụng`; phải chủ động duyệt.
10. Thay provider chưa có adapter → UI khóa và API từ chối cấu hình không hợp lệ.
11. Lịch sử AI usages theo 30 ngày >1.000 bản ghi → thống kê khớp SQL aggregate và không mất records.
12. Bản insight fallback deterministic → UI gắn nhãn đúng; cost AI = 0 cho lần không gọi model.
13. Đề chuẩn bị sửa rubric nhưng có submission cũ → kết quả cũ giữ phiên bản rubric và lịch sử chấm.
14. Payload file chứa prompt injection → không có quyền thực thi tool khác hoặc đọc tenant khác.
15. Credit từ Org campaign không trừ tài khoản Personal; khi mở Personal bài tự chọn thì trừ đúng ví.
16. Provider báo 1.000/500 tokens khác ước tính bằng ký tự → logger lưu số provider nếu có và ghi loại ước tính nếu không có.
17. Admin không có capability `OPERATE_AI` không được sửa model/budget hoặc tải nhật ký chi tiết.
18. Dữ liệu ít mẫu → Org AI không suy đoán “toàn bộ nhân sự”; UI có `n` và độ phủ.

---

## 14. Đối chiếu tài liệu AI 8 lớp người dùng cung cấp

Tài liệu tải lên mô tả **Model, System Prompt, RAG, Tools/MCP, Auth, Guardrails, Cache/Router, Monitoring/Eval** và các thực hành backend proxy, SSE, retry, structured outputs. Đây là kiến trúc tham khảo tốt nhưng không nên triển khai tất cả như các middleware bắt buộc nối tuyến tính.

- **Bắt buộc ngay:** auth/RBAC/tenant, backend proxy, task prompt theo phiên bản, schema validation, ledger/idempotency, đánh giá đầu ra, monitoring.
- **Theo tác vụ:** RAG (chỉ khi cần tìm tri thức dài), streaming (khi UX cần cập nhật tiến trình thực), tools/MCP (chỉ khi có hành động được quyền kiểm soát), provider routing (khi có adapter thứ hai).
- **Phát biểu cần hiệu chỉnh:** “tiết kiệm tới 80–90% nhờ caching” là mức mang tính tình huống, không bảo đảm cho mọi yêu cầu. AI prompt không thay quyền backend; JSON mode không thay validator; filter prompt injection không thể bảo đảm chặn mọi trường hợp.
- **Production-grade đối với NEXA:** do liên quan điểm đánh giá, nên bổ sung *rubric evidence validation, human approval, provenance, calibration bằng gold samples* — không được dừng ở “LLM trả JSON hợp lệ”.

---

## 15. Tài liệu tham khảo bên ngoài đã kiểm tra

1. [UNESCO — Guidance for generative AI in education and research](https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research) — định hướng người học và trách nhiệm của con người.
2. [NIST — AI Risk Management Framework, Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) — quản trị, đo lường và kiểm soát rủi ro.
3. [OWASP — Top 10 for LLM and GenAI](https://genai.owasp.org/initiatives/top-10-for-llm-and-genai/) — prompt injection, lộ dữ liệu, quản lý quyền và hành động của agent.
4. [Google Cloud — Deploy and operate generative AI applications](https://docs.cloud.google.com/architecture/deploy-operate-generative-ai-applications) — đánh giá định kỳ, ground dữ liệu và kiến trúc vận hành.
5. [Google Cloud — Agentic AI architecture components](https://docs.cloud.google.com/architecture/choose-agentic-ai-architecture-components) — chọn giải pháp đơn giản trước multi-agent.
6. [OpenAI — Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs) — schema đầu ra và xử lý refusal.
7. [OpenAI — Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices) — đo chất lượng thay vì tin prompt/model tự khai (lưu ý API Evals có kế hoạch thay đổi cuối 2026).
8. [Anthropic — Optimizing for cost and intelligence](https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence) — chọn model, cache và kiểm soát chi phí theo workload.
9. [EDUCAUSE — From Prompt to Practice: Transparent GenAI Use in Higher Education](https://er.educause.edu/articles/2026/3/from-prompt-to-practice-a-framework-for-transparent-genai-use-in-higher-education) — lưu phiên bản AI draft, chỉnh sửa và trách nhiệm người phê duyệt.
10. [Systematic review — Higher education assessments in the age of GenAI (2026)](https://link.springer.com/article/10.1186/s41239-026-00627-4) — năm nhóm vai trò của AI trong thiết kế bài, luyện tập, chấm, minh bạch học tập và phản hồi.

### Đường dẫn code cần review khi triển khai

- [AI rubric grading route](https://github.com/minhhuyzzz/nexa_AI/blob/main/src/app/api/ai/grade-submission/route.ts)
- [Personal AI analysis route](https://github.com/minhhuyzzz/nexa_AI/blob/main/src/app/api/ai/analyze-competency/route.ts)
- [Organization AI insights route](https://github.com/minhhuyzzz/nexa_AI/blob/main/src/app/api/org/%5Bslug%5D/analytics/ai-insights/route.ts)
- [AI Authoring route](https://github.com/minhhuyzzz/nexa_AI/blob/main/src/app/api/ai/authoring-assist/route.ts)
- [Provider adapters](https://github.com/minhhuyzzz/nexa_AI/blob/main/src/features/ai-gateway/adapters/index.ts)
- [AI usage logger](https://github.com/minhhuyzzz/nexa_AI/blob/main/src/features/ai-gateway/services/ai-usage-logger.service.ts)
- [AI configuration service](https://github.com/minhhuyzzz/nexa_AI/blob/main/src/features/ai-gateway/services/ai-config.service.ts)
- [Organization grading UI](https://github.com/minhhuyzzz/nexa_AI/blob/main/src/app/%28dashboard%29/org/%5Bslug%5D/grading/OrgGradingClientView.tsx)
- [Personal analysis UI](https://github.com/minhhuyzzz/nexa_AI/blob/main/src/app/%28dashboard%29/personal/competency/analysis/page.tsx)
- [Platform Admin AI Gateway UI](https://github.com/minhhuyzzz/nexa_AI/blob/main/src/app/%28dashboard%29/admin/ai-gateway/page.tsx)

---

**Đề xuất chốt:** *Một AI Gateway, bốn tác vụ AI được cấp quyền rõ ràng, một cơ chế credits, một quy trình đánh giá đầu ra và ba trải nghiệm theo vai trò.* Ưu tiên reliability + dữ liệu thật rồi mới redesign UI. Không xây lại sản phẩm chỉ để thêm AI.
