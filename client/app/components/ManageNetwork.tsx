import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { IOfficeIP } from '~/interfaces/officeIP.interface';
import IPEditorForm from './IPEditorForm';
import { Network, Plus, Edit, MapPin } from 'lucide-react';

export default function ManageNetwork({
  officeIps,
}: {
  officeIps: IOfficeIP[];
}) {
  const [showIPEditorForm, setShowIPEditorForm] = useState(false);
  const [editIp, setEditIp] = useState<string | null>(null);

  return (
    <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
      <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-3 md:py-4'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0'>
          <CardTitle className='text-white text-lg md:text-xl font-bold flex items-center'>
            <Network className='w-4 h-4 md:w-5 md:h-5 mr-2' />
            <span className='hidden sm:inline'>Quản lý địa chỉ IP</span>
            <span className='sm:hidden'>IP Offices</span>
          </CardTitle>
          <Button
            variant='secondary'
            size='sm'
            className='bg-white text-green-700 hover:bg-green-50 text-xs md:text-sm self-end sm:self-auto'
            onClick={() => setShowIPEditorForm((prev) => !prev)}
          >
            <Plus className='w-3 h-3 md:w-4 md:h-4' />
            <span className='hidden sm:inline'>Thêm IP</span>
            <span className='sm:hidden'>Thêm</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className='p-4 md:p-6 space-y-3 md:space-y-4'>
        {showIPEditorForm && (
          <div className='p-3 md:p-4 border border-green-200 rounded-lg bg-green-50'>
            <IPEditorForm
              setShowIPEditorForm={setShowIPEditorForm}
              type='create'
            />
          </div>
        )}

        <div className='space-y-2 md:space-y-3'>
          {officeIps.length === 0 ? (
            <div className='text-center py-6 md:py-8 text-gray-500'>
              <Network className='w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300' />
              <p className='text-xs md:text-sm'>Chưa có địa chỉ IP nào</p>
            </div>
          ) : (
            officeIps.map((officeIp) =>
              editIp === officeIp.id ? (
                <div
                  key={officeIp.id}
                  className='p-3 md:p-4 border border-blue-200 rounded-lg bg-blue-50'
                >
                  <IPEditorForm
                    officeIp={officeIp}
                    setShowIPEditorForm={setShowIPEditorForm}
                    type='update'
                    setEditIp={setEditIp}
                  />
                </div>
              ) : (
                <div
                  key={officeIp.id}
                  className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 p-3 md:p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200'
                >
                  <div className='flex items-center space-x-3 flex-1 min-w-0'>
                    <div className='w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                      <MapPin className='w-4 h-4 md:w-5 md:h-5 text-green-600' />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='font-medium text-gray-900 text-sm md:text-base truncate'>
                        {officeIp.officeName}
                      </p>
                      <Badge
                        variant='outline'
                        className='text-xs mt-1 font-mono'
                      >
                        {officeIp.ipAddress}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 self-end sm:self-auto'
                    onClick={() => setEditIp(officeIp.id)}
                  >
                    <Edit className='h-4 w-4' />
                  </Button>
                </div>
              ),
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
