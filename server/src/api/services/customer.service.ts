import { NotFoundError, BadRequestError } from '../core/errors';
import { CustomerModel } from '../models/customer.model';
import { CaseServiceModel } from '../models/caseService.model';
import {
  ICustomer,
  ICustomerCreate,
  ICustomerUpdate,
} from '../interfaces/customer.interface';
import {
  getReturnData,
  getReturnList,
  removeNestedNullish,
} from '@utils/index';
import { CUSTOMER } from '../constants';
import { formatAttributeName } from '../utils';
import { FilterQuery } from 'mongoose';
import mongoose from 'mongoose';
import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { serverConfig } from '@configs/config.server';
import {
  getDistrictBySlug,
  getDistrictsByProvinceCode,
  getProvinceBySlug,
  provinces,
  toAddressString,
} from '@utils/address.util';
import { format, parse } from 'date-fns';

interface ICustomerQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  source?: string;
  contactChannel?: string;
  province?: string;
  district?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
}

// Enhanced createCustomer method to support creating customer with case service
const createCustomer = async (customerData: ICustomerCreate) => {
  try {
    // Check for existing customer with same email or msisdn (only if provided)
    const checks = [];

    // Only check email if it's provided and not empty
    if (customerData.email && customerData.email.trim()) {
      checks.push(CustomerModel.findOne({ cus_email: customerData.email }));
    } else {
      checks.push(Promise.resolve(null));
    }

    // Always check msisdn if provided
    if (customerData.msisdn) {
      checks.push(CustomerModel.findOne({ cus_msisdn: customerData.msisdn }));
    } else {
      checks.push(Promise.resolve(null));
    }

    const [existingCustomerByEmail, existingCustomerByMsisdn] =
      await Promise.all(checks);

    if (existingCustomerByEmail) {
      throw new BadRequestError('Email khách hàng đã tồn tại trong hệ thống');
    }

    if (existingCustomerByMsisdn) {
      throw new BadRequestError(
        'Số điện thoại khách hàng đã tồn tại trong hệ thống'
      );
    }

    // Format and create new customer
    const newCustomer = await CustomerModel.build({
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      email:
        customerData.email && customerData.email.trim()
          ? customerData.email
          : undefined,
      msisdn: customerData.msisdn,
      address: {
        province: customerData.province || '',
        district: customerData.district || '',
        street: customerData.street || '',
      },
      sex: customerData.sex,
      contactChannel: customerData.contactChannel,
      source: customerData.source,
      notes: customerData.notes,
      code: customerData.code,
      birthDate: customerData.birthDate,
      createdAt: new Date(customerData.createdAt || Date.now()).toISOString(),
    });

    return getReturnData(newCustomer);
  } catch (error) {
    // Wrap original error with Vietnamese message if it's a standard Error
    if (
      error instanceof Error &&
      !(error instanceof BadRequestError) &&
      !(error instanceof NotFoundError)
    ) {
      throw new Error(`Đã xảy ra lỗi khi tạo khách hàng: ${error.message}`);
    }
    throw error;
  }
};

const getCustomers = async (query: ICustomerQuery = {}) => {
  try {
    // Apply pagination options
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder,
      source,
      contactChannel,
      province,
      district,
      createdAtFrom,
      createdAtTo,
    } = query;

    // Build the aggregation pipeline
    const pipeline: any[] = [];

    // Stage 1: Search filter if provided
    if (search) {
      const searchRegex = new RegExp(search, 'i'); // Case-insensitive search
      pipeline.push({
        $match: {
          $or: [
            { cus_firstName: searchRegex },
            { cus_lastName: searchRegex },
            { cus_email: searchRegex },
            { cus_msisdn: searchRegex },
            { cus_code: searchRegex },
            { cus_notes: searchRegex },
          ],
        },
      });
    }

    if (source) {
      pipeline.push({
        $match: {
          cus_source: source,
        },
      });
    }
    if (contactChannel) {
      pipeline.push({
        $match: {
          cus_contactChannel: contactChannel,
        },
      });
    }

    // Filter by province if provided
    if (province) {
      pipeline.push({
        $match: {
          'cus_address.province': province,
        },
      });
    }

    // Filter by district if provided
    if (district) {
      pipeline.push({
        $match: {
          'cus_address.district': district,
        },
      });
    }

    // Filter by createdAt date range if provided
    if (createdAtFrom || createdAtTo) {
      const dateFilter: any = {};
      if (createdAtFrom) {
        dateFilter.$gte = new Date(createdAtFrom);
      }
      if (createdAtTo) {
        dateFilter.$lte = new Date(createdAtTo);
      }
      pipeline.push({
        $match: {
          createdAt: dateFilter,
        },
      });
    }

    // Stage 2: Project to include only necessary fields
    pipeline.push({
      $project: {
        _id: 1,
        cus_firstName: 1,
        cus_lastName: 1,
        cus_email: 1,
        cus_msisdn: 1,
        cus_address: 1,
        cus_sex: 1,
        cus_contactChannel: 1,
        cus_source: 1,
        cus_notes: 1,
        cus_code: 1,
        cus_birthDate: 1,
        cus_createdAt: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    });

    // Stage 3: Sort the results
    const sortField = sortBy || 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    pipeline.push({
      $sort: { [sortField]: sortDirection },
    });

    // Get total count first (for pagination)
    const countPipeline = [...pipeline]; // Clone the pipeline
    countPipeline.push({ $count: 'total' });
    const countResult = await CustomerModel.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Stage 4: Apply pagination
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: +limit });

    // Execute the aggregation
    const customers = await CustomerModel.aggregate(pipeline);
    const totalPages = Math.ceil(total / limit);

    return {
      data: getReturnList<ICustomer>(customers),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    // Wrap original error with Vietnamese message if it's a standard Error
    if (
      error instanceof Error &&
      !(error instanceof BadRequestError) &&
      !(error instanceof NotFoundError)
    ) {
      throw new Error(
        `Đã xảy ra lỗi khi lấy danh sách khách hàng: ${error.message}`
      );
    }
    throw error;
  }
};

const getCustomerById = async (customerId: string) => {
  try {
    const customer = await CustomerModel.findById(customerId);

    if (!customer) {
      throw new NotFoundError('Không tìm thấy khách hàng');
    }

    return getReturnData(customer);
  } catch (error) {
    // Wrap original error with Vietnamese message if it's a standard Error
    if (
      error instanceof Error &&
      !(error instanceof BadRequestError) &&
      !(error instanceof NotFoundError)
    ) {
      throw new Error(
        `Đã xảy ra lỗi khi lấy thông tin khách hàng: ${error.message}`
      );
    }
    throw error;
  }
};

const updateCustomer = async (
  customerId: string,
  customerData: ICustomerUpdate
) => {
  try {
    // Check if customer exists
    const existingCustomer = await CustomerModel.findById(customerId);

    if (!existingCustomer) {
      throw new NotFoundError('Không tìm thấy khách hàng');
    }

    // Check for email or phone number duplication (only if provided and not empty)
    if (customerData.email && customerData.email.trim()) {
      const duplicateEmail = await CustomerModel.findOne({
        cus_email: customerData.email,
        _id: { $ne: customerId },
      });
      if (duplicateEmail) {
        throw new BadRequestError('Email đã được sử dụng cho khách hàng khác');
      }
    }

    if (customerData.msisdn && customerData.msisdn.trim()) {
      const duplicatePhone = await CustomerModel.findOne({
        cus_msisdn: customerData.msisdn,
        _id: { $ne: customerId },
      });
      if (duplicatePhone) {
        throw new BadRequestError(
          'Số điện thoại đã được sử dụng cho khách hàng khác'
        );
      }
    }

    // Format and clean data
    const cleanedData = removeNestedNullish<ICustomerUpdate>({
      ...customerData,
      // Convert empty email strings to undefined to avoid unique constraint issues
      email:
        customerData.email && customerData.email.trim()
          ? customerData.email
          : undefined,
    });
    const formattedData = formatAttributeName(
      {
        ...cleanedData,
        address: {
          province: cleanedData.province,
          district: cleanedData.district,
          street: cleanedData.street,
        },
      },
      CUSTOMER.PREFIX
    );

    // Update customer
    const updatedCustomer = await CustomerModel.findByIdAndUpdate(
      customerId,
      {
        $set: formattedData,
      },
      { new: true, timestamps: false }
    );

    if (!updatedCustomer) {
      throw new NotFoundError('Không tìm thấy khách hàng sau khi cập nhật');
    }

    return getReturnData(updatedCustomer);
  } catch (error) {
    // Wrap original error with Vietnamese message if it's a standard Error
    if (
      error instanceof Error &&
      !(error instanceof BadRequestError) &&
      !(error instanceof NotFoundError)
    ) {
      throw new Error(
        `Đã xảy ra lỗi khi cập nhật khách hàng: ${error.message}`
      );
    }
    throw error;
  }
};

const deleteCustomer = async (customerId: string) => {
  try {
    // Check if customer exists
    const customer = await CustomerModel.findById(customerId);

    if (!customer) {
      throw new NotFoundError('Không tìm thấy khách hàng');
    }

    // Check if customer has associated case services
    const associatedCases = await CaseServiceModel.findOne({
      case_customer: customerId,
    });

    if (associatedCases) {
      throw new BadRequestError(
        'Không thể xóa khách hàng có liên kết với các Hồ sơ vụ việc. Vui lòng xóa các Hồ sơ vụ việc trước.'
      );
    }

    // Delete customer
    const deleteResult = await CustomerModel.deleteOne({ _id: customerId });

    if (deleteResult.deletedCount === 0) {
      throw new Error('Không thể xóa khách hàng');
    }

    return {
      success: true,
      message: 'Xóa khách hàng thành công',
    };
  } catch (error) {
    // Wrap original error with Vietnamese message if it's a standard Error
    if (
      error instanceof Error &&
      !(error instanceof BadRequestError) &&
      !(error instanceof NotFoundError)
    ) {
      throw new Error(`Đã xảy ra lỗi khi xóa khách hàng: ${error.message}`);
    }
    throw error;
  }
};

const deleteMultipleCustomers = async ({
  customerIds,
}: {
  customerIds: string[];
}) => {
  let session;
  try {
    // Validate input
    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      throw new BadRequestError('Yêu cầu danh sách ID khách hàng hợp lệ');
    }

    // Check if any customer has associated case services
    const associatedCases = await CaseServiceModel.findOne({
      case_customer: { $in: customerIds },
    });

    if (associatedCases) {
      throw new BadRequestError(
        'Không thể xóa khách hàng có liên kết với các Hồ sơ vụ việc. Vui lòng xóa các Hồ sơ vụ việc trước.'
      );
    }

    // Start transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // Delete customers
    const deleteResult = await CustomerModel.deleteMany(
      { _id: { $in: customerIds } },
      { session }
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      message: 'Xóa nhiều khách hàng thành công',
      count: deleteResult.deletedCount,
    };
  } catch (error) {
    // Rollback transaction if there's an error
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    // Wrap original error with Vietnamese message if it's a standard Error
    if (
      error instanceof Error &&
      !(error instanceof BadRequestError) &&
      !(error instanceof NotFoundError)
    ) {
      throw new Error(
        `Đã xảy ra lỗi khi xóa nhiều khách hàng: ${error.message}`
      );
    }
    throw error;
  }
};

const searchCustomers = async (searchQuery: any) => {
  try {
    let query: FilterQuery<any> = {};

    // Build search query based on provided fields
    if (searchQuery.text) {
      const searchText = searchQuery.text;
      query.$or = [
        { cus_firstName: { $regex: searchText, $options: 'i' } },
        { cus_lastName: { $regex: searchText, $options: 'i' } },
        { cus_email: { $regex: searchText, $options: 'i' } },
        { cus_msisdn: { $regex: searchText, $options: 'i' } },
        { cus_notes: { $regex: searchText, $options: 'i' } },
        { 'cus_address.province': { $regex: searchText, $options: 'i' } },
        { 'cus_address.district': { $regex: searchText, $options: 'i' } },
        { 'cus_address.street': { $regex: searchText, $options: 'i' } },
      ];
    }

    // Add filters for specific fields if provided
    if (searchQuery.sex) {
      query.cus_sex = searchQuery.sex;
    }

    if (searchQuery.source) {
      query.cus_source = searchQuery.source;
    }

    if (searchQuery.contactChannel) {
      query.cus_contactChannel = searchQuery.contactChannel;
    }

    // Filter by address components if provided
    if (searchQuery.province) {
      query['cus_address.province'] = searchQuery.province;
    }

    if (searchQuery.district) {
      query['cus_address.district'] = searchQuery.district;
    }

    // Date range filters
    if (searchQuery.startDate || searchQuery.endDate) {
      query.createdAt = {};

      if (searchQuery.startDate) {
        query.createdAt.$gte = new Date(searchQuery.startDate);
      }

      if (searchQuery.endDate) {
        query.createdAt.$lte = new Date(searchQuery.endDate);
      }
    }

    // Get results
    const customers = await CustomerModel.find(query).sort({ createdAt: -1 });

    return getReturnList(customers);
  } catch (error) {
    // Wrap original error with Vietnamese message if it's a standard Error
    if (
      error instanceof Error &&
      !(error instanceof BadRequestError) &&
      !(error instanceof NotFoundError)
    ) {
      throw new Error(
        `Đã xảy ra lỗi khi tìm kiếm khách hàng: ${error.message}`
      );
    }
    throw error;
  }
};

const getCustomerStatistics = async (query: any) => {
  try {
    // Get total count
    const totalCustomers = await CustomerModel.countDocuments(query);

    // Get count by gender
    const maleCount = await CustomerModel.countDocuments({
      ...query,
      cus_sex: CUSTOMER.SEX.MALE.value,
    });

    const femaleCount = await CustomerModel.countDocuments({
      ...query,
      cus_sex: CUSTOMER.SEX.FEMALE.value,
    });

    // Get count by source
    const sourceStats = await CustomerModel.aggregate([
      { $match: query },
      { $group: { _id: '$cus_source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get count by contactChannel
    const channelStats = await CustomerModel.aggregate([
      { $match: query },
      { $group: { _id: '$cus_contactChannel', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get new customers per month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await CustomerModel.aggregate([
      {
        $match: {
          ...query,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return {
      totalCustomers,
      genderDistribution: {
        male: maleCount,
        female: femaleCount,
        other: totalCustomers - maleCount - femaleCount,
      },
      sourceDistribution: sourceStats,
      channelDistribution: channelStats,
      monthlyGrowth: monthlyStats,
    };
  } catch (error) {
    // Wrap original error with Vietnamese message if it's a standard Error
    if (
      error instanceof Error &&
      !(error instanceof BadRequestError) &&
      !(error instanceof NotFoundError)
    ) {
      throw new Error(
        `Đã xảy ra lỗi khi lấy thống kê khách hàng: ${error.message}`
      );
    }
    throw error;
  }
};

/**
 * Export customers data to XLSX file
 * @param queryParams Query parameters for filtering customers
 */
const exportCustomersToXLSX = async (queryParams: any) => {
  try {
    // Get customers based on query params
    const { data: customersList } = await getCustomers(queryParams);

    // Create directory if it doesn't exist
    const exportDir = path.join(process.cwd(), 'public', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    } else {
      // Clean up old export files
      try {
        for (const file of fs.readdirSync(exportDir)) {
          if (file.startsWith('khach_hang_')) {
            fs.unlinkSync(path.join(exportDir, file));
          }
        }
      } catch (error) {
        console.warn('Error cleaning up old export files:', error);
        // Continue execution even if cleanup fails
      }
    }

    // Create timestamp for unique filename
    const timestamp = new Date().getTime();
    const fileName = `khach_hang_${new Date()
      .toLocaleDateString('vi-VN')
      .split('/')
      .join('-')}_${timestamp}.xlsx`;
    const filePath = path.join(exportDir, fileName);

    // Map customer data for Excel
    const excelData = customersList.map((customer) => {
      // Format address from object to string
      let addressString = '';
      if (customer.cus_address) {
        addressString = toAddressString(customer.cus_address);
      }

      return {
        'Mã khách hàng': customer.cus_code || '',
        Họ: customer.cus_lastName || '',
        Tên: customer.cus_firstName || '',
        Email: customer.cus_email || '',
        'Số điện thoại': customer.cus_msisdn || '',
        'Địa chỉ': addressString,
        'Giới tính':
          Object.values(CUSTOMER.SEX).find(
            (item) => item.value === customer.cus_sex
          )?.label || '',
        'Kênh liên hệ':
          Object.values(CUSTOMER.CONTACT_CHANNEL).find(
            (item) => item.value === customer.cus_contactChannel
          )?.label || '',
        Nguồn:
          Object.values(CUSTOMER.SOURCE).find(
            (item) => item.value === customer.cus_source
          )?.label || '',
        'Ghi chú': customer.cus_notes || '',
        'Ngày sinh': customer.cus_birthDate
          ? format(new Date(customer.cus_birthDate), 'dd/MM/yyyy')
          : '',
        'Tạo lúc': customer.cus_createdAt
          ? format(new Date(customer.cus_createdAt), 'HH:mm dd/MM/yyyy')
          : '',
        'Cập nhật lúc': customer.updatedAt
          ? format(new Date(customer.updatedAt), 'HH:mm dd/MM/yyyy')
          : '',
      };
    });

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Khách hàng');

    // Write to file with error handling
    try {
      XLSX.writeFile(workbook, filePath);
    } catch (error) {
      throw new Error(
        `Không thể tạo file Excel: ${
          error instanceof Error ? error.message : 'Lỗi không xác định'
        }`
      );
    }

    // Verify file was created
    if (!fs.existsSync(filePath)) {
      throw new Error('File Excel được tạo nhưng không thể tìm thấy');
    }

    return {
      fileUrl: `${serverConfig.serverUrl}/exports/${fileName}`,
      fileName: fileName,
      count: excelData.length,
    };
  } catch (error) {
    // Wrap original error with Vietnamese message if it's a standard Error
    if (
      error instanceof Error &&
      !(error instanceof BadRequestError) &&
      !(error instanceof NotFoundError)
    ) {
      throw new Error(
        `Đã xảy ra lỗi khi xuất dữ liệu khách hàng ra XLSX: ${error.message}`
      );
    }
    throw error;
  }
};

/**
 * Import customers data from XLSX file
 * @param filePath Path to the Excel file to import
 * @param options Import options
 */
const importCustomersFromXLSX = async (
  filePath: string,
  options: {
    skipDuplicates?: boolean;
    updateExisting?: boolean;
    skipEmptyRows?: boolean;
  } = {}
) => {
  let session;
  try {
    const {
      skipDuplicates = true,
      updateExisting = false,
      skipEmptyRows = true,
    } = options;

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new BadRequestError('Không tìm thấy file Excel để import');
    }

    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    if (!rawData || rawData.length === 0) {
      throw new BadRequestError(
        'File Excel không có dữ liệu hoặc định dạng không đúng'
      );
    }

    // Start transaction
    session = await mongoose.startSession();
    session.startTransaction();

    const results = {
      total: rawData.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; error: string; data?: any }>,
    };

    // Process each row
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i] as any;
      const rowNumber = i + 2; // +2 because Excel is 1-indexed and first row is header

      try {
        // Skip empty rows if option is enabled
        if (skipEmptyRows && isEmptyRow(row)) {
          results.skipped++;
          continue;
        }

        // Map Excel columns to customer data
        const customerData = mapExcelRowToCustomer(row);

        // Validate required fields
        if (!customerData.firstName && !customerData.lastName) {
          results.errors.push({
            row: rowNumber,
            error: 'Thiếu thông tin họ tên',
            data: row,
          });
          continue;
        }

        if (!customerData.msisdn && !customerData.email) {
          results.errors.push({
            row: rowNumber,
            error: 'Phải có ít nhất số điện thoại hoặc email',
            data: row,
          });
          continue;
        }

        // Validate email format if provided
        if (
          customerData.email &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)
        ) {
          results.errors.push({
            row: rowNumber,
            error: 'Định dạng email không hợp lệ',
            data: row,
          });
          continue;
        }

        // Validate phone number format if provided
        if (
          customerData.msisdn &&
          !/^[0-9+\-\s()]{8,15}$/.test(customerData.msisdn)
        ) {
          results.errors.push({
            row: rowNumber,
            error: 'Định dạng số điện thoại không hợp lệ',
            data: row,
          });
          continue;
        }

        // Check for existing customer
        const existingCustomer = await findExistingCustomer(customerData);

        if (existingCustomer) {
          if (skipDuplicates && !updateExisting) {
            results.skipped++;
            continue;
          } else if (updateExisting) {
            // Update existing customer
            await CustomerModel.findByIdAndUpdate(
              existingCustomer._id,
              formatAttributeName(
                {
                  ...customerData,
                  birthDate: customerData.birthDate,
                  address: {
                    province: customerData.province || '',
                    district: customerData.district || '',
                    street: customerData.street || '',
                  },
                },
                CUSTOMER.PREFIX
              ),
              { session, new: true }
            );
            results.updated++;
          } else {
            results.errors.push({
              row: rowNumber,
              error: 'Khách hàng đã tồn tại (email hoặc số điện thoại trùng)',
              data: row,
            });
          }
        } else {
          // Create new customer
          await CustomerModel.build({
            firstName: customerData.firstName,
            lastName: customerData.lastName,
            email: customerData.email,
            msisdn: customerData.msisdn,
            address: {
              province: customerData.province || '',
              district: customerData.district || '',
              street: customerData.street || '',
            },
            sex: customerData.sex,
            contactChannel: customerData.contactChannel,
            source: customerData.source,
            notes: customerData.notes,
            code: customerData.code,
            birthDate: customerData.birthDate,
            createdAt: customerData.createdAt,
          });
          results.imported++;
        }
      } catch (error) {
        console.log('Error importing customer data:', error);
        results.errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Lỗi không xác định',
          data: row,
        });
      }
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return results;
  } catch (error) {
    // Rollback transaction if there's an error
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }

    // Wrap original error with Vietnamese message if it's a standard Error
    if (
      error instanceof Error &&
      !(error instanceof BadRequestError) &&
      !(error instanceof NotFoundError)
    ) {
      throw new Error(
        `Đã xảy ra lỗi khi import dữ liệu khách hàng từ XLSX: ${error.message}`
      );
    }
    throw error;
  }
};

/**
 * Helper function to check if a row is empty
 */
const isEmptyRow = (row: any): boolean => {
  const values = Object.values(row);
  return values.every(
    (value) =>
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '')
  );
};

/**
 * Helper function to map Excel row to customer data
 */
const mapExcelRowToCustomer = (row: any) => {
  const sexRow = row['Giới tính'];
  const contactChannelRow = row['Kênh liên hệ'];
  const sourceRow = row['Nguồn'];

  let birthDate: string | undefined,
    createdAt: string = new Date().toISOString();
  if (row['Ngày sinh']) {
    try {
      birthDate = parse(
        row['Ngày sinh'],
        'dd/MM/yyyy',
        new Date()
      ).toISOString();
    } catch (error) {
      console.warn('Error parsing birth date:', error);
    }
  }
  if (row['Tạo lúc']) {
    try {
      createdAt = parse(
        row['Tạo lúc'],
        'HH:mm dd/MM/yyyy',
        new Date()
      ).toISOString();
    } catch (error) {
      console.warn('Error parsing created date:', error);
    }
  }

  // Parse address string to extract province, district, and street
  const addressString = row['Địa chỉ'] || '';
  let province = '',
    district = '',
    street = '';

  if (addressString) {
    // Try to parse address format: "street, district, province"
    const addressParts = addressString
      .split(',')
      .map((part: string) => part.trim());
    if (addressParts.length >= 3) {
      street = addressParts.slice(0, -2).join(', ');
      district = addressParts[addressParts.length - 2];
      province = addressParts[addressParts.length - 1];
    } else if (addressParts.length === 2) {
      street = addressParts[0];
      province = addressParts[1];
    } else {
      street = addressString;
    }
  }

  return {
    code: row['Mã khách hàng'] || '',
    lastName: row['Họ'] || '',
    firstName: row['Tên'] || '',
    email:
      row['Email'] && row['Email'].trim() ? row['Email'].trim() : undefined,
    msisdn: row['Số điện thoại'] || '',
    province,
    district,
    street,
    sex: Object.values(CUSTOMER.SEX).find((item) => item.label === sexRow)
      ?.value,
    contactChannel:
      Object.values(CUSTOMER.CONTACT_CHANNEL).find(
        (item) => item.label === contactChannelRow
      )?.value || CUSTOMER.CONTACT_CHANNEL.OTHER.value,
    source:
      Object.values(CUSTOMER.SOURCE).find((item) => item.label === sourceRow)
        ?.value || CUSTOMER.SOURCE.OTHER.value,
    notes: row['Ghi chú'] || '',
    birthDate,
    createdAt,
  };
};

/**
 * Helper function to find existing customer by email or phone
 */
const findExistingCustomer = async (customerData: any) => {
  const conditions = [];

  if (customerData.email) {
    conditions.push({ cus_email: customerData.email });
  }

  if (customerData.msisdn) {
    conditions.push({ cus_msisdn: customerData.msisdn });
  }

  if (conditions.length === 0) {
    return null;
  }

  return await CustomerModel.findOne({ $or: conditions });
};

export {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  deleteMultipleCustomers,
  searchCustomers,
  getCustomerStatistics,
  exportCustomersToXLSX,
  importCustomersFromXLSX,
};
