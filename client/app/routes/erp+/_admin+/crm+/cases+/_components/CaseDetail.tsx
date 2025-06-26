import BriefEmployeeCard from '~/components/BriefEmployeeCard';
import Defer from '~/components/Defer';
import TextRenderer from '~/components/TextRenderer';
import { Badge } from '~/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  CASE_SERVICE,
  CASE_STATUS_BADGE_CLASSES,
} from '~/constants/caseService.constant';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { ICaseService } from '~/interfaces/case.interface';
import { formatDate } from '~/utils';
import CustomerBrief from './CustomerBrief';

export default function CaseDetail({
  casePromise,
}: {
  casePromise: ILoaderDataPromise<ICaseService>;
}) {
  return (
    <Defer resolve={casePromise}>
      {(caseService) => (
        <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
          <CardHeader className='bg-gradient-to-r from-emerald-600 to-green-700 text-white py-6 rounded-t-xl'>
            <CardTitle className='text-white text-3xl font-bold'>
              {caseService.case_code}
            </CardTitle>
          </CardHeader>
          <CardContent className='p-6 space-y-6'>
            {/* Customer Info */}
            <CustomerBrief customer={caseService.case_customer} />

            {/* Case Notes */}
            {caseService.case_notes && (
              <div>
                <Label
                  htmlFor='case_notes'
                  className='text-gray-700 font-semibold mb-2 block'
                >
                  Ghi chú
                </Label>
                <TextRenderer
                  content={caseService.case_notes}
                  className='rounded-lg border border-gray-300 p-3 bg-gray-50 text-gray-800 break-words'
                />
              </div>
            )}

            {/* Status, Start Date, End Date */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-gray-200 pt-6'>
              <div className='flex flex-col items-center'>
                <Label className='text-gray-700 font-semibold mb-2 block'>
                  Trạng thái
                </Label>
                <Badge
                  className={`px-3 py-1 rounded-full text-base ${CASE_STATUS_BADGE_CLASSES[caseService.case_status]}`}
                >
                  {CASE_SERVICE.STATUS[caseService.case_status]}
                </Badge>
              </div>
              <div>
                <Label className='text-gray-700 font-semibold mb-2 block'>
                  Ngày bắt đầu
                </Label>
                <Input
                  value={formatDate(caseService.case_startDate)}
                  readOnly
                  className='bg-white border-gray-300'
                />
              </div>
              <div>
                <Label className='text-gray-700 font-semibold mb-2 block'>
                  Ngày kết thúc
                </Label>
                <Input
                  value={formatDate(caseService.case_endDate)}
                  readOnly
                  className='bg-white border-gray-300'
                />
              </div>
            </div>

            {/* Legal Team & Assignees */}
            <div className='border-t border-gray-200 pt-6'>
              <h4 className='text-xl font-bold text-gray-800 mb-8 flex items-center'>
                <span className='text-teal-600 mr-2'>
                  &#128100; Người thực hiện
                </span>
              </h4>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {caseService.case_leadAttorney && (
                  <BriefEmployeeCard
                    key={caseService.case_leadAttorney.id}
                    employee={caseService.case_leadAttorney}
                    highlighted
                    highlightText='Luật sư chính'
                  />
                )}
                {caseService.case_assignees?.map((assignee) => (
                  <BriefEmployeeCard key={assignee.id} employee={assignee} />
                ))}
              </div>
            </div>

            {/* Timestamps */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-6'>
              <div>
                <Label className='text-gray-700 font-semibold mb-2 block'>
                  Tạo lúc
                </Label>
                <Input
                  value={formatDate(
                    caseService.createdAt,
                    'HH:mm - DD/MM/YYYY',
                  )}
                  readOnly
                  className='bg-gray-50 border-gray-300'
                />
              </div>
              <div>
                <Label className='text-gray-700 font-semibold mb-2 block'>
                  Cập nhật lúc
                </Label>
                <Input
                  value={formatDate(
                    caseService.updatedAt,
                    'HH:mm - DD/MM/YYYY',
                  )}
                  readOnly
                  className='bg-gray-50 border-gray-300'
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Defer>
  );
}
