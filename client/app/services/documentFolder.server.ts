import { ISessionUser } from '~/interfaces/auth.interface';
import { fetcher } from '.';
import { IListResponse } from '~/interfaces/response.interface';
import {
  IDocumentFolder,
  IDocumentFolderCreate,
  IDocumentFolderUpdate,
} from '~/interfaces/documentFolder.interface';

/**
 * Get all document-folders with pagination and filtering
 */
const getDocumentFolders = async (
  searchParams: URLSearchParams,
  request: ISessionUser,
) => {
  const response = await fetcher<IListResponse<IDocumentFolder>>(
    `/document-folders?${searchParams.toString()}`,
    { request },
  );
  return response;
};

/**
 * Get a specific document folder by ID
 */
const getDocumentFolderById = async (id: string, request: ISessionUser) => {
  const response = await fetcher<IDocumentFolder>(`/document-folders/${id}`, {
    request,
  });
  return response;
};

/**
 * Create a new document folder
 */
const createDocumentFolder = (
  data: IDocumentFolderCreate,
  request: ISessionUser,
) => {
  return fetcher<IDocumentFolder[]>('/document-folders', {
    method: 'POST',
    body: JSON.stringify(data),
    request,
  });
};

/**
 * Update document folder metadata
 */
const updateDocumentFolder = async (
  id: string,
  data: IDocumentFolderUpdate,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<IDocumentFolder>(`/document-folders/${id}`, {
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
const deleteDocumentFolder = async (
  documentId: string,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<any>(`/document-folders/${documentId}`, {
      method: 'DELETE',
      request,
    });
    return response as { success: boolean; message: string };
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

const bulkDeleteDocumentFolder = async (
  folderIds: string[],
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<any>(`/document-folders/bulk`, {
      method: 'DELETE',
      body: JSON.stringify({ folderIds }),
      request,
    });
    return response as { success: boolean; message: string };
  } catch (error) {
    console.error('Error deleting document folders:', error);
    throw error;
  }
};

export {
  createDocumentFolder,
  getDocumentFolders,
  getDocumentFolderById,
  updateDocumentFolder,
  deleteDocumentFolder,
  bulkDeleteDocumentFolder,
};
