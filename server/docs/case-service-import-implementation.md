# Case Service Import Implementation Summary

## Files Created/Modified

### Backend (Server)

1. **`/server/src/api/services/caseService.service.ts`**

   - Added `importCaseServices` function with full implementation
   - Added helper functions: `isEmptyCaseServiceRow`, `mapExcelRowToCaseService`
   - Supports transaction-based import with rollback on errors
   - Validates required fields and data formats
   - Creates default tasks for new case services

2. **`/server/src/api/controllers/caseService.controller.ts`**

   - Updated `importCaseServices` method to handle import options
   - Added proper error handling and file cleanup
   - Returns detailed import results

3. **`/server/src/api/schemas/caseService.schema.ts`**

   - Added `caseServiceImportOptionsSchema` for validating import options

4. **`/server/src/api/routers/caseService/index.ts`**

   - Updated import route to use `/import/xlsx` endpoint
   - Removed schema validation middleware (handled in controller)

5. **`/server/docs/case-service-import-api.ts`**

   - Complete API documentation with sample data format
   - Excel column mapping reference

6. **`/server/test-case-service-import.js`**
   - Test script to generate sample Excel file for testing

### Frontend (Client)

1. **`/client/app/routes/erp+/_admin+/cases+/import.xlsx.tsx`**

   - Complete import handler based on customer import
   - Handles file validation, upload, and result processing
   - Enhanced error handling with failure rate detection

2. **`/client/app/services/caseService.server.ts`**

   - New service file with `importCaseServices` function
   - Handles FormData submission to backend API

3. **`/client/app/routes/erp+/_admin+/cases+/index.tsx`**
   - Added `importable` prop to List component

## Key Features Implemented

### Data Processing

- **Excel File Support**: Reads `.xlsx` and `.xls` files
- **Smart Customer Matching**: Finds customers by code or full name
- **Smart Attorney Matching**: Finds attorneys by code or full name
- **Assignee Parsing**: Handles comma-separated list of assignees
- **Date Parsing**: Supports `dd/MM/yyyy` format for dates
- **Address Parsing**: Extracts province, district, street from address string

### Import Options

- **Skip Duplicates**: Option to skip existing case services
- **Update Existing**: Option to update existing case services instead of skipping
- **Skip Empty Rows**: Option to ignore completely empty rows

### Error Handling

- **Row-level Validation**: Validates each row independently
- **Transaction Support**: All-or-nothing import with rollback on critical errors
- **Detailed Error Reporting**: Shows row number, error message, and original data
- **File Size Validation**: Max 10MB file size limit
- **File Type Validation**: Only Excel files allowed

### API Response Format

```json
{
  "success": true,
  "message": "Case services imported successfully",
  "data": {
    "total": 100,
    "imported": 80,
    "updated": 15,
    "skipped": 5,
    "errors": [
      {
        "row": 10,
        "error": "Thiếu mã hồ sơ vụ việc",
        "data": {...}
      }
    ]
  }
}
```

## Excel File Format Expected

| Column Name          | Description                 | Required            | Example                              |
| -------------------- | --------------------------- | ------------------- | ------------------------------------ |
| Mã hồ sơ             | Case service code           | Yes                 | HS001                                |
| Khách hàng           | Customer full name          | If no customer code | Nguyễn Văn A                         |
| Mã khách hàng        | Customer code               | Preferred           | KH001                                |
| Luật sư chính        | Lead attorney full name     | If no attorney code | Trần Thị B                           |
| Mã luật sư           | Lead attorney code          | Preferred           | LS001                                |
| Người được phân công | Assignees (comma-separated) | No                  | Lê Văn C, Phạm Thị D                 |
| Trạng thái           | Case status                 | No                  | open, in_progress, completed, closed |
| Ghi chú              | Notes                       | No                  | Vụ việc tranh chấp hợp đồng          |
| Ngày bắt đầu         | Start date (dd/MM/yyyy)     | No                  | 01/01/2024                           |
| Ngày kết thúc        | End date (dd/MM/yyyy)       | No                  | 31/12/2024                           |

## Testing

Run the test script to generate sample data:

```bash
cd /home/phanhotboy/workspace/iconic/cube-erp/server
node test-case-service-import.js
```

## Usage

1. Navigate to Cases section in the admin panel
2. Click the "Nhập Excel" (Import Excel) button
3. Select an Excel file with the correct format
4. Monitor the import progress and results
5. Review any errors in the response
