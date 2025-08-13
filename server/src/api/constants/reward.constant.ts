export const REWARD = {
  DOCUMENT_NAME: 'Reward',
  COLLECTION_NAME: 'rewards',
  PREFIX: 'rw_',

  STATUS: {
    ACTIVE: 'active',
    CLOSED: 'closed',
  },

  EVENT_TYPE: {
    HOLIDAY: 'holiday',
    NEW_YEAR: 'new_year',
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
    ACHIEVEMENT: 'achievement',
    SPECIAL: 'special',
    OTHER: 'other',
  },
} as const;
