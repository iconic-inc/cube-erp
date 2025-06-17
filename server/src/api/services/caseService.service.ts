import { CaseServiceModel } from '@models/caseService.model';
import { Types } from 'mongoose';
import { IResponseList } from '../interfaces/response.interface';

import { BadRequestError, NotFoundError } from '../core/errors';
import {
  formatAttributeName,
  getReturnData,
  getReturnList,
} from '@utils/index';
import { CASE_SERVICE } from '../constants';
import { createObjectCsvWriter } from 'csv-writer';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { TMP_FOLDER } from '@constants/index';
import {
  ICaseServiceCreate,
  ICaseServiceResponse,
} from '../interfaces/caseService.interface';

const getAllCaseServices = async (query: any) => {
  const {
    page = 1,
    limit = 10,
    sort = 'createdAt',
    order = 'desc',
    search = '',
    status,
    startDate,
    endDate,
    leadAttorney,
    customer,
  } = query;

  // Build the filter query
  const filterQuery: any = {};

  if (status) {
    filterQuery.case_status = status;
  }

  if (leadAttorney) {
    filterQuery.case_leadAttorney = new Types.ObjectId(leadAttorney as string);
  }

  if (customer) {
    filterQuery.case_customer = new Types.ObjectId(customer as string);
  }

  // Handle date range filtering
  if (startDate) {
    filterQuery.case_startDate = { $gte: new Date(startDate as string) };
  }

  if (endDate) {
    filterQuery.case_endDate = { $lte: new Date(endDate as string) };
  }

  // Handle search
  if (search) {
    filterQuery.$or = [
      { case_code: { $regex: search, $options: 'i' } },
      { case_notes: { $regex: search, $options: 'i' } },
    ];
  }

  // Calculate pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build sort object
  const sortObj: any = {};
  sortObj[sort as string] = order === 'asc' ? 1 : -1;

  // Execute query with populate
  const caseServices = await CaseServiceModel.find(filterQuery)
    .populate('case_customer', 'cus_firstName cus_lastName cus_email')
    .populate({
      path: 'case_leadAttorney',
      select: 'employeeCode position department',
      populate: {
        path: 'userId',
        select: 'usr_firstName usr_lastName usr_email',
      },
    })
    .populate({
      path: 'case_associateAttorney',
      select: 'employeeCode position department',
      populate: {
        path: 'userId',
        select: 'usr_firstName usr_lastName usr_email',
      },
    })
    .populate({
      path: 'case_paralegal',
      select: 'employeeCode position department',
      populate: {
        path: 'userId',
        select: 'usr_firstName usr_lastName usr_email',
      },
    })
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum)
    .lean();

  // Get total count for pagination
  const total = await CaseServiceModel.countDocuments(filterQuery);

  return {
    data: getReturnList(caseServices) as any[],
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  } as IResponseList<ICaseServiceResponse>;
};

const getCaseServiceById = async (id: string) => {
  const caseService = await CaseServiceModel.findById(id)
    .populate(
      'case_customer',
      'customer_firstName customer_lastName customer_email'
    )
    .populate(
      'case_leadAttorney',
      'employee_firstName employee_lastName employee_email'
    )
    .populate(
      'case_associateAttorney',
      'employee_firstName employee_lastName employee_email'
    )
    .populate(
      'case_paralegal',
      'employee_firstName employee_lastName employee_email'
    );

  if (!caseService) {
    throw new NotFoundError('Case service not found');
  }

  return getReturnData(caseService);
};

const createCaseService = async (caseServiceData: ICaseServiceCreate) => {
  // Generate a unique case code if not provided
  if (!caseServiceData.code) {
    const timestamp = Date.now().toString();
    const randomNum = Math.floor(Math.random() * 9000 + 1000).toString();
    caseServiceData.code = `CS-${timestamp.substring(
      timestamp.length - 4
    )}${randomNum}`;
  }

  const newCaseService = await CaseServiceModel.build(caseServiceData);
  return getReturnData(newCaseService);
};

const updateCaseService = async (
  id: string,
  caseServiceData: Partial<ICaseServiceCreate>
) => {
  // Find and update
  const updatedCaseService = await CaseServiceModel.findByIdAndUpdate(
    id,
    { $set: formatAttributeName(caseServiceData, CASE_SERVICE.PREFIX) },
    { new: true, runValidators: true }
  ).populate(
    'case_customer case_leadAttorney case_associateAttorney case_paralegal'
  );

  if (!updatedCaseService) {
    throw new NotFoundError('Case service not found');
  }

  return getReturnData(updatedCaseService);
};

const deleteCaseService = async (id: string) => {
  const deletedCaseService = await CaseServiceModel.findByIdAndDelete(id);

  if (!deletedCaseService) {
    throw new NotFoundError('Case service not found');
  }

  return getReturnData(deletedCaseService);
};

/**
 * Export case services to CSV
 */
const exportCaseServicesToCSV = async (query: any) => {
  const { status, startDate, endDate, leadAttorney, customer } = query;

  // Build the filter query
  const filterQuery: any = {};

  if (status) {
    filterQuery.case_status = status;
  }

  if (leadAttorney) {
    filterQuery.case_leadAttorney = new Types.ObjectId(leadAttorney as string);
  }

  if (customer) {
    filterQuery.case_customer = new Types.ObjectId(customer as string);
  }

  // Handle date range filtering
  if (startDate) {
    filterQuery.case_startDate = { $gte: new Date(startDate as string) };
  }

  if (endDate) {
    filterQuery.case_endDate = { $lte: new Date(endDate as string) };
  }

  // Fetch cases with their related data
  const caseServices = await getAllCaseServices(filterQuery);

  // Create a CSV file
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${
    now.getMonth() + 1
  }-${now.getDate()}`;
  const fileName = `case-services-export-${timestamp}.csv`;
  const filePath = path.join(TMP_FOLDER, fileName);

  // Ensure tmp directory exists
  if (!fs.existsSync(TMP_FOLDER)) {
    fs.mkdirSync(TMP_FOLDER, { recursive: true });
  }

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'case_code', title: 'Case Code' },
      { id: 'customer', title: 'Customer' },
      { id: 'leadAttorney', title: 'Lead Attorney' },
      { id: 'associateAttorney', title: 'Associate Attorney' },
      { id: 'paralegal', title: 'Paralegal' },
      { id: 'case_notes', title: 'Notes' },
      { id: 'case_status', title: 'Status' },
      { id: 'case_startDate', title: 'Start Date' },
      { id: 'case_endDate', title: 'End Date' },
      { id: 'createdAt', title: 'Created At' },
      { id: 'updatedAt', title: 'Updated At' },
    ],
  });

  // Format the data for CSV export
  const formattedData = caseServices.data.map((cs) => {
    const customer = cs.case_customer
      ? `${cs.case_customer.cus_firstName} ${cs.case_customer.cus_lastName}`
      : 'N/A';

    const leadAttorney = cs.case_leadAttorney
      ? `${cs.case_leadAttorney.emp_user.usr_firstName} ${cs.case_leadAttorney.emp_user.usr_lastName}`
      : 'N/A';

    const associateAttorney = cs.case_associateAttorney
      ? `${cs.case_associateAttorney.emp_user.usr_firstName} ${cs.case_associateAttorney.emp_user.usr_lastName}`
      : 'N/A';

    const paralegal = cs.case_paralegal
      ? `${cs.case_paralegal.emp_user.usr_firstName} ${cs.case_paralegal.emp_user.usr_lastName}`
      : 'N/A';

    return {
      ...cs,
      customer,
      leadAttorney,
      associateAttorney,
      paralegal,
      case_startDate: cs.case_startDate
        ? new Date(cs.case_startDate).toLocaleDateString()
        : 'N/A',
      case_endDate: cs.case_endDate
        ? new Date(cs.case_endDate).toLocaleDateString()
        : 'N/A',
      createdAt: new Date(cs.createdAt).toLocaleString(),
      updatedAt: new Date(cs.updatedAt).toLocaleString(),
    };
  });

  // Write the CSV file
  await csvWriter.writeRecords(formattedData);

  return { filePath, fileName };
};

/**
 * Export case services to XLSX
 */
const exportCaseServicesToXLSX = async (query: any) => {
  const { status, startDate, endDate, leadAttorney, customer } = query;

  // Build the filter query
  const filterQuery: any = {};

  if (status) {
    filterQuery.case_status = status;
  }

  if (leadAttorney) {
    filterQuery.case_leadAttorney = new Types.ObjectId(leadAttorney as string);
  }

  if (customer) {
    filterQuery.case_customer = new Types.ObjectId(customer as string);
  }

  // Handle date range filtering
  if (startDate) {
    filterQuery.case_startDate = { $gte: new Date(startDate as string) };
  }

  if (endDate) {
    filterQuery.case_endDate = { $lte: new Date(endDate as string) };
  }

  // Fetch cases with their related data
  const caseServices = await getAllCaseServices(filterQuery);

  // Format the data for XLSX export
  const formattedData = caseServices.data.map((cs) => {
    const customer = cs.case_customer
      ? `${cs.case_customer.cus_firstName} ${cs.case_customer.cus_lastName}`
      : 'N/A';

    const leadAttorney = cs.case_leadAttorney
      ? `${cs.case_leadAttorney.emp_user.usr_firstName} ${cs.case_leadAttorney.emp_user.usr_lastName}`
      : 'N/A';

    const associateAttorney = cs.case_associateAttorney
      ? `${cs.case_associateAttorney.emp_user.usr_firstName} ${cs.case_associateAttorney.emp_user.usr_lastName}`
      : 'N/A';

    const paralegal = cs.case_paralegal
      ? `${cs.case_paralegal.emp_user.usr_firstName} ${cs.case_paralegal.emp_user.usr_lastName}`
      : 'N/A';

    return {
      'Case Code': cs.case_code,
      Customer: customer,
      'Lead Attorney': leadAttorney,
      'Associate Attorney': associateAttorney,
      Paralegal: paralegal,
      Notes: cs.case_notes || 'N/A',
      Status: cs.case_status,
      'Start Date': cs.case_startDate
        ? new Date(cs.case_startDate).toLocaleDateString()
        : 'N/A',
      'End Date': cs.case_endDate
        ? new Date(cs.case_endDate).toLocaleDateString()
        : 'N/A',
      'Created At': new Date(cs.createdAt).toLocaleString(),
      'Updated At': new Date(cs.updatedAt).toLocaleString(),
    };
  });

  // Create a workbook and worksheet
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(formattedData);

  // Add the worksheet to the workbook
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Case Services');

  // Generate the XLSX file
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${
    now.getMonth() + 1
  }-${now.getDate()}`;
  const fileName = `case-services-export-${timestamp}.xlsx`;
  const filePath = path.join(TMP_FOLDER, fileName);

  // Ensure tmp directory exists
  if (!fs.existsSync(TMP_FOLDER)) {
    fs.mkdirSync(TMP_FOLDER, { recursive: true });
  }

  // Write the workbook to file
  xlsx.writeFile(workbook, filePath);

  return { filePath, fileName };
};

/**
 * Process import data from CSV or XLSX
 */
const processImportData = async (importData: any[]) => {
  const processedData = [];
  const errors = [];

  for (const [index, item] of importData.entries()) {
    try {
      // Map the imported data to the CaseService model format
      const caseServiceData: any = {
        code: item['Case Code'] || item['case_code'],
        customer: item['Customer ID'] || item['customer'] || null,
        leadAttorney: item['Lead Attorney ID'] || item['leadAttorney'] || null,
        associateAttorney:
          item['Associate Attorney ID'] || item['associateAttorney'] || null,
        paralegal: item['Paralegal ID'] || item['paralegal'] || null,
        notes: item['Notes'] || item['case_notes'] || null,
        status: item['Status'] || item['case_status'] || 'open',
        startDate:
          item['Start Date'] ||
          item['case_startDate'] ||
          new Date().toISOString(),
        endDate: item['End Date'] || item['case_endDate'] || null,
      };

      // Validate required fields
      if (!caseServiceData.customer || !caseServiceData.leadAttorney) {
        throw new Error('Customer and Lead Attorney are required');
      }

      // Generate case code if not provided
      if (!caseServiceData.code) {
        const timestamp = Date.now().toString();
        const randomNum = Math.floor(Math.random() * 9000 + 1000).toString();
        caseServiceData.code = `CS-${timestamp.substring(
          timestamp.length - 4
        )}${randomNum}`;
      }

      processedData.push(caseServiceData);
    } catch (error: any) {
      errors.push({
        row: index + 2, // +2 because index is 0-based and we skip the header row
        error: error.message,
      });
    }
  }

  return { processedData, errors };
};

/**
 * Import case services
 */
const importCaseServices = async (filePath: string) => {
  // Determine file type
  const fileType = path.extname(filePath).toLowerCase();
  let importData;
  if (fileType === '.csv') {
    importData = parseCSVFile(filePath);
  } else if (fileType === '.xlsx') {
    importData = parseXLSXFile(filePath);
  } else {
    throw new BadRequestError(
      'Unsupported file type. Only CSV and XLSX are allowed.'
    );
  }
  // Process the imported data
  const { processedData, errors } = await processImportData(importData);
  if (errors.length > 0) {
    throw new BadRequestError(
      `Errors found in the following rows: ${errors
        .map((error) => `Row ${error.row}: ${error.error}`)
        .join(', ')}`
    );
  }
  const createdCaseServices = [];

  for (const data of processedData) {
    try {
      const newCaseService = await CaseServiceModel.build(data);
      createdCaseServices.push(getReturnData(newCaseService));
    } catch (error: any) {
      errors.push({
        row: data,
        error: error.message,
      });
    }
  }

  return { createdCaseServices, errors };
};

/**
 * Parse CSV file
 */
const parseCSVFile = (filePath: string) => {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const rows = fileContent.trim().split('\n');
    const headers = rows[0].split(',').map((header) => header.trim());

    const importData = [];

    // Process each row (skip header row)
    for (let i = 1; i < rows.length; i++) {
      const rowData = rows[i].split(',').map((cell) => cell.trim());
      const rowObj: any = {};

      headers.forEach((header, index) => {
        rowObj[header] = rowData[index] || null;
      });

      importData.push(rowObj);
    }

    return importData;
  } catch (error: any) {
    throw new BadRequestError(`Error parsing CSV file: ${error.message}`);
  }
};

/**
 * Parse XLSX file
 */
const parseXLSXFile = (filePath: string) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    return xlsx.utils.sheet_to_json(worksheet);
  } catch (error: any) {
    throw new BadRequestError(`Error parsing XLSX file: ${error.message}`);
  }
};

// attach documents to case services
const attachDocumentsToCase = async (
  caseServiceId: string,
  documents: Express.Multer.File[]
) => {
  if (!documents || documents.length === 0) {
    throw new BadRequestError('No documents provided for attachment');
  }
  const caseService = await CaseServiceModel.findById(caseServiceId);
  if (!caseService) {
    throw new NotFoundError('Case service not found');
  }
  const documentIds = documents.map((doc) => doc.id);

  await caseService.save();
  return getReturnData(caseService);
};

// detach documents from case services
const detachDocumentsFromCase = async (
  caseServiceId: string,
  documentIds: string[]
) => {
  if (!documentIds || documentIds.length === 0) {
    throw new BadRequestError('No document IDs provided for detachment');
  }
  const caseService = await CaseServiceModel.findById(caseServiceId);
  if (!caseService) {
    throw new NotFoundError('Case service not found');
  }
  await caseService.save();
  return getReturnData(caseService);
};

export {
  getAllCaseServices,
  getCaseServiceById,
  createCaseService,
  updateCaseService,
  deleteCaseService,
  exportCaseServicesToCSV,
  exportCaseServicesToXLSX,
  processImportData,
  importCaseServices,
  parseCSVFile,
  parseXLSXFile,
};
