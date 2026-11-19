import { createAdminClient } from '@/lib/supabase/admin';

export interface CouponRule {
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number; // Tỷ lệ % (ví dụ: 20) hoặc số tiền VND cố định (ví dụ: 20000)
  description: string;
  isActive: boolean;
  minOrderAmount?: number;
}

// Các mã giảm giá mặc định của hệ thống
export const DEFAULT_COUPONS: CouponRule[] = [
  {
    code: 'NEXA20',
    type: 'PERCENT',
    value: 20,
    description: 'Giảm 20% giá trị đơn hàng',
    isActive: true,
  },
  {
    code: 'CHAOBAN',
    type: 'FIXED',
    value: 10000,
    description: 'Giảm 10.000 đ cho thành viên mới',
    isActive: true,
    minOrderAmount: 40000,
  },
  {
    code: 'TRIAN',
    type: 'FIXED',
    value: 30000,
    description: 'Giảm 30.000 đ tri ân người học',
    isActive: true,
    minOrderAmount: 100000,
  },
  {
    code: 'PROMO10',
    type: 'PERCENT',
    value: 10,
    description: 'Giảm 10% khuyến mãi đặc biệt',
    isActive: true,
  },
];

export class CouponService {
  /**
   * Lấy danh sách quy tắc mã giảm giá từ database (system_settings) hoặc fallback mặc định
   */
  static async getAllCoupons(): Promise<CouponRule[]> {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'discount_coupons')
        .maybeSingle();

      if (data?.value && Array.isArray(data.value)) {
        return data.value as CouponRule[];
      }
    } catch {
      // Fallback nếu chưa cấu hình DB
    }
    return DEFAULT_COUPONS;
  }

  /**
   * Xác thực và tính toán số tiền giảm
   */
  static async validate(
    rawCode: string,
    currentAmount: number
  ): Promise<{
    valid: boolean;
    code: string;
    discountAmount: number;
    finalAmount: number;
    message: string;
  }> {
    const cleanCode = (rawCode || '').trim().toUpperCase();
    if (!cleanCode) {
      return {
        valid: false,
        code: '',
        discountAmount: 0,
        finalAmount: currentAmount,
        message: 'Vui lòng nhập mã giảm giá',
      };
    }

    const coupons = await this.getAllCoupons();
    const coupon = coupons.find(
      (c) => c.code.toUpperCase() === cleanCode && c.isActive !== false
    );

    if (!coupon) {
      return {
        valid: false,
        code: cleanCode,
        discountAmount: 0,
        finalAmount: currentAmount,
        message: 'Mã giảm giá không tồn tại hoặc đã hết hạn',
      };
    }

    if (coupon.minOrderAmount && currentAmount < coupon.minOrderAmount) {
      return {
        valid: false,
        code: cleanCode,
        discountAmount: 0,
        finalAmount: currentAmount,
        message: `Đơn hàng tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')} đ để áp dụng mã này`,
      };
    }

    let discount = 0;
    if (coupon.type === 'PERCENT') {
      discount = Math.round((currentAmount * coupon.value) / 100);
    } else {
      discount = coupon.value;
    }

    // Không giảm quá giá trị đơn hàng
    discount = Math.min(discount, currentAmount - 1000); // Giữ tối thiểu 1.000đ cho cổng payOS xử lý
    if (discount < 0) discount = 0;

    const finalAmount = Math.max(1000, currentAmount - discount);

    return {
      valid: true,
      code: coupon.code,
      discountAmount: discount,
      finalAmount,
      message: `Áp dụng thành công: ${coupon.description}`,
    };
  }
}
