const INCH_TO_CM = 2.54;

const ratioInput = document.querySelector("[data-monitor-ratio]");
const unitInput = document.querySelector("[data-monitor-unit]");
const diagonalInput = document.querySelector("[data-monitor-diagonal]");
const widthOutput = document.querySelector("[data-monitor-width]");
const heightOutput = document.querySelector("[data-monitor-height]");
const diagonalOutput = document.querySelector("[data-monitor-diagonal-output]");
const areaOutput = document.querySelector("[data-monitor-area]");

function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value);
}

function updateMonitorCalculator() {
  const diagonal = Number(diagonalInput.value);
  if (!Number.isFinite(diagonal) || diagonal <= 0) {
    return;
  }

  const [ratioWidth, ratioHeight] = ratioInput.value.split(":").map(Number);
  const diagonalInInches = unitInput.value === "cm" ? diagonal / INCH_TO_CM : diagonal;
  const ratioLength = Math.sqrt(ratioWidth ** 2 + ratioHeight ** 2);
  const widthInInches = (diagonalInInches * ratioWidth) / ratioLength;
  const heightInInches = (diagonalInInches * ratioHeight) / ratioLength;
  const areaInSquareInches = widthInInches * heightInInches;

  widthOutput.textContent = `${formatNumber(widthInInches)} in / ${formatNumber(widthInInches * INCH_TO_CM)} cm`;
  heightOutput.textContent = `${formatNumber(heightInInches)} in / ${formatNumber(heightInInches * INCH_TO_CM)} cm`;
  diagonalOutput.textContent = `${formatNumber(diagonalInInches)} in / ${formatNumber(diagonalInInches * INCH_TO_CM)} cm`;
  areaOutput.textContent =
    `${formatNumber(areaInSquareInches)} in² / ${formatNumber(areaInSquareInches * (INCH_TO_CM ** 2))} cm²`;
}

[ratioInput, unitInput, diagonalInput].forEach((element) => {
  element.addEventListener("input", updateMonitorCalculator);
  element.addEventListener("change", updateMonitorCalculator);
});

updateMonitorCalculator();
