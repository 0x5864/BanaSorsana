const principalInput = document.querySelector("[data-deposit-principal]");
const currencyInput = document.querySelector("[data-deposit-currency]");
const rateInput = document.querySelector("[data-deposit-rate]");
const termValueInput = document.querySelector("[data-deposit-term-value]");
const termUnitInput = document.querySelector("[data-deposit-term-unit]");
const calculateButton = document.querySelector("[data-deposit-calculate]");
const noteOutput = document.querySelector("[data-deposit-note]");
const grossOutput = document.querySelector("[data-deposit-gross]");
const taxOutput = document.querySelector("[data-deposit-tax]");
const netOutput = document.querySelector("[data-deposit-net]");
const totalOutput = document.querySelector("[data-deposit-total]");
const taxRateOutput = document.querySelector("[data-deposit-tax-rate]");

function parseLocalizedNumber(value) {
  return Number(String(value).replace(/\./g, "").replace(",", "."));
}

function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatAmount(value, currency) {
  return `${formatNumber(value, 2)} ${currency}`;
}

function formatPercent(value) {
  return `%${formatNumber(value, 2)}`;
}

function getTermDays() {
  const termValue = Number(termValueInput.value);
  const unit = termUnitInput.value;

  if (unit === "day") {
    return termValue;
  }

  if (unit === "month") {
    return termValue * 30;
  }

  return termValue * 365;
}

function getWithholdingRate(currency, termDays) {
  if (currency === "TRY") {
    if (termDays <= 180) {
      return 15;
    }
    if (termDays <= 365) {
      return 12;
    }
    return 10;
  }

  if (termDays <= 365) {
    return 20;
  }

  return 18;
}

function calculateDeposit() {
  const principal = parseLocalizedNumber(principalInput.value);
  const annualRate = parseLocalizedNumber(rateInput.value);
  const termDays = getTermDays();
  const currency = currencyInput.value;

  if (
    !Number.isFinite(principal) ||
    !Number.isFinite(annualRate) ||
    !Number.isFinite(termDays) ||
    principal <= 0 ||
    annualRate < 0 ||
    termDays <= 0
  ) {
    noteOutput.textContent = "Lütfen tüm alanlara geçerli değerler gir.";
    return;
  }

  const grossInterest = principal * (annualRate / 100) * (termDays / 365);
  const withholdingRate = getWithholdingRate(currency, termDays);
  const taxAmount = grossInterest * (withholdingRate / 100);
  const netInterest = grossInterest - taxAmount;
  const maturityAmount = principal + netInterest;

  grossOutput.textContent = formatAmount(grossInterest, currency);
  taxOutput.textContent = formatAmount(taxAmount, currency);
  netOutput.textContent = formatAmount(netInterest, currency);
  totalOutput.textContent = formatAmount(maturityAmount, currency);
  taxRateOutput.textContent = formatPercent(withholdingRate);
  noteOutput.textContent = `${currency} mevduat için ${termDays} gün vadede stopaj oranı ${formatPercent(withholdingRate)} olarak uygulandı.`;
}

calculateButton.addEventListener("click", calculateDeposit);

[principalInput, currencyInput, rateInput, termValueInput, termUnitInput].forEach((input) => {
  input.addEventListener("input", calculateDeposit);
  input.addEventListener("change", calculateDeposit);
});

calculateDeposit();
