import { getDaysInMonth, isValidDate } from "./calendar";

/**
 * Historia AI - Time System
 *
 * Bu dosya oyunun zamanını yönetir.
 * React, UI veya oyun ekranı hakkında hiçbir bilgisi yoktur.
 */

/**
 * Varsayılan başlangıç tarihi.
 */
export const DEFAULT_START_DATE = {
  year: 1305,
  month: 3,
  day: 1,
};

/**
 * Yeni oyun zamanı oluşturur.
 */
export function createGameTime(startDate = DEFAULT_START_DATE) {
  if (!isValidDate(startDate)) {
    throw new Error("Geçersiz başlangıç tarihi.");
  }

  return {
    currentDate: { ...startDate },
    turn: 1,
    calendar: "julian",
  };
}

/**
 * Verilen tarihe belirtilen kadar gün ekler.
 * Yeni bir tarih döndürür.
 */
export function advanceDays(date, days) {
  if (!isValidDate(date)) {
    throw new Error("Geçersiz tarih.");
  }

  if (!Number.isInteger(days) || days < 0) {
    throw new Error("Gün sayısı negatif olamaz.");
  }

  let year = date.year;
  let month = date.month;
  let day = date.day + days;

  while (true) {
    const daysInMonth = getDaysInMonth(year, month);

    if (day <= daysInMonth) {
      break;
    }

    day -= daysInMonth;
    month++;

    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return {
    year,
    month,
    day,
  };
}

/**
 * 1 hafta = 7 gün
 */
export function advanceWeeks(date, weeks) {
  if (!Number.isInteger(weeks) || weeks < 0) {
    throw new Error("Hafta sayısı negatif olamaz.");
  }

  return advanceDays(date, weeks * 7);
}

/**
 * Ay ilerletir.
 * Gün, yeni ayın maksimum gününü aşarsa kırpılır.
 *
 * Örnek:
 * 31 Ocak + 1 ay = 28 Şubat
 */
export function advanceMonths(date, months) {
  if (!isValidDate(date)) {
    throw new Error("Geçersiz tarih.");
  }

  if (!Number.isInteger(months) || months < 0) {
    throw new Error("Ay sayısı negatif olamaz.");
  }

  let year = date.year;
  let month = date.month + months;

  while (month > 12) {
    month -= 12;
    year++;
  }

  const maxDays = getDaysInMonth(year, month);

  return {
    year,
    month,
    day: Math.min(date.day, maxDays),
  };
}

/**
 * Yıl ilerletir.
 */
export function advanceYears(date, years) {
  if (!isValidDate(date)) {
    throw new Error("Geçersiz tarih.");
  }

  if (!Number.isInteger(years) || years < 0) {
    throw new Error("Yıl sayısı negatif olamaz.");
  }

  const year = date.year + years;
  const maxDays = getDaysInMonth(year, date.month);

  return {
    year,
    month: date.month,
    day: Math.min(date.day, maxDays),
  };
}