const operationInput = document.querySelector("[data-gold-operation]");
const typeInput = document.querySelector("[data-gold-type]");
const amountInput = document.querySelector("[data-gold-amount]");
const unitInput = document.querySelector("[data-gold-unit]");
const amountLabel = document.querySelector("[data-gold-amount-label]");
const calculateButton = document.querySelector("[data-gold-calculate]");

const priceLabelOutput = document.querySelector("[data-gold-price-label]");
const resultLabelOutput = document.querySelector("[data-gold-result-label]");
const unitPriceOutput = document.querySelector("[data-gold-unit-price]");
const resultOutput = document.querySelector("[data-gold-result]");
const sourceOutput = document.querySelector("[data-gold-source]");
const summaryOutput = document.querySelector("[data-gold-summary]");
const noteOutput = document.querySelector("[data-gold-note]");

let goldRates = null;

const goldTypeCatalog = {
  gram24: { label: "24 Ayar Gram Altın", unit: "gram", currency: "TL" },
  gram22: { label: "22 Ayar Gram Altın", unit: "gram", currency: "TL" },
  gram18: { label: "18 Ayar Gram Altın", unit: "gram", currency: "TL" },
  ceyrek: { label: "Çeyrek Altın", unit: "adet", currency: "TL" },
  yarim: { label: "Yarım Altın", unit: "adet", currency: "TL" },
  tam: { label: "Tam Altın", unit: "adet", currency: "TL" },
  ata: { label: "Ata Altın", unit: "adet", currency: "TL" },
  gremse: { label: "Gremse Altın", unit: "adet", currency: "TL" },
  hasGram: { label: "Has Altın Gram", unit: "gram", currency: "TL" },
  ons: { label: "Altın/Ons ($)", unit: "ons", currency: "USD" },
};

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

function updateGoldFormLabels() {
  const selectedType = goldTypeCatalog[typeInput.value];
  const isBuying = operationInput.value === "buy";

  unitInput.value = selectedType.unit;
  amountLabel.textContent = isBuying ? `Tutar (${selectedType.currency})` : "Miktar";
  priceLabelOutput.textContent = isBuying ? "Kullanılan satış fiyatı" : "Kullanılan alış fiyatı";
  resultLabelOutput.textContent = isBuying ? "Alınabilecek miktar" : "Elde edilen tutar";
}

async function loadGoldRates() {
  const response = await fetch("/api/gold-rates");
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Altın fiyatları alınamadı.");
  }

  goldRates = data;
  sourceOutput.textContent = data.source || "Canlı tablo";
}

function calculateGold() {
  if (!goldRates?.rates) {
    noteOutput.textContent = "Canlı fiyatlar yüklenemedi.";
    return;
  }

  const selectedType = typeInput.value;
  const typeConfig = goldTypeCatalog[selectedType];
  const rate = goldRates.rates[selectedType];
  const amount = parseLocalizedNumber(amountInput.value);
  const isBuying = operationInput.value === "buy";

  if (!rate || !Number.isFinite(amount) || amount <= 0) {
    noteOutput.textContent = "Lütfen geçerli bir miktar gir.";
    return;
  }

  const unitPrice = isBuying ? rate.sell : rate.buy;

  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    noteOutput.textContent = "Seçilen tür için fiyat bulunamadı.";
    return;
  }

  unitPriceOutput.textContent = formatAmount(unitPrice, typeConfig.currency);

  if (isBuying) {
    const quantity = amount / unitPrice;
    resultOutput.textContent = `${formatNumber(quantity, 4)} ${typeConfig.unit}`;
    summaryOutput.textContent = `${formatAmount(amount, typeConfig.currency)} ile yaklaşık ${formatNumber(
      quantity,
      4,
    )} ${typeConfig.unit}`;
  } else {
    const proceeds = amount * unitPrice;
    resultOutput.textContent = formatAmount(proceeds, typeConfig.currency);
    summaryOutput.textContent = `${formatNumber(amount, 4)} ${typeConfig.unit} ${typeConfig.label} bozduruldu`;
  }

  noteOutput.textContent = rate.derived
    ? "Bu tür için değer, canlı baz fiyat üzerinden yaklaşık türetildi."
    : "Bu tür için canlı alış-satış fiyatı kullanıldı.";
}

async function refreshGoldCalculator() {
  updateGoldFormLabels();

  try {
    if (!goldRates) {
      noteOutput.textContent = "Canlı fiyatlar yükleniyor...";
      await loadGoldRates();
    }
    calculateGold();
  } catch (error) {
    noteOutput.textContent = error instanceof Error ? error.message : "Altın fiyatları alınamadı.";
  }
}

[operationInput, typeInput].forEach((element) => {
  element.addEventListener("change", refreshGoldCalculator);
});

amountInput.addEventListener("input", calculateGold);
calculateButton.addEventListener("click", refreshGoldCalculator);

refreshGoldCalculator();
