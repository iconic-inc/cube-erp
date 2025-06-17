export const CUSTOMER = {
  DOCUMENT_NAME: 'Customer',
  COLLECTION_NAME: 'customers',
  PREFIX: 'cus_',
  SEX: {
    MALE: 'male',
    FEMALE: 'female',
  },
  STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PENDING: 'pending',
    BLOCKED: 'blocked',
  },
} as const;
