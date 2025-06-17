import { ISessionUser } from '~/interfaces/auth.interface';
import { fetcher } from '.';
import { IPaginationOptions } from '~/interfaces/request.interface';
import { IListResponse } from '~/interfaces/response.interface';
import {
  IDocument,
  IDocumentCreate,
  IDocumentUpdate,
  IAccessRightsUpdate,
  IDocumentFilter,
} from '~/interfaces/document.interface';

/**
 * Get all documents with pagination and filtering
 */
const getDocuments = async (
  query: any = {},
  options: IPaginationOptions = {},
  request: ISessionUser,
) => {
  const { page = 1, limit = 10, sortBy, sortOrder } = options;

  const searchParams = new URLSearchParams(query);
  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);
  searchParams.set('page', String(page));
  searchParams.set('limit', String(limit));

  const response = await fetcher<IListResponse<IDocument>>(
    `/documents?${searchParams.toString()}`,
    { request },
  );
  return response;
};

/**
 * Get all documents for a specific case
 */
const getDocumentsByCase = async (
  caseId: string,
  options: IPaginationOptions = {},
  request: ISessionUser,
) => {
  const { page = 1, limit = 10, sortBy, sortOrder } = options;

  const searchParams = new URLSearchParams();
  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);
  searchParams.set('page', String(page));
  searchParams.set('limit', String(limit));

  const response = await fetcher<IListResponse<IDocument>>(
    `/documents/case/${caseId}?${searchParams.toString()}`,
    { request },
  );
  return response;
};

/**
 * Get document by ID
 */
const getDocumentById = async (id: string, request: ISessionUser) => {
  const response = await fetcher<IDocument>(`/documents/${id}`, {
    request,
  });
  return response;
};

/**
 * Upload a new document
 * Note: This uses FormData for file upload, which is different from the JSON approach
 */
const uploadDocument = (data: FormData, request: ISessionUser) => {
  return fetcher<IDocument>('/documents', {
    method: 'POST',
    body: data,
    request,
  });
};

/**
 * Update document metadata
 */
const updateDocument = async (
  id: string,
  data: IDocumentUpdate,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<IDocument>(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      request,
    });
    return response;
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

/**
 * Delete a document
 */
const deleteDocument = async (documentId: string, request: ISessionUser) => {
  try {
    const response = await fetcher<any>(`/documents/${documentId}`, {
      method: 'DELETE',
      request,
    });
    return response as { success: boolean; message: string };
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// delete multiple documents
const deleteMultipleDocuments = async (
  documentIds: string[],
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<any>('/documents/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ documentIds }),
      request,
    });
    return response as { success: boolean; message: string };
  } catch (error) {
    console.error('Error deleting multiple documents:', error);
    throw error;
  }
};

/**
 * Detach document from a case
 */
const detachFromCase = async (
  documentId: string,
  caseId: string,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<any>(
      `/documents/${documentId}/case/${caseId}`,
      {
        method: 'DELETE',
        request,
      },
    );
    return response as { success: boolean; message: string };
  } catch (error) {
    console.error('Error detaching document from case:', error);
    throw error;
  }
};

/**
 * Update document access permissions
 */
const updateAccessRights = async (
  documentId: string,
  accessRights: IAccessRightsUpdate,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<IDocument>(
      `/documents/${documentId}/access`,
      {
        method: 'PUT',
        body: JSON.stringify(accessRights),
        request,
      },
    );
    return response;
  } catch (error) {
    console.error('Error updating document access rights:', error);
    throw error;
  }
};

/**
 * Filter documents by different criteria
 */
const filterDocuments = async (
  filter: IDocumentFilter,
  options: IPaginationOptions = {},
  request: ISessionUser,
) => {
  const { page = 1, limit = 10, sortBy, sortOrder } = options;

  const searchParams = new URLSearchParams();
  if (filter.search) searchParams.set('search', filter.search);
  if (filter.type) searchParams.set('type', filter.type);
  if (filter.startDate) searchParams.set('startDate', filter.startDate);
  if (filter.endDate) searchParams.set('endDate', filter.endDate);
  if (filter.createdBy) searchParams.set('createdBy', filter.createdBy);

  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);
  searchParams.set('page', String(page));
  searchParams.set('limit', String(limit));

  const response = await fetcher<IListResponse<IDocument>>(
    `/documents/filter?${searchParams.toString()}`,
    { request },
  );
  return response;
};

/**
 * Download a document (returns a URL to download the file)
 * Note: This function assumes there's a download endpoint available
 */
const getDocumentDownloadUrl = (documentId: string, token: string) => {
  return `/api/v1/documents/${documentId}/download?token=${token}`;
};

export {
  getDocuments,
  getDocumentsByCase,
  getDocumentById,
  uploadDocument,
  updateDocument,
  deleteDocument,
  deleteMultipleDocuments,
  detachFromCase,
  updateAccessRights,
  getDocumentDownloadUrl,
  filterDocuments,
};
