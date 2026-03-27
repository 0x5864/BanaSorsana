const genderInput = document.querySelector("[data-bmi-gender]");
const ageInput = document.querySelector("[data-bmi-age]");
const heightInput = document.querySelector("[data-bmi-height]");
const weightInput = document.querySelector("[data-bmi-weight]");

const bmiValueOutput = document.querySelector("[data-bmi-value]");
const bmiCategoryOutput = document.querySelector("[data-bmi-category]");
const bmiRangeOutput = document.querySelector("[data-bmi-range]");
const bmiDeltaOutput = document.querySelector("[data-bmi-delta]");
const bmiPonderalOutput = document.querySelector("[data-bmi-ponderal]");
const bmiNoteOutput = document.querySelector("[data-bmi-note]");

function formatNumber(value, digits = 1) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function getBmiCategory(bmi) {
  if (bmi < 16) {
    return "Aşırı Zayıf";
  }
  if (bmi < 17) {
    return "Biraz Zayıf";
  }
  if (bmi < 18.5) {
    return "Hafif Zayıf";
  }
  if (bmi < 25) {
    return "Normal";
  }
  if (bmi < 30) {
    return "Fazla kilolu";
  }
  if (bmi < 35) {
    return "Obez Sınıf 1";
  }
  if (bmi < 40) {
    return "Obez Sınıf 2";
  }
  return "Obez Sınıf 3";
}

function updateBmi() {
  const age = Number(ageInput.value);
  const heightCm = Number(heightInput.value);
  const weightKg = Number(weightInput.value);

  if (!Number.isFinite(age) || !Number.isFinite(heightCm) || !Number.isFinite(weightKg) || heightCm <= 0 || weightKg <= 0) {
    return;
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const ponderalIndex = weightKg / (heightM * heightM * heightM);
  const healthyMin = 18.5 * heightM * heightM;
  const healthyMax = 25 * heightM * heightM;

  let deltaText = "Hedef aralıkta";
  if (bmi < 18.5) {
    deltaText = `${formatNumber(healthyMin - weightKg)} kg artır`;
  } else if (bmi > 25) {
    deltaText = `${formatNumber(weightKg - healthyMax)} kg azalt`;
  }

  bmiValueOutput.textContent = `${formatNumber(bmi)} kg/m²`;
  bmiCategoryOutput.textContent = getBmiCategory(bmi);
  bmiRangeOutput.textContent = `${formatNumber(healthyMin)} kg - ${formatNumber(healthyMax)} kg`;
  bmiDeltaOutput.textContent = deltaText;
  bmiPonderalOutput.textContent = `${formatNumber(ponderalIndex, 2)} kg/m³`;

  if (age < 20) {
    bmiNoteOutput.textContent =
      "Kaynak sayfadaki gibi 2-20 yaş için CDC yüzdelik yaklaşımı gerekir. Bu ekranda BMI değeri ve genel referans aralığı gösterilir.";
  } else {
    const genderText = genderInput.value === "female" ? "kadın" : "erkek";
    bmiNoteOutput.textContent =
      `Calculator.io sayfasındaki WHO yetişkin sınıflandırmasına göre ${genderText} kullanıcı için genel BMI sonucu gösteriliyor.`;
  }
}

[genderInput, ageInput, heightInput, weightInput].forEach((element) => {
  element.addEventListener("input", updateBmi);
  element.addEventListener("change", updateBmi);
});

updateBmi();
