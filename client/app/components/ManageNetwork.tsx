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
      <CardHeader className='bg-gradient-to-r from-green-600 to-emerald-700 text-white py-4'>
        <div className='flex justify-between items-center'>
          <CardTitle className='text-white text-xl font-bold flex items-center'>
            <Network className='w-5 h-5 mr-2' />
            Quản lý địa chỉ IP
          </CardTitle>
          <Button
            variant='secondary'
            size='sm'
            className='bg-white text-green-700 hover:bg-green-50'
            onClick={() => setShowIPEditorForm((prev) => !prev)}
          >
            <Plus className='w-4 h-4 mr-1' />
            Thêm IP
          </Button>
        </div>
      </CardHeader>

      <CardContent className='p-6 space-y-4'>
        {showIPEditorForm && (
          <div className='p-4 border border-green-200 rounded-lg bg-green-50'>
            <IPEditorForm
              setShowIPEditorForm={setShowIPEditorForm}
              type='create'
            />
          </div>
        )}

        <div className='space-y-3'>
          {officeIps.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <Network className='w-12 h-12 mx-auto mb-3 text-gray-300' />
              <p className='text-sm'>Chưa có địa chỉ IP nào</p>
            </div>
          ) : (
            officeIps.map((officeIp) =>
              editIp === officeIp.id ? (
                <div
                  key={officeIp.id}
                  className='p-4 border border-blue-200 rounded-lg bg-blue-50'
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
                  className='flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200'
                >
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
                      <MapPin className='w-5 h-5 text-green-600' />
                    </div>
                    <div>
                      <p className='font-medium text-gray-900 text-sm'>
                        {officeIp.officeName}
                      </p>
                      <Badge variant='outline' className='text-xs mt-1'>
                        {officeIp.ipAddress}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8 w-8 p-0 text-blue-600 hover:bg-blue-50'
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
