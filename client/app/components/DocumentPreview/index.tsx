import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  Image,
  File,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Skeleton } from '~/components/ui/skeleton';

interface DocumentPreviewProps {
  url: string;
  fileName?: string;
  className?: string;
  showDownload?: boolean;
  showExternalLink?: boolean;
  maxHeight?: string;
}

const DocumentPreview = ({
  url,
  fileName,
  className = '',
  showDownload = true,
  showExternalLink = true,
  maxHeight = '1000px',
}: DocumentPreviewProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [documentType, setDocumentType] = useState<
    'pdf' | 'image' | 'video' | 'audio' | 'office' | 'text' | 'csv' | 'unknown'
  >('unknown');

  // Extract file extension and determine document type
  const getFileExtension = (url: string): string => {
    const urlWithoutParams = url.split('?')[0];
    const extension = urlWithoutParams.split('.').pop()?.toLowerCase() || '';
    return extension;
  };

  const determineDocumentType = (url: string) => {
    const extension = getFileExtension(url);

    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const pdfExtensions = ['pdf'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'];
    const officeExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    const csvExtensions = ['csv'];
    const textExtensions = ['txt', 'json', 'xml', 'html', 'css', 'js', 'ts'];

    if (imageExtensions.includes(extension)) return 'image';
    if (pdfExtensions.includes(extension)) return 'pdf';
    if (videoExtensions.includes(extension)) return 'video';
    if (audioExtensions.includes(extension)) return 'audio';
    if (officeExtensions.includes(extension)) return 'office';
    if (csvExtensions.includes(extension)) return 'csv';
    if (textExtensions.includes(extension)) return 'text';

    return 'unknown';
  };

  useEffect(() => {
    if (url) {
      setHasError(false);
      const docType = determineDocumentType(url);
      setDocumentType(docType);

      // If it's a CSV file, fetch and parse the data
      if (docType === 'csv') {
        fetchCsvData();
      }
    }
  }, [url]);

  const fetchCsvData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(url);
      if (!response.ok) {
        handleError();
      }

      const csvText = await response.text();
      const rows = csvText
        .split('\n')
        .map((row) => {
          // Simple CSV parsing - handles basic cases
          const cells = [];
          let currentCell = '';
          let inQuotes = false;

          for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              cells.push(currentCell.trim());
              currentCell = '';
            } else {
              currentCell += char;
            }
          }
          cells.push(currentCell.trim());
          return cells;
        })
        .filter((row) => row.some((cell) => cell.length > 0)); // Remove empty rows

      setCsvData(rows);
      handleLoad();
    } catch (error) {
      console.error('Error fetching CSV:', error);
      handleError();
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'document';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExternalLink = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getDocumentIcon = () => {
    switch (documentType) {
      case 'pdf':
        return <FileText className='h-5 w-5' />;
      case 'image':
        return <Image className='h-5 w-5' />;
      default:
        return <File className='h-5 w-5' />;
    }
  };

  const getDocumentTypeLabel = () => {
    switch (documentType) {
      case 'pdf':
        return 'PDF';
      case 'image':
        return 'Hình ảnh';
      case 'video':
        return 'Video';
      case 'audio':
        return 'Âm thanh';
      case 'office':
        return 'Office';
      case 'csv':
        return 'CSV';
      case 'text':
        return 'Văn bản';
      default:
        return 'Tài liệu';
    }
  };

  const renderPreview = () => {
    if (hasError) {
      return (
        <div className='flex flex-col items-center justify-center p-8 text-muted-foreground'>
          <AlertCircle className='h-12 w-12 mb-4' />
          <p className='text-sm'>Không thể xem trước tài liệu</p>
          <p className='text-xs mt-1'>
            Tài liệu có thể bị hỏng hoặc ở định dạng không được hỗ trợ
          </p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className='space-y-3 p-4'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-3/4' />
          <Skeleton className='h-32 w-full' />
        </div>
      );
    }

    switch (documentType) {
      case 'image':
        return (
          <div className='flex justify-center p-4'>
            <img
              src={url}
              alt={fileName || 'Document preview'}
              className='max-w-full object-contain h-auto rounded-lg shadow-sm'
              style={{ maxHeight }}
              onLoad={handleLoad}
              onError={handleError}
            />
          </div>
        );

      case 'pdf':
        return (
          <div className='w-full' style={{ height: maxHeight }}>
            <iframe
              src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
              className='w-full h-full border-0 rounded-lg'
              title={fileName || 'PDF preview'}
              onLoad={handleLoad}
              onError={handleError}
            />
          </div>
        );

      case 'video':
        return (
          <div className='flex justify-center p-4'>
            <video
              controls
              className='max-w-full rounded-lg shadow-sm'
              style={{ maxHeight }}
              onLoadedData={handleLoad}
              onError={handleError}
            >
              <source src={url} />
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className='flex justify-center p-8'>
            <audio
              controls
              className='w-full max-w-md'
              onLoadedData={handleLoad}
              onError={handleError}
            >
              <source src={url} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        );

      case 'text':
        return (
          <div className='p-4'>
            <iframe
              src={url}
              className='w-full border-0 rounded-lg bg-gray-50'
              style={{ height: maxHeight }}
              title={fileName || 'Text document preview'}
              onLoad={handleLoad}
              onError={handleError}
            />
          </div>
        );

      case 'csv':
        return (
          <div className='p-4' style={{ maxHeight, overflow: 'auto' }}>
            {isLoading ? (
              <div className='space-y-3'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-32 w-full' />
              </div>
            ) : csvData.length > 0 ? (
              <div className='overflow-x-auto'>
                <table className='min-w-full border-collapse border border-gray-300 text-sm'>
                  <thead>
                    {csvData[0] && (
                      <tr className='bg-gray-50'>
                        {csvData[0].map((header, index) => (
                          <th
                            key={index}
                            className='border border-gray-300 px-3 py-2 text-left font-medium text-gray-900'
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {csvData.slice(1).map((row, rowIndex) => (
                      <tr key={rowIndex} className='hover:bg-gray-50'>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className='border border-gray-300 px-3 py-2 text-gray-700'
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {csvData.length > 100 && (
                  <div className='mt-2 text-xs text-muted-foreground text-center'>
                    Showing {Math.min(100, csvData.length)} rows
                  </div>
                )}
              </div>
            ) : (
              <div className='text-center text-muted-foreground py-8'>
                <File className='h-12 w-12 mx-auto mb-2' />
                <p>No data to display</p>
              </div>
            )}
          </div>
        );

      case 'office':
        return (
          <div className='p-4'>
            <div className='w-full' style={{ height: maxHeight }}>
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
                className='w-full h-full'
                title={fileName || 'Office document preview'}
                onLoad={handleLoad}
                onError={handleError}
              />
            </div>
            <div className='mt-2 text-xs text-muted-foreground text-center'>
              Powered by Microsoft Office Online
            </div>
          </div>
        );

      default:
        return (
          <div className='flex flex-col items-center justify-center p-8 text-muted-foreground'>
            <File className='h-12 w-12 mb-4' />
            <p className='text-sm'>Không thể xem trước tài liệu</p>
            <p className='text-xs mt-1'>
              Tệp tin này không thể được xem trước trong trình duyệt
            </p>
            <div className='flex gap-2 mt-4'>
              {showDownload && (
                <Button size='sm' variant='outline' onClick={handleDownload}>
                  <Download className='h-4 w-4 mr-2' />
                  Tải xuống
                </Button>
              )}
              {showExternalLink && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={handleExternalLink}
                >
                  <ExternalLink className='h-4 w-4 mr-2' />
                  Mở
                </Button>
              )}
            </div>
          </div>
        );
    }
  };

  if (!url) {
    return (
      <Card className={className}>
        <CardContent className='flex items-center justify-center p-8 text-muted-foreground'>
          <p>Không có URL tài liệu nào được cung cấp</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            {getDocumentIcon()}
            <CardTitle className='text-sm font-medium truncate'>
              {fileName || 'Xem trước tài liệu'}
            </CardTitle>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='secondary' className='text-xs'>
              {getDocumentTypeLabel()}
            </Badge>
            {(showDownload || showExternalLink) && (
              <div className='flex gap-1'>
                {showDownload && (
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={handleDownload}
                    className='h-8 w-8 p-0'
                  >
                    <Download className='h-4 w-4' />
                  </Button>
                )}
                {showExternalLink && (
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={handleExternalLink}
                    className='h-8 w-8 p-0'
                  >
                    <ExternalLink className='h-4 w-4' />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className='p-0'>{renderPreview()}</CardContent>
    </Card>
  );
};

export default DocumentPreview;
