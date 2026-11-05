# HƯỚNG DẪN TÍCH HỢP AI VÀO HỆ THỐNG PHẦN MỀM
*(AI Integration & 8-Layer Architecture Technical Guide)*

---

## 1. TỔNG QUAN

Tích hợp AI (đặc biệt là các mô hình ngôn ngữ lớn - LLM) vào hệ thống phần mềm không đơn thuần là việc gọi một API và hiển thị văn bản trả về. Trong môi trường sản phẩm thực tế (Production), một hệ thống AI hoàn chỉnh đòi hỏi kiến trúc nhiều lớp để đảm bảo tính **bảo mật, độ tin cậy, hiệu năng cao và chi phí tối ưu**.

Tài liệu này tổng hợp kiến trúc tích hợp AI chuẩn hóa gồm **8 lớp hạ tầng** cùng các nguyên tắc kỹ thuật cốt lõi cho lập trình viên và hệ thống AI Agent.

---

## 2. MÔ HÌNH KIẾN TRÚC AI 8 LỚP (8-LAYER AI ARCHITECTURE)

Trong quá trình phát triển ứng dụng AI, mỗi lớp dưới đây được sinh ra nhằm giải quyết một sự cố hoặc hạn chế cụ thể của lớp liền trước:

```
[User Request] 
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 5: Phân quyền (Authentication & Authorization)    │
├─────────────────────────────────────────────────────────┤
│ Layer 6: Rào chắn (Guardrails & Prompt Injection Filter)│
├─────────────────────────────────────────────────────────┤
│ Layer 7: Cache & Router (Prompt Cache & Model Routing)  │
├─────────────────────────────────────────────────────────┤
│ Layer 3: RAG (Retrieval-Augmented Generation)           │
├─────────────────────────────────────────────────────────┤
│ Layer 2: System Prompt (Nhiệm vụ & Quy tắc)             │
├─────────────────────────────────────────────────────────┤
│ Layer 1: Model Layer (LLM Core Engine)                  │
├─────────────────────────────────────────────────────────┤
│ Layer 4: Tools / MCP (Function Calling & System Actions)│
├─────────────────────────────────────────────────────────┤
│ Layer 8: Giám sát & Đánh giá (Monitoring & Eval/Logging)│
└─────────────────────────────────────────────────────────┘
      │
      ▼
[Structured Response / Stream to Client]
```

### 1. Model Layer (Lớp Mô hình AI)
* **Bản chất**: Lớp lõi chứa các mô hình trí tuệ nhân tạo (OpenAI, Anthropic Claude, Gemini, hoặc mô hình Open-source tự host như Llama, Qwen).
* **Vai trò**: Tiếp nhận Prompt và sinh ra phản hồi dựa trên xác suất ngôn ngữ.
* **Sự cố của lớp này**: Chỉ sử dụng Model thuần túy dễ dẫn đến câu trả lời lan man, sai định dạng và không tuân thủ quy tắc sản phẩm.

### 2. System Prompt Layer (Lớp Lệnh Hệ thống)
* **Bản chất**: Thiết lập khung ngữ cảnh, định hình vai trò (Persona), quy tắc ứng xử, định dạng đầu ra và các ranh giới cho AI.
* **Vai trò**: Ép AI hoạt động đúng chức năng chuyên biệt (ví dụ: "Bạn là chuyên gia phân tích dữ liệu...").
* **Sự cố của lớp này**: AI chỉ có tri thức đóng đóng gói trong dữ liệu huấn luyện ban đầu, không truy cập được dữ liệu nội bộ/thời gian thực và dễ sinh ra hiện tượng ảo giác (Hallucination).

### 3. RAG Layer (Retrieval-Augmented Generation - Lớp Tri thức Bổ trợ)
* **Bản chất**: Hệ thống tìm kiếm ngữ nghĩa (Semantic Search / Vector Database) để trích xuất văn bản nội bộ và đính kèm vào Prompt trước khi gửi tới Model.
* **Vai trò**: Cung cấp tri thức chuẩn xác, có nguồn gốc rõ ràng cho AI mà không cần huấn luyện lại (Fine-tune) mô hình.
* **Sự cố của lớp này**: AI biết thông tin nhưng chỉ trả lời thụ động bằng văn bản, không thể chủ động thực hiện hành động hoặc gọi lệnh hệ thống.

### 4. Tools / MCP Layer (Model Context Protocol & Function Calling - Lớp Công cụ)
* **Bản chất**: Cho phép AI gọi các hàm hệ thống (API, thao tác CSDL, gửi email, kích hoạt Webhook) dựa trên ý định người dùng.
* **Vai trò**: Biến AI từ một "Chatbot trả lời văn bản" thành một "AI Agent có khả năng thực thi tác vụ".
* **Sự cố của lớp này**: Bất kỳ người dùng nào cũng có thể gọi AI và kích hoạt các công cụ nguy hiểm nếu không có cơ chế kiểm soát truy cập.

### 5. Authentication & Authorization Layer (Lớp Phân quyền)
* **Bản chất**: Xác thực danh tính (JWT, Session) và kiểm tra quyền hạn (Role-based Access Control - RBAC) của người dùng ở Backend Proxy trước khi chuyển yêu cầu tới AI.
* **Vai trò**: Đảm bảo người dùng chỉ được truy cập dữ liệu và công cụ trong phạm vi cho phép.
* **Sự cố của lớp này**: Kẻ tấn công có thể chèn các câu lệnh tinh vi (Prompt Injection) để đánh lừa AI bỏ qua phân quyền hoặc tiết lộ dữ liệu nhạy cảm.

### 6. Guardrails Layer (Lớp Rào chắn An toàn)
* **Bản chất**: Bộ lọc kiểm tra an toàn 2 chiều (Input Guardrails & Output Guardrails).
* **Vai trò**:
  * *Đầu vào*: Lọc các câu lệnh Prompt Injection, câu hỏi độc hại, kiểm tra độ dài văn bản.
  * *Đầu ra*: Lọc thông tin nhạy cảm (PII), đảm bảo câu trả lời không vi phạm tiêu chuẩn cộng đồng hoặc quy tắc an toàn.
* **Sự cố của lớp này**: Chi phí gọi API gia tăng nhanh chóng và độ trễ cao khi hệ thống mở rộng quy mô.

### 7. Cache & Router Layer (Lớp Định tuyến & Bộ nhớ đệm)
* **Bản chất**: 
  * **Prompt Caching**: Lưu bộ nhớ đệm cho các đoạn System Prompt hoặc ngữ cảnh RAG cố định để tiết kiệm tới 80-90% chi phí Token.
  * **Model Router**: Tự động chuyển hướng yêu cầu (ví dụ: dùng mô hình nhỏ/rẻ cho tác vụ đơn giản, dùng mô hình lớn cho phân tích phức tạp) hoặc fallback sang mô hình phụ khi mô hình chính gặp sự cố.
* **Sự cố của lớp này**: Không biết hệ thống đang hoạt động ra sao, độ chính xác thế nào và chi phí thực tế phát sinh bao nhiêu.

### 8. Monitoring & Eval Layer (Lớp Giám sát & Đánh giá)
* **Bản chất**: Hệ thống ghi log, đếm token, đo độ trễ (Latency), theo dõi tỷ lệ lỗi và đánh giá chất lượng câu trả lời (Evaluation Pipeline / Human-in-the-loop).
* **Vai trò**: Cung cấp chỉ số để liên tục cải tiến System Prompt, phát hiện sự cố và duy trì độ ổn định của toàn hệ thống.

---

## 3. NGUYÊN TẮC KỸ THUẬT CỐT LÕI KHI TÍCH HỢP AI API

### 3.1. Bảo mật API Key & Kiến trúc Backend Proxy
* **Không bao giờ lộ API Key**: Tuyệt đối không nhúng API Key ở mã nguồn Frontend (React, Mobile App).
* **Mô hình Backend Proxy**: 
  $$\text{Client (UI)} \xrightarrow{\text{JWT / Session}} \text{Backend Proxy} \xrightarrow{\text{Secret API Key}} \text{LLM Provider (OpenAI/Anthropic/Gemini)}$$
* Backend Proxy đảm nhận vai trò:
  * Kiểm tra hạn mức (Rate Limiting).
  * Giấu chìa khóa API.
  * Kiểm soát chi phí và ghi log.

### 3.2. Xử lý Streaming Response (Server-Sent Events)
* **Vấn đề**: Các bài phân tích hoặc câu trả lời dài từ LLM có thể mất từ 5 - 15 giây để hoàn thành, dễ gây ra hiện tượng HTTP Timeout hoặc trải nghiệm người dùng bị đứt đoạn.
* **Giải pháp**: Áp dụng cơ chế **Streaming (SSE - Server-Sent Events)** để đẩy dữ liệu từng phần (chunks) về Frontend ngay khi AI vừa tạo ra, giúp hiển thị phản hồi tức thì cho người dùng.

### 3.3. Quản lý Context & Trạng thái (Statelessness)
* **Bản chất API**: Hầu hết các API LLM đều không lưu trạng thái (Stateless). Mỗi lượt gọi là một phiên làm việc độc lập.
* **Quản lý bộ nhớ**:
  * Backend Proxy chịu trách nhiệm lưu trữ lịch sử hội thoại vào CSDL.
  * Khi gửi yêu cầu mới, Backend tự động đính kèm lịch sử câu hỏi liên quan.
  * Áp dụng kỹ thuật **Cắt tỉa (Pruning)** hoặc **Tóm tắt (Summarization)** lịch sử cũ để kiểm soát độ dài Context Window và tối ưu chi phí token.

### 3.4. Quản lý Lỗi & Cơ chế Thử lại (Error Handling & Retry)
* **Phân loại lỗi**:
  * Lỗi `4xx` (Bad Request, Unauthorized): Lỗi do cấu hình hoặc dữ liệu gửi đi sai $\rightarrow$ Không retry, trả lỗi ngay cho client.
  * Lỗi `429` (Rate Limit) hoặc `5xx` (Server Overload từ phía nhà cung cấp AI) $\rightarrow$ Áp dụng cơ chế **Thử lại tự động (Retry)**.
* **Chiến lược Retry**: Sử dụng thuật toán **Exponential Backoff** (tăng thời gian chờ theo cấp số nhân) kết hợp với **Jitter** (độ trễ ngẫu nhiên) để tránh gây nghẽn hệ thống.

### 3.5. Trả về Dữ liệu có Cấu trúc (Structured Outputs & JSON Schema)
* Khi cần tích hợp phản hồi của AI vào logic phần mềm (như ghi CSDL, vẽ biểu đồ, kích hoạt giao diện), bắt buộc yêu cầu AI trả về định dạng **JSON** có cấu trúc rõ ràng.
* Sử dụng thuộc tính `response_format: { type: "json_object" }` hoặc **JSON Schema / Function Calling** để đảm bảo dữ liệu đầu ra luôn tuân thủ đúng kiểu dữ liệu (Data Types) mà hệ thống yêu cầu.

---

## 4. TÓM TẮT LUỒNG XỬ LÝ MỘT YÊU CẦU (REQUEST PIPELINE)

```
[1. User nhập yêu cầu]
          │
          ▼
[2. Backend Proxy xác thực user & kiểm tra Rate Limit]
          │
          ▼
[3. Guardrails lọc Prompt Injection & câu lệnh độc hại]
          │
          ▼
[4. RAG trích xuất tri thức bổ sung từ Vector DB]
          │
          ▼
[5. Ghép System Prompt + Ngữ cảnh RAG + Lịch sử hội thoại]
          │
          ▼
[6. Router chọn Mô hình AI phù hợp & kiểm tra Prompt Cache]
          │
          ▼
[7. Gọi LLM API (Nhận phản hồi dạng Stream / Structured JSON)]
          │
          ▼
[8. Monitoring ghi log Token, Latency & đánh giá phản hồi]
          │
          ▼
[9. Trả kết quả về cho Client UI]
```
