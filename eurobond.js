const currencyInput = document.querySelector("[data-eb-currency]");
const frequencyInput = document.querySelector("[data-eb-frequency]");
const couponRateInput = document.querySelector("[data-eb-coupon-rate]");
const priceModeInput = document.querySelector("[data-eb-price-mode]");
const priceInput = document.querySelector("[data-eb-price]");
const nominalInput = document.querySelector("[data-eb-nominal]");
const purchaseDateInput = document.querySelector("[data-eb-purchase-date]");
const maturityDateInput = document.querySelector("[data-eb-maturity-date]");
const calculateButton = document.querySelector("[data-eb-calculate]");
const priceLabel = document.querySelector("[data-eb-price-label]");
const noteOutput = document.querySelector("[data-eb-note]");

const couponPaymentOutput = document.querySelector("[data-eb-coupon-payment]");
const accruedInterestOutput = document.querySelector("[data-eb-accrued-interest]");
const totalCostOutput = document.querySelector("[data-eb-total-cost]");
const ytmOutput = document.querySelector("[data-eb-ytm]");

const scheduleToggle = document.querySelector("[data-eb-schedule-toggle]");
const schedulePanel = document.querySelector("[data-eb-schedule-panel]");
const scheduleBody = document.querySelector("[data-eb-schedule-body]");

const frequencyMap = {
  none: { months: 0, periodsPerYear: 0 },
  monthly: { months: 1, periodsPerYear: 12 },
  quarterly: { months: 3, periodsPerYear: 4 },
  semiannual: { months: 6, periodsPerYear: 2 },
  yearly: { months: 12, periodsPerYear: 1 },
};

function parseLocalizedNumber(value) {
  return Number(String(value).replace(/\./g, "").replace(",", "."));
}

function formatAmount(value, currency) {
  return `${new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} ${currency}`;
}

function formatPercent(value) {
  return `%${new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function dateFromInput(value) {
  return new Date(`${value}T12:00:00`);
}

function addMonths(date, months) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
}

function daysBetween(startDate, endDate) {
  return Math.max(0, (endDate - startDate) / 86400000);
}

function updatePriceLabel() {
  priceLabel.textContent = priceModeInput.value === "dirty" ? "Kirli alış fiyatı (%)" : "Temiz alış fiyatı (%)";
}

function getCouponWindow(purchaseDate, maturityDate, frequencyKey) {
  const frequency = frequencyMap[frequencyKey];
  if (frequency.periodsPerYear === 0) {
    return null;
  }

  let nextCouponDate = new Date(maturityDate);
  let previousCouponDate = addMonths(nextCouponDate, -frequency.months);

  while (purchaseDate < previousCouponDate) {
    nextCouponDate = previousCouponDate;
    previousCouponDate = addMonths(nextCouponDate, -frequency.months);
  }

  return { previousCouponDate, nextCouponDate };
}

function buildCashFlows(purchaseDate, maturityDate, nominal, annualCouponRate, frequencyKey) {
  const frequency = frequencyMap[frequencyKey];
  const cashFlows = [];

  if (frequency.periodsPerYear === 0) {
    cashFlows.push({
      date: new Date(maturityDate),
      couponAmount: 0,
      principalAmount: nominal,
      totalAmount: nominal,
      remainingDays: Math.round(daysBetween(purchaseDate, maturityDate)),
    });
    return cashFlows;
  }

  const couponAmount = nominal * (annualCouponRate / 100) / frequency.periodsPerYear;
  const paymentDates = [];
  let cursor = new Date(maturityDate);

  while (cursor > purchaseDate) {
    paymentDates.unshift(new Date(cursor));
    cursor = addMonths(cursor, -frequency.months);
  }

  paymentDates.forEach((paymentDate) => {
    const isMaturity = paymentDate.getTime() === maturityDate.getTime();
    const principalAmount = isMaturity ? nominal : 0;
    cashFlows.push({
      date: paymentDate,
      couponAmount,
      principalAmount,
      totalAmount: couponAmount + principalAmount,
      remainingDays: Math.round(daysBetween(purchaseDate, paymentDate)),
    });
  });

  return cashFlows;
}

function calculateYtm(targetPrice, cashFlows, purchaseDate) {
  if (targetPrice <= 0 || !cashFlows.length) {
    return 0;
  }

  const presentValue = (yieldRate) =>
    cashFlows.reduce((total, flow) => {
      const yearFraction = daysBetween(purchaseDate, flow.date) / 365;
      return total + flow.totalAmount / (1 + yieldRate) ** yearFraction;
    }, 0);

  let low = -0.95;
  let high = 2.5;
  while (presentValue(high) > targetPrice && high < 20) {
    high *= 1.5;
  }

  for (let index = 0; index < 80; index += 1) {
    const mid = (low + high) / 2;
    const midValue = presentValue(mid);
    if (midValue > targetPrice) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return ((low + high) / 2) * 100;
}

function renderSchedule(cashFlows, currency) {
  scheduleBody.innerHTML = cashFlows
    .map(
      (flow) => `
        <tr>
          <td>${formatDate(flow.date)}</td>
          <td>${formatAmount(flow.couponAmount, currency)}</td>
          <td>${formatAmount(flow.principalAmount, currency)}</td>
          <td>${formatAmount(flow.totalAmount, currency)}</td>
          <td>${flow.remainingDays}</td>
        </tr>
      `,
    )
    .join("");
}

function calculateEurobond() {
  const currency = currencyInput.value;
  const frequencyKey = frequencyInput.value;
  const annualCouponRate = parseLocalizedNumber(couponRateInput.value);
  const inputPricePercent = parseLocalizedNumber(priceInput.value);
  const nominal = parseLocalizedNumber(nominalInput.value);
  const purchaseDate = dateFromInput(purchaseDateInput.value);
  const maturityDate = dateFromInput(maturityDateInput.value);

  if (
    !Number.isFinite(annualCouponRate) ||
    !Number.isFinite(inputPricePercent) ||
    !Number.isFinite(nominal) ||
    annualCouponRate < 0 ||
    inputPricePercent <= 0 ||
    nominal <= 0 ||
    Number.isNaN(purchaseDate.getTime()) ||
    Number.isNaN(maturityDate.getTime()) ||
    purchaseDate >= maturityDate
  ) {
    noteOutput.textContent = "Lütfen tüm alanları geçerli değerlerle doldur.";
    return;
  }

  const frequency = frequencyMap[frequencyKey];
  const couponPerPayment =
    frequency.periodsPerYear === 0 ? 0 : nominal * (annualCouponRate / 100) / frequency.periodsPerYear;

  let accruedInterest = 0;
  if (frequency.periodsPerYear > 0) {
    const couponWindow = getCouponWindow(purchaseDate, maturityDate, frequencyKey);
    if (couponWindow) {
      const periodDays = Math.max(1, daysBetween(couponWindow.previousCouponDate, couponWindow.nextCouponDate));
      const elapsedDays = Math.min(periodDays, daysBetween(couponWindow.previousCouponDate, purchaseDate));
      accruedInterest = couponPerPayment * (elapsedDays / periodDays);
    }
  }

  const accruedPercent = nominal === 0 ? 0 : (accruedInterest / nominal) * 100;
  const cleanPricePercent = priceModeInput.value === "dirty" ? inputPricePercent - accruedPercent : inputPricePercent;
  const dirtyPricePercent = priceModeInput.value === "dirty" ? inputPricePercent : inputPricePercent + accruedPercent;
  const totalCost = nominal * dirtyPricePercent / 100;

  const cashFlows = buildCashFlows(purchaseDate, maturityDate, nominal, annualCouponRate, frequencyKey);
  const ytm = calculateYtm(totalCost, cashFlows, purchaseDate);

  couponPaymentOutput.textContent =
    frequency.periodsPerYear === 0 ? `0,00 ${currency}` : formatAmount(couponPerPayment, currency);
  accruedInterestOutput.textContent = formatAmount(accruedInterest, currency);
  totalCostOutput.textContent = formatAmount(totalCost, currency);
  ytmOutput.textContent = formatPercent(ytm);

  noteOutput.textContent = `Temiz fiyat ${formatPercent(cleanPricePercent)} ve kirli fiyat ${formatPercent(
    dirtyPricePercent,
  )} olarak hesaplandı.`;

  renderSchedule(cashFlows, currency);
}

function toggleSchedule() {
  const isHidden = schedulePanel.hidden;
  schedulePanel.hidden = !isHidden;
  scheduleToggle.textContent = isHidden ? "Nakit akışını gizle" : "Nakit akışını göster";
}

[
  currencyInput,
  frequencyInput,
  couponRateInput,
  priceModeInput,
  priceInput,
  nominalInput,
  purchaseDateInput,
  maturityDateInput,
].forEach((input) => {
  input.addEventListener("change", () => {
    updatePriceLabel();
    calculateEurobond();
  });
  input.addEventListener("input", calculateEurobond);
});

calculateButton.addEventListener("click", calculateEurobond);
scheduleToggle.addEventListener("click", toggleSchedule);

updatePriceLabel();
calculateEurobond();
