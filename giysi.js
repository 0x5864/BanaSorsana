const CLOTHING_SYSTEMS = [
  { key: "eu_women", label: "EU kadın (beden)" },
  { key: "us_women", label: "US kadın" },
  { key: "uk_women", label: "UK kadın" },
  { key: "jp_women", label: "Japon kadın (beden)" },
  { key: "eu_men", label: "EU erkek (beden)" },
  { key: "usuk_men", label: "US & UK erkek" },
  { key: "jp_men", label: "Japon erkek (beden)" },
  { key: "letter", label: "Letter boyutu" },
];

const CLOTHING_ROWS = [
  ["32", "2", "4", "5", "42", "32", "1", "XXS"],
  ["34", "4", "6", "7", "44", "34", "2", "XS"],
  ["36", "6", "8", "9", "46", "36", "3", "S"],
  ["38", "8", "10", "11", "48", "38", "4", "M"],
  ["40", "10", "12", "13", "50", "40", "5", "L"],
  ["42", "12", "14", "15", "52", "42", "6", "XL"],
  ["44", "14", "16", "17", "54", "44", "7", "XXL"],
  ["46", "16", "18", "19", "56", "46", "8", "3XL"],
  ["48", "18", "20", "21", "58", "48", "9", "4XL"],
  ["50", "20", "22", "23", "60", "50", "10", "5XL"],
].map((values) => Object.fromEntries(CLOTHING_SYSTEMS.map((system, index) => [system.key, values[index]])));

const systemSelect = document.querySelector("[data-clothing-system]");
const sizeSelect = document.querySelector("[data-clothing-size]");
const resultsContainer = document.querySelector("[data-clothing-results]");

function populateSystems() {
  systemSelect.innerHTML = "";
  CLOTHING_SYSTEMS.forEach((system) => {
    const option = document.createElement("option");
    option.value = system.key;
    option.textContent = system.label;
    systemSelect.appendChild(option);
  });
  systemSelect.value = "eu_women";
}

function populateSizes(systemKey) {
  sizeSelect.innerHTML = "";
  CLOTHING_ROWS.forEach((row, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = row[systemKey];
    sizeSelect.appendChild(option);
  });
  sizeSelect.value = "0";
}

function renderResults() {
  const activeRow = CLOTHING_ROWS[Number(sizeSelect.value)];
  resultsContainer.innerHTML = "";
  CLOTHING_SYSTEMS.forEach((system) => {
    const card = document.createElement("article");
    card.className = "apparel-result-card";
    card.innerHTML = `<p class="apparel-result-label">${system.label}</p><p class="apparel-result-value">${activeRow[system.key]}</p>`;
    resultsContainer.appendChild(card);
  });
}

systemSelect.addEventListener("change", () => {
  populateSizes(systemSelect.value);
  renderResults();
});
sizeSelect.addEventListener("change", renderResults);

populateSystems();
populateSizes(systemSelect.value);
renderResults();
