const tvmTargetInput = document.querySelector("[data-tvm-target]");
const tvmPaymentTimingInput = document.querySelector("[data-tvm-payment-timing]");
const tvmPvInput = document.querySelector("[data-tvm-pv]");
const tvmFvInput = document.querySelector("[data-tvm-fv]");
const tvmPmtInput = document.querySelector("[data-tvm-pmt]");
const tvmRateInput = document.querySelector("[data-tvm-rate]");
const tvmPeriodsInput = document.querySelector("[data-tvm-periods]");
const tvmCalculateButton = document.querySelector("[data-tvm-calculate]");
const tvmResultLabel = document.querySelector("[data-tvm-result-label]");
const tvmResultValue = document.querySelector("[data-tvm-result-value]");
const tvmGrowthValue = document.querySelector("[data-tvm-growth]");
const tvmTotalPaymentsValue = document.querySelector("[data-tvm-total-payments]");

const TARGET_META = {
  fv: { label: "Gelecek değer (FV)", input: tvmFvInput },
  pv: { label: "Bugünkü değer (PV)", input: tvmPvInput },
  pmt: { label: "Dönemsel ödeme (PMT)", input: tvmPmtInput },
};

function parseDecimal(value) {
  const raw = String(value).trim().replace(/\s+/g, "");
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

function formatAmount(value) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatFactor(value) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

function getTimingFactor(ratePerPeriod, paymentTiming) {
  if (paymentTiming === "begin") {
    return 1 + ratePerPeriod;
  }
  return 1;
}

function getAnnuityFutureFactor(ratePerPeriod, periods, paymentTiming) {
  if (periods <= 0) {
    return 0;
  }

  if (ratePerPeriod === 0) {
    return periods;
  }

  return (((1 + ratePerPeriod) ** periods - 1) / ratePerPeriod) * getTimingFactor(ratePerPeriod, paymentTiming);
}

function updateTargetState() {
  const target = tvmTargetInput?.value ?? "fv";

  Object.entries(TARGET_META).forEach(([key, meta]) => {
    if (!meta.input) {
      return;
    }

    const isTarget = key === target;
    meta.input.readOnly = isTarget;
    meta.input.value = isTarget ? "-" : meta.input.value === "-" ? "0,00" : meta.input.value;
  });
}

function calculateTvm() {
  const target = tvmTargetInput?.value ?? "fv";
  const paymentTiming = tvmPaymentTimingInput?.value ?? "end";
  const pv = parseDecimal(tvmPvInput?.value ?? "");
  const fv = parseDecimal(tvmFvInput?.value ?? "");
  const pmt = parseDecimal(tvmPmtInput?.value ?? "");
  const ratePercent = parseDecimal(tvmRateInput?.value ?? "");
  const periods = Number(tvmPeriodsInput?.value ?? "0");

  if (
    ratePercent === null ||
    !Number.isFinite(periods) ||
    periods <= 0 ||
    (target !== "pv" && (pv === null || pv < 0)) ||
    (target !== "fv" && (fv === null || fv < 0)) ||
    (target !== "pmt" && (pmt === null || pmt < 0))
  ) {
    if (tvmResultValue) {
      tvmResultValue.textContent = "-";
    }
    if (tvmGrowthValue) {
      tvmGrowthValue.textContent = "-";
    }
    if (tvmTotalPaymentsValue) {
      tvmTotalPaymentsValue.textContent = "-";
    }
    return;
  }

  const ratePerPeriod = ratePercent / 100;
  const growthFactor = (1 + ratePerPeriod) ** periods;
  const annuityFutureFactor = getAnnuityFutureFactor(ratePerPeriod, periods, paymentTiming);
  const targetMeta = TARGET_META[target];

  let result = 0;

  if (target === "fv") {
    result = (pv ?? 0) * growthFactor + (pmt ?? 0) * annuityFutureFactor;
  } else if (target === "pv") {
    result = ((fv ?? 0) - (pmt ?? 0) * annuityFutureFactor) / growthFactor;
  } else {
    result = annuityFutureFactor === 0 ? 0 : ((fv ?? 0) - (pv ?? 0) * growthFactor) / annuityFutureFactor;
  }

  if (targetMeta.input) {
    targetMeta.input.value = formatAmount(result);
  }

  if (tvmResultLabel) {
    tvmResultLabel.textContent = targetMeta.label;
  }

  if (tvmResultValue) {
    tvmResultValue.textContent = formatAmount(result);
  }

  if (tvmGrowthValue) {
    tvmGrowthValue.textContent = `${formatFactor(growthFactor)}x`;
  }

  if (tvmTotalPaymentsValue) {
    tvmTotalPaymentsValue.textContent = formatAmount((target === "pmt" ? result : (pmt ?? 0)) * periods);
  }
}

if (tvmTargetInput) {
  tvmTargetInput.addEventListener("change", () => {
    updateTargetState();
    calculateTvm();
  });
}

if (tvmPaymentTimingInput) {
  tvmPaymentTimingInput.addEventListener("change", calculateTvm);
}

if (tvmCalculateButton) {
  tvmCalculateButton.addEventListener("click", calculateTvm);
}

[tvmPvInput, tvmFvInput, tvmPmtInput].forEach((input) => {
  if (!input) {
    return;
  }

  input.addEventListener("blur", () => {
    if (input.readOnly) {
      return;
    }
    const value = parseDecimal(input.value);
    if (value === null) {
      return;
    }
    input.value = formatAmount(value);
  });
});

updateTargetState();
calculateTvm();
