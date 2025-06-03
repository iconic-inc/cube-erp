import { NotFoundError, BadRequestError } from '../core/errors';
import { CustomerModel } from '../models/customer.model';
import { CaseServiceModel } from '../models/caseService.model';
import { EmployeeModel } from '../models/employee.model';
import {
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
import { FilterQuery, UpdateQuery } from 'mongoose';
import mongoose from 'mongoose';
import * as path from 'path';
import * as fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
import * as XLSX from 'xlsx';

interface ICustomerQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Enhanced createCustomer method to support creating customer with case service
const createCustomer = async (customerData: ICustomerCreate) => {
  try {
    // Check for existing customer with same email or msisdn
    const [existingCustomerByEmail, existingCustomerByMsisdn] =
      await Promise.all([
        CustomerModel.findOne({ cus_email: customerData.email }),
        CustomerModel.findOne({ cus_msisdn: customerData.msisdn }),
      ]);

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
      email: customerData.email,
      msisdn: customerData.msisdn,
      address: customerData.address,
      sex: customerData.sex,
      contactChannel: customerData.contactChannel,
      source: customerData.source,
      notes: customerData.notes,
      code: customerData.code,
      birthDate: customerData.birthDate,
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
    const { page = 1, limit = 10, search, sortBy, sortOrder } = query;

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
            { cus_address: searchRegex },
            { cus_notes: searchRegex },
          ],
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
      data: getReturnList(customers),
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

    // Check for email or phone number duplication
    if (customerData.email) {
      const duplicateEmail = await CustomerModel.findOne({
        cus_email: customerData.email,
        _id: { $ne: customerId },
      });
      if (duplicateEmail) {
        throw new BadRequestError('Email đã được sử dụng cho khách hàng khác');
      }
    }

    if (customerData.msisdn) {
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
    const cleanedData = removeNestedNullish<ICustomerUpdate>(customerData);
    const formattedData = formatAttributeName(cleanedData, CUSTOMER.PREFIX);

    // Update customer
    const updatedCustomer = await CustomerModel.findByIdAndUpdate(
      customerId,
      { $set: formattedData },
      { new: true }
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
        'Không thể xóa khách hàng có liên kết với các dịch vụ hồ sơ'
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
        'Không thể xóa khách hàng có liên kết với các dịch vụ hồ sơ'
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
        { cus_fistName: { $regex: searchText, $options: 'i' } },
        { cus_lastName: { $regex: searchText, $options: 'i' } },
        { cus_email: { $regex: searchText, $options: 'i' } },
        { cus_msisdn: { $regex: searchText, $options: 'i' } },
        { cus_notes: { $regex: searchText, $options: 'i' } },
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
      cus_sex: CUSTOMER.SEX.MALE,
    });

    const femaleCount = await CustomerModel.countDocuments({
      ...query,
      cus_sex: CUSTOMER.SEX.FEMALE,
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

const addCustomerInteraction = async (
  customerId: string,
  interaction: {
    type: 'call' | 'message' | 'meeting' | 'email' | 'other';
    notes?: string;
    staff?: string;
  }
) => {
  try {
    // Check if customer exists
    const customer = await CustomerModel.findById(customerId);

    if (!customer) {
      throw new NotFoundError('Không tìm thấy khách hàng');
    }

    // Check if staff exists (if staff ID provided)
    if (interaction.staff) {
      const staffExists = await EmployeeModel.findById(interaction.staff);
      if (!staffExists) {
        throw new BadRequestError('Không tìm thấy nhân viên');
      }
    }

    // Add interaction to customer document
    // Note: We'd need to extend the customer model to support interactions
    // For now, let's modify the customer's notes field
    const currentNotes = customer.cus_notes || '';
    const interactionNote = `[${new Date().toISOString()}] ${interaction.type.toUpperCase()}${
      interaction.staff ? ` bởi ${interaction.staff}` : ''
    }: ${interaction.notes || 'Không có thông tin chi tiết'}`;

    // Update the customer notes
    const updatedCustomer = await CustomerModel.findByIdAndUpdate(
      customerId,
      {
        cus_notes: currentNotes
          ? `${currentNotes}\n\n${interactionNote}`
          : interactionNote,
      },
      { new: true }
    );

    if (!updatedCustomer) {
      throw new Error('Không thể cập nhật tương tác cho khách hàng');
    }

    return {
      success: true,
      message: 'Ghi nhận tương tác khách hàng thành công',
      interaction: {
        type: interaction.type,
        timestamp: new Date().toISOString(),
        staff: interaction.staff,
        notes: interaction.notes,
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
        `Đã xảy ra lỗi khi thêm tương tác khách hàng: ${error.message}`
      );
    }
    throw error;
  }
};

// Export functions for CSV format
const exportCustomersToCSV = async (queryParams: any) => {
  try {
    // Get customers based on query params
    const customersList = await searchCustomers(queryParams);

    // Create directory if it doesn't exist
    const exportDir = path.join(process.cwd(), 'public', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Create timestamp for unique filename
    const timestamp = new Date().getTime();
    const filePath = path.join(exportDir, `customers_${timestamp}.csv`);

    // Define CSV headers
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'firstName', title: 'First Name' },
        { id: 'lastName', title: 'Last Name' },
        { id: 'email', title: 'Email' },
        { id: 'phone', title: 'Phone' },
        { id: 'address', title: 'Address' },
        { id: 'sex', title: 'Gender' },
        { id: 'contactChannel', title: 'Contact Channel' },
        { id: 'source', title: 'Source' },
        { id: 'notes', title: 'Notes' },
        { id: 'createdAt', title: 'Created At' },
        { id: 'updatedAt', title: 'Updated At' },
      ],
    });

    // Map customer data to CSV format
    const csvData = customersList.map((customer: any) => {
      return {
        firstName: customer.cus_fistName || '',
        lastName: customer.cus_lastName || '',
        email: customer.cus_email || '',
        phone: customer.cus_msisdn || '',
        address: customer.cus_address || '',
        sex: customer.cus_sex || '',
        contactChannel: customer.cus_contactChannel || '',
        source: customer.cus_source || '',
        notes: customer.cus_notes || '',
        createdAt: customer.createdAt
          ? new Date(customer.createdAt).toISOString()
          : '',
        updatedAt: customer.updatedAt
          ? new Date(customer.updatedAt).toISOString()
          : '',
      };
    });

    // Write data to CSV file
    await csvWriter.writeRecords(csvData);

    return {
      filePath: `/exports/customers_${timestamp}.csv`,
      fileName: `customers_${timestamp}.csv`,
      count: csvData.length,
    };
  } catch (error) {
    // Wrap original error with Vietnamese message if it's a standard Error
    if (
      error instanceof Error &&
      !(error instanceof BadRequestError) &&
      !(error instanceof NotFoundError)
    ) {
      throw new Error(
        `Đã xảy ra lỗi khi xuất dữ liệu khách hàng ra CSV: ${error.message}`
      );
    }
    throw error;
  }
};

// Export functions for XLSX format
const exportCustomersToXLSX = async (queryParams: any) => {
  try {
    // Get customers based on query params
    const customersList = await searchCustomers(queryParams);

    // Create directory if it doesn't exist
    const exportDir = path.join(process.cwd(), 'public', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Create timestamp for unique filename
    const timestamp = new Date().getTime();
    const filePath = path.join(exportDir, `customers_${timestamp}.xlsx`);

    // Map customer data for Excel
    const excelData = customersList.map((customer: any) => {
      return {
        'First Name': customer.cus_fistName || '',
        'Last Name': customer.cus_lastName || '',
        Email: customer.cus_email || '',
        Phone: customer.cus_msisdn || '',
        Address: customer.cus_address || '',
        Gender: customer.cus_sex || '',
        'Contact Channel': customer.cus_contactChannel || '',
        Source: customer.cus_source || '',
        Notes: customer.cus_notes || '',
        'Created At': customer.createdAt
          ? new Date(customer.createdAt).toISOString()
          : '',
        'Updated At': customer.updatedAt
          ? new Date(customer.updatedAt).toISOString()
          : '',
      };
    });

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');

    // Write to file
    XLSX.writeFile(workbook, filePath);

    return {
      filePath: `/exports/customers_${timestamp}.xlsx`,
      fileName: `customers_${timestamp}.xlsx`,
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

export {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  deleteMultipleCustomers,
  searchCustomers,
  getCustomerStatistics,
  addCustomerInteraction,
  exportCustomersToCSV,
  exportCustomersToXLSX,
};
