import {
  Link,
  useFetcher,
  useNavigate,
  useRevalidator,
} from '@remix-run/react';
import { toast } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { IListResponse } from '~/interfaces/response.interface';
import {
  IListColumn,
  ILoaderDataPromise,
  IResolveError,
} from '~/interfaces/app.interface';
import List from '~/components/List';
import { Plus } from 'lucide-react';
import { ICaseDocument, ICaseDocumentBrief } from '~/interfaces/case.interface';
import { isResolveError } from '~/lib';
import { IDocument } from '~/interfaces/document.interface';
import ErrorCard from '~/components/ErrorCard';
import DocumentPicker from '~/components/DocumentInput/DocumentPicker';
import { action } from '~/routes/api+/cases+/$caseId.documents';
import LoadingCard from '~/components/LoadingCard';
import { Badge } from '~/components/ui/badge';

export default function CaseDocumentList({
  caseId,
  caseDocumentsPromise,
}: {
  caseId: string;
  caseDocumentsPromise: ILoaderDataPromise<IListResponse<ICaseDocument>>;
}) {
  const toastIdRef = useRef<any>(null);
  const fetcher = useFetcher<typeof action>();
  const [caseDocuments, setCaseDocuments] = useState<ICaseDocumentBrief[]>([]);
  const [error, setError] = useState<IResolveError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [visibleColumns, setVisibleColumns] = useState<
    IListColumn<ICaseDocumentBrief>[]
  >([
    {
      key: 'name',
      title: 'Tên tài liệu',
      visible: true,
      render: (caseDoc) => (
        <Link
          to={`/erp/documents/${caseDoc.document.id}`}
          className='text-sm font-medium text-blue-600 hover:underline'
        >
          {caseDoc.document.doc_name}
        </Link>
      ),
    },
    {
      key: 'createdBy',
      title: 'Người tạo',
      visible: true,
      render: (caseDoc) => (
        <span className='text-sm text-gray-600'>
          {`${caseDoc.document.doc_createdBy.emp_user?.usr_firstName} ${caseDoc.document.doc_createdBy.emp_user?.usr_lastName}`}
        </span>
      ),
    },
    {
      key: 'isPublic',
      title: 'Chế độ truy cập',
      visible: true,
      render: (caseDoc) => (
        <Badge
          className={`${caseDoc.document.doc_isPublic ? 'bg-green-500' : 'bg-yellow-500'} text-white`}
        >
          {caseDoc.document.doc_isPublic ? 'Công khai' : 'Hạn chế'}
        </Badge>
      ),
    },
  ]);

  const [openDocPicker, setOpenDocPicker] = useState(false);
  const revalidator = useRevalidator();

  useEffect(() => {
    async function loadData() {
      try {
        const caseDocs = await caseDocumentsPromise;
        if (isResolveError(caseDocs)) {
          setError(caseDocs);
          return;
        } else {
          setCaseDocuments(
            caseDocs.data.map(
              (doc) =>
                ({
                  id: doc.id,
                  document: doc.document,
                  caseService: doc.caseService,
                }) as ICaseDocumentBrief,
            ),
          );
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading case documents:', error);
        setError({
          message: 'Có lỗi xảy ra khi tải tài liệu',
          success: false,
        });
      }
    }

    loadData();
  }, [caseDocumentsPromise]);

  useEffect(() => {
    if (fetcher.data) {
      toast.update(toastIdRef.current, {
        type: fetcher.data.toast?.type as 'success' | 'error',
        render: fetcher.data.toast?.message || 'Đang xử lý...',
        isLoading: false,
        autoClose: 3000,
      });
      toastIdRef.current = null;
      setIsLoading(false);
      revalidator.revalidate();
    }
  }, [fetcher.data]);

  if (error) {
    return <ErrorCard message={error.message} />;
  }

  return (
    <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200 mt-8'>
      <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-6 rounded-t-xl'>
        <CardTitle className='text-white text-3xl font-bold'>
          Tài liệu
        </CardTitle>
      </CardHeader>
      <CardContent className='p-2 md:p-6 space-y-4'>
        <div className='flex justify-end gap-4'>
          <Button
            variant='primary'
            className='px-4 py-2'
            type='button'
            onClick={() => setOpenDocPicker(true)}
          >
            Thêm Tài liệu
          </Button>
        </div>

        {isLoading ? (
          <LoadingCard />
        ) : (
          <List<ICaseDocumentBrief>
            name='Tài liệu'
            itemsPromise={{ data: caseDocuments, pagination: {} as any }}
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            addNewHandler={() => setOpenDocPicker(true)}
            showPagination={false}
            showToolbar={false}
            deleteHandleRoute={`/api/cases/${caseId}/documents`}
          />
        )}
      </CardContent>

      {openDocPicker && (
        <DocumentPicker
          onClose={() => setOpenDocPicker(false)}
          defaultActiveTab={2}
          documentGetter={async () => {
            try {
              const response = await fetch(
                `/api/data?getter=getDocuments&limit=10000&page=1`,
              );
              const data: IListResponse<IDocument> = await response.json();
              return {
                data: data.data.filter(
                  (doc) =>
                    !caseDocuments.some(
                      (caseDoc) => caseDoc.document.id === doc.id,
                    ),
                ),
                pagination: data.pagination,
              };
            } catch (error) {
              console.error('Error fetching documents:', error);
              toast.error('Có lỗi xảy ra khi tải tài liệu');
              return { data: [], pagination: {} as any };
            }
          }}
          onSelect={(docs: IDocument[]) => {
            toastIdRef.current = toast.loading('Đang gán tài liệu...');

            fetcher.submit(
              {
                documentIds: JSON.stringify(docs.map((doc) => doc.id)),
              },
              {
                method: 'POST',
                action: `/api/cases/${caseId}/documents`,
              },
            );
          }}
        />
      )}
    </Card>
  );
}
