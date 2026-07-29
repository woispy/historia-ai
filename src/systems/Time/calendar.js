/**
 * Historia AI - Calendar System
 *
 * Bu dosya yalnızca takvim kurallarını bilir.
 * Oyun zamanı, React veya oyun durumu hakkında hiçbir bilgisi yoktur.
 */

/**
 * Ay isimleri
 * Month numarası 1-12 arasında kullanılır.
 */
export const MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

/**
 * Normal yıldaki ay uzunlukları
 * Index:
 * 0 = Ocak
 * 1 = Şubat
 * ...
 */
export const DAYS_IN_MONTH = [
  31,
  28,
  31,
  30,
  31,
  30,
  31,
  31,
  30,
  31,
  30,
  31,
];

/**
 * Şimdilik artık yıl kullanılmıyor.
 * Gelecekte Julian/Hicri/Fantastik takvim desteği
 * buradan yönetilecek.
 */
export function isLeapYear(year) {
  void year;

  return false;
}

/**
 * Verilen ayın kaç gün çektiğini döndürür.
 */
export function getDaysInMonth(year, month) {
  if (month < 1 || month > 12) {
    throw new Error(`Geçersiz ay: ${month}`);
  }

  if (month === 2 && isLeapYear(year)) {
    return 29;
  }

  return DAYS_IN_MONTH[month - 1];
}

/**
 * Tarihin geçerli olup olmadığını kontrol eder.
 */
export function isValidDate({ year, month, day }) {
  if (!Number.isInteger(year) || year < 1) {
    return false;
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return false;
  }

  const maxDays = getDaysInMonth(year, month);

  if (!Number.isInteger(day) || day < 1 || day > maxDays) {
    return false;
  }

  return true;
}