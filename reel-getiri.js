const modeInput = document.querySelector("[data-reel-mode]");
const startDateInput = document.querySelector("[data-reel-start-date]");
const endDateInput = document.querySelector("[data-reel-end-date]");
const indexTypeInput = document.querySelector("[data-reel-index-type]");
const tlInitialInput = document.querySelector("[data-reel-initial-tl]");
const tlFinalInput = document.querySelector("[data-reel-final-tl]");
const currencyInput = document.querySelector("[data-reel-currency]");
const currencyAmountInput = document.querySelector("[data-reel-currency-amount]");
const currencyBuyRateInput = document.querySelector("[data-reel-currency-buy-rate]");
const currencySellRateInput = document.querySelector("[data-reel-currency-sell-rate]");
const metalInput = document.querySelector("[data-reel-metal]");
const metalAmountInput = document.querySelector("[data-reel-metal-amount]");
const metalBuyPriceInput = document.querySelector("[data-reel-metal-buy-price]");
const metalSellPriceInput = document.querySelector("[data-reel-metal-sell-price]");
const calculateButton = document.querySelector("[data-reel-calculate]");
const noteOutput = document.querySelector("[data-reel-note]");

const groupElements = Array.from(document.querySelectorAll("[data-reel-group]"));

const nominalOutput = document.querySelector("[data-reel-nominal]");
const inflationUsedOutput = document.querySelector("[data-reel-inflation-used]");
const thresholdOutput = document.querySelector("[data-reel-threshold]");
const amountOutput = document.querySelector("[data-reel-amount]");
const rateOutput = document.querySelector("[data-reel-rate]");

let inflationIndices = null;

function parseLocalizedNumber(value) {
  return Number(String(value).replace(/\./g, "").replace(",", "."));
}

function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatAmount(value) {
  return `${formatNumber(value, 2)} TL`;
}

function formatPercent(value) {
  return `%${formatNumber(value, 2)}`;
}

function getMonthKey(value) {
  if (!value) {
    return "";
  }
  return value.slice(0, 7);
}

function parseDateParts(value) {
  const [year, month, day] = String(value)
    .split("-")
    .map((part) => Number(part));

  return { year, month, day };
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getPreviousMonthKey(monthKey) {
  const [yearValue, monthValue] = monthKey.split("-").map(Number);
  let year = yearValue;
  let month = monthValue - 1;

  if (month === 0) {
    month = 12;
    year -= 1;
  }

  return `${year}-${String(month).padStart(2, "0")}`;
}

function getNextMonthKey(monthKey) {
  const [yearValue, monthValue] = monthKey.split("-").map(Number);
  let year = yearValue;
  let month = monthValue + 1;

  if (month === 13) {
    month = 1;
    year += 1;
  }

  return `${year}-${String(month).padStart(2, "0")}`;
}

function buildSelectedIndexSeries(indexType) {
  if (indexType === "cpi") {
    return inflationIndices.indices.cpi;
  }

  if (indexType === "enag") {
    return inflationIndices.indices.enag;
  }

  const averageSeries = {};
  const cpiEntries = inflationIndices.indices.cpi;
  const enagEntries = inflationIndices.indices.enag;

  Object.keys(cpiEntries).forEach((key) => {
    if (typeof enagEntries[key] === "number") {
      averageSeries[key] = (cpiEntries[key] + enagEntries[key]) / 2;
    }
  });

  return averageSeries;
}

function getCoveredDaysInMonth(monthKey, startDate, endDate) {
  const { year, month } = parseDateParts(`${monthKey}-01`);
  const monthDays = getDaysInMonth(year, month);
  const startMonthKey = getMonthKey(startDateInput.value);
  const endMonthKey = getMonthKey(endDateInput.value);

  if (startMonthKey === endMonthKey) {
    return Math.max(0, endDate.day - startDate.day + 1);
  }

  if (monthKey === startMonthKey) {
    return monthDays - startDate.day + 1;
  }

  if (monthKey === endMonthKey) {
    return endDate.day;
  }

  return monthDays;
}

function setModeVisibility() {
  const mode = modeInput.value;
  groupElements.forEach((element) => {
    element.classList.toggle("reel-hidden", element.dataset.reelGroup !== mode);
  });
}

async function loadInflationIndices() {
  const response = await fetch("/api/inflation-indices");
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Enflasyon endeksleri alınamadı.");
  }

  inflationIndices = data;
}

function getIndexedInflationRate() {
  const startDate = parseDateParts(startDateInput.value);
  const endDate = parseDateParts(endDateInput.value);
  const startKey = getMonthKey(startDateInput.value);
  const endKey = getMonthKey(endDateInput.value);
  const indexType = indexTypeInput.value;

  if (!inflationIndices?.indices?.cpi || !inflationIndices?.indices?.enag) {
    throw new Error("Endeks verisi henüz yüklenmedi.");
  }

  if (!startKey || !endKey || startKey > endKey) {
    throw new Error("Tarih aralığı geçersiz.");
  }

  if (
    !Number.isFinite(startDate.year) ||
    !Number.isFinite(startDate.month) ||
    !Number.isFinite(startDate.day) ||
    !Number.isFinite(endDate.year) ||
    !Number.isFinite(endDate.month) ||
    !Number.isFinite(endDate.day)
  ) {
    throw new Error("Tarih alanları geçersiz.");
  }

  const selectedSeries = buildSelectedIndexSeries(indexType);
  let inflationMultiplier = 1;
  let monthKey = startKey;

  while (monthKey <= endKey) {
    const previousMonthKey = getPreviousMonthKey(monthKey);
    const previousValue = selectedSeries[previousMonthKey];
    const currentValue = selectedSeries[monthKey];

    if (!previousValue || !currentValue) {
      if (indexType === "cpi") {
        throw new Error("Seçilen tarihler için TÜFE verisi bulunamadı.");
      }
      if (indexType === "enag") {
        throw new Error("Seçilen tarihler için ENAG verisi bulunamadı.");
      }
      throw new Error("Seçilen tarihler için ortalama endeks verisi bulunamadı.");
    }

    const { year, month } = parseDateParts(`${monthKey}-01`);
    const monthDays = getDaysInMonth(year, month);
    const coveredDays = getCoveredDaysInMonth(monthKey, startDate, endDate);
    const monthlyRate = currentValue / previousValue - 1;
    const partialRate = Math.pow(1 + monthlyRate, coveredDays / monthDays) - 1;
    inflationMultiplier *= 1 + partialRate;

    monthKey = getNextMonthKey(monthKey);
  }

  return (inflationMultiplier - 1) * 100;
}

function getInvestmentValues() {
  const mode = modeInput.value;

  if (mode === "tl") {
    return {
      initial: parseLocalizedNumber(tlInitialInput.value),
      final: parseLocalizedNumber(tlFinalInput.value),
      label: "TL yatırımı",
    };
  }

  if (mode === "currency") {
    const amount = parseLocalizedNumber(currencyAmountInput.value);
    const buyRate = parseLocalizedNumber(currencyBuyRateInput.value);
    const sellRate = parseLocalizedNumber(currencySellRateInput.value);

    return {
      initial: amount * buyRate,
      final: amount * sellRate,
      label: `${currencyInput.value} yatırımı`,
    };
  }

  const amount = parseLocalizedNumber(metalAmountInput.value);
  const buyPrice = parseLocalizedNumber(metalBuyPriceInput.value);
  const sellPrice = parseLocalizedNumber(metalSellPriceInput.value);

  return {
    initial: amount * buyPrice,
    final: amount * sellPrice,
    label: `${metalInput.value} yatırımı`,
  };
}

async function calculateRealReturn() {
  let inflationRate = 0;
  if (!inflationIndices) {
    await loadInflationIndices();
  }
  inflationRate = getIndexedInflationRate();

  const investment = getInvestmentValues();

  if (
    !Number.isFinite(inflationRate) ||
    !Number.isFinite(investment.initial) ||
    !Number.isFinite(investment.final) ||
    investment.initial <= 0 ||
    investment.final <= 0
  ) {
    noteOutput.textContent = "Lütfen tüm alanlara geçerli değerler gir.";
    return;
  }

  const nominalGain = investment.final - investment.initial;
  const inflationAdjustedThreshold = investment.initial * (1 + inflationRate / 100);
  const realGain = investment.final - inflationAdjustedThreshold;
  const realRate = (realGain / inflationAdjustedThreshold) * 100;

  inflationUsedOutput.textContent = formatPercent(inflationRate);
  nominalOutput.textContent = formatAmount(nominalGain);
  thresholdOutput.textContent = formatAmount(inflationAdjustedThreshold);
  amountOutput.textContent = formatAmount(realGain);
  rateOutput.textContent = formatPercent(realRate);

  noteOutput.textContent =
    realGain >= 0
      ? `${investment.label} enflasyonun üzerinde getiri üretmiş görünüyor.`
      : `${investment.label} enflasyon karşısında reel kayıp üretmiş görünüyor.`;
}

modeInput.addEventListener("change", () => {
  setModeVisibility();
  calculateRealReturn().catch((error) => {
    noteOutput.textContent = error instanceof Error ? error.message : "Hesaplama yapılamadı.";
  });
});

[
  startDateInput,
  endDateInput,
  indexTypeInput,
  tlInitialInput,
  tlFinalInput,
  currencyAmountInput,
  currencyBuyRateInput,
  currencySellRateInput,
  metalAmountInput,
  metalBuyPriceInput,
  metalSellPriceInput,
  currencyInput,
  metalInput,
].forEach((input) => {
  input.addEventListener("input", () => {
    calculateRealReturn().catch((error) => {
      noteOutput.textContent = error instanceof Error ? error.message : "Hesaplama yapılamadı.";
    });
  });
  input.addEventListener("change", () => {
    setModeVisibility();
    calculateRealReturn().catch((error) => {
      noteOutput.textContent = error instanceof Error ? error.message : "Hesaplama yapılamadı.";
    });
  });
});

calculateButton.addEventListener("click", () => {
  calculateRealReturn().catch((error) => {
    noteOutput.textContent = error instanceof Error ? error.message : "Hesaplama yapılamadı.";
  });
});

setModeVisibility();
calculateRealReturn().catch((error) => {
  noteOutput.textContent = error instanceof Error ? error.message : "Hesaplama yapılamadı.";
});
