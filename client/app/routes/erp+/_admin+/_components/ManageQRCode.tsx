export default function ManageQRCode({
  qrcode,
}: {
  qrcode?: { qrCode: string; attendanceUrl: string };
}) {
  return (
    <div className='bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition duration-300'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='font-semibold text-gray-800'>Mã QR chấm công</h3>
        {/* <button className='bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition duration-200'>
          Generate New
        </button> */}
      </div>

      <div className='flex items-center justify-center mb-4'>
        <div className='bg-white border-2 border-gray-200 rounded-md shadow-sm hover:shadow-md transition duration-300'>
          <img
            src={qrcode?.qrCode || '/images/qr-placeholder.png'}
            alt='QR Code'
            className='w-56 h-56 object-cover rounded-md'
          />
        </div>
      </div>
      {/* <div className='space-y-3'>
        <div className='flex justify-between items-center'>
          <p className='text-sm text-gray-600'>Location:</p>
          <select className='bg-gray-50 border border-gray-200 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-100 transition'>
            <option>Main Office - Floor 1</option>
            <option>Main Office - Floor 2</option>
            <option>Remote Office</option>
          </select>
        </div>
        <div className='flex justify-between items-center'>
          <p className='text-sm text-gray-600'>Expiration:</p>
          <select className='bg-gray-50 border border-gray-200 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-100 transition'>
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
        </div>
        <div className='flex space-x-2 mt-4'>
          <button className='flex-1 bg-green-500 text-white px-3 py-2 rounded-md text-sm hover:bg-green-600 transition duration-200 flex items-center justify-center'>
            <span className='material-symbols-outlined text-sm mr-1'>
              download
            </span>
            Download
          </button>
          <button className='flex-1 bg-blue-500 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-600 transition duration-200 flex items-center justify-center'>
            <span className='material-symbols-outlined text-sm mr-1'>
              share
            </span>
            Share
          </button>
        </div>
      </div> */}
    </div>
  );
}
