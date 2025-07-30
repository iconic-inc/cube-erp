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
import { Edit, Pen } from 'lucide-react';
import CaseDocumentList from './_components/CaseDocumentList';
import {
  canAccessCaseServices,
  canAccessTransactionManagement,
} from '~/utils/permission';
import { getTransactions } from '~/services/transaction.server';
import CaseTransactionList from './_components/CaseTransactionList';

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
  const casePromise = getCaseServiceById(caseId, session!).catch((error) => {
    console.error('Error fetching case service:', error);
    return {
      success: false,
      message: error.message || 'Có lỗi khi lấy thông tin dịch vụ',
    };
  });
  const caseTransactionsPromise = canAccessTransactionManagement(
    session?.user.usr_role,
  )
    ? getTransactions(
        new URLSearchParams({ caseId, page: '1', limit: '100' }),
        session!,
      ).catch((error) => {
        console.error('Error fetching customer transactions:', error);
        return {
          success: false,
          message: error.message || 'Có lỗi khi lấy danh sách giao dịch',
        };
      })
    : null;
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
    casePromise,
    caseTasksPromise,
    caseDocumentsPromise,
    caseTransactionsPromise,
  };
};

export default function () {
  const {
    caseId,
    casePromise,
    caseTasksPromise,
    caseDocumentsPromise,
    caseTransactionsPromise,
  } = useLoaderData<typeof loader>();

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
      <CaseDetail casePromise={casePromise} />

      {/* Associated Transactions Card */}
      {caseTransactionsPromise && (
        <CaseTransactionList
          caseId={caseId}
          caseTransactionsPromise={caseTransactionsPromise}
        />
      )}

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
