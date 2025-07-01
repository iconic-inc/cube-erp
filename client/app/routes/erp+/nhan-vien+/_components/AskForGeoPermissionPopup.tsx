export default function AskForGeoPermissionPopup() {
  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
      <div className='bg-white rounded-lg shadow-lg p-8 w-96'>
        <h2 className='text-xl font-semibold mb-4'>
          Cho phép truy cập định vị
        </h2>
        <p className='text-gray-500'>
          Để sử dụng tính năng điểm danh, bạn cần cho phép truy cập định vị của
          thiết bị.
        </p>
        <div className='flex justify-end mt-8'>
          <button
            className='text-blue-500 font-semibold'
            onClick={() => {
              navigator.geolocation.getCurrentPosition((position) => {
                console.log(position);
              });
            }}
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}
