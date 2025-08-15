import { data } from '@remix-run/node';

export interface ISelectSearchOption {
  label: string;
  value: string;
}

export type FilterOptionFunction<T> = (item: T) => ISelectSearchOption;

export interface IListColumn<T> {
  key: string;
  title: string;
  sortField?: string;
  visible: boolean;
  render: (item: T) => React.ReactNode;
  filterField?: string;
  options?: ISelectSearchOption[] | FilterOptionFunction<T>;
  dateFilterable?: boolean;
}

export interface IResolveError {
  success: boolean;
  message: string;
}

export type ILoaderDataPromise<T> =
  | Promise<T | IResolveError>
  | (T | IResolveError);

export type IExportResponse = {
  fileUrl: string;
  fileName: string;
  count: number;
};

export interface IActionFunctionResponse<T = undefined> {
  success: boolean;
  toast: {
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  };
  data?: T;
  redirectTo?: string;
}

export type IActionFunctionReturn<T = undefined> = Promise<
  ReturnType<typeof data<IActionFunctionResponse<T>>>
>;
