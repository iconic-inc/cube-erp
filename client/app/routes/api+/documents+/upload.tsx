import { ActionFunctionArgs, data } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { uploadDocument } from '~/services/document.server';

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);
  const body = await request.formData();

  try {
    const files = body.getAll('documents') as File[];
    if (!files.length) {
      return data(
        {
          documents: [],
          success: 0,
          toast: {
            message: 'Không có tài liệu nào được chọn để tải lên.',
            type: 'error',
          },
        },
        { headers },
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
        success: 1,
        toast: { message: 'Upload tài liệu thành công!', type: 'success' },
      },
      { headers },
    );
  } catch (error: any) {
    console.error(error);
    return data(
      {
        documents: [],
        success: 0,
        toast: { message: error.message, type: 'error' },
      },
      { headers },
    );
  }
};
