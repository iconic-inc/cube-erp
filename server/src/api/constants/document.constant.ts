export const DOCUMENT = {
  DOCUMENT_NAME: 'Document',
  COLLECTION_NAME: 'documents',
  PREFIX: 'doc_',
  STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
  },
  TYPE: {
    CONTRACT: 'contract',
    INVOICE: 'invoice',
    REPORT: 'report',
    OTHER: 'other',
  },
} as const;
