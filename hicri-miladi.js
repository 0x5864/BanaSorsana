const calendarTypeSelect = document.querySelector("[data-calendar-type]");
const gregorianDateInput = document.querySelector("[data-gregorian-date]");
const hijriDayInput = document.querySelector("[data-hijri-day]");
const hijriMonthSelect = document.querySelector("[data-hijri-month]");
const hijriYearInput = document.querySelector("[data-hijri-year]");
const toHijriButton = document.querySelector("[data-convert-to-hijri]");
const toGregorianButton = document.querySelector("[data-convert-to-gregorian]");
const calendarError = document.querySelector("[data-calendar-error]");
const resultGregorian = document.querySelector("[data-result-gregorian]");
const resultHijri = document.querySelector("[data-result-hijri]");
const resultWeekday = document.querySelector("[data-result-weekday]");
const resultCalendar = document.querySelector("[data-result-calendar]");

const HIJRI_MONTHS = [
  "Muharrem", "Safer", "Rebiülevvel", "Rebiülahir", "Cemaziyelevvel", "Cemaziyelahir",
  "Recep", "Şaban", "Ramazan", "Şevval", "Zilkade", "Zilhicce",
];

function parseGregorianDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatGregorianDate(date) {
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

function getHijriNumericParts(date, calendarType) {
  const parts = new Intl.DateTimeFormat(`en-u-ca-${calendarType}`, { day: "numeric", month: "numeric", year: "numeric" }).formatToParts(date);
  return {
    day: Number(parts.find((part) => part.type === "day").value),
    month: Number(parts.find((part) => part.type === "month").value),
    year: Number(parts.find((part) => part.type === "year").value),
  };
}

function getHijriLongParts(date, calendarType) {
  const parts = new Intl.DateTimeFormat(`tr-TR-u-ca-${calendarType}`, { day: "numeric", month: "long", year: "numeric" }).formatToParts(date);
  return {
    day: parts.find((part) => part.type === "day").value,
    month: parts.find((part) => part.type === "month").value,
    year: parts.find((part) => part.type === "year").value,
  };
}

function islamicToJulianDay(year, month, day) {
  return day + Math.ceil(29.5 * (month - 1)) + (year - 1) * 354 + Math.floor((3 + 11 * year) / 30) + 1948439;
}

function julianDayToGregorian(julianDay) {
  let l = julianDay + 68569;
  const n = Math.floor((4 * l) / 146097);
  l -= Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l + 1)) / 1461001);
  l -= Math.floor((1461 * i) / 4) - 31;
  const j = Math.floor((80 * l) / 2447);
  const day = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  const month = j + 2 - 12 * l;
  const year = 100 * (n - 49) + i + l;
  return new Date(year, month - 1, day);
}

function findGregorianFromHijri(year, month, day, calendarType) {
  const approximateGregorian = julianDayToGregorian(islamicToJulianDay(year, month, day));
  for (let offset = -120; offset <= 120; offset += 1) {
    const candidate = new Date(approximateGregorian);
    candidate.setDate(candidate.getDate() + offset);
    const hijriParts = getHijriNumericParts(candidate, calendarType);
    if (hijriParts.year === year && hijriParts.month === month && hijriParts.day === day) {
      return candidate;
    }
  }
  return null;
}

function updateCalendarResult(date, calendarType) {
  const hijri = getHijriLongParts(date, calendarType);
  const weekday = new Intl.DateTimeFormat("tr-TR", { weekday: "long" }).format(date);
  resultGregorian.textContent = formatGregorianDate(date);
  resultHijri.textContent = `${hijri.day} ${hijri.month} ${hijri.year}`;
  resultWeekday.textContent = weekday;
  resultCalendar.textContent = calendarType === "islamic-umalqura" ? "Arabistan hicri (Um Al Qura)" : "Diyanet takvimine göre";
  calendarError.hidden = true;
}

function populateHijriMonths() {
  hijriMonthSelect.innerHTML = "";
  HIJRI_MONTHS.forEach((month, index) => {
    const option = document.createElement("option");
    option.value = String(index + 1);
    option.textContent = month;
    hijriMonthSelect.appendChild(option);
  });
}

function syncHijriInputsFromGregorian() {
  const date = parseGregorianDate(gregorianDateInput.value);
  if (!date) {
    calendarError.hidden = false;
    return;
  }
  const calendarType = calendarTypeSelect.value;
  const hijriNumeric = getHijriNumericParts(date, calendarType);
  hijriDayInput.value = String(hijriNumeric.day);
  hijriMonthSelect.value = String(hijriNumeric.month);
  hijriYearInput.value = String(hijriNumeric.year);
  updateCalendarResult(date, calendarType);
}

function syncGregorianFromHijri() {
  const year = Number(hijriYearInput.value);
  const month = Number(hijriMonthSelect.value);
  const day = Number(hijriDayInput.value);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    calendarError.hidden = false;
    return;
  }
  const gregorianDate = findGregorianFromHijri(year, month, day, calendarTypeSelect.value);
  if (!gregorianDate) {
    calendarError.hidden = false;
    return;
  }
  gregorianDateInput.value = gregorianDate.toISOString().slice(0, 10);
  updateCalendarResult(gregorianDate, calendarTypeSelect.value);
}

populateHijriMonths();
gregorianDateInput.value = new Date().toISOString().slice(0, 10);
syncHijriInputsFromGregorian();
toHijriButton.addEventListener("click", syncHijriInputsFromGregorian);
toGregorianButton.addEventListener("click", syncGregorianFromHijri);
calendarTypeSelect.addEventListener("change", syncHijriInputsFromGregorian);
