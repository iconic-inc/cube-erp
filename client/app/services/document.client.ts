import { IDocument } from '~/interfaces/document.interface';

interface DocumentUploadResponse {
  documents: IDocument[];
  success: number;
  toast: {
    message: string;
    type: 'success' | 'error';
  };
}

export const uploadDocuments = async (
  files: FileList,
): Promise<DocumentUploadResponse> => {
  const formData = new FormData();

  for (let i = 0; i < files.length; i++) {
    formData.append('documents', files[i]);
  }

  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload documents');
  }

  return response.json();
};
