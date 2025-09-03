import { Types } from 'mongoose';
import {
  getCaseServices,
  getCaseServiceById,
  createCaseService,
  updateCaseService,
  deleteCaseService,
  bulkDeleteCaseServices,
  attachDocumentToCase,
  detachDocumentFromCase,
  getCaseServiceDocuments,
  getCaseServiceTasks,
  getCaseServiceOverview,
  updateCaseServiceParticipant,
  updateCaseServiceInstallment,
  updateCaseServiceIncurredCost,
  exportCaseServicesToXLSX,
  importCaseServices,
} from '../api/services/caseService.service';
import { CaseServiceModel } from '../api/models/caseService.model';
import { CustomerModel } from '../api/models/customer.model';
import { EmployeeModel } from '../api/models/employee.model';
import { UserModel } from '../api/models/user.model';
import { DocumentModel } from '../api/models/document.model';
import { DocumentCaseModel } from '../api/models/documentCase.model';
import { TaskModel } from '../api/models/task.model';
import {
  ICaseServiceCreate,
  ICaseServiceUpdate,
  ICaseServiceQuery,
  CaseParticipant,
  InstallmentPlanItem,
  IncurredCost,
} from '../api/interfaces/caseService.interface';
import { CASE_SERVICE, USER, CUSTOMER } from '../api/constants';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../api/core/errors';
import path from 'path';
import fs from 'fs';

describe('CaseService', () => {
  let testCustomer: any;
  let testEmployee: any;
  let testUser: any;
  let testCaseService: any;
  let testDocument: any;

  beforeEach(async () => {
    // Create test user
    testUser = await UserModel.create({
      usr_firstName: 'Test',
      usr_lastName: 'User',
      usr_email: 'test@example.com',
      usr_username: 'testuser',
      usr_password: 'hashedpassword',
      usr_role: { name: 'Admin', slug: 'admin' },
      usr_status: USER.STATUS.ACTIVE,
    });

    // Create test customer
    testCustomer = await CustomerModel.create({
      cus_firstName: 'John',
      cus_lastName: 'Doe',
      cus_email: 'john.doe@example.com',
      cus_code: 'CUST001',
      cus_msisdn: '1234567890',
    });

    // Create test employee
    testEmployee = await EmployeeModel.create({
      emp_code: 'EMP001',
      emp_user: testUser._id,
      emp_position: 'Lawyer',
    });

    // Create test document
    testDocument = await DocumentModel.create({
      doc_name: 'Test Document',
      doc_type: 'PDF',
      doc_url: '/test/document.pdf',
      doc_createdBy: testEmployee._id,
      doc_isPublic: true,
    });
  });

  describe('getCaseServices', () => {
    beforeEach(async () => {
      // Create multiple test case services
      await CaseServiceModel.create([
        {
          case_customer: testCustomer._id,
          case_code: 'CASE001',
          case_notes: 'Test case 1',
          case_status: CASE_SERVICE.STATUS.OPEN,
          case_pricing: {
            baseAmount: 1000,
            taxes: [],
          },
          case_participants: [],
          case_installments: [],
          case_incurredCosts: [],
          case_totalsCache: {
            scheduled: 0,
            paid: 0,
            outstanding: 0,
            taxComputed: 0,
            incurredCostTotal: 0,
            commissionTotal: 0,
            netFinal: 1000,
            nextDueDate: null,
            overdueCount: 0,
          },
        },
        {
          case_customer: testCustomer._id,
          case_code: 'CASE002',
          case_notes: 'Test case 2',
          case_status: CASE_SERVICE.STATUS.IN_PROGRESS,
          case_pricing: {
            baseAmount: 2000,
            taxes: [],
          },
          case_participants: [],
          case_installments: [],
          case_incurredCosts: [],
          case_totalsCache: {
            scheduled: 0,
            paid: 0,
            outstanding: 0,
            taxComputed: 0,
            incurredCostTotal: 0,
            commissionTotal: 0,
            netFinal: 2000,
            nextDueDate: null,
            overdueCount: 0,
          },
        },
      ]);
    });

    it('should return paginated case services', async () => {
      const query: ICaseServiceQuery = { page: 1, limit: 10 };
      const result = await getCaseServices(query);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should filter case services by status', async () => {
      const query: ICaseServiceQuery = {
        status: CASE_SERVICE.STATUS.OPEN,
        page: 1,
        limit: 10,
      };
      const result = await getCaseServices(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].case_status).toBe(CASE_SERVICE.STATUS.OPEN);
    });

    it('should search case services by code', async () => {
      const query: ICaseServiceQuery = {
        search: 'CASE001',
        page: 1,
        limit: 10,
      };
      const result = await getCaseServices(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].case_code).toBe('CASE001');
    });

    it('should filter case services by customer', async () => {
      const query: ICaseServiceQuery = {
        customerId: testCustomer._id.toString(),
        page: 1,
        limit: 10,
      };
      const result = await getCaseServices(query);

      expect(result.data).toHaveLength(2);
      result.data.forEach((caseService) => {
        expect(caseService.case_customer._id.toString()).toBe(
          testCustomer._id.toString()
        );
      });
    });

    it('should sort case services by creation date desc by default', async () => {
      const query: ICaseServiceQuery = { page: 1, limit: 10 };
      const result = await getCaseServices(query);

      expect(result.data).toHaveLength(2);
      // Since both were created in the same test, we can at least verify they're sorted
      expect(
        new Date(result.data[0].createdAt).getTime()
      ).toBeGreaterThanOrEqual(new Date(result.data[1].createdAt).getTime());
    });
  });

  describe('getCaseServiceById', () => {
    beforeEach(async () => {
      testCaseService = await CaseServiceModel.create({
        case_customer: testCustomer._id,
        case_code: 'CASE001',
        case_notes: 'Test case',
        case_status: CASE_SERVICE.STATUS.OPEN,
        case_participants: [testEmployee._id],
        case_pricing: {
          baseAmount: 1000,
          taxes: [],
        },
        case_installments: [],
        case_incurredCosts: [],
        case_totalsCache: {
          scheduled: 0,
          paid: 0,
          outstanding: 0,
          taxComputed: 0,
          incurredCostTotal: 0,
          commissionTotal: 0,
          netFinal: 1000,
          nextDueDate: null,
          overdueCount: 0,
        },
      });
    });

    it('should return case service by valid ID for authorized user', async () => {
      const result = await getCaseServiceById(
        testCaseService._id.toString(),
        testUser._id.toString()
      );

      expect(result).toHaveProperty('case_code', 'CASE001');
      expect(result).toHaveProperty('case_notes', 'Test case');
      expect(result).toHaveProperty('case_status', CASE_SERVICE.STATUS.OPEN);
    });

    it('should throw BadRequestError for invalid ID', async () => {
      await expect(
        getCaseServiceById('invalid-id', testUser._id.toString())
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError for non-existent case service', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      await expect(
        getCaseServiceById(nonExistentId, testUser._id.toString())
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('createCaseService', () => {
    it('should create a new case service with valid data', async () => {
      const caseServiceData: ICaseServiceCreate = {
        customer: testCustomer._id.toString(),
        code: 'CASE001',
        notes: 'Test case',
        status: CASE_SERVICE.STATUS.OPEN,
        participants: [],
        pricing: {
          baseAmount: 1000,
          taxes: [],
        },
        installments: [],
        incurredCosts: [],
        startDate: new Date().toISOString(),
      };

      const result = await createCaseService(caseServiceData);

      expect(result).toHaveProperty('case_code', 'CASE001');
      expect(result).toHaveProperty('case_notes', 'Test case');
      expect(result).toHaveProperty(
        'case_customer',
        testCustomer._id.toString()
      );

      // Verify it was saved to database
      const savedCase = await CaseServiceModel.findById(result.id);
      expect(savedCase).toBeTruthy();
      expect(savedCase!.case_code).toBe('CASE001');
    });

    it('should throw BadRequestError for duplicate case code', async () => {
      // Create first case service
      await CaseServiceModel.create({
        case_customer: testCustomer._id,
        case_code: 'CASE001',
        case_pricing: { baseAmount: 1000, taxes: [] },
        case_participants: [],
        case_installments: [],
        case_incurredCosts: [],
        case_totalsCache: {
          scheduled: 0,
          paid: 0,
          outstanding: 0,
          taxComputed: 0,
          incurredCostTotal: 0,
          commissionTotal: 0,
          netFinal: 1000,
          nextDueDate: null,
          overdueCount: 0,
        },
      });

      const duplicateData: ICaseServiceCreate = {
        customer: testCustomer._id.toString(),
        code: 'CASE001', // Duplicate code
        participants: [],
        pricing: {
          baseAmount: 1000,
          taxes: [],
        },
        installments: [],
        incurredCosts: [],
      };

      await expect(createCaseService(duplicateData)).rejects.toThrow(
        BadRequestError
      );
    });

    it('should create case service with participants and calculate commission totals', async () => {
      const participants: CaseParticipant[] = [
        {
          employeeId: testEmployee._id,
          role: 'Lead Attorney',
          commission: {
            type: 'PERCENT_OF_GROSS',
            value: 10,
            transactionId: new Types.ObjectId(),
          },
        },
      ];

      const caseServiceData: ICaseServiceCreate = {
        customer: testCustomer._id.toString(),
        code: 'CASE002',
        participants,
        pricing: {
          baseAmount: 1000,
          taxes: [],
        },
        installments: [],
        incurredCosts: [],
      };

      const result = await createCaseService(caseServiceData);

      expect(result.case_participants).toHaveLength(1);
      expect(result.case_participants![0].role).toBe('Lead Attorney');
      expect(result.case_totalsCache!.commissionTotal).toBeGreaterThan(0);
    });

    it('should create case service with installments', async () => {
      const installments: InstallmentPlanItem[] = [
        {
          _id: new Types.ObjectId().toString(),
          seq: 1,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          amount: 500,
          status: 'PLANNED',
          paidAmount: 0,
          notes: 'First installment',
          transactionId: new Types.ObjectId().toString(),
        },
        {
          _id: new Types.ObjectId().toString(),
          seq: 2,
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
          amount: 500,
          status: 'PLANNED',
          paidAmount: 0,
          notes: 'Second installment',
          transactionId: new Types.ObjectId().toString(),
        },
      ];

      const caseServiceData: ICaseServiceCreate = {
        customer: testCustomer._id.toString(),
        code: 'CASE003',
        participants: [],
        pricing: {
          baseAmount: 1000,
          taxes: [],
        },
        installments,
        incurredCosts: [],
      };

      const result = await createCaseService(caseServiceData);

      expect(result.case_installments).toHaveLength(2);
      expect(result.case_totalsCache!.scheduled).toBe(1000);
      expect(result.case_totalsCache!.outstanding).toBe(1000);
    });
  });

  describe('updateCaseService', () => {
    beforeEach(async () => {
      testCaseService = await CaseServiceModel.create({
        case_customer: testCustomer._id,
        case_code: 'CASE001',
        case_notes: 'Original notes',
        case_status: CASE_SERVICE.STATUS.OPEN,
        case_pricing: {
          baseAmount: 1000,
          taxes: [],
        },
        case_participants: [],
        case_installments: [],
        case_incurredCosts: [],
        case_totalsCache: {
          scheduled: 0,
          paid: 0,
          outstanding: 0,
          taxComputed: 0,
          incurredCostTotal: 0,
          commissionTotal: 0,
          netFinal: 1000,
          nextDueDate: null,
          overdueCount: 0,
        },
      });
    });

    it('should update case service with valid data', async () => {
      const updateData: ICaseServiceUpdate = {
        notes: 'Updated notes',
        status: CASE_SERVICE.STATUS.IN_PROGRESS,
      };

      const result = await updateCaseService(
        testCaseService._id.toString(),
        updateData
      );

      expect(result.case_notes).toBe('Updated notes');
      expect(result.case_status).toBe(CASE_SERVICE.STATUS.IN_PROGRESS);
    });

    it('should throw BadRequestError for invalid ID', async () => {
      const updateData: ICaseServiceUpdate = { notes: 'Updated notes' };

      await expect(updateCaseService('invalid-id', updateData)).rejects.toThrow(
        BadRequestError
      );
    });

    it('should throw NotFoundError for non-existent case service', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      const updateData: ICaseServiceUpdate = { notes: 'Updated notes' };

      await expect(
        updateCaseService(nonExistentId, updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should set endDate when status is closed or completed', async () => {
      const updateData: ICaseServiceUpdate = {
        status: CASE_SERVICE.STATUS.CLOSED,
      };

      const result = await updateCaseService(
        testCaseService._id.toString(),
        updateData
      );

      expect(result.case_status).toBe(CASE_SERVICE.STATUS.CLOSED);
      expect(result.case_endDate).toBeTruthy();
    });

    it('should recalculate totals cache when updating financial data', async () => {
      const updateData: ICaseServiceUpdate = {
        pricing: {
          baseAmount: 2000,
          taxes: [
            {
              name: 'VAT',
              mode: 'PERCENT',
              value: 10,
              scope: 'ON_BASE',
              transactionId: new Types.ObjectId(),
            },
          ],
        },
      };

      const result = await updateCaseService(
        testCaseService._id.toString(),
        updateData
      );

      expect(result.case_totalsCache!.taxComputed).toBeGreaterThan(0);
      expect(result.case_totalsCache!.netFinal).toBeLessThan(2000); // After tax deduction
    });
  });

  describe('deleteCaseService', () => {
    beforeEach(async () => {
      testCaseService = await CaseServiceModel.create({
        case_customer: testCustomer._id,
        case_code: 'CASE001',
        case_pricing: {
          baseAmount: 1000,
          taxes: [],
        },
        case_participants: [],
        case_installments: [],
        case_incurredCosts: [],
        case_totalsCache: {
          scheduled: 0,
          paid: 0,
          outstanding: 0,
          taxComputed: 0,
          incurredCostTotal: 0,
          commissionTotal: 0,
          netFinal: 1000,
          nextDueDate: null,
          overdueCount: 0,
        },
      });
    });

    it('should delete case service and related data', async () => {
      const result = await deleteCaseService(testCaseService._id.toString());

      expect(result).toHaveProperty('case_code', 'CASE001');

      // Verify it was deleted from database
      const deletedCase = await CaseServiceModel.findById(testCaseService._id);
      expect(deletedCase).toBeNull();
    });

    it('should throw NotFoundError for non-existent case service', async () => {
      const nonExistentId = new Types.ObjectId().toString();

      await expect(deleteCaseService(nonExistentId)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('bulkDeleteCaseServices', () => {
    let caseService1: any, caseService2: any;

    beforeEach(async () => {
      caseService1 = await CaseServiceModel.create({
        case_customer: testCustomer._id,
        case_code: 'CASE001',
        case_pricing: { baseAmount: 1000, taxes: [] },
        case_participants: [],
        case_installments: [],
        case_incurredCosts: [],
        case_totalsCache: {
          scheduled: 0,
          paid: 0,
          outstanding: 0,
          taxComputed: 0,
          incurredCostTotal: 0,
          commissionTotal: 0,
          netFinal: 1000,
          nextDueDate: null,
          overdueCount: 0,
        },
      });

      caseService2 = await CaseServiceModel.create({
        case_customer: testCustomer._id,
        case_code: 'CASE002',
        case_pricing: { baseAmount: 2000, taxes: [] },
        case_participants: [],
        case_installments: [],
        case_incurredCosts: [],
        case_totalsCache: {
          scheduled: 0,
          paid: 0,
          outstanding: 0,
          taxComputed: 0,
          incurredCostTotal: 0,
          commissionTotal: 0,
          netFinal: 2000,
          nextDueDate: null,
          overdueCount: 0,
        },
      });
    });

    it('should delete multiple case services', async () => {
      const ids = [caseService1._id.toString(), caseService2._id.toString()];
      const result = await bulkDeleteCaseServices(ids);

      expect(result.success).toBe(true);

      // Verify they were deleted
      const remainingCases = await CaseServiceModel.find({ _id: { $in: ids } });
      expect(remainingCases).toHaveLength(0);
    });
  });

  describe('attachDocumentToCase', () => {
    beforeEach(async () => {
      testCaseService = await CaseServiceModel.create({
        case_customer: testCustomer._id,
        case_code: 'CASE001',
        case_pricing: { baseAmount: 1000, taxes: [] },
        case_participants: [],
        case_installments: [],
        case_incurredCosts: [],
        case_totalsCache: {
          scheduled: 0,
          paid: 0,
          outstanding: 0,
          taxComputed: 0,
          incurredCostTotal: 0,
          commissionTotal: 0,
          netFinal: 1000,
          nextDueDate: null,
          overdueCount: 0,
        },
      });
    });

    it('should attach document to case service', async () => {
      const result = await attachDocumentToCase(
        [testDocument._id.toString()],
        testCaseService._id.toString(),
        testUser._id.toString()
      );

      expect(result.success).toBe(true);
      expect(result.details.newlyAttached).toBe(1);

      // Verify document was attached
      const documentCase = await DocumentCaseModel.findOne({
        document: testDocument._id,
        caseService: testCaseService._id,
      });
      expect(documentCase).toBeTruthy();
    });

    it('should not attach same document twice', async () => {
      // First attachment
      await attachDocumentToCase(
        [testDocument._id.toString()],
        testCaseService._id.toString(),
        testUser._id.toString()
      );

      // Second attachment (should be detected as already attached)
      const result = await attachDocumentToCase(
        [testDocument._id.toString()],
        testCaseService._id.toString(),
        testUser._id.toString()
      );

      expect(result.details.alreadyAttached).toBe(1);
      expect(result.details.newlyAttached).toBe(0);
    });
  });

  describe('detachDocumentFromCase', () => {
    let documentCase: any;

    beforeEach(async () => {
      testCaseService = await CaseServiceModel.create({
        case_customer: testCustomer._id,
        case_code: 'CASE001',
        case_pricing: { baseAmount: 1000, taxes: [] },
        case_participants: [],
        case_installments: [],
        case_incurredCosts: [],
        case_totalsCache: {
          scheduled: 0,
          paid: 0,
          outstanding: 0,
          taxComputed: 0,
          incurredCostTotal: 0,
          commissionTotal: 0,
          netFinal: 1000,
          nextDueDate: null,
          overdueCount: 0,
        },
      });

      documentCase = await DocumentCaseModel.create({
        document: testDocument._id,
        caseService: testCaseService._id,
        createdBy: testEmployee._id,
      });
    });

    it('should detach document from case service', async () => {
      const result = await detachDocumentFromCase(
        [documentCase._id.toString()],
        testCaseService._id.toString()
      );

      expect(result.success).toBe(true);

      // Verify document was detached
      const deletedDocumentCase = await DocumentCaseModel.findById(
        documentCase._id
      );
      expect(deletedDocumentCase).toBeNull();
    });
  });

  describe('updateCaseServiceParticipant', () => {
    beforeEach(async () => {
      testCaseService = await CaseServiceModel.create({
        case_customer: testCustomer._id,
        case_code: 'CASE001',
        case_pricing: { baseAmount: 1000, taxes: [] },
        case_participants: [],
        case_installments: [],
        case_incurredCosts: [],
        case_totalsCache: {
          scheduled: 0,
          paid: 0,
          outstanding: 0,
          taxComputed: 0,
          incurredCostTotal: 0,
          commissionTotal: 0,
          netFinal: 1000,
          nextDueDate: null,
          overdueCount: 0,
        },
      });
    });

    it('should update case service participants', async () => {
      const participants: CaseParticipant[] = [
        {
          employeeId: testEmployee._id,
          role: 'Lead Attorney',
          commission: {
            type: 'PERCENT_OF_GROSS',
            value: 10,
            transactionId: new Types.ObjectId(),
          },
        },
      ];

      const result = await updateCaseServiceParticipant(
        testCaseService._id.toString(),
        participants,
        testUser._id.toString()
      );

      expect(result.success).toBe(true);
      expect(result.participants).toHaveLength(1);
      expect(result.participants![0].role).toBe('Lead Attorney');
    });

    it('should clear all participants when empty array provided', async () => {
      const result = await updateCaseServiceParticipant(
        testCaseService._id.toString(),
        [],
        testUser._id.toString()
      );

      expect(result.success).toBe(true);
      expect(result.participants).toHaveLength(0);
    });
  });

  describe('updateCaseServiceInstallment', () => {
    beforeEach(async () => {
      testCaseService = await CaseServiceModel.create({
        case_customer: testCustomer._id,
        case_code: 'CASE001',
        case_pricing: { baseAmount: 1000, taxes: [] },
        case_participants: [],
        case_installments: [],
        case_incurredCosts: [],
        case_totalsCache: {
          scheduled: 0,
          paid: 0,
          outstanding: 0,
          taxComputed: 0,
          incurredCostTotal: 0,
          commissionTotal: 0,
          netFinal: 1000,
          nextDueDate: null,
          overdueCount: 0,
        },
      });
    });

    it('should update case service installments', async () => {
      const installments: InstallmentPlanItem[] = [
        {
          _id: new Types.ObjectId().toString(),
          seq: 1,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          amount: 500,
          status: 'PLANNED',
          paidAmount: 0,
          notes: 'First installment',
          transactionId: new Types.ObjectId().toString(),
        },
      ];

      const result = await updateCaseServiceInstallment(
        testCaseService._id.toString(),
        installments,
        testUser._id.toString()
      );

      expect(result.success).toBe(true);
      expect(result.installments).toHaveLength(1);
      expect(result.totalsCache!.scheduled).toBe(500);
    });
  });

  describe('updateCaseServiceIncurredCost', () => {
    beforeEach(async () => {
      testCaseService = await CaseServiceModel.create({
        case_customer: testCustomer._id,
        case_code: 'CASE001',
        case_pricing: { baseAmount: 1000, taxes: [] },
        case_participants: [],
        case_installments: [],
        case_incurredCosts: [],
        case_totalsCache: {
          scheduled: 0,
          paid: 0,
          outstanding: 0,
          taxComputed: 0,
          incurredCostTotal: 0,
          commissionTotal: 0,
          netFinal: 1000,
          nextDueDate: null,
          overdueCount: 0,
        },
      });
    });

    it('should update case service incurred costs', async () => {
      const incurredCosts: IncurredCost[] = [
        {
          _id: new Types.ObjectId().toString(),
          date: new Date(),
          category: 'Court Fees',
          description: 'Filing fees',
          amount: 100,
          transactionId: new Types.ObjectId().toString(),
        },
      ];

      const result = await updateCaseServiceIncurredCost(
        testCaseService._id.toString(),
        incurredCosts,
        testUser._id.toString()
      );

      expect(result.success).toBe(true);
      expect(result.incurredCosts).toHaveLength(1);
      expect(result.totalsCache!.incurredCostTotal).toBe(100);
    });
  });

  describe('getCaseServiceOverview', () => {
    beforeEach(async () => {
      testCaseService = await CaseServiceModel.create({
        case_customer: testCustomer._id,
        case_code: 'CASE001',
        case_pricing: { baseAmount: 1000, taxes: [] },
        case_participants: [
          {
            employeeId: testEmployee._id,
            role: 'Lead Attorney',
            commission: {
              type: 'PERCENT_OF_GROSS',
              value: 10,
              transactionId: new Types.ObjectId(),
            },
          },
        ],
        case_installments: [
          {
            _id: new Types.ObjectId().toString(),
            seq: 1,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            amount: 500,
            status: 'PLANNED',
            paidAmount: 0,
            notes: 'First installment',
            transactionId: new Types.ObjectId().toString(),
          },
        ],
        case_incurredCosts: [
          {
            _id: new Types.ObjectId().toString(),
            date: new Date(),
            category: 'Court Fees',
            description: 'Filing fees',
            amount: 100,
            transactionId: new Types.ObjectId().toString(),
          },
        ],
        case_totalsCache: {
          scheduled: 500,
          paid: 0,
          outstanding: 500,
          taxComputed: 0,
          incurredCostTotal: 100,
          commissionTotal: 100,
          netFinal: 800,
          nextDueDate: null,
          overdueCount: 0,
        },
      });
    });

    it('should return case service overview with populated data', async () => {
      const result = await getCaseServiceOverview(
        testCaseService._id.toString()
      );

      expect(result).toHaveProperty('case_pricing');
      expect(result).toHaveProperty('case_participants');
      expect(result).toHaveProperty('case_installments');
      expect(result).toHaveProperty('case_incurredCosts');
      expect(result).toHaveProperty('case_totalsCache');
      expect(result.case_totalsCache!.netFinal).toBe(800);
    });

    it('should throw NotFoundError for non-existent case service', async () => {
      const nonExistentId = new Types.ObjectId().toString();

      await expect(getCaseServiceOverview(nonExistentId)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('exportCaseServicesToXLSX', () => {
    beforeEach(async () => {
      await CaseServiceModel.create({
        case_customer: testCustomer._id,
        case_code: 'CASE001',
        case_notes: 'Test case for export',
        case_pricing: { baseAmount: 1000, taxes: [] },
        case_participants: [],
        case_installments: [],
        case_incurredCosts: [],
        case_totalsCache: {
          scheduled: 0,
          paid: 0,
          outstanding: 0,
          taxComputed: 0,
          incurredCostTotal: 0,
          commissionTotal: 0,
          netFinal: 1000,
          nextDueDate: null,
          overdueCount: 0,
        },
      });
    });

    it('should export case services to XLSX file', async () => {
      const result = await exportCaseServicesToXLSX({ page: 1, limit: 100 });

      expect(result).toHaveProperty('fileUrl');
      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('count');
      expect(result.count).toBe(1);
      expect(result.fileName).toMatch(/ho_so_vu_viec_.*\.xlsx$/);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock mongoose connection error
      jest
        .spyOn(CaseServiceModel, 'find')
        .mockRejectedValueOnce(new Error('Database connection error'));

      await expect(getCaseServices({})).rejects.toThrow(
        'Đã xảy ra lỗi khi lấy danh sách Hồ sơ vụ việc'
      );
    });

    it('should validate ObjectId format', async () => {
      await expect(
        getCaseServiceById('invalid-object-id', testUser._id.toString())
      ).rejects.toThrow(BadRequestError);
    });

    it('should handle missing required fields in create', async () => {
      const invalidData = {
        // Missing required customer field
        code: 'CASE001',
        participants: [],
        pricing: { baseAmount: 1000, taxes: [] },
        installments: [],
        incurredCosts: [],
      };

      // This should be caught by the schema validation or mongoose validation
      await expect(createCaseService(invalidData as any)).rejects.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete case service lifecycle', async () => {
      // Create case service
      const createData: ICaseServiceCreate = {
        customer: testCustomer._id.toString(),
        code: 'LIFECYCLE_TEST',
        notes: 'Complete lifecycle test',
        participants: [],
        pricing: { baseAmount: 1000, taxes: [] },
        installments: [],
        incurredCosts: [],
      };

      const created = await createCaseService(createData);
      expect(created.case_code).toBe('LIFECYCLE_TEST');

      // Update case service
      const updated = await updateCaseService(created.id, {
        notes: 'Updated lifecycle test',
        status: CASE_SERVICE.STATUS.IN_PROGRESS,
      });
      expect(updated.case_notes).toBe('Updated lifecycle test');

      // Attach document
      await attachDocumentToCase(
        [testDocument._id.toString()],
        created.id,
        testUser._id.toString()
      );

      // Get case service with documents
      const documents = await getCaseServiceDocuments(
        created.id,
        testUser._id.toString(),
        { page: 1, limit: 10 }
      );
      expect(documents.data).toHaveLength(1);

      // Delete case service
      await deleteCaseService(created.id);

      // Verify deletion
      await expect(
        getCaseServiceById(created.id, testUser._id.toString())
      ).rejects.toThrow(NotFoundError);
    });
  });
});
