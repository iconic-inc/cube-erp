import { ICustomer } from '~/interfaces/customer.interface';

export default function CustomerBulkActionBar({
  selectedCustomers,
  handleConfirmBulkDelete,
}: {
  selectedCustomers: ICustomer[];
  handleConfirmBulkDelete: () => void;
}) {
  return (
    <div className='bg-blue-50 p-3 border-b border-blue-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0'>
      <div className='flex items-center gap-2 w-full md:w-auto'>
        <span className='font-medium text-blue-700'>
          {selectedCustomers.length} Khách hàng đã chọn
        </span>
      </div>
      <div className='flex flex-wrap items-center gap-2 w-full md:w-auto mt-2 md:mt-0'>
        <button
          className='px-3 py-1.5 text-sm bg-white border border-gray-300 text-red-600 rounded-md hover:bg-gray-50 transition shadow-sm flex items-center gap-1'
          onClick={handleConfirmBulkDelete}
        >
          <span className='material-symbols-outlined text-sm'>delete</span>
          Xóa
        </button>
      </div>
    </div>
  );
}
