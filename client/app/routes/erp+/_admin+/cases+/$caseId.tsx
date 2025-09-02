import CaseTaskList from './_components/CaseTaskList';
import CaseDetail from './_components/CaseDetail';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import {
  getCaseServiceDocuments,
  getCaseServiceTasks,
  getCaseServiceOverview,
  bulkDeleteCaseService,
  patchCaseService,
  getCaseServiceById,
} from '~/services/case.server';
import { parseAuthCookie } from '~/services/cookie.server';
import { data, useLoaderData, useNavigate } from '@remix-run/react';
import ContentHeader from '~/components/ContentHeader';
import { Edit } from 'lucide-react';
import CaseDocumentList from './_components/CaseDocumentList';
import { canAccessCaseServices } from '~/utils/permission';
import { IActionFunctionReturn } from '~/interfaces/app.interface';
import { isAuthenticated } from '~/services/auth.server';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const session = await parseAuthCookie(request);

  if (!canAccessCaseServices(session?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  // Fetch case service data based on case ID
  const caseId = params.caseId;
  if (!caseId) {
    throw new Response('Case ID is required', { status: 400 });
  }
  const caseService = await getCaseServiceById(caseId, session!).catch(
    (error) => {
      console.error('Error fetching case service overview:', error);
      return {
        success: false,
        message: error.message || 'Có lỗi khi lấy thông tin dịch vụ',
      };
    },
  );

  const caseTasksPromise = getCaseServiceTasks(caseId, session!).catch(
    (error) => {
      console.error('Error fetching case tasks:', error);
      return {
        success: false,
        message: error.message || 'Có lỗi khi lấy danh sách công việc',
      };
    },
  );
  const caseDocumentsPromise = getCaseServiceDocuments(caseId, session!).catch(
    (error) => {
      console.error('Error fetching case documents:', error);
      return {
        success: false,
        message: error.message || 'Có lỗi khi lấy danh sách tài liệu',
      };
    },
  );

  return {
    caseId,
    caseService,
    caseTasksPromise,
    caseDocumentsPromise,
  };
};

export default function () {
  const { caseId, caseService, caseTasksPromise, caseDocumentsPromise } =
    useLoaderData<typeof loader>();

  const navigate = useNavigate();

  return (
    <div className='space-y-4 sm:space-y-6 min-h-screen mx-auto'>
      <ContentHeader
        title='Chi tiết Hồ sơ vụ việc'
        actionContent={
          <>
            <Edit className='w-4 h-4' />
            <span className='hidden sm:inline'>Chỉnh sửa Hồ sơ</span>
            <span className='sm:hidden'>Chỉnh sửa</span>
          </>
        }
        actionHandler={() => {
          navigate(`./edit`);
        }}
        backHandler={() => navigate('/erp/cases')}
      />

      {/* Case Service Details Card */}
      <CaseDetail caseService={caseService} />

      {/* Associated Tasks Card */}
      <CaseTaskList caseId={caseId} caseTasksPromise={caseTasksPromise} />

      {/* Associated Documents Card */}
      <CaseDocumentList
        caseId={caseId}
        caseDocumentsPromise={caseDocumentsPromise}
      />
    </div>
  );
}

export const action = async ({
  params,
  request,
}: ActionFunctionArgs): IActionFunctionReturn => {
  const { session, headers } = await isAuthenticated(request);
  const caseId = params.caseId as string;

  if (!session) {
    return data(
      {
        success: false,
        toast: { message: 'Unauthorized', type: 'error' },
      },
      { headers, status: 401 },
    );
  }

  switch (request.method) {
    case 'DELETE':
      try {
        await bulkDeleteCaseService([caseId], session);
        return data(
          {
            success: true,
            toast: {
              message: 'Xóa Hồ sơ vụ việc thành công!',
              type: 'success',
            },
            redirectTo: '/erp/cases',
          },
          { headers },
        );
      } catch (error: any) {
        console.error('Error deleting case service:', error);
        return data(
          {
            success: false,
            toast: {
              message: 'Có lỗi xảy ra khi xóa Hồ sơ vụ việc',
              type: 'error',
            },
          },
          { headers, status: 500 },
        );
      }

    case 'PATCH':
      try {
        const formData = await request.formData();
        const res = await patchCaseService(
          caseId,
          { op: formData.get('op') as string, value: formData.get('value') },
          session!,
        );

        return data(
          {
            success: true,
            toast: {
              message: 'Cập nhật Hồ sơ vụ việc thành công!',
              type: 'success',
            },
          },
          { headers },
        );
      } catch (error: any) {
        console.error('Error updating case service:', error);
        let errorMessage = 'Có lỗi xảy ra khi cập nhật Hồ sơ vụ việc';

        return data(
          {
            success: false,
            toast: {
              message: errorMessage,
              type: 'error',
            },
          },
          { headers, status: 500 },
        );
      }

    default:
      return data(
        {
          success: false,
          toast: { message: 'Method not allowed', type: 'error' },
        },
        { headers, status: 405 },
      );
  }
};
