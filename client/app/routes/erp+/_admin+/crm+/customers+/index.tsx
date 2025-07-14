import { ActionFunctionArgs, data, LoaderFunctionArgs } from '@remix-run/node';
import {
  Link,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from '@remix-run/react';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

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
import { canAccessCustomerManagement } from '~/utils/permission';
import {
  getDistrictBySlug,
  getDistrictsByProvinceCode,
  getProvinceBySlug,
  provinces,
  toAddressString,
} from '~/utils/address.util';
import { CUSTOMER } from '~/constants/customer.constant';
import { formatDate } from '~/utils';

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
  const [province, setProvince] = useState(provinces[0]);
  const [districts, setDistricts] = useState(
    getDistrictsByProvinceCode(province.code),
  );

  // Handle province changes
  useEffect(() => {
    const provinceSlug = searchParams.get('province');
    const selectedProvince =
      getProvinceBySlug(provinceSlug || '') || provinces[0];

    setProvince(selectedProvince);

    const newDistricts = getDistrictsByProvinceCode(selectedProvince.code);
    setDistricts(newDistricts);
    setVisibleColumns((prevColumns) =>
      prevColumns.map((col) => {
        if (col.key === 'district') {
          return {
            ...col,
            options: newDistricts.map((d) => ({
              value: d.slug,
              label: d.name,
            })),
          };
        }
        return col;
      }),
    );
  }, [searchParams]);

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
          to={`/erp/crm/customers/${customer.id}`}
          className='text-blue-600 hover:underline flex flex-col'
        >
          <span>
            {customer.cus_firstName} {customer.cus_lastName}
          </span>
          <span className='text-gray-500 text-sm truncate'>
            {customer.cus_code || 'Chưa có mã'}
          </span>
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
            to={`tel:${customer.cus_msisdn}`}
            className='text-blue-600 hover:underline truncate'
            onClick={(e) => e.stopPropagation()}
          >
            {customer.cus_msisdn}
          </Link>
        ) : (
          'Chưa có số điện thoại'
        ),
    },
    {
      key: 'contactChannel',
      title: 'Kênh liên hệ',
      sortField: 'cus_contactChannel',
      visible: true,
      filterField: 'contactChannel',
      options: Object.values(CUSTOMER.CONTACT_CHANNEL),
      render: (customer: ICustomer) =>
        getContactChannelLabel(customer.cus_contactChannel),
    },
    {
      key: 'source',
      title: 'Nguồn khách hàng',
      sortField: 'cus_source',
      visible: true,
      filterField: 'source',
      options: Object.values(CUSTOMER.SOURCE),
      render: (customer: ICustomer) => getSourceLabel(customer.cus_source),
    },
    {
      key: 'address',
      title: 'Địa chỉ',
      sortField: 'cus_address.district',
      visible: true,
      render: (customer: ICustomer) => toAddressString(customer.cus_address),
    },
    {
      key: 'province',
      title: 'Tỉnh/Thành phố',
      sortField: 'cus_address.province',
      visible: false,
      filterField: 'province',
      options: provinces.map((p) => ({
        value: p.slug,
        label: p.name,
      })),
      render: (customer: ICustomer) =>
        getProvinceBySlug(customer.cus_address.province)?.name,
    },
    {
      key: 'district',
      title: 'Quận/Huyện',
      sortField: 'cus_address.district',
      visible: false,
      filterField: 'district',
      options: districts.map((p) => ({
        value: p.slug,
        label: p.name,
      })),
      render: (customer: ICustomer) =>
        getDistrictBySlug(districts, customer.cus_address.district)?.name,
    },
    {
      key: 'createdAt',
      title: 'Ngày tạo',
      sortField: 'cus_createdAt',
      visible: true,
      filterField: 'createdAt',
      dateFilterable: true,
      render: (customer: ICustomer) =>
        formatDate(customer.cus_createdAt, 'HH:mm - DD/MM/YYYY'),
    },
    {
      key: 'action',
      title: 'Hành động',
      visible: true,
      render: (customer) => (
        <Button variant='primary' asChild>
          <Link to={`/erp/crm/cases/new?customerId=${customer?.id || ''}`}>
            Thêm Hồ sơ vụ việc
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
            <Plus className='w-4 h-4 mr-2' />
            Thêm Khách hàng
          </>
        }
        actionHandler={() => navigate('/erp/crm/customers/new')}
      />

      <List<ICustomer>
        itemsPromise={customersPromise}
        name='Khách hàng'
        exportable
        setVisibleColumns={setVisibleColumns}
        visibleColumns={visibleColumns}
        addNewHandler={() => navigate('/erp/crm/customers/new')}
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
