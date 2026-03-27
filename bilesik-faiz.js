const daysInput = document.querySelector("[data-compound-days]");
const simpleRateInput = document.querySelector("[data-compound-simple-rate]");
const calculateButton = document.querySelector("[data-compound-calculate]");
const noteOutput = document.querySelector("[data-compound-note]");
const compoundRateOutput = document.querySelector("[data-compound-rate]");
const multiplierOutput = document.querySelector("[data-compound-multiplier]");
const futureValueOutput = document.querySelector("[data-compound-future]");

function parseLocalizedNumber(value) {
  return Number(String(value).replace(/\./g, "").replace(",", "."));
}

function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatPercent(value) {
  return `%${formatNumber(value, 2)}`;
}

function calculateCompoundRate() {
  const days = Number(daysInput.value);
  const simpleRate = parseLocalizedNumber(simpleRateInput.value);

  if (!Number.isFinite(days) || !Number.isFinite(simpleRate) || days <= 0) {
    noteOutput.textContent = "Lütfen gün sayısı ve faiz oranı için geçerli değerler gir.";
    return;
  }

  const compoundRate = (Math.pow((simpleRate * days) / 36500 + 1, 365 / days) - 1) * 100;
  const multiplier = 1 + compoundRate / 100;
  const futureValue = 100 * multiplier;

  compoundRateOutput.textContent = formatPercent(compoundRate);
  multiplierOutput.textContent = `${formatNumber(multiplier, 4)}x`;
  futureValueOutput.textContent = formatNumber(futureValue, 2);
  noteOutput.textContent = `${days} gün ve %${formatNumber(simpleRate, 2)} basit faiz için yıllık bileşik oran hesaplandı.`;
}

calculateButton.addEventListener("click", calculateCompoundRate);

[daysInput, simpleRateInput].forEach((input) => {
  input.addEventListener("input", calculateCompoundRate);
  input.addEventListener("change", calculateCompoundRate);
});

calculateCompoundRate();
