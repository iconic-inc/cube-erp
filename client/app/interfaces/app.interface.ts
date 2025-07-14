import { data } from '@remix-run/node';

export interface IListColumn<T> {
  key: string;
  title: string;
  sortField?: string;
  visible: boolean;
  render: (item: T) => React.ReactNode;
  filterField?: string;
  options?:
    | {
        label: string;
        value: string;
      }[]
    | ((item: T) => { label: string; value: string });
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
    type: 'error' | 'success';
    message: string;
  };
  data?: T;
}

export type IActionFunctionReturn<T = undefined> = Promise<
  ReturnType<typeof data<IActionFunctionResponse<T>>>
>;
