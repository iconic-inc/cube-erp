import { MONTHS, TODAY, WEEKDAY } from '../constants/date.constant.js';

import {
  getFullYearDates,
  getFullMonthDates,
  getFullWeekDates,
  getFullHours,
} from './date.util.js';
import { formatCurrency, toVnDateTimeString } from './index.js';

const buildDataset = (
  label: string | number,
  dates: string[],
  recMap: Map<string, number>,
): { label: string | number; data: number[] } => {
  let total = 0;

  const data = dates.reduce((arr, date, i) => {
    const currData = recMap.get(toVnDateTimeString(date)) || 0;
    total += currData;

    arr.push(currData);

    return arr;
  }, [] as number[]);

  return { label, data };
};

export function createYearData(
  year = TODAY.getFullYear(),
  recMap: Map<string, number>,
) {
  const fullYearDates = getFullYearDates(year);
  const dataset = buildDataset(year, fullYearDates, recMap);

  const options = {
    scales: {
      x: {
        min: fullYearDates[0],
        max: fullYearDates[fullYearDates.length - 1],
        // type: 'timeseries',
        ticks: {
          callback(value: string, index: number) {
            const currDate = new Date(value);
            return currDate.getDate() === 1
              ? MONTHS[currDate.getMonth()]
              : null;
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback(value: number) {
            return formatCurrency(value);
          },
        },
      },
    },
  };

  return { dataset, options };
}

export function createMonthData(
  month = TODAY.getMonth(),
  year = TODAY.getFullYear(),
  recMap: Map<string, number>,
) {
  const fullMonthDates = getFullMonthDates(month, year);
  const dataset = buildDataset(MONTHS[month], fullMonthDates, recMap);

  const options = {
    scales: {
      x: {
        min: 1,
        max: 31,
        ticks: {
          callback(value: string, index: number) {
            return `Ngày ${value + 1}`;
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback(value: number) {
            return formatCurrency(value);
          },
        },
      },
    },
  };

  return { dataset, options };
}

export function createWeekData(
  day = TODAY.getDate(),
  month = TODAY.getMonth(),
  year = TODAY.getFullYear(),
  recMap: Map<string, number>,
) {
  const fullWeekDates = getFullWeekDates(day, month, year);
  const dataset = buildDataset(
    `Tuần ${new Date(fullWeekDates[0]).getDate()}-${new Date(
      fullWeekDates[fullWeekDates.length - 1],
    ).getDate()}/${
      new Date(fullWeekDates[fullWeekDates.length - 1]).getMonth() + 1
    }`,
    fullWeekDates,
    recMap,
  );

  const options = {
    scales: {
      x: {
        min: 1,
        max: 7,
        ticks: {
          callback(value: number, index: number) {
            return WEEKDAY[value];
          },
        },
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        callback(value: number) {
          return formatCurrency(value);
        },
      },
    },
  };

  return { dataset, options };
}

export function createDayData(
  day = TODAY.getDate(),
  month = TODAY.getMonth(),
  year = TODAY.getFullYear(),
  recMap: Map<string, number>,
) {
  const fullHours = getFullHours();
  const dataset = buildDataset(
    new Date(year, month, day).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    fullHours.map((hour) => {
      return `${year}-${month + 1}-${day} ${hour}:00:00 GMT+7`;
    }),
    recMap,
  );

  const options = {
    scales: {
      x: {
        min: 1,
        max: 24,
        ticks: {
          callback(value: number, index: number) {
            return `${value}:00`;
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback(value: number) {
            return formatCurrency(value);
          },
        },
      },
    },
  };

  return { dataset, options };
}
