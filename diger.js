const MM_PER_INCH = 25.4;
const ROLLING_FACTOR = 0.96;
const MM_PER_KM = 1000000;
const INCHES_PER_MILE = 63360;

const tyreInput = document.querySelector("[data-tyre-code]");
const tyreError = document.querySelector("[data-tyre-error]");
const tyreResults = document.querySelector("[data-tyre-results]");
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
const btuRegionInput = document.querySelector("[data-btu-region]");
const btuAreaInput = document.querySelector("[data-btu-area]");
const btuPeopleInput = document.querySelector("[data-btu-people]");
const btuLightingInput = document.querySelector("[data-btu-lighting]");
const btuValueOutput = document.querySelector("[data-btu-value]");
const btuSuggestedOutput = document.querySelector("[data-btu-suggested]");
const btuBaseOutput = document.querySelector("[data-btu-base]");
const btuExtraOutput = document.querySelector("[data-btu-extra]");

const HIJRI_MONTHS = [
  "Muharrem",
  "Safer",
  "Rebiülevvel",
  "Rebiülahir",
  "Cemaziyelevvel",
  "Cemaziyelahir",
  "Recep",
  "Şaban",
  "Ramazan",
  "Şevval",
  "Zilkade",
  "Zilhicce",
];

function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value);
}

function parseTyreCode(code) {
  const cleaned = code.trim().toUpperCase().replace(/\s+/g, "");
  const match = cleaned.match(/^(\d{3})\/(\d{2,3})R(\d{2})$/);

  if (!match) {
    return null;
  }

  const widthMm = Number(match[1]);
  const middleValue = Number(match[2]);
  const rimInch = Number(match[3]);
  const rimMm = rimInch * MM_PER_INCH;

  let sidewallHeightMm;
  let sidewallRatio;
  let tyreDiameterMm;

  if (middleValue >= 200) {
    tyreDiameterMm = middleValue;
    sidewallHeightMm = (tyreDiameterMm - rimMm) / 2;
    sidewallRatio = (sidewallHeightMm / widthMm) * 100;
  } else {
    sidewallRatio = middleValue;
    sidewallHeightMm = widthMm * (sidewallRatio / 100);
    tyreDiameterMm = rimMm + sidewallHeightMm * 2;
  }

  if (sidewallHeightMm <= 0 || tyreDiameterMm <= rimMm) {
    return null;
  }

  const tyreCircumferenceMm = tyreDiameterMm * Math.PI;
  const rollingCircumferenceMm = tyreCircumferenceMm * ROLLING_FACTOR;
  const rollingRadiusMm = (tyreDiameterMm / 2) * ROLLING_FACTOR;
  const wheelRadiusMm = rimMm / 2;
  const revolutionsPerKm = MM_PER_KM / rollingCircumferenceMm;

  return {
    widthMm,
    sidewallRatio,
    sidewallHeightMm,
    rimMm,
    tyreDiameterMm,
    rollingCircumferenceMm,
    tyreCircumferenceMm,
    rollingRadiusMm,
    wheelRadiusMm,
    revolutionsPerKm,
  };
}

function buildCards(data) {
  const metricCards = [
    ["Genişlik", `${formatNumber(data.widthMm)} mm`],
    ["Yanak oranı", `%${formatNumber(data.sidewallRatio, 1)}`],
    ["Yanak yüksekliği", `${formatNumber(data.sidewallHeightMm)} mm`],
    ["Jant çapı", `${formatNumber(data.rimMm)} mm`],
    ["Lastik çapı", `${formatNumber(data.tyreDiameterMm)} mm`],
    ["Yuvarlanma çevresi", `${formatNumber(data.rollingCircumferenceMm)} mm`],
    ["Lastik çevresi", `${formatNumber(data.tyreCircumferenceMm)} mm`],
    ["Yuvarlanma yarıçapı", `${formatNumber(data.rollingRadiusMm)} mm`],
    ["Teker yarıçapı", `${formatNumber(data.wheelRadiusMm)} mm`],
    ["Km başına devir", formatNumber(data.revolutionsPerKm)],
  ];

  const imperialCards = [
    ["Genişlik", `${formatNumber(data.widthMm / MM_PER_INCH)} in`],
    ["Yanak oranı", `%${formatNumber(data.sidewallRatio, 1)}`],
    ["Yanak yüksekliği", `${formatNumber(data.sidewallHeightMm / MM_PER_INCH)} in`],
    ["Jant çapı", `${formatNumber(data.rimMm / MM_PER_INCH)} in`],
    ["Lastik çapı", `${formatNumber(data.tyreDiameterMm / MM_PER_INCH)} in`],
    ["Yuvarlanma çevresi", `${formatNumber(data.rollingCircumferenceMm / MM_PER_INCH)} in`],
    ["Lastik çevresi", `${formatNumber(data.tyreCircumferenceMm / MM_PER_INCH)} in`],
    ["Yuvarlanma yarıçapı", `${formatNumber(data.rollingRadiusMm / MM_PER_INCH)} in`],
    ["Teker yarıçapı", `${formatNumber(data.wheelRadiusMm / MM_PER_INCH)} in`],
    ["Mil başına devir", formatNumber(INCHES_PER_MILE / (data.rollingCircumferenceMm / MM_PER_INCH))],
  ];

  return `
    <section class="other-result-group">
      <p class="other-result-group-title">Metrik</p>
      <div class="other-result-grid">
        ${metricCards
          .map(
            ([label, value]) => `
              <article class="other-result-card">
                <p class="other-result-label">${label}</p>
                <p class="other-result-value">${value}</p>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>

    <section class="other-result-group">
      <p class="other-result-group-title">İngiliz / Amerikan</p>
      <div class="other-result-grid">
        ${imperialCards
          .map(
            ([label, value]) => `
              <article class="other-result-card">
                <p class="other-result-label">${label}</p>
                <p class="other-result-value">${value}</p>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function updateTyreCalculator() {
  const parsed = parseTyreCode(tyreInput.value);

  if (!parsed) {
    tyreError.hidden = false;
    tyreResults.innerHTML = "";
    return;
  }

  tyreError.hidden = true;
  tyreResults.innerHTML = buildCards(parsed);
}

tyreInput.addEventListener("input", updateTyreCalculator);
updateTyreCalculator();

function parseGregorianDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatGregorianDate(date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getHijriNumericParts(date, calendarType) {
  const formatter = new Intl.DateTimeFormat(`en-u-ca-${calendarType}`, {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
  const parts = formatter.formatToParts(date);

  return {
    day: Number(parts.find((part) => part.type === "day").value),
    month: Number(parts.find((part) => part.type === "month").value),
    year: Number(parts.find((part) => part.type === "year").value),
  };
}

function getHijriLongParts(date, calendarType) {
  const formatter = new Intl.DateTimeFormat(`tr-TR-u-ca-${calendarType}`, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const parts = formatter.formatToParts(date);

  return {
    day: parts.find((part) => part.type === "day").value,
    month: parts.find((part) => part.type === "month").value,
    year: parts.find((part) => part.type === "year").value,
  };
}

function islamicToJulianDay(year, month, day) {
  return (
    day +
    Math.ceil(29.5 * (month - 1)) +
    (year - 1) * 354 +
    Math.floor((3 + 11 * year) / 30) +
    1948439
  );
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
  resultCalendar.textContent =
    calendarType === "islamic-umalqura" ? "Arabistan hicri (Um Al Qura)" : "Diyanet takvimine göre";
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

function suggestBtuCapacity(value) {
  const standardCapacities = [9000, 12000, 18000, 24000, 30000, 36000, 48000];
  return standardCapacities.find((capacity) => value <= capacity) ?? standardCapacities.at(-1);
}

function updateBtuCalculator() {
  const regionFactor = Number(btuRegionInput.value);
  const area = Number(btuAreaInput.value);
  const people = Number(btuPeopleInput.value);
  const lighting = Number(btuLightingInput.value);

  if (
    !Number.isFinite(regionFactor) ||
    !Number.isFinite(area) ||
    !Number.isFinite(people) ||
    !Number.isFinite(lighting) ||
    area <= 0 ||
    people < 0 ||
    lighting < 0
  ) {
    return;
  }

  const baseBtu = area * regionFactor;
  const extraBtu = people * 600 + lighting * 3.412;
  const totalBtu = baseBtu + extraBtu;
  const suggested = suggestBtuCapacity(totalBtu);

  btuValueOutput.textContent = `${formatNumber(totalBtu)} BTU/h`;
  btuSuggestedOutput.textContent = `${formatNumber(suggested)} BTU/h`;
  btuBaseOutput.textContent = `${formatNumber(baseBtu)} BTU/h`;
  btuExtraOutput.textContent = `${formatNumber(extraBtu)} BTU/h`;
}

[btuRegionInput, btuAreaInput, btuPeopleInput, btuLightingInput].forEach((element) => {
  element.addEventListener("input", updateBtuCalculator);
  element.addEventListener("change", updateBtuCalculator);
});

updateBtuCalculator();
