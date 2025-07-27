import { ActionFunctionArgs, data } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { IActionFunctionReturn } from '~/interfaces/app.interface';
import { importCustomers } from '~/services/customer.server';

interface IImportResponse {
  imported: number;
  updated: number;
  errors: Array<{
    row: number;
    error: string;
    data: any;
  }>;
}

export const action = async ({
  request,
}: ActionFunctionArgs): IActionFunctionReturn<IImportResponse> => {
  const { session, headers } = await isAuthenticated(request);
  if (!session) {
    return data(
      {
        success: false,
        toast: {
          type: 'error',
          message: 'Bạn cần đăng nhập để thực hiện hành động này',
        },
      },
      { headers },
    );
  }

  try {
    if (request.method !== 'POST') {
      return data(
        {
          success: false,
          toast: { message: 'Phương thức không hợp lệ', type: 'error' },
        },
        { headers },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const overwrite = formData.get('overwrite') === 'true';

    if (!file) {
      return data(
        {
          success: false,
          toast: {
            type: 'error',
            message: 'Vui lòng chọn file để nhập dữ liệu',
          },
        },
        { headers },
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!allowedTypes.includes(file.type)) {
      return data(
        {
          success: false,
          toast: {
            type: 'error',
            message: 'Vui lòng chọn file Excel (.xlsx hoặc .xls)',
          },
        },
        { headers },
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return data(
        {
          success: false,
          toast: {
            type: 'error',
            message: 'File quá lớn. Vui lòng chọn file nhỏ hơn 10MB',
          },
        },
        { headers },
      );
    }

    // Create FormData to send to backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('overwrite', overwrite.toString());

    // Call backend import API
    const result = await importCustomers(file, overwrite, session);
    console.log('import result', result.errors);
    if (result.errors.length > 0) {
      return data(
        {
          success: false,
          toast: {
            type: 'error',
            message: result.errors[0].error || 'Có lỗi xảy ra khi nhập dữ liệu',
          },
          data: result,
        },
        { headers },
      );
    }

    return data(
      {
        success: true,
        toast: {
          type: 'success',
          message: `Nhập dữ liệu thành công! ${result.imported} bản ghi được thêm, ${result.updated} bản ghi được cập nhật.`,
        },
        data: result,
      },
      { headers },
    );
  } catch (error: any) {
    console.error('Import error:', error);
    return data(
      {
        success: false,
        toast: {
          message: error.message || 'Có lỗi xảy ra khi nhập dữ liệu',
          type: 'error',
        },
      },
      { headers },
    );
  }
};
