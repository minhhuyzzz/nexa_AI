/**
 * Chuyển đổi toàn bộ thông báo lỗi từ Supabase Auth sang Tiếng Việt thân thiện, rõ ràng.
 */
export function translateAuthError(msg?: string | null): string {
  if (!msg) return 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
  const lower = msg.toLowerCase();

  // 1. Password complexity / policy
  if (
    lower.includes('password should contain') ||
    lower.includes('password should contain at least') ||
    lower.includes('password must contain')
  ) {
    return 'Mật khẩu cần kết hợp chữ thường và số (tối thiểu 6 ký tự).';
  }
  if (
    lower.includes('password should be at least') ||
    lower.includes('password is too short') ||
    lower.includes('least 6 characters')
  ) {
    return 'Mật khẩu cần có độ dài tối thiểu từ 6 ký tự trở lên.';
  }

  // 2. Existing user / duplicate
  if (
    lower.includes('already registered') ||
    lower.includes('user already exists') ||
    lower.includes('email already in use')
  ) {
    return 'Địa chỉ email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.';
  }
  if (
    lower.includes('database error saving new user') ||
    lower.includes('duplicate key') ||
    lower.includes('unique constraint')
  ) {
    return 'Biệt danh này đã có người sử dụng. Vui lòng chọn biệt danh khác.';
  }

  // 3. Invalid credentials
  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid credentials') ||
    lower.includes('wrong password')
  ) {
    return 'Địa chỉ email hoặc mật khẩu không chính xác.';
  }

  // 4. Email validation
  if (
    lower.includes('invalid email') ||
    lower.includes('unable to validate email') ||
    lower.includes('valid email address')
  ) {
    return 'Địa chỉ email không đúng định dạng. Vui lòng kiểm tra lại.';
  }

  // 5. Rate limiting / Too many attempts
  if (
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('over_email_send_rate_limit')
  ) {
    return 'Bạn đã gửi yêu cầu quá nhiều lần. Vui lòng chờ 1 - 2 phút rồi thử lại.';
  }

  // 6. Email not confirmed
  if (lower.includes('email not confirmed') || lower.includes('unconfirmed email')) {
    return 'Tài khoản chưa được kích hoạt qua email. Vui lòng kiểm tra hộp thư của bạn.';
  }

  // 7. Signup disabled
  if (lower.includes('signup is disabled') || lower.includes('signups not allowed')) {
    return 'Tính năng tạo tài khoản mới tạm thời đang được bảo trì.';
  }

  // 8. Network / Server error
  if (lower.includes('network') || lower.includes('fetch failed') || lower.includes('failed to fetch')) {
    return 'Lỗi kết nối máy chủ. Vui lòng kiểm tra lại đường truyền Internet.';
  }

  return msg;
}
