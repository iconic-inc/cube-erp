export const CASE_SERVICE = {
  DOCUMENT_NAME: 'CaseService',
  COLLECTION_NAME: 'case_services',
  PREFIX: 'case_',
  STATUS: {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CLOSED: 'closed',
  },
} as const;
