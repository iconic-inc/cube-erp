import { Save } from 'lucide-react';
import { useLoaderData, useNavigate } from '@remix-run/react';
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  data as dataResponse,
} from '@remix-run/node';

import { getCaseServiceById, updateCaseService } from '~/services/case.server';
import { parseAuthCookie } from '~/services/cookie.server';
import ContentHeader from '~/components/ContentHeader';
import CaseDetailForm from './_components/CaseDetailForm';
import { getEmployees } from '~/services/employee.server';
import { isAuthenticated } from '~/services/auth.server';
import { ICaseServiceUpdate } from '~/interfaces/case.interface';
import { CASE_SERVICE } from '~/constants/caseService.constant';
import { useMemo } from 'react';
import { generateFormId } from '~/utils';
import { canAccessCaseServices } from '~/utils/permission';
import { IActionFunctionReturn } from '~/interfaces/app.interface';

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

  return { caseId, casePromise };
};

export default function () {
  const { caseId, casePromise } = useLoaderData<typeof loader>();

  const formId = useMemo(
    () => generateFormId(`case-detail-form-${caseId}`),
    [caseId],
  );

  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      <ContentHeader
        title='Chi tiết Hồ sơ vụ việc'
        actionContent={
          <>
            <Save className='w-4 h-4' />
            Lưu Hồ sơ
          </>
        }
        actionHandler={() => {
          const form = document.getElementById(formId) as HTMLFormElement;
          if (form) {
            form.requestSubmit();
          }
        }}
      />

      {/* Case Service Details Card */}
      <CaseDetailForm formId={formId} casePromise={casePromise} type='update' />
    </div>
  );
}

export const action = async ({
  request,
  params,
}: ActionFunctionArgs): IActionFunctionReturn => {
  const { session, headers } = await isAuthenticated(request);

  switch (request.method) {
    case 'PUT': {
      try {
        const caseId = params.caseId;
        if (!caseId) {
          return dataResponse(
            {
              success: false,
              toast: {
                message: 'Vui lòng cung cấp ID Hồ sơ vụ việc',
                type: 'error',
              },
            },
            { headers },
          );
        }

        const formData = await request.formData();

        // Parse pricing data
        const pricingData = formData.get('pricing') as string;
        const pricing = pricingData ? JSON.parse(pricingData) : undefined;

        // Parse participants data
        const participantsData = formData.get('participants') as string;
        const participants = participantsData
          ? JSON.parse(participantsData)
          : undefined;

        // Parse installments data
        const installmentsData = formData.get('installments') as string;
        const installments = installmentsData
          ? JSON.parse(installmentsData)
          : undefined;

        // Parse incurred costs data
        const incurredCostsData = formData.get('incurredCosts') as string;
        const incurredCosts = incurredCostsData
          ? JSON.parse(incurredCostsData)
          : undefined;

        const data: ICaseServiceUpdate = {
          code: formData.get('code') as string,
          notes: (formData.get('notes') as string) || undefined,
          status:
            (formData.get('status') as keyof typeof CASE_SERVICE.STATUS) ||
            undefined,
          startDate: (formData.get('startDate') as string) || undefined,
          endDate: (formData.get('endDate') as string) || undefined,
          pricing,
          participants,
          installments,
          incurredCosts,
        };

        // Kiểm tra dữ liệu bắt buộc
        if (
          ['code'].some((field) => !data[field as keyof ICaseServiceUpdate])
        ) {
          return dataResponse(
            {
              success: false,
              toast: {
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc',
                type: 'error',
              },
            },
            { headers },
          );
        }

        // Validate pricing data if provided
        if (data.pricing && data.pricing.baseAmount < 0) {
          return dataResponse(
            {
              success: false,
              toast: {
                message: 'Giá cơ bản không thể âm',
                type: 'error',
              },
            },
            { headers, status: 400 },
          );
        }

        // Validate installments sequence numbers are unique if provided
        if (data.installments && data.installments.length > 0) {
          const sequences = data.installments.map((inst) => inst.seq);
          const uniqueSequences = new Set(sequences);
          if (sequences.length !== uniqueSequences.size) {
            return dataResponse(
              {
                success: false,
                toast: {
                  message: 'Số thứ tự các kỳ thanh toán phải duy nhất',
                  type: 'error',
                },
              },
              { headers, status: 400 },
            );
          }
        }

        const res = await updateCaseService(caseId, data, session!);

        return dataResponse(
          {
            success: true,
            toast: {
              message: 'Cập nhật Hồ sơ thành công!',
              type: 'success',
            },
            redirectTo: `/erp/cases/${res.id}`,
          },
          { headers },
        );
      } catch (error: any) {
        console.error('Error updating case:', error);
        const errorMessage =
          error.message || 'Có lỗi xảy ra khi cập nhật Hồ sơ';

        return dataResponse(
          {
            success: false,
            toast: {
              message: errorMessage,
              type: 'error',
            },
          },
          { headers },
        );
      }
    }

    default:
      return dataResponse(
        {
          success: false,
          toast: { message: 'Method not allowed', type: 'error' },
        },
        { headers },
      );
  }
};
