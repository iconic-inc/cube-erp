// Task status and priority constants
export const TASK = {
  STATUS: {
    not_started: 'Chưa bắt đầu',
    in_progress: 'Đang tiến hành',
    completed: 'Đã hoàn thành',
    cancelled: 'Đã hủy',
  },
  PRIORITY: {
    low: 'Thấp',
    medium: 'Trung bình',
    high: 'Cao',
    urgent: 'Khẩn cấp',
  },
} as const;

export const TASK_PRIORITY_BADGE_CLASSES = {
  low: 'bg-green-500 text-white px-3 py-1 rounded-full',
  medium: 'bg-yellow-500 text-white px-3 py-1 rounded-full',
  high: 'bg-orange-500 text-white px-3 py-1 rounded-full',
  urgent: 'bg-red-500 text-white px-3 py-1 rounded-full',
} as const;

export const TASK_STATUS_BADGE_CLASSES = {
  not_started: 'bg-gray-500 text-white px-3 py-1 rounded-full',
  in_progress: 'bg-blue-500 text-white px-3 py-1 rounded-full',
  completed: 'bg-emerald-500 text-white px-3 py-1 rounded-full',
  cancelled: 'bg-rose-500 text-white px-3 py-1 rounded-full',
} as const;
