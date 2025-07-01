const ageUnit = {
  d: 'ngày',
  m: 'tháng',
  y: 'tuổi',
};

const getUnit = (u: string) => {
  return ageUnit[
    (Object.keys(ageUnit).find((key) => key === u) ||
      'y') as keyof typeof ageUnit
  ];
};

const toAgeString = ({ from, to }: { from: string; to: string }) => {
  const [fromAge, fromAgeUnit] = from.split('');
  const [toAge, toAgeUnit] = to.split('');

  if (from === to) {
    return `${from} ${getUnit(fromAgeUnit)}`;
  }

  return `${fromAge} ${getUnit(fromAgeUnit)} - ${toAge} ${getUnit(toAgeUnit)}`;
};

const abbCurrency = ['Đ', 'K', 'Tr', 'T'];
const shortenNumber = (money: number, stack = 0) => {
  if (Math.abs(+money) < 1_000 || stack >= abbCurrency.length - 1) {
    if (stack < 2) return `${+money.toFixed(2)}${abbCurrency[stack]}`;

    const [int, dec] = money.toFixed(2).split('.');
    return `${int}${abbCurrency[stack]}${dec.replace(/0+$/, '')}`;
  }

  return shortenNumber(+(+money / 1_000).toFixed(2), ++stack);
};

const toCurrencyString = (money: number | string) => {
  return shortenNumber(+money);
};

const getMapLink = (html: string) => {
  return html.match(/(https:\/\/[^"]*)/)?.[1];
};

const toVnDateString = (date: string) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};
const toVnDateTimeString = (date: string | Date) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
  });
};

const isEmptyObj = (obj: Object) => !Object.keys(obj).length;

const calHourDiff = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  return Math.abs((endDate.getTime() - startDate.getTime()) / 36e5).toFixed(2);
};

const parseJwt = <U>(token: string) => {
  const data = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64').toString('utf-8'),
  );
  return data as U & {
    exp: number;
    iat: number;
  };
};

const isExpired = (token: string) => {
  const { exp } = parseJwt(token);
  const expDate = new Date(exp * 1000);
  const now = new Date();
  return expDate < now;
};

// Format date using format string
const formatDate = (
  dateString?: string | Date,
  format: string = 'DD/MM/YYYY',
) => {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';

  // Get date components
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  // Get day of week in Vietnamese
  const weekdays = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
  ];
  const dayOfWeek = weekdays[date.getDay()];

  // Replace format patterns
  return format
    .replace('dddd', dayOfWeek)
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year.toString())
    .replace('HH', hours)
    .replace('mm', minutes);
};

// Format currency in Vietnamese style
const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0 ₫';

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(num);
};

// Calculate age from date of birth
const calculateAge = (dateOfBirth: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDifference = today.getMonth() - dateOfBirth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < dateOfBirth.getDate())
  ) {
    age--;
  }

  return age;
};

// Helper type for decreasing the depth counter
function getValueByPath<T>(obj: T, path: string) {
  if (typeof obj !== 'object' || obj === null) {
    return undefined;
  }
  // @ts-ignore
  return path.split('.').reduce((o, k) => (o || {})[k], obj);
}

const generateFormId = (prefix: string) => {
  return `${prefix}-${Math.random().toString(36).substring(2, 15)}`;
};

export {
  toAgeString,
  toCurrencyString,
  getMapLink,
  isEmptyObj,
  toVnDateString,
  toVnDateTimeString,
  calHourDiff,
  shortenNumber,
  getUnit,
  parseJwt,
  isExpired,
  ageUnit,
  abbCurrency,
  formatDate,
  formatCurrency,
  calculateAge,
  getValueByPath,
  generateFormId,
};
