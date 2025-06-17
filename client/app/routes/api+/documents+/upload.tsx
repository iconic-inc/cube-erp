import { ActionFunctionArgs, data } from '@remix-run/node';
import { authenticator, isAuthenticated } from '~/services/auth.server';
import { uploadDocument } from '~/services/document.server';

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);

  switch (request.method) {
    case 'POST':
      const body = await request.formData();

      try {
        const files = body.getAll('document') as File[];
        if (!files.length) {
          // throw new Error('Vui lòng chọn ít nhất một tài liệu để tải lên');
          return data(
            {
              success: false,
              toast: {
                message: 'Vui lòng chọn ít nhất một tài liệu để tải lên',
                type: 'error',
              },
            },
            { headers, status: 400 },
          );
        }

        const formData = new FormData();

        for (let i = 0; i < files.length; i++) {
          formData.append('documents', files[i]);
        }
        const documents = await uploadDocument(formData, session!);

        return data(
          {
            documents,
            success: true,
            toast: { message: 'Upload Tài liệu thành công!', type: 'success' },
          },
          { headers },
        );
      } catch (error: any) {
        console.error(error);
        return data(
          {
            success: false,
            toast: { message: error.message, type: 'error' },
          },
          { headers },
        );
      }

    default:
      return data(
        {
          success: false,
          toast: { message: 'Phương thức không hợp lệ', type: 'error' },
        },
        { headers },
      );
  }
};
