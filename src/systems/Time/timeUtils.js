import { MONTHS, isValidDate } from "./calendar.js";

const DEFAULT_OPTIONS = {
  locale: "tr",
  shortMonth: false,
};

export function getMonthName(month, options = DEFAULT_OPTIONS) {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Geçersiz ay: ${month}`);
  }

  const monthName = MONTHS[month - 1];

  if (options.shortMonth) {
    return monthName.slice(0, 3);
  }

  return monthName;
}

export function formatDate(date, options = DEFAULT_OPTIONS) {
  if (!isValidDate(date)) {
    throw new Error("Geçersiz tarih.");
  }

  const settings = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const month = getMonthName(date.month, settings);

  return `${date.day} ${month} ${date.year}`;
}
