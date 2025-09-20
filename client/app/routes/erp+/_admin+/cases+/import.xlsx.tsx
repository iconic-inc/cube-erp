import { ActionFunctionArgs, data } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { IActionFunctionReturn } from '~/interfaces/app.interface';
import { importCaseServices } from '~/services/case.server';

interface IImportResponse {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
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
    const skipDuplicates = formData.get('skipDuplicates') !== 'false'; // Default to true
    const updateExisting = formData.get('updateExisting') === 'true'; // Default to false
    const skipEmptyRows = formData.get('skipEmptyRows') !== 'false'; // Default to true

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

    // Call backend import API
    const result = await importCaseServices(
      file,
      {
        skipDuplicates,
        updateExisting,
        skipEmptyRows,
      },
      session,
    );

    // Check if there are critical errors (more than 50% failure rate)
    const failureRate = result.errors.length / result.total;
    if (result.errors.length > 0 && failureRate > 0.5) {
      return data(
        {
          success: false,
          toast: {
            type: 'error',
            message: `Có quá nhiều lỗi khi nhập dữ liệu (${result.errors.length}/${result.total} hàng lỗi). Vui lòng kiểm tra định dạng file.`,
          },
          data: result,
        },
        { headers },
      );
    }

    // Determine success message based on results
    let message = '';
    if (result.imported > 0 || result.updated > 0) {
      const parts = [];
      if (result.imported > 0) {
        parts.push(`${result.imported} hồ sơ được thêm mới`);
      }
      if (result.updated > 0) {
        parts.push(`${result.updated} hồ sơ được cập nhật`);
      }
      if (result.skipped > 0) {
        parts.push(`${result.skipped} hàng được bỏ qua`);
      }
      if (result.errors.length > 0) {
        parts.push(`${result.errors.length} hàng có lỗi`);
      }
      message = `Nhập dữ liệu hoàn tất! ${parts.join(', ')}.`;
    } else {
      message = 'Không có dữ liệu nào được nhập. Vui lòng kiểm tra file Excel.';
    }

    return data(
      {
        success: true,
        toast: {
          type: result.errors.length > 0 ? 'success' : 'success',
          message,
        },
        data: result,
      },
      { headers },
    );
  } catch (error: any) {
    console.error('Case service import error:', error);
    return data(
      {
        success: false,
        toast: {
          message:
            error.message || 'Có lỗi xảy ra khi nhập dữ liệu hồ sơ vụ việc',
          type: 'error',
        },
      },
      { headers },
    );
  }
};
