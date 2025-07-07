export const CASE_SERVICE = {
  STATUS: {
    open: 'Mở',
    in_progress: 'Đang thực hiện',
    completed: 'Hoàn thành',
    closed: 'Đóng',
  },
} as const;

export const CASE_STATUS_BADGE_CLASSES = {
  open: 'bg-gray-500 text-white px-3 py-1 rounded-full',
  in_progress: 'bg-blue-500 text-white px-3 py-1 rounded-full',
  completed: 'bg-emerald-500 text-white px-3 py-1 rounded-full',
  closed: 'bg-rose-500 text-white px-3 py-1 rounded-full',
} as const;
