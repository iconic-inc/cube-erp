export const USER = {
  DOCUMENT_NAME: 'User',
  COLLECTION_NAME: 'users',
  PREFIX: 'usr_',
  STATUS: {
    ACTIVE: 'active',
    PENDING: 'pending',
    DELETED: 'deleted',
  },
  SEX: {
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other',
  },
  EMPLOYEE: {
    PREFIX: 'emp_',
    DOCUMENT_NAME: 'Employee',
    COLLECTION_NAME: 'employees',
  },
} as const;
