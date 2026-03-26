const converterModal = document.querySelector("[data-home-converter-modal]");
const converterModalTriggers = document.querySelectorAll("[data-home-converter-trigger]");
const converterModalClosers = document.querySelectorAll("[data-home-converter-close]");
const converterModalCard = document.querySelector(".home-weight-card[data-converter-card]");
const converterModalTitle = document.querySelector("[data-home-converter-title]");

function setConverterModal(open) {
  if (!converterModal) {
    return;
  }

  converterModal.hidden = !open;
  converterModal.classList.toggle("is-open", open);
  document.body.classList.toggle("modal-open", open);
}

function openConverterModal(category, label) {
  if (!converterModalCard) {
    return;
  }

  converterModalCard.dataset.category = category;

  if (converterModalTitle) {
    converterModalTitle.textContent = label;
  }

  if (typeof initializeCard === "function") {
    initializeCard(converterModalCard);
  }

  setConverterModal(true);
}

if (converterModal && converterModalTriggers.length) {
  converterModalTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openConverterModal(trigger.dataset.category, trigger.dataset.label);
    });
  });

  converterModalClosers.forEach((closer) => {
    closer.addEventListener("click", () => {
      setConverterModal(false);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && converterModal.classList.contains("is-open")) {
      setConverterModal(false);
    }
  });
}
