export const CUSTOMER = {
  DOCUMENT_NAME: 'Customer',
  COLLECTION_NAME: 'customers',
  PREFIX: 'cus_',
  SEX: {
    MALE: { label: 'Nam', value: 'male' },
    FEMALE: { label: 'Nữ', value: 'female' },
  },
  STATUS: {
    ACTIVE: { label: 'Kích hoạt', value: 'active' },
    INACTIVE: { label: 'Không kích hoạt', value: 'inactive' },
    PENDING: { label: 'Đang chờ', value: 'pending' },
    BLOCKED: { label: 'Bị chặn', value: 'blocked' },
  },
  CONTACT_CHANNEL: {
    PHONE: {
      label: 'Số điện thoại',
      value: 'phone',
    },
    EMAIL: {
      label: 'Email',
      value: 'email',
    },
    IN_PERSON: {
      label: 'Trực tiếp',
      value: 'in_person',
    },
    FACEBOOK: {
      label: 'Facebook',
      value: 'facebook',
    },
    ZALO: {
      label: 'Zalo',
      value: 'zalo',
    },
    OTHER: {
      label: 'Khác',
      value: 'other',
    },
  },
  SOURCE: {
    WEBSITE: {
      value: 'website',
      label: 'Website',
    },
    FACEBOOK: {
      value: 'facebook',
      label: 'Facebook',
    },
    ZALO: {
      value: 'zalo',
      label: 'Zalo',
    },
    SOCIAL_MEDIA: {
      value: 'social_media',
      label: 'Mạng xã hội',
    },
    REFERRAL: {
      value: 'referral',
      label: 'Giới thiệu',
    },
    ADVERTISEMENT: {
      value: 'advertisement',
      label: 'Quảng cáo',
    },
    EVENT: {
      value: 'event',
      label: 'Sự kiện',
    },
    OTHER: {
      value: 'other',
      label: 'Khác',
    },
  },
} as const;
