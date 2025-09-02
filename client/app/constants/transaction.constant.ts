export const TRANSACTION = {
  TYPE: {
    income: {
      value: 'income',
      label: 'Thu',
      className: 'bg-green-600 text-white',
    },
    outcome: {
      value: 'outcome',
      label: 'Chi',
      className: 'bg-yellow-600 text-white',
    },
  },
  PAYMENT_METHOD: {
    CASH: { value: 'cash', label: 'Tiền mặt' },
    BANK_TRANSFER: { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng' },
    CREDIT_CARD: { value: 'credit_card', label: 'Thẻ tín dụng' },
    MOBILE_PAYMENT: {
      value: 'mobile_payment',
      label: 'Thanh toán di động (Momo, ZaloPay, v.v.)',
    },
    OTHER: { value: 'other', label: 'Phương thức khác' },
  },
  CATEGORY: {
    income: {
      CONSULTATION_FEE: { value: 'consultation_fee', label: 'Phí tư vấn' },
      CASE_HANDLING_FEE: {
        value: 'case_handling_fee',
        label: 'Phí xử lý hồ sơ',
      },
      RETAINER_FEE: { value: 'retainer_fee', label: 'Phí giữ chân luật sư' },
      SUCCESS_BONUS: {
        value: 'success_bonus',
        label: 'Phí thành công vụ việc',
      },
      DOCUMENT_DRAFTING: {
        value: 'document_drafting',
        label: 'Phí soạn thảo văn bản',
      },
      INSTALLMENT_PAYMENT: {
        value: 'installment_payment',
        label: 'Thu tiền trả góp từ khách hàng',
      },
      OTHER: { value: 'other_income', label: 'Khác' },
    },

    // Outcome categories
    outcome: {
      STAFF_SALARY: { value: 'staff_salary', label: 'Lương nhân viên' },
      INCIDENTAL_EXPENSE: {
        value: 'incidental_expense',
        label: 'Chi phí phát sinh',
      },
      OFFICE_RENT: { value: 'office_rent', label: 'Tiền thuê văn phòng' },
      UTILITIES: { value: 'utilities', label: 'Điện nước, internet' },
      MARKETING: { value: 'marketing', label: 'Quảng cáo, tiếp thị' },
      TAX: { value: 'tax', label: 'Thuế' },
      EQUIPMENT: { value: 'equipment', label: 'Mua sắm thiết bị' },
      TRAINING_EXPENSE: { value: 'training_expense', label: 'Chi phí đào tạo' },
      REWARD: { value: 'reward', label: 'Thưởng' },
      FOOD: { value: 'food', label: 'Chi phí ăn uống' },
      TRAVEL_EXPENSE: { value: 'travel_expense', label: 'Chi phí công tác' },
      OPERATIONAL_EXPENSE: {
        value: 'operational_expense',
        label: 'Chi phí vận hành',
      },
      TAX_PAYMENT: {
        value: 'tax_payment',
        label: 'Thanh toán thuế cho hồ sơ vụ việc',
      },
      COMMISSION_PAYMENT: {
        value: 'commission_payment',
        label: 'Thanh toán hoa hồng cho nhân viên',
      },
      OTHER: { value: 'other_outcome', label: 'Khác' },
    },
  },
} as const;
