export const REWARD = {
  STATUS: {
    ACTIVE: {
      label: 'Đang hoạt động',
      value: 'active',
    },
    CLOSED: {
      label: 'Đã đóng',
      value: 'closed',
    },
  },

  EVENT_TYPE: {
    HOLIDAY: {
      label: 'Ngày lễ',
      value: 'holiday',
    },
    NEW_YEAR: {
      label: 'Tết Nguyên Đán',
      value: 'new_year',
    },
    MONTHLY: {
      label: 'Hàng tháng',
      value: 'monthly',
    },
    QUARTERLY: {
      label: 'Hàng quý',
      value: 'quarterly',
    },
    ACHIEVEMENT: {
      label: 'Thành tích',
      value: 'achievement',
    },
    SPECIAL: {
      label: 'Đặc biệt',
      value: 'special',
    },
    OTHER: {
      label: 'Khác',
      value: 'other',
    },
  },
} as const;
