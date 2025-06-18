export interface IListColumn<T> {
  key: string;
  title: string;
  sortField?: string;
  visible: boolean;
  render: (item: T) => React.ReactNode;
  filterable?: boolean;
}

export interface IResolveError {
  success: boolean;
  message: string;
}

export type ILoaderDataPromise<T> =
  | Promise<T | IResolveError>
  | (T | IResolveError);
