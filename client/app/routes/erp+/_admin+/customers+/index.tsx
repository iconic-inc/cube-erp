import { ActionFunctionArgs, data, LoaderFunctionArgs } from '@remix-run/node';
import {
  Link,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from '@remix-run/react';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Province } from 'new-vn-provinces/provinces';
import { Ward } from 'new-vn-provinces/wards';
import {
  getProvinceById,
  getWardsByProvinceId,
  getProvinceData,
} from 'new-vn-provinces/cache';

import {
  deleteMultipleCustomers,
  exportCustomers,
  getCustomers,
} from '~/services/customer.server';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { ICustomer } from '~/interfaces/customer.interface';
import { IListResponse } from '~/interfaces/response.interface';
import {
  IListColumn,
  IActionFunctionReturn,
  IExportResponse,
} from '~/interfaces/app.interface';
import { isAuthenticated } from '~/services/auth.server';
import List from '~/components/List';
import { Button } from '~/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { canAccessCustomerManagement } from '~/utils/permission';
import { toAddressString } from '~/utils/address.util';
import { CUSTOMER } from '~/constants/customer.constant';
import { formatDate } from '~/utils';
import AddressRenderer from '~/components/AddressRenderer';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  if (!canAccessCustomerManagement(user?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  const url = new URL(request.url);

  return {
    customersPromise: getCustomers(url.searchParams, user!).catch((e) => {
      console.error(e);
      return {
        data: [],
        pagination: {
          totalPages: 0,
          page: 1,
          limit: 10,
          total: 0,
        },
      } as IListResponse<ICustomer>;
    }),
  };
};

export default function HRMCustomers() {
  const { customersPromise } = useLoaderData<typeof loader>();

  const [searchParams, setSearchParams] = useSearchParams();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // Handle province changes
  useEffect(() => {
    (async () => {
      const provinces = await getProvinceData();
      const provinceIdParam = searchParams.get('provinceId');
      const selectedProvince =
        (await getProvinceById(provinceIdParam || '')) || provinces[0];
      const newWards = await getWardsByProvinceId(selectedProvince?.idProvince);

      setProvinces(provinces);
      setWards(newWards);
      setVisibleColumns((prevColumns) =>
        prevColumns.map((col) => {
          switch (col.key) {
            case 'wardId':
              return {
                ...col,
                options: newWards.map((d) => ({
                  value: d.idWard,
                  label: d.name,
                })),
              };

            case 'provinceId':
              return {
                ...col,
                options: provinces.map((p) => ({
                  value: p.idProvince,
                  label: p.name,
                })),
              };

            default:
              return col;
          }
        }),
      );
    })();
  }, [searchParams]);

  // remove ward search param on province change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.delete('wardId');
    setSearchParams(params);
  }, [searchParams.get('provinceId')]);

  const getSourceLabel = (source?: string) => {
    return (
      Object.values(CUSTOMER.SOURCE).find((src) => src.value === source)
        ?.label || CUSTOMER.SOURCE.OTHER.label
    );
  };

  const getContactChannelLabel = (channel?: string) => {
    return (
      Object.values(CUSTOMER.CONTACT_CHANNEL).find((ch) => ch.value === channel)
        ?.label || CUSTOMER.CONTACT_CHANNEL.OTHER.label
    );
  };
  const [visibleColumns, setVisibleColumns] = useState<
    IListColumn<ICustomer>[]
  >([
    {
      key: 'customerName',
      title: 'Tên Khách hàng',
      sortField: 'cus_user.usr_firstName',
      visible: true,
      render: (customer: ICustomer) => (
        <Link
          prefetch='intent'
          to={`/erp/customers/${customer.id}`}
          className='text-blue-600 hover:underline flex items-center'
        >
          <Avatar className='w-6 h-6 sm:w-8 sm:h-8 mr-2 shrink-0'>
            <AvatarImage
              src={'/assets/avatar-placeholder.png'}
              alt={`${customer.cus_firstName} ${customer.cus_lastName}`}
            />
            <AvatarFallback className='bg-gray-200 text-gray-600 font-bold text-sm sm:text-base'>
              {customer.cus_firstName?.charAt(0).toUpperCase() || 'N/A'}
            </AvatarFallback>
          </Avatar>
          <div className='flex flex-col min-w-0 flex-1'>
            <span className='text-sm sm:text-base font-medium truncate'>
              {customer.cus_firstName} {customer.cus_lastName}
            </span>
            <span className='text-gray-500 text-sm sm:text-base truncate'>
              {customer.cus_code || 'Chưa có mã'}
            </span>
          </div>
        </Link>
      ),
    },
    {
      key: 'msisdn',
      title: 'Số điện thoại',
      sortField: 'cus_msisdn',
      visible: true,
      render: (customer: ICustomer) =>
        customer.cus_msisdn ? (
          <Link
            prefetch='intent'
            to={`tel:${customer.cus_msisdn}`}
            className='text-blue-600 hover:underline text-sm sm:text-base truncate block max-w-[120px] sm:max-w-none'
            onClick={(e) => e.stopPropagation()}
          >
            {customer.cus_msisdn}
          </Link>
        ) : (
          <span className='text-gray-600 text-sm sm:text-base truncate block max-w-[120px] sm:max-w-none'>
            Chưa có số điện thoại
          </span>
        ),
    },
    {
      key: 'contactChannel',
      title: 'Kênh liên hệ',
      sortField: 'cus_contactChannel',
      visible: true,
      filterField: 'contactChannel',
      options: Object.values(CUSTOMER.CONTACT_CHANNEL),
      render: (customer: ICustomer) => (
        <Badge
          variant='secondary'
          className='text-sm sm:text-base whitespace-nowrap'
        >
          {getContactChannelLabel(customer.cus_contactChannel)}
        </Badge>
      ),
    },
    {
      key: 'source',
      title: 'Nguồn khách hàng',
      sortField: 'cus_source',
      visible: true,
      filterField: 'source',
      options: Object.values(CUSTOMER.SOURCE),
      render: (customer: ICustomer) => (
        <Badge
          variant='outline'
          className='text-sm sm:text-base whitespace-nowrap'
        >
          {getSourceLabel(customer.cus_source)}
        </Badge>
      ),
    },
    {
      key: 'address',
      title: 'Địa chỉ',
      sortField: 'cus_address.provinceId',
      visible: true,
      render: (customer: ICustomer) => (
        <span className='text-gray-600 text-sm sm:text-base truncate block max-w-[150px] sm:max-w-none'>
          <AddressRenderer address={customer.cus_address} />
        </span>
      ),
    },
    {
      key: 'provinceId',
      title: 'Tỉnh/Thành phố',
      sortField: 'cus_address.provinceId',
      visible: false,
      filterField: 'provinceId',
      options: [],
      render: (customer: ICustomer) => (
        <span className='text-gray-600 text-sm sm:text-base truncate block max-w-[120px] sm:max-w-none'>
          {provinces[(customer.cus_address.provinceId || '') as any]?.name ||
            'Chưa có tỉnh/thành phố'}
        </span>
      ),
    },
    {
      key: 'wardId',
      title: 'Phường/Xã',
      sortField: 'cus_address.wardId',
      visible: false,
      filterField: 'wardId',
      options: [],
      render: (customer: ICustomer) => (
        <span className='text-gray-600 text-sm sm:text-base truncate block max-w-[120px] sm:max-w-none'>
          {wards[(customer.cus_address.wardId || '') as any]?.name ||
            'Chưa có phường/xã'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      title: 'Ngày tạo',
      sortField: 'cus_createdAt',
      visible: true,
      filterField: 'createdAt',
      dateFilterable: true,
      render: (customer: ICustomer) => (
        <span className='text-gray-600 text-sm sm:text-base truncate block max-w-[140px] sm:max-w-none'>
          {formatDate(customer.cus_createdAt, 'DD/MM/YYYY')}
        </span>
      ),
    },
    {
      key: 'action',
      title: 'Hành động',
      visible: true,
      render: (customer) => (
        <Button
          variant='primary'
          asChild
          className='text-sm sm:text-base px-2 sm:px-4 py-1 sm:py-2'
        >
          <Link
            to={`/erp/cases/new?customerId=${customer?.id || ''}`}
            prefetch='intent'
          >
            <span className='hidden sm:inline'>Thêm Hồ sơ vụ việc</span>
            <span className='sm:hidden'>Thêm vụ việc</span>
          </Link>
        </Button>
      ),
    },
  ]);

  const navigate = useNavigate();

  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      {/* Content Header */}
      <ContentHeader
        title='Danh sách Khách hàng'
        actionContent={
          <>
            <Plus className='w-4 h-4' />
            <span className='hidden sm:inline'>Thêm Khách hàng</span>
            <span className='sm:hidden'>Thêm</span>
          </>
        }
        actionHandler={() => navigate('/erp/customers/new')}
      />

      <List<ICustomer>
        itemsPromise={customersPromise}
        name='Khách hàng'
        exportable
        importable
        setVisibleColumns={setVisibleColumns}
        visibleColumns={visibleColumns}
        addNewHandler={() => navigate('/erp/customers/new')}
      />
    </div>
  );
}

export const action = async ({
  request,
}: ActionFunctionArgs): IActionFunctionReturn<IExportResponse> => {
  const { session, headers } = await isAuthenticated(request);
  if (!session) {
    return data(
      {
        success: false,
        toast: {
          type: 'error',
          message: 'Bạn cần đăng nhập để thực hiện hành động này',
        },
      },
      { headers },
    );
  }

  try {
    const formData = await request.formData();
    switch (request.method) {
      case 'DELETE':
        const customerIdsString = formData.get('itemIds') as string;
        if (!customerIdsString) {
          return data(
            {
              success: false,
              toast: {
                message: 'Không có khách hàng nào được chọn để xóa',
                type: 'error',
              },
            },
            { headers },
          );
        }

        const customerIds = JSON.parse(customerIdsString);
        if (!Array.isArray(customerIds) || customerIds.length === 0) {
          return data(
            {
              success: false,
              toast: {
                message: 'Không có khách hàng nào được chọn để xóa',
                type: 'error',
              },
            },
            { headers },
          );
        }
        // Call the bulk delete function
        await deleteMultipleCustomers(customerIds, session);

        return data(
          {
            success: true,
            toast: {
              type: 'success',
              message: `Đã xóa ${customerIds.length} khách hàng thành công`,
            },
          },
          { headers },
        );

      case 'POST':
        // Handle export action
        const fileType = formData.get('fileType') as string;
        if (!fileType || !['xlsx'].includes(fileType)) {
          return data(
            {
              success: false,
              toast: { type: 'error', message: 'Định dạng file không hợp lệ.' },
            },
            { headers },
          );
        }

        const url = new URL(request.url);
        const fileData = await exportCustomers(
          url.searchParams,
          fileType as 'xlsx',
          session,
        );
        return data(
          {
            success: true,
            toast: {
              type: 'success',
              message: `Đã xuất dữ liệu Khách hàng thành công!`,
            },
            data: {
              fileUrl: fileData.fileUrl,
              fileName: fileData.fileName,
              count: fileData.count,
            },
          },
          { headers },
        );

      default:
        return data(
          {
            success: false,
            toast: { message: 'Phương thức không hợp lệ', type: 'error' },
          },
          { headers },
        );
    }
  } catch (error: any) {
    console.error('Action error:', error);
    return data(
      {
        success: false,
        toast: {
          message: error.message || 'Có lỗi xảy ra khi thực hiện hành động',
          type: 'error',
        },
      },
      { headers },
    );
  }
};
