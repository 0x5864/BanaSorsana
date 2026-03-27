const MM_PER_INCH = 25.4;
const ROLLING_FACTOR = 0.96;
const MM_PER_KM = 1000000;
const INCHES_PER_MILE = 63360;

const tyreInput = document.querySelector("[data-tyre-code]");
const tyreError = document.querySelector("[data-tyre-error]");
const tyreResults = document.querySelector("[data-tyre-results]");

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
        ${metricCards.map(([label, value]) => `<article class="other-result-card"><p class="other-result-label">${label}</p><p class="other-result-value">${value}</p></article>`).join("")}
      </div>
    </section>
    <section class="other-result-group">
      <p class="other-result-group-title">İngiliz / Amerikan</p>
      <div class="other-result-grid">
        ${imperialCards.map(([label, value]) => `<article class="other-result-card"><p class="other-result-label">${label}</p><p class="other-result-value">${value}</p></article>`).join("")}
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
