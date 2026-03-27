const modeInput = document.querySelector("[data-vehicle-loan-mode]");
const kindInput = document.querySelector("[data-vehicle-loan-kind]");
const amountInput = document.querySelector("[data-vehicle-loan-amount]");
const paymentInput = document.querySelector("[data-vehicle-loan-payment-input]");
const monthsInput = document.querySelector("[data-vehicle-loan-months]");
const rateInput = document.querySelector("[data-vehicle-loan-rate]");
const noteOutput = document.querySelector("[data-vehicle-loan-note]");
const calculateButton = document.querySelector("[data-vehicle-loan-calculate]");
const scheduleToggleButton = document.querySelector("[data-vehicle-loan-schedule-toggle]");
const schedulePanel = document.querySelector("[data-vehicle-loan-schedule-panel]");
const scheduleBody = document.querySelector("[data-vehicle-loan-schedule-body]");
const amountOutput = document.querySelector("[data-vehicle-loan-amount-output]");
const paymentOutput = document.querySelector("[data-vehicle-loan-payment-output]");
const interestOutput = document.querySelector("[data-vehicle-loan-interest-output]");
const taxOutput = document.querySelector("[data-vehicle-loan-tax-output]");
const totalOutput = document.querySelector("[data-vehicle-loan-total-output]");
const groupElements = Array.from(document.querySelectorAll("[data-vehicle-loan-group]"));

const BSMV_RATE = 0.05;

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

function setModeVisibility() {
  const mode = modeInput.value;
  groupElements.forEach((element) => {
    const shouldHide = element.dataset.vehicleLoanGroup !== mode;
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

function buildSchedule(principal, payment, nominalMonthlyRate, months, kkdfRate) {
  let balance = principal;
  let totalInterest = 0;
  let totalTax = 0;
  const rows = [];

  for (let month = 1; month <= months; month += 1) {
    const interest = balance * nominalMonthlyRate;
    const bsmv = interest * BSMV_RATE;
    const kkdf = interest * kkdfRate;
    const taxes = bsmv + kkdf;
    const principalPart = payment - interest - taxes;
    balance = Math.max(0, balance - principalPart);
    totalInterest += interest;
    totalTax += taxes;

    rows.push({
      month,
      payment,
      interest,
      bsmv,
      kkdf,
      principal: principalPart,
      balance,
    });
  }

  return {
    rows,
    totalInterest,
    totalTax,
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
          <td>${formatAmount(row.bsmv)}</td>
          <td>${formatAmount(row.kkdf)}</td>
          <td>${formatAmount(row.principal)}</td>
          <td>${formatAmount(row.balance)}</td>
        </tr>
      `,
    )
    .join("");
}

function calculateVehicleLoan() {
  const mode = modeInput.value;
  const months = Number(monthsInput.value);
  const nominalRate = parseLocalizedNumber(rateInput.value) / 100;
  const kkdfRate = kindInput.value === "commercial" ? 0 : 0.15;
  const effectiveRate = nominalRate * (1 + BSMV_RATE + kkdfRate);

  if (!Number.isFinite(months) || !Number.isFinite(nominalRate) || months <= 0 || nominalRate < 0) {
    noteOutput.textContent = "Lütfen vade ve faiz alanlarına geçerli değerler gir.";
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
    payment = getMonthlyPayment(principal, effectiveRate, months);
  } else {
    payment = parseLocalizedNumber(paymentInput.value);
    if (!Number.isFinite(payment) || payment <= 0) {
      noteOutput.textContent = "Lütfen geçerli bir aylık taksit gir.";
      return;
    }
    principal = getPrincipalFromPayment(payment, effectiveRate, months);
  }

  const schedule = buildSchedule(principal, payment, nominalRate, months, kkdfRate);

  amountOutput.textContent = formatAmount(principal);
  paymentOutput.textContent = formatAmount(payment);
  interestOutput.textContent = formatAmount(schedule.totalInterest);
  taxOutput.textContent = formatAmount(schedule.totalTax);
  totalOutput.textContent = formatAmount(schedule.totalPayment);
  renderSchedule(schedule.rows);

  noteOutput.textContent = `Taşıt kredisi için BSMV %5 ve KKDF ${kindInput.value === "commercial" ? "%0" : "%15"} uygulanarak ödeme planı oluşturuldu.`;
}

modeInput.addEventListener("change", () => {
  setModeVisibility();
  calculateVehicleLoan();
});

[kindInput, amountInput, paymentInput, monthsInput, rateInput].forEach((input) => {
  input.addEventListener("input", calculateVehicleLoan);
  input.addEventListener("change", calculateVehicleLoan);
});

calculateButton.addEventListener("click", calculateVehicleLoan);

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
calculateVehicleLoan();
