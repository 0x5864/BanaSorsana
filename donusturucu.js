const CONVERTER_CATEGORIES = {
  area: {
    units: {
      sqm: { label: "Metrekare (m²)", toBase: 1 },
      sqin: { label: "Inch kare (in²)", toBase: 0.00064516 },
      sqft: { label: "Foot kare (ft²)", toBase: 0.09290304 },
      sqyd: { label: "Yarda kare (yd²)", toBase: 0.83612736 },
      hectare: { label: "Hektar", toBase: 10000 },
      acre: { label: "Acre", toBase: 4046.8564224 },
      donum: { label: "Dönüm", toBase: 1000 },
    },
    defaultFrom: "sqm",
    defaultTo: "hectare",
  },
  pressure: {
    units: {
      bar: { label: "Bar", toBase: 100000 },
      kp_cm2: { label: "kp/cm²", toBase: 98066.5 },
      torr: { label: "Torr", toBase: 133.3223684211 },
      atm: { label: "Atmosfer (atm)", toBase: 101325 },
      lbf_ft2: { label: "lb/ft²", toBase: 47.88025898 },
      psi: { label: "lb/in² (psi)", toBase: 6894.757293168 },
    },
    defaultFrom: "bar",
    defaultTo: "psi",
  },
  flow: {
    units: {
      ls: { label: "Litre / saniye (L/s)", toBase: 1 },
      gpm: { label: "gal/min", toBase: 0.0630901964 },
      cfs: { label: "ft³/s", toBase: 28.316846592 },
      bblh: { label: "varil / saat", toBase: 0.04416313748 },
    },
    defaultFrom: "ls",
    defaultTo: "gpm",
  },
  energy: {
    units: {
      erg: { label: "Erg", toBase: 1e-7 },
      joule: { label: "Joule", toBase: 1 },
      kwh: { label: "kWh", toBase: 3600000 },
      cal: { label: "Cal", toBase: 4.184 },
      ftlb: { label: "ft-lbf", toBase: 1.3558179483314 },
      btu: { label: "Btu", toBase: 1055.05585262 },
      kpm: { label: "kpm", toBase: 9.80665 },
    },
    defaultFrom: "joule",
    defaultTo: "cal",
  },
  temperature: {
    units: {
      c: { label: "Celsius (°C)" },
      f: { label: "Fahrenheit (°F)" },
      k: { label: "Kelvin (K)" },
      r: { label: "Rankine (°R)" },
      re: { label: "Réaumur (°Ré)" },
    },
    defaultFrom: "c",
    defaultTo: "f",
  },
  time: {
    units: {
      second: { label: "Saniye", toBase: 1 },
      minute: { label: "Dakika", toBase: 60 },
      hour: { label: "Saat", toBase: 3600 },
      day: { label: "Gün", toBase: 86400 },
      week: { label: "Hafta", toBase: 604800 },
      month: { label: "Ay", toBase: 2629800 },
      year: { label: "Yıl", toBase: 31557600 },
    },
    defaultFrom: "second",
    defaultTo: "minute",
  },
  power: {
    units: {
      watt: { label: "Watt (W)", toBase: 1 },
      kw: { label: "Kilowatt (kW)", toBase: 1000 },
      metric_hp: { label: "Beygir gücü (PS)", toBase: 735.49875 },
      hp: { label: "Horsepower (hp)", toBase: 745.6998715823 },
      kcalh: { label: "kcal/h", toBase: 1.1622222222 },
      btuh: { label: "Btu/h", toBase: 0.2930710702 },
    },
    defaultFrom: "watt",
    defaultTo: "kw",
  },
  volume: {
    units: {
      m3: { label: "Metreküp (m³)", toBase: 1 },
      in3: { label: "Inch küp (in³)", toBase: 0.000016387064 },
      ft3: { label: "Foot küp (ft³)", toBase: 0.028316846592 },
      yd3: { label: "Yarda küp (yd³)", toBase: 0.764554857984 },
      us_gal: { label: "U.S. Galonu", toBase: 0.003785411784 },
      uk_gal: { label: "İng. Galonu", toBase: 0.00454609 },
    },
    defaultFrom: "m3",
    defaultTo: "us_gal",
  },
  force: {
    units: {
      newton: { label: "Newton (N)", toBase: 1 },
      dyne: { label: "Dyn", toBase: 0.00001 },
      kp: { label: "Kilopond (kp)", toBase: 9.80665 },
      lbf: { label: "Pound force (lbf)", toBase: 4.4482216152605 },
    },
    defaultFrom: "newton",
    defaultTo: "lbf",
  },
  weight: {
    units: {
      kg: { label: "Kilogram (kg)", toBase: 1 },
      kps2m: { label: "kp.s²/m", toBase: 9.80665 },
      oz: { label: "Ons (oz)", toBase: 0.028349523125 },
      lbs: { label: "Pound (lbs)", toBase: 0.45359237 },
      short_ton: { label: "Ton (short)", toBase: 907.18474 },
      long_ton: { label: "Ton (long)", toBase: 1016.0469088 },
      metric_ton: { label: "Ton (metrik)", toBase: 1000 },
    },
    defaultFrom: "kg",
    defaultTo: "lbs",
  },
  specific_weight: {
    units: {
      kp_m3: { label: "kp/m³", toBase: 1 },
      lbf_ft3: { label: "lb.force/ft³", toBase: 16.01846337396 },
    },
    defaultFrom: "kp_m3",
    defaultTo: "lbf_ft3",
  },
  length: {
    units: {
      m: { label: "Metre (m)", toBase: 1 },
      inch: { label: "Inch (in)", toBase: 0.0254 },
      foot: { label: "Foot (ft)", toBase: 0.3048 },
      yard: { label: "Yarda (yd)", toBase: 0.9144 },
      mile: { label: "Mil", toBase: 1609.344 },
      nautical_mile: { label: "Deniz mili", toBase: 1852 },
    },
    defaultFrom: "m",
    defaultTo: "inch",
  },
  density: {
    units: {
      kg_m3: { label: "Kg/m³", toBase: 1 },
      lb_ft3: { label: "lb/ft³", toBase: 16.01846337396 },
      lb_in3: { label: "lb/in³", toBase: 27679.904710191 },
    },
    defaultFrom: "kg_m3",
    defaultTo: "lb_ft3",
  },
  surface_tension: {
    units: {
      nm: { label: "N/m", toBase: 1 },
      dyncm: { label: "dyn/cm", toBase: 0.001 },
      lbf_ft: { label: "lbf/ft", toBase: 14.5939029372 },
    },
    defaultFrom: "nm",
    defaultTo: "dyncm",
  },
};

function normalizeAmount(value) {
  const parsed = Number(value.trim().replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

function formatNumber(value) {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 8,
  }).format(value);
}

function populateSelect(select, entries, selectedKey) {
  select.innerHTML = "";

  entries.forEach(([unitKey, unit]) => {
    const option = document.createElement("option");
    option.value = unitKey;
    option.textContent = unit.label;
    option.selected = unitKey === selectedKey;
    select.appendChild(option);
  });
}

function convertTemperature(amount, fromUnit, toUnit) {
  let celsius = amount;

  if (fromUnit === "f") {
    celsius = (amount - 32) * (5 / 9);
  } else if (fromUnit === "k") {
    celsius = amount - 273.15;
  } else if (fromUnit === "r") {
    celsius = (amount - 491.67) * (5 / 9);
  } else if (fromUnit === "re") {
    celsius = amount * 1.25;
  }

  if (toUnit === "f") {
    return (celsius * 9) / 5 + 32;
  }

  if (toUnit === "k") {
    return celsius + 273.15;
  }

  if (toUnit === "r") {
    return (celsius + 273.15) * (9 / 5);
  }

  if (toUnit === "re") {
    return celsius * 0.8;
  }

  return celsius;
}

function convertValue(categoryKey, amount, fromUnit, toUnit) {
  if (categoryKey === "temperature") {
    return convertTemperature(amount, fromUnit, toUnit);
  }

  const category = CONVERTER_CATEGORIES[categoryKey];
  const amountInBase = amount * category.units[fromUnit].toBase;
  return amountInBase / category.units[toUnit].toBase;
}

function updateCard(card) {
  const categoryKey = card.dataset.category;
  const category = CONVERTER_CATEGORIES[categoryKey];
  const amountInput = card.querySelector("[data-amount]");
  const fromSelect = card.querySelector("[data-from]");
  const toSelect = card.querySelector("[data-to]");
  const resultValue = card.querySelector("[data-result-value]");
  const resultUnit = card.querySelector("[data-result-unit]");
  const summary = card.querySelector("[data-summary]");
  const amount = normalizeAmount(amountInput.value);

  if (amount === null) {
    resultValue.textContent = "-";
    resultUnit.textContent = category.units[toSelect.value].label;
    summary.textContent = "Geçerli bir miktar girdiğinde sonuç burada görünecek.";
    return;
  }

  const converted = convertValue(categoryKey, amount, fromSelect.value, toSelect.value);
  resultValue.textContent = formatNumber(converted);
  resultUnit.textContent = category.units[toSelect.value].label;
  summary.textContent = `${formatNumber(amount)} ${category.units[fromSelect.value].label} = ${formatNumber(converted)} ${category.units[toSelect.value].label}`;
}

function initializeCard(card) {
  const categoryKey = card.dataset.category;
  const category = CONVERTER_CATEGORIES[categoryKey];
  const entries = Object.entries(category.units);
  const amountInput = card.querySelector("[data-amount]");
  const fromSelect = card.querySelector("[data-from]");
  const toSelect = card.querySelector("[data-to]");
  const swapButton = card.querySelector("[data-swap]");

  if (card.dataset.converterBound !== "true") {
    amountInput.addEventListener("input", () => {
      updateCard(card);
    });

    fromSelect.addEventListener("change", () => {
      updateCard(card);
    });

    toSelect.addEventListener("change", () => {
      updateCard(card);
    });

    swapButton.addEventListener("click", () => {
      const currentFrom = fromSelect.value;
      fromSelect.value = toSelect.value;
      toSelect.value = currentFrom;
      updateCard(card);
    });

    card.dataset.converterBound = "true";
  }

  populateSelect(fromSelect, entries, category.defaultFrom);
  populateSelect(toSelect, entries, category.defaultTo);

  updateCard(card);
}

document.querySelectorAll("[data-converter-card]").forEach((card) => {
  initializeCard(card);
});
