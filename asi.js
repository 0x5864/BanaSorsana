const VACCINE_SCHEDULE = [
  { label: "Doğum", vaccines: ["Hepatit B - 1. doz"], months: 0 },
  { label: "1. Ay", vaccines: ["Hepatit B - 2. doz"], months: 1 },
  { label: "2. Ay", vaccines: ["BCG", "KPA - 1. doz", "DaBT-İPA-Hib-Hep B - 1. doz"], months: 2 },
  { label: "4. Ay", vaccines: ["KPA - 2. doz", "DaBT-İPA-Hib-Hep B - 2. doz"], months: 4 },
  { label: "6. Ay", vaccines: ["DaBT-İPA-Hib-Hep B - 3. doz", "OPA - 1. doz"], months: 6 },
  { label: "12. Ay", vaccines: ["KPA - rapel", "Suçiçeği", "KKK - 1. doz"], months: 12 },
  { label: "18. Ay", vaccines: ["DaBT-İPA-Hib-Hep B - rapel", "OPA - 2. doz", "Hepatit A - 1. doz"], months: 18 },
  { label: "24. Ay", vaccines: ["Hepatit A - 2. doz"], months: 24 },
  { label: "48. Ay", vaccines: ["KKK - 2. doz", "DaBT-İPA rapel"], months: 48 },
  { label: "13 Yaş", vaccines: ["Td rapel"], months: 156 },
];

const birthdateInput = document.querySelector("[data-vaccine-birthdate]");
const vaccineList = document.querySelector("[data-vaccine-list]");

function formatDate(date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function renderSchedule() {
  const birthdate = birthdateInput.value ? new Date(`${birthdateInput.value}T00:00:00`) : null;
  if (!birthdate || Number.isNaN(birthdate.getTime())) {
    vaccineList.innerHTML = "";
    return;
  }

  vaccineList.innerHTML = `
    <div class="vaccine-table">
      ${VACCINE_SCHEDULE.map((item) => {
        const vaccineDate = addMonths(birthdate, item.months);
        return `
          <article class="vaccine-row">
            <p class="vaccine-item-age">${item.label}</p>
            <p class="vaccine-item-date">${formatDate(vaccineDate)}</p>
            <p class="vaccine-item-list">${item.vaccines.join(" • ")}</p>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function setDefaultBirthdate() {
  const today = new Date();
  const defaultDate = new Date(today.getFullYear(), today.getMonth() - 2, today.getDate());
  birthdateInput.value = defaultDate.toISOString().slice(0, 10);
}

birthdateInput.addEventListener("input", renderSchedule);
birthdateInput.addEventListener("change", renderSchedule);

setDefaultBirthdate();
renderSchedule();
