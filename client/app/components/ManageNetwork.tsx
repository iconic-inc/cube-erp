import { useState } from 'react';
import { IOfficeIP } from '~/interfaces/officeIP.interface';
import IPEditorForm from './IPEditorForm';
import HRMButton from './CustomButton';

export default function ManageNetwork({
  officeIps,
}: {
  officeIps: IOfficeIP[];
}) {
  const [showIPEditorForm, setShowIPEditorForm] = useState(false);
  const [editIp, setEditIp] = useState<string | null>(null);

  return (
    <div className='bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition duration-300'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='font-semibold text-gray-800'>Danh sách địa chỉ IP</h3>

        <HRMButton
          color='blue'
          type='button'
          onClick={() => {
            setShowIPEditorForm((prev) => !prev);
          }}
        >
          Thêm địa chỉ IP
        </HRMButton>
      </div>

      <div className='space-y-3'>
        {showIPEditorForm && (
          <IPEditorForm
            setShowIPEditorForm={setShowIPEditorForm}
            type='create'
          />
        )}

        {officeIps.map((officeIp) =>
          editIp === officeIp.id ? (
            <IPEditorForm
              key={officeIp.id}
              officeIp={officeIp}
              setShowIPEditorForm={setShowIPEditorForm}
              type='update'
              setEditIp={setEditIp}
            />
          ) : (
            <div
              key={officeIp.id}
              className='flex justify-between items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition duration-200'
            >
              <div>
                <p className='font-medium text-sm'>{officeIp.officeName}</p>
                <p className='text-xs text-gray-500'>{officeIp.ipAddress}</p>
              </div>
              <div className='flex space-x-2'>
                <button
                  className='h-8 w-8 text-blue-500 hover:bg-blue-50 p-1 rounded-full transition-all'
                  type='button'
                  onClick={() => {
                    setEditIp(officeIp.id);
                  }}
                >
                  <span className='material-symbols-outlined'>edit</span>
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
