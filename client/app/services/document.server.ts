import { ISessionUser } from '~/interfaces/auth.interface';
import { fetcher } from '.';
import { IListResponse } from '~/interfaces/response.interface';
import {
  IDocument,
  IDocumentUpdate,
  IAccessRightsUpdate,
} from '~/interfaces/document.interface';

/**
 * Get all documents with pagination and filtering
 */
const getDocuments = async (
  searchParams: URLSearchParams,
  request: ISessionUser,
) => {
  const response = await fetcher<IListResponse<IDocument>>(
    `/documents?${searchParams.toString()}`,
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
  return fetcher<IDocument[]>('/documents', {
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

export {
  getDocuments,
  getDocumentById,
  uploadDocument,
  updateDocument,
  deleteDocument,
  deleteMultipleDocuments,
  updateAccessRights,
};
