const modeInput = document.querySelector("[data-home-loan-mode]");
const propertyValueInput = document.querySelector("[data-home-loan-property-value]");
const amountInput = document.querySelector("[data-home-loan-amount]");
const paymentInput = document.querySelector("[data-home-loan-payment-input]");
const monthsInput = document.querySelector("[data-home-loan-months]");
const rateInput = document.querySelector("[data-home-loan-rate]");
const noteOutput = document.querySelector("[data-home-loan-note]");
const calculateButton = document.querySelector("[data-home-loan-calculate]");
const scheduleToggleButton = document.querySelector("[data-home-loan-schedule-toggle]");
const schedulePanel = document.querySelector("[data-home-loan-schedule-panel]");
const scheduleBody = document.querySelector("[data-home-loan-schedule-body]");
const amountOutput = document.querySelector("[data-home-loan-amount-output]");
const paymentOutput = document.querySelector("[data-home-loan-payment-output]");
const interestOutput = document.querySelector("[data-home-loan-interest-output]");
const totalOutput = document.querySelector("[data-home-loan-total-output]");
const ltvOutput = document.querySelector("[data-home-loan-ltv-output]");
const groupElements = Array.from(document.querySelectorAll("[data-home-loan-group]"));

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

function setModeVisibility() {
  const mode = modeInput.value;
  groupElements.forEach((element) => {
    const shouldHide = element.dataset.homeLoanGroup !== mode;
    element.classList.toggle("need-loan-hidden", shouldHide);
  });
}

function getMonthlyPayment(principal, monthlyRate, months) {
  if (monthlyRate === 0) {
    return principal / months;
  }

  const factor = Math.pow(1 + monthlyRate, months);
  return principal * ((monthlyRate * factor) / (factor - 1));
}

function getPrincipalFromPayment(payment, monthlyRate, months) {
  if (monthlyRate === 0) {
    return payment * months;
  }

  const factor = Math.pow(1 + monthlyRate, months);
  return payment * ((factor - 1) / (monthlyRate * factor));
}

function buildSchedule(principal, payment, monthlyRate, months) {
  let balance = principal;
  let totalInterest = 0;
  const rows = [];

  for (let month = 1; month <= months; month += 1) {
    const interest = balance * monthlyRate;
    const principalPart = payment - interest;
    balance = Math.max(0, balance - principalPart);
    totalInterest += interest;

    rows.push({
      month,
      payment,
      interest,
      principal: principalPart,
      balance,
    });
  }

  return {
    rows,
    totalInterest,
    totalPayment: payment * months,
  };
}

function renderSchedule(rows) {
  scheduleBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${row.month}</td>
          <td>${formatAmount(row.payment)}</td>
          <td>${formatAmount(row.interest)}</td>
          <td>${formatAmount(row.principal)}</td>
          <td>${formatAmount(row.balance)}</td>
        </tr>
      `,
    )
    .join("");
}

function calculateHomeLoan() {
  const mode = modeInput.value;
  const propertyValue = parseLocalizedNumber(propertyValueInput.value);
  const months = Number(monthsInput.value);
  const monthlyRate = parseLocalizedNumber(rateInput.value) / 100;

  if (
    !Number.isFinite(propertyValue) ||
    !Number.isFinite(months) ||
    !Number.isFinite(monthlyRate) ||
    propertyValue <= 0 ||
    months <= 0 ||
    monthlyRate < 0
  ) {
    noteOutput.textContent = "Lütfen konut değeri, vade ve faiz alanlarına geçerli değerler gir.";
    return;
  }

  let principal = 0;
  let payment = 0;

  if (mode === "amount") {
    principal = parseLocalizedNumber(amountInput.value);
    if (!Number.isFinite(principal) || principal <= 0) {
      noteOutput.textContent = "Lütfen geçerli bir kredi tutarı gir.";
      return;
    }
    payment = getMonthlyPayment(principal, monthlyRate, months);
  } else {
    payment = parseLocalizedNumber(paymentInput.value);
    if (!Number.isFinite(payment) || payment <= 0) {
      noteOutput.textContent = "Lütfen geçerli bir aylık taksit gir.";
      return;
    }
    principal = getPrincipalFromPayment(payment, monthlyRate, months);
  }

  const schedule = buildSchedule(principal, payment, monthlyRate, months);
  const financingRatio = (principal / propertyValue) * 100;

  amountOutput.textContent = formatAmount(principal);
  paymentOutput.textContent = formatAmount(payment);
  interestOutput.textContent = formatAmount(schedule.totalInterest);
  totalOutput.textContent = formatAmount(schedule.totalPayment);
  ltvOutput.textContent = formatPercent(financingRatio);
  renderSchedule(schedule.rows);

  noteOutput.textContent = `Konut kredisi için ${months} aylık plana göre vergi muafiyetli ödeme tablosu oluşturuldu.`;
}

modeInput.addEventListener("change", () => {
  setModeVisibility();
  calculateHomeLoan();
});

[propertyValueInput, amountInput, paymentInput, monthsInput, rateInput].forEach((input) => {
  input.addEventListener("input", calculateHomeLoan);
  input.addEventListener("change", calculateHomeLoan);
});

calculateButton.addEventListener("click", calculateHomeLoan);

scheduleToggleButton.addEventListener("click", () => {
  const isHidden = schedulePanel.hasAttribute("hidden");
  if (isHidden) {
    schedulePanel.removeAttribute("hidden");
    scheduleToggleButton.textContent = "Ödeme tablosunu gizle";
  } else {
    schedulePanel.setAttribute("hidden", "");
    scheduleToggleButton.textContent = "Ödeme tablosunu göster";
  }
});

setModeVisibility();
calculateHomeLoan();
