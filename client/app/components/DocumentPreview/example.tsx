import DocumentPreview from '~/components/DocumentPreview';

// Example usage of DocumentPreview component

export function DocumentPreviewExample() {
  return (
    <div className='space-y-6 p-6'>
      {/* PDF Document Preview */}
      <DocumentPreview
        url='https://example.com/document.pdf'
        fileName='Sample Document.pdf'
        className='w-full max-w-4xl'
      />

      {/* Image Document Preview */}
      <DocumentPreview
        url='https://example.com/image.jpg'
        fileName='Sample Image.jpg'
        maxHeight='400px'
      />

      {/* Document with custom settings */}
      <DocumentPreview
        url='https://example.com/document.docx'
        fileName='Report.docx'
        showDownload={false}
        showExternalLink={true}
        maxHeight='600px'
      />

      {/* Local server document (from your uploads folder) */}
      <DocumentPreview
        url='/uploads/documents/sample.pdf'
        fileName='Uploaded Document.pdf'
      />
    </div>
  );
}

// Props interface for reference:
export interface DocumentPreviewProps {
  url: string; // Required: URL to the document
  fileName?: string; // Optional: Display name for the file
  className?: string; // Optional: Additional CSS classes
  showDownload?: boolean; // Optional: Show download button (default: true)
  showExternalLink?: boolean; // Optional: Show external link button (default: true)
  maxHeight?: string; // Optional: Maximum height for preview (default: '500px')
}
