import { ISessionUser } from '~/interfaces/auth.interface';
import { fetcher } from '.';
import { IListResponse } from '~/interfaces/response.interface';
import {
  ICaseDocument,
  ICaseService,
  ICaseServiceCreate,
  ICaseServiceUpdate,
} from '~/interfaces/case.interface';
import { ITask } from '~/interfaces/task.interface';

// Get list of case services with pagination and query
const getCaseServices = async (
  searchParams: URLSearchParams,
  request: ISessionUser,
) => {
  const response = await fetcher<IListResponse<ICaseService>>(
    `/case-services?${searchParams.toString()}`,
    { request },
  );
  return response;
};

// Get a case service by ID
const getCaseServiceById = async (id: string, request: ISessionUser) => {
  const response = await fetcher<any>(`/case-services/${id}`, {
    request,
  });
  return response as ICaseService;
};

// get task associated with a case service
const getCaseServiceTasks = async (id: string, request: ISessionUser) => {
  const tasks = await fetcher<IListResponse<ITask>>(
    `/case-services/${id}/tasks`,
    {
      request,
    },
  );
  return tasks;
};

const getCaseServiceDocuments = async (id: string, request: ISessionUser) => {
  const response = await fetcher<IListResponse<ICaseDocument>>(
    `/case-services/${id}/documents`,
    {
      request,
    },
  );
  return response;
};

// Create a new case service
const createCaseService = async (
  caseServiceData: ICaseServiceCreate,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<ICaseService>('/case-services', {
      method: 'POST',
      body: JSON.stringify(caseServiceData),
      request,
    });

    return response;
  } catch (error: any) {
    console.error('Error creating case service:', error);
    throw error;
  }
};

// Update a case service
const updateCaseService = async (
  id: string,
  data: ICaseServiceUpdate,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<ICaseService>(`/case-services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      request,
    });
    return response;
  } catch (error) {
    console.error('Error updating case service:', error);
    throw error;
  }
};

// Delete a case service
const bulkDeleteCaseService = async (
  caseServiceIds: string[],
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<any>(`/case-services/bulk`, {
      method: 'DELETE',
      body: JSON.stringify({ caseServiceIds }),
      request,
    });
    return response;
  } catch (error) {
    console.error('Error deleting case service:', error);
    throw error;
  }
};

// Attach documents to a case service
const attachDocumentsToCase = async (
  id: string,
  documentIds: string[],
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<any>(`/case-services/${id}/documents`, {
      method: 'POST',
      body: JSON.stringify({ documentIds }),
      request,
    });
    return response;
  } catch (error) {
    console.error('Error attaching documents to case:', error);
    throw error;
  }
};

// detach documents from a case service
const detachDocumentsFromCase = async (
  id: string,
  caseDocumentIds: string[],
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<any>(`/case-services/${id}/documents`, {
      method: 'DELETE',
      body: JSON.stringify({ caseDocumentIds }),
      request,
    });
    return response;
  } catch (error) {
    console.error('Error detaching documents from case:', error);
    throw error;
  }
};

// Import case services from file (CSV or XLSX)

// Import case services from Excel file
const importCaseServices = async (
  file: File,
  options: {
    skipDuplicates?: boolean;
    updateExisting?: boolean;
    skipEmptyRows?: boolean;
  },
  request: ISessionUser,
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append(
    'skipDuplicates',
    options.skipDuplicates?.toString() || 'true',
  );
  formData.append(
    'updateExisting',
    options.updateExisting?.toString() || 'false',
  );
  formData.append('skipEmptyRows', options.skipEmptyRows?.toString() || 'true');

  const response = await fetcher<{
    total: number;
    imported: number;
    updated: number;
    skipped: number;
    errors: Array<{
      row: number;
      error: string;
      data: any;
    }>;
  }>('/case-services/import/xlsx', {
    request,
    method: 'POST',
    body: formData,
    headers: {}, // Let fetch handle content-type for FormData
  });

  return response;
};

// Export case services to CSV
const exportCaseServicesToCSV = async (
  searchParams: URLSearchParams,
  request: ISessionUser,
) => {
  return await fetcher<{ fileUrl: string; fileName: string; count: number }>(
    `/case-services/export/csv?${searchParams.toString()}`,
    {
      method: 'GET',
      request,
    },
  );
};

// Export case services to XLSX
const exportCaseServicesToXLSX = async (
  searchParams: URLSearchParams,
  request: ISessionUser,
) => {
  return await fetcher<{ fileUrl: string; fileName: string; count: number }>(
    `/case-services/export/xlsx?${searchParams.toString()}`,
    {
      method: 'GET',
      request,
    },
  );
};

const getMyCaseServices = async (
  searchParams: URLSearchParams,
  request: ISessionUser,
) => {
  const response = await fetcher<IListResponse<ICaseService>>(
    `/employees/me/case-services?${searchParams.toString()}`,
    { request },
  );
  return response;
};

export {
  getCaseServices,
  getCaseServiceById,
  createCaseService,
  updateCaseService,
  bulkDeleteCaseService,
  attachDocumentsToCase,
  detachDocumentsFromCase,
  importCaseServices,
  exportCaseServicesToCSV,
  exportCaseServicesToXLSX,
  getCaseServiceTasks,
  getCaseServiceDocuments,
  getMyCaseServices,
};
