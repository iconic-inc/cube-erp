const TODAY = new Date();

declare global {
  interface Date {
    addDays: (days: number) => Date;
    getWeek: (dowOffset?: number) => number;
  }
}

const getDates = (startDate: Date, endDate: Date) => {
  let dateArray = new Array();
  let currentDate = startDate;

  while (currentDate <= endDate) {
    dateArray.push(currentDate.toLocaleDateString());
    currentDate = currentDate.addDays(1);
  }

  return dateArray;
};

export const getFirstYearDate = (year: number) => new Date(year, 0, 1);
export const getLastYearDate = (year: number) => new Date(year, 11, 31);

export function getFullYearDates(year = TODAY.getFullYear()) {
  const firstYearDate = getFirstYearDate(year);
  const lastYearDate = getLastYearDate(year);

  return getDates(firstYearDate, lastYearDate);
}

export const getFirstMonthDate = (month: number, year: number) =>
  new Date(year, month, 1);
export const getLastMonthDate = (month: number, year: number) =>
  new Date(year, month + 1, 0);

export function getFullMonthDates(
  month = TODAY.getMonth(),
  year = TODAY.getFullYear()
) {
  const firstMonthDate = getFirstMonthDate(month, year);
  const lastMonthDate = getLastMonthDate(month, year);

  return getDates(firstMonthDate, lastMonthDate);
}

const getFirstWeekDay = (day: number, month: number, year: number) =>
  new Date(year, month, day).getDate() - new Date(year, month, day).getDay();
export const getFirstWeekDate = (day: number, month: number, year: number) =>
  new Date(year, month, getFirstWeekDay(day, month, year));
export const getLastWeekDate = (day: number, month: number, year: number) =>
  new Date(year, month, getFirstWeekDay(day, month, year) + 6);

export function getFullWeekDates(
  day = TODAY.getDate(),
  month = TODAY.getMonth(),
  year = TODAY.getFullYear()
) {
  const firstWeekDate = getFirstWeekDate(day, month, year);
  const lastWeekDate = getLastWeekDate(day, month, year);

  return getDates(firstWeekDate, lastWeekDate);
}

export function getDateObject(dateStr: string) {
  const date = new Date(dateStr);
  return {
    day: date.getDate(),
    month: date.getMonth(),
    year: date.getFullYear(),
  };
}

Date.prototype.getWeek = function (dowOffset = 0) {
  var newYear = new Date(this.getFullYear(), 0, 1);
  var day = newYear.getDay() - dowOffset; //the day of week the year begins on
  day = day >= 0 ? day : day + 7;
  var daynum =
    Math.floor(
      (this.getTime() -
        newYear.getTime() -
        (this.getTimezoneOffset() - newYear.getTimezoneOffset()) * 60000) /
        86400000
    ) + 1;
  var weeknum;
  //if the year starts before the middle of a week
  if (day < 4) {
    weeknum = Math.floor((daynum + day - 1) / 7) + 1;
    if (weeknum > 52) {
      newYear = new Date(this.getFullYear() + 1, 0, 1);
      day = newYear.getDay() - dowOffset;
      day = day >= 0 ? day : day + 7;
      /*if the next year starts before the middle of
                    the week, it is week #1 of that year*/
      weeknum = day < 4 ? 1 : 53;
    }
  } else {
    weeknum = Math.floor((daynum + day - 1) / 7);
  }
  return weeknum;
};

Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const WEEKDAY = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
