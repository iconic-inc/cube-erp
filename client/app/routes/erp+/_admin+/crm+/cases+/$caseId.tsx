import CaseTaskList from './_components/CaseTaskList';
import CaseDetail from './_components/CaseDetail';
import { LoaderFunctionArgs } from '@remix-run/node';
import {
  getCaseServiceById,
  getCaseServiceDocuments,
  getCaseServiceTasks,
} from '~/services/case.server';
import { parseAuthCookie } from '~/services/cookie.server';
import { useLoaderData, useNavigate } from '@remix-run/react';
import ContentHeader from '~/components/ContentHeader';
import { Pen } from 'lucide-react';
import CaseDocumentList from './_components/CaseDocumentList';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const session = await parseAuthCookie(request);
  // Fetch case service data based on case ID
  const caseId = params.caseId;
  if (!caseId) {
    throw new Response('Case ID is required', { status: 400 });
  }
  const casePromise = getCaseServiceById(caseId, session!).catch((error) => {
    console.error('Error fetching case service:', error);
    return {
      success: false,
      message: error.message || 'Có lỗi khi lấy thông tin dịch vụ',
    };
  });
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

  return { caseId, casePromise, caseTasksPromise, caseDocumentsPromise };
};

export default function () {
  const { caseId, casePromise, caseTasksPromise, caseDocumentsPromise } =
    useLoaderData<typeof loader>();

  const navigate = useNavigate();

  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      <ContentHeader
        title='Chi tiết Hồ sơ Dịch vụ'
        actionContent={
          <>
            <Pen className='w-4 h-4 mr-1' />
            Chỉnh sửa Hồ sơ
          </>
        }
        actionHandler={() => {
          navigate(`./edit`);
        }}
      />

      {/* Case Service Details Card */}
      <CaseDetail casePromise={casePromise} />

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
