export const TRANSACTION = {
  DOCUMENT_NAME: 'Transaction',
  COLLECTION_NAME: 'transactions',
  PREFIX: 'tx_',
  TYPE: {
    INCOME: 'income',
    OUTCOME: 'outcome',
  },
  PAYMENT_METHOD: {
    CASH: 'cash', // Tiền mặt
    BANK_TRANSFER: 'bank_transfer', // Chuyển khoản ngân hàng
    CREDIT_CARD: 'credit_card', // Thẻ tín dụng
    MOBILE_PAYMENT: 'mobile_payment', // Thanh toán di động (Momo, ZaloPay, v.v.)
    OTHER: 'other', // Phương thức khác
  },
  CATEGORY: {
    INCOME: {
      CONSULTATION_FEE: 'consultation_fee', // Phí tư vấn
      CASE_HANDLING_FEE: 'case_handling_fee', // Phí xử lý hồ sơ
      RETAINER_FEE: 'retainer_fee', // Phí giữ chân luật sư
      SUCCESS_BONUS: 'success_bonus', // Phí thành công vụ việc
      DOCUMENT_DRAFTING: 'document_drafting', // Phí soạn thảo văn bản
      INSTALLMENT_PAYMENT: 'installment_payment', // Thu tiền trả góp từ khách hàng
      OTHER: 'other_income', // Khác
    },

    // Outcome categories
    OUTCOME: {
      STAFF_SALARY: 'staff_salary', // Lương nhân viên
      INCIDENTAL_EXPENSE: 'incidental_expense', // Chi phí phát sinh
      OPERATIONAL_EXPENSE: 'operational_expense', // Chi phí vận hành
      OFFICE_RENT: 'office_rent', // Tiền thuê văn phòng
      UTILITIES: 'utilities', // Điện nước, internet
      MARKETING: 'marketing', // Quảng cáo, tiếp thị
      TAX: 'tax', // Thuế
      TAX_PAYMENT: 'tax_payment', // Thanh toán thuế cho hồ sơ vụ việc
      EQUIPMENT: 'equipment', // Mua sắm thiết bị
      TRAINING_EXPENSE: 'training_expense', // Chi phí đào tạo
      REWARD: 'reward', // Thưởng
      COMMISSION_PAYMENT: 'commission_payment', // Thanh toán hoa hồng cho nhân viên
      OTHER: 'other_outcome', // Khác
    },
  },
} as const;
