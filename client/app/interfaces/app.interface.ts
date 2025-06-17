export interface IListColumn<T> {
  key: string;
  title: string;
  sortField?: string;
  visible: boolean;
  render: (item: T) => React.ReactNode;
  filterable?: boolean;
}
