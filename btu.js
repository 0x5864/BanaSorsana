const btuRegionInput = document.querySelector("[data-btu-region]");
const btuAreaInput = document.querySelector("[data-btu-area]");
const btuPeopleInput = document.querySelector("[data-btu-people]");
const btuLightingInput = document.querySelector("[data-btu-lighting]");
const btuValueOutput = document.querySelector("[data-btu-value]");
const btuSuggestedOutput = document.querySelector("[data-btu-suggested]");
const btuBaseOutput = document.querySelector("[data-btu-base]");
const btuExtraOutput = document.querySelector("[data-btu-extra]");

function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value);
}

function suggestBtuCapacity(value) {
  const standardCapacities = [9000, 12000, 18000, 24000, 30000, 36000, 48000];
  return standardCapacities.find((capacity) => value <= capacity) ?? standardCapacities.at(-1);
}

function updateBtuCalculator() {
  const regionFactor = Number(btuRegionInput.value);
  const area = Number(btuAreaInput.value);
  const people = Number(btuPeopleInput.value);
  const lighting = Number(btuLightingInput.value);

  if (!Number.isFinite(regionFactor) || !Number.isFinite(area) || !Number.isFinite(people) || !Number.isFinite(lighting) || area <= 0 || people < 0 || lighting < 0) {
    return;
  }

  const baseBtu = area * regionFactor;
  const extraBtu = people * 600 + lighting * 3.412;
  const totalBtu = baseBtu + extraBtu;
  const suggested = suggestBtuCapacity(totalBtu);

  btuValueOutput.textContent = `${formatNumber(totalBtu)} BTU/h`;
  btuSuggestedOutput.textContent = `${formatNumber(suggested)} BTU/h`;
  btuBaseOutput.textContent = `${formatNumber(baseBtu)} BTU/h`;
  btuExtraOutput.textContent = `${formatNumber(extraBtu)} BTU/h`;
}

[btuRegionInput, btuAreaInput, btuPeopleInput, btuLightingInput].forEach((element) => {
  element.addEventListener("input", updateBtuCalculator);
  element.addEventListener("change", updateBtuCalculator);
});

updateBtuCalculator();
