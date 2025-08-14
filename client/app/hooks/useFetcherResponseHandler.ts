import { FetcherWithComponents, useNavigate } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { IActionFunctionResponse } from '../interfaces/app.interface';

export const useFetcherResponseHandler = <T = any>(
  fetcher: FetcherWithComponents<IActionFunctionResponse<T>>,
  options?: {
    onSubmit?: () => any;
    onSuccess?: (
      data: T | undefined,
      fetcher: FetcherWithComponents<IActionFunctionResponse<T>>,
    ) => any;
    onFailed?: (
      data: T | undefined,
      fetcher: FetcherWithComponents<IActionFunctionResponse<T>>,
    ) => any;
    onDone?: (
      data: T | undefined,
      fetcher: FetcherWithComponents<IActionFunctionResponse<T>>,
    ) => any;
  },
) => {
  const toastIdRef = useRef<any>(null);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle fetcher response
  useEffect(() => {
    switch (fetcher.state) {
      case 'loading':
        const fetcherData = fetcher.data;
        if (!fetcherData && typeof fetcherData !== 'object') return;

        const { toast: toastData, success, redirectTo } = fetcherData;
        if (toastData && toastIdRef.current) {
          toast.update(toastIdRef.current, {
            type: toastData.type,
            render: toastData.message,
            isLoading: false,
            autoClose: 3000,
            closeOnClick: true,
            closeButton: true,
            pauseOnHover: true,
            pauseOnFocusLoss: true,
          });
        }

        options?.onDone?.(fetcherData.data, fetcher);

        if (success) {
          options?.onSuccess?.(fetcherData.data, fetcher);
        } else {
          options?.onFailed?.(fetcherData.data, fetcher);
        }
        toastIdRef.current = null;
        setIsSubmitting(false);
        // Redirect if success
        if (redirectTo) {
          navigate(redirectTo, { replace: true });
        }

        break;

      case 'submitting':
        toastIdRef.current = toast.loading('Đang xử lý...');
        options?.onSubmit?.();
        setIsSubmitting(true);
        break;
    }
  }, [fetcher.state, navigate]);

  return { isSubmitting, setIsSubmitting };
};
