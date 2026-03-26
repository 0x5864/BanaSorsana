const API_BASE_URL = "https://client.hdisigorta.com.tr/webservice/uavt";
const PTT_POSTAL_API_URL = "/api/ptt-posta-kodu";

const SELECT_CONFIG = {
  province: {
    endpoint: "provinces",
    valueKey: "id",
    labelKey: "name",
    extraLabelKeys: [],
  },
  district: {
    endpoint: (value) => `districts?provinceId=${value}`,
    valueKey: "id",
    labelKey: "name",
    extraLabelKeys: [],
  },
  town: {
    endpoint: (value) => `towns?districtId=${value}`,
    valueKey: "id",
    labelKey: "name",
    extraLabelKeys: [],
  },
  neighborhood: {
    endpoint: (value) => `neighborhoods?townId=${value}`,
    valueKey: "id",
    labelKey: "name",
    extraLabelKeys: [],
  },
  street: {
    endpoint: (value) => `streets?neighborhoodId=${value}`,
    valueKey: "id",
    labelKey: "name",
    extraLabelKeys: ["csbmName"],
  },
  building: {
    endpoint: (value) => `buildings?streetId=${value}`,
    valueKey: "id",
    labelKey: "buildingNumber",
    extraLabelKeys: ["buildingName"],
  },
  flat: {
    endpoint: (value) => `flats?buildingId=${value}`,
    valueKey: "id",
    labelKey: "apartmentNo",
    extraLabelKeys: [],
  },
};

const DOWNSTREAM_FIELDS = {
  province: ["district", "town", "neighborhood", "street", "building", "flat"],
  district: ["town", "neighborhood", "street", "building", "flat"],
  town: ["neighborhood", "street", "building", "flat"],
  neighborhood: ["street", "building", "flat"],
  street: ["building", "flat"],
  building: ["flat"],
  flat: [],
};

const FIELD_ORDER = ["province", "district", "town", "neighborhood", "street", "building", "flat"];

document.addEventListener("DOMContentLoaded", () => {
  const elements = {
    form: document.querySelector("[form-uavt]"),
    districtForm: document.querySelector("[district-form]"),
    warning: document.querySelector("[uavt-warning]"),
    resultCard: document.querySelector("[calculation-result]"),
    resultValue: document.querySelector("[result-value]"),
    postalCodeValue: document.querySelector("[postal-code-value]"),
    submitButton: document.querySelector("[submit-button]"),
    buttonText: document.querySelector("[button-text]"),
    buttonLoader: document.querySelector("[button-loader]"),
    districtProvinceInput: document.querySelector("[district-province-input]"),
    districtNeighborhoodInput: document.querySelector("[district-neighborhood-input]"),
    districtNeighborhoodList: document.querySelector("[district-neighborhood-list]"),
    districtSubmitButton: document.querySelector("[district-submit-button]"),
    districtButtonText: document.querySelector("[district-button-text]"),
    districtButtonLoader: document.querySelector("[district-button-loader]"),
    districtOutput: document.querySelector("[district-output]"),
    selectedPath: document.querySelector("[selected-path]"),
    selects: {
      province: document.querySelector("[province-select]"),
      district: document.querySelector("[district-select]"),
      town: document.querySelector("[town-select]"),
      neighborhood: document.querySelector("[neighborhood-select]"),
      street: document.querySelector("[street-select]"),
      building: document.querySelector("[building-select]"),
      flat: document.querySelector("[flat-select]"),
    },
  };

  const optionCache = {
    province: [],
    district: [],
    town: [],
    neighborhood: [],
    street: [],
    building: [],
    flat: [],
    districtLookupProvince: [],
  };

  const lookupCache = {
    districtsByProvince: new Map(),
    townsByDistrict: new Map(),
    neighborhoodsByTown: new Map(),
    neighborhoodsByProvince: new Map(),
    postalRecordsByDistrict: new Map(),
  };

  let flatState = "idle";

  const setLoading = (isLoading) => {
    elements.submitButton.disabled = isLoading;
    elements.buttonLoader.hidden = !isLoading;
    elements.buttonText.textContent = isLoading ? "Yükleniyor" : "Sorgula";
  };

  const setDistrictLoading = (isLoading) => {
    elements.districtSubmitButton.disabled = isLoading;
    elements.districtButtonLoader.hidden = !isLoading;
    elements.districtButtonText.textContent = isLoading ? "Aranıyor" : "İlçe bul";
  };

  const setWarningMessage = (message) => {
    elements.warning.textContent = message;
  };

  const setWarningVisible = (isVisible) => {
    elements.warning.hidden = !isVisible;
  };

  const setResult = (value) => {
    const normalizedValue = value && String(value).trim() ? String(value).trim() : "0";
    elements.resultValue.textContent = normalizedValue;
    elements.resultCard.classList.toggle("-hidden", normalizedValue === "0");
  };

  const setPostalCode = (value = "-") => {
    elements.postalCodeValue.textContent = value && String(value).trim() ? String(value).trim() : "-";
  };

  const getSelectedOptionText = (selectElement) =>
    selectElement?.options?.[selectElement.selectedIndex]?.textContent?.trim() ?? "";

  const resetSelect = (fieldName) => {
    const selectElement = elements.selects[fieldName];
    if (!selectElement) {
      return;
    }

    optionCache[fieldName] = [];
    selectElement.value = "";
    selectElement.querySelectorAll("option:not(:first-child)").forEach((optionElement) => {
      optionElement.remove();
    });
    selectElement.disabled = true;
  };

  const setSelectPlaceholder = (fieldName, placeholderText) => {
    const selectElement = elements.selects[fieldName];
    const firstOption = selectElement?.querySelector("option:first-child");
    if (firstOption) {
      firstOption.textContent = placeholderText;
    }
  };

  const resetDownstream = (fieldName) => {
    DOWNSTREAM_FIELDS[fieldName].forEach(resetSelect);
  };

  const buildOptionLabel = (item, config) => {
    const baseText = item[config.labelKey] ?? "";
    const extraText = config.extraLabelKeys
      .map((key) => item[key])
      .find((value) => value !== null && value !== undefined && String(value).trim() !== "");

    if (!extraText) {
      return String(baseText);
    }

    if (config.labelKey === "buildingNumber" && item.buildingName) {
      return `${baseText} - ${item.buildingName}`;
    }

    return `${baseText} ${extraText}`;
  };

  const populateSelect = (fieldName, items) => {
    const selectElement = elements.selects[fieldName];
    const config = SELECT_CONFIG[fieldName];

    resetSelect(fieldName);

    items.forEach((item) => {
      const optionElement = document.createElement("option");
      optionElement.value = String(item[config.valueKey]);
      optionElement.textContent = buildOptionLabel(item, config);
      selectElement.appendChild(optionElement);
    });

    if (items.length > 0) {
      selectElement.disabled = false;
    }
  };

  const updateSelectedPath = () => {
    const labels = FIELD_ORDER.map((fieldName) => {
      const selectElement = elements.selects[fieldName];
      if (!selectElement || !selectElement.value) {
        return "";
      }

      return selectElement.options[selectElement.selectedIndex]?.textContent?.trim() ?? "";
    }).filter(Boolean);

    elements.selectedPath.textContent = labels.length > 0 ? labels.join(" / ") : "Henüz tam adres seçilmedi.";
  };

  const fetchFieldItems = async (fieldName, parentValue = "") => {
    const config = SELECT_CONFIG[fieldName];
    const endpoint = typeof config.endpoint === "function" ? config.endpoint(parentValue) : config.endpoint;
    const response = await fetch(`${API_BASE_URL}/${endpoint}`);

    if (!response.ok) {
      throw new Error(`${fieldName} verisi alinamadi`);
    }

    const payload = await response.json();
    if (!payload.isSuccess || !Array.isArray(payload.data)) {
      throw new Error(`${fieldName} verisi gecersiz`);
    }

    return payload.data;
  };

  const fetchOptions = async (fieldName, parentValue = "") => {
    const items = await fetchFieldItems(fieldName, parentValue);
    optionCache[fieldName] = items;
    populateSelect(fieldName, items);
    if (fieldName === "flat") {
      flatState = items.length > 0 ? "loaded" : "missing";
    }
    setWarningVisible(items.length === 0);
    return items;
  };

  const populateDistrictProvinceSelect = (items = optionCache.districtLookupProvince) => {
    const selectElement = elements.districtProvinceInput;
    selectElement.querySelectorAll("option:not(:first-child)").forEach((optionElement) => {
      optionElement.remove();
    });

    items.forEach((province) => {
      const optionElement = document.createElement("option");
      optionElement.value = province.name;
      optionElement.textContent = province.name;
      selectElement.appendChild(optionElement);
    });

    selectElement.disabled = items.length === 0;
  };

  const fetchLookupData = async (map, key, path) => {
    if (map.has(key)) {
      return map.get(key);
    }

    const response = await fetch(`${API_BASE_URL}/${path}`);
    if (!response.ok) {
      throw new Error(`${path} verisi alinamadi`);
    }

    const payload = await response.json();
    if (!payload.isSuccess || !Array.isArray(payload.data)) {
      throw new Error(`${path} verisi gecersiz`);
    }

    map.set(key, payload.data);
    return payload.data;
  };

  const fetchPttPostalData = async (action, payload) => {
    const response = await fetch(PTT_POSTAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        ...payload,
      }),
    });

    if (!response.ok) {
      throw new Error("PTT posta kodu alınamadı");
    }

    return response.json();
  };

  const resetDistrictNeighborhoodSelect = (placeholderText = "Önce İl Seçiniz") => {
    const inputElement = elements.districtNeighborhoodInput;
    const listElement = elements.districtNeighborhoodList;

    listElement.querySelectorAll("option").forEach((optionElement) => {
      optionElement.remove();
    });
    inputElement.value = "";
    inputElement.placeholder = placeholderText;
    inputElement.disabled = true;
  };

  const populateDistrictNeighborhoodSelect = (items) => {
    const inputElement = elements.districtNeighborhoodInput;
    const listElement = elements.districtNeighborhoodList;

    resetDistrictNeighborhoodSelect("Mahalle Seçiniz");

    items.forEach((item) => {
      const optionElement = document.createElement("option");
      optionElement.value = item.name;
      listElement.appendChild(optionElement);
    });

    inputElement.disabled = items.length === 0;
    if (items.length === 0) {
      inputElement.placeholder = "Mahalle bulunamadı";
    }
  };

  const normalizeText = (value) =>
    String(value ?? "")
      .trim()
      .toLocaleUpperCase("tr-TR")
      .replace(/\s+/g, " ");

  const normalizePostalNeighborhood = (value) =>
    normalizeText(value)
      .replace(/\bMAHALLESI\b/g, "")
      .replace(/\bMAHALLESİ\b/g, "")
      .replace(/\bMAH\.\b/g, "")
      .replace(/\bMAH\b/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const normalizePostalStreet = (value) =>
    normalizeText(value)
      .replace(/\bCADDE\b/g, "")
      .replace(/\bSOKAK\b/g, "")
      .replace(/\bBULVARI\b/g, "")
      .replace(/\bKUME EVLERI\b/g, "")
      .replace(/\bKÜME EVLERİ\b/g, "")
      .replace(/\bKUME EVLER\b/g, "")
      .replace(/\bKÜME EVLER\b/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const fetchPttPostalRecords = async (provinceId, districtId) => {
    const cacheKey = `${provinceId}::${districtId}`;
    if (lookupCache.postalRecordsByDistrict.has(cacheKey)) {
      return lookupCache.postalRecordsByDistrict.get(cacheKey);
    }

    const records = await fetchPttPostalData("postakodu", {
      il_kodu: String(provinceId),
      ilce_kodu: String(districtId),
    });
    lookupCache.postalRecordsByDistrict.set(cacheKey, records);
    return records;
  };

  const resolvePostalCodeFromPtt = async (provinceId, districtId, neighborhoodName, streetName) => {
    const postalRecords = await fetchPttPostalRecords(provinceId, districtId);
    if (!Array.isArray(postalRecords) || postalRecords.length === 0) {
      return "-";
    }

    const normalizedNeighborhood = normalizePostalNeighborhood(neighborhoodName);
    const normalizedStreet = normalizePostalStreet(streetName);

    const streetMatch = postalRecords.find(
      (record) =>
        normalizePostalNeighborhood(record.mahalleAdi) === normalizedNeighborhood &&
        normalizePostalStreet(record.sokakAdi) === normalizedStreet,
    );
    if (streetMatch?.posta_Kodu) {
      return String(streetMatch.posta_Kodu).trim();
    }

    const neighborhoodMatch = postalRecords.find(
      (record) => normalizePostalNeighborhood(record.mahalleAdi) === normalizedNeighborhood,
    );
    if (neighborhoodMatch?.posta_Kodu) {
      return String(neighborhoodMatch.posta_Kodu).trim();
    }

    const firstPostalRecord = postalRecords.find((record) => String(record.posta_Kodu ?? "").trim());
    return firstPostalRecord?.posta_Kodu ? String(firstPostalRecord.posta_Kodu).trim() : "-";
  };

  const findFlatRecord = (items, flatValue, flatLabel) => {
    const normalizedFlatLabel = normalizeText(flatLabel);
    return (
      items.find((item) => String(item.id) === String(flatValue)) ??
      items.find((item) => normalizeText(item.apartmentNo) === normalizedFlatLabel) ??
      null
    );
  };

  const resolveSelectedFlat = async () => {
    const flatValue = elements.selects.flat.value;
    const flatLabel = getSelectedOptionText(elements.selects.flat);
    let selectedFlat = findFlatRecord(optionCache.flat, flatValue, flatLabel);

    if (selectedFlat?.uavt) {
      return selectedFlat;
    }

    const buildingId = elements.selects.building.value;
    if (!buildingId) {
      return null;
    }

    const flats = await fetchFieldItems("flat", buildingId);
    optionCache.flat = flats;
    selectedFlat = findFlatRecord(flats, flatValue, flatLabel);
    return selectedFlat?.uavt ? selectedFlat : null;
  };

  const isNeighborhoodMatch = (needle, haystack) => {
    const normalizedNeedle = normalizeText(needle);
    const normalizedHaystack = normalizeText(haystack);
    return normalizedHaystack === normalizedNeedle || normalizedHaystack.includes(normalizedNeedle);
  };

  const renderDistrictResults = (matches, provinceName, neighborhoodName) => {
    elements.districtOutput.replaceChildren();

    if (matches.length === 0) {
      const titleElement = document.createElement("strong");
      titleElement.textContent = "Sonuç bulunamadı.";
      const copyElement = document.createElement("span");
      copyElement.textContent = `${provinceName} içinde "${neighborhoodName}" için ilçe eşleşmesi yok.`;
      elements.districtOutput.append(titleElement, copyElement);
      return;
    }

    const listElement = document.createElement("ul");

    matches.forEach((match) => {
      const itemElement = document.createElement("li");
      const districtElement = document.createElement("strong");
      const detailElement = document.createElement("span");

      districtElement.textContent = match.district;
      detailElement.textContent = `${match.town} / ${match.neighborhood}`;
      itemElement.append(districtElement, detailElement);
      listElement.appendChild(itemElement);
    });

    elements.districtOutput.appendChild(listElement);
  };

  const buildProvinceNeighborhoodIndex = async (provinceName) => {
    const normalizedProvince = normalizeText(provinceName);
    let provincePool =
      optionCache.districtLookupProvince.length > 0 ? optionCache.districtLookupProvince : optionCache.province;

    if (provincePool.length === 0) {
      const response = await fetch(`${API_BASE_URL}/provinces`);
      if (!response.ok) {
        throw new Error("İl listesi alınamadı");
      }
      const payload = await response.json();
      if (!payload.isSuccess || !Array.isArray(payload.data)) {
        throw new Error("İl listesi geçersiz");
      }
      optionCache.districtLookupProvince = payload.data;
      provincePool = payload.data;
      populateDistrictProvinceSelect(payload.data);
    }

    const province = provincePool.find(
      (item) => normalizeText(item.name) === normalizedProvince || String(item.id) === String(provinceName),
    );

    if (!province) {
      throw new Error("Girilen il adı bulunamadı");
    }

    if (lookupCache.neighborhoodsByProvince.has(province.id)) {
      return lookupCache.neighborhoodsByProvince.get(province.id);
    }

    const districts = await fetchLookupData(
      lookupCache.districtsByProvince,
      province.id,
      `districts?provinceId=${province.id}`,
    );

    const records = [];

    for (const district of districts) {
      let towns = [];
      try {
        towns = await fetchLookupData(
          lookupCache.townsByDistrict,
          district.id,
          `towns?districtId=${district.id}`,
        );
      } catch (error) {
        console.warn("towns load skipped", district.id, error);
        continue;
      }

      for (const town of towns) {
        let neighborhoods = [];
        try {
          neighborhoods = await fetchLookupData(
            lookupCache.neighborhoodsByTown,
            town.id,
            `neighborhoods?townId=${town.id}`,
          );
        } catch (error) {
          console.warn("neighborhoods load skipped", town.id, error);
          continue;
        }

        neighborhoods.forEach((neighborhood) => {
          records.push({
            district: district.name,
            town: town.name,
            neighborhood: neighborhood.name,
          });
        });
      }
    }

    const uniqueNeighborhoods = records
      .map((item) => item.neighborhood)
      .filter((value, index, collection) => collection.indexOf(value) === index)
      .sort((left, right) => left.localeCompare(right, "tr"));

    const payload = {
      province,
      records,
      neighborhoods: uniqueNeighborhoods.map((name) => ({ name })),
    };

    if (payload.neighborhoods.length === 0) {
      throw new Error("Bu il için mahalle listesi alınamadı");
    }

    lookupCache.neighborhoodsByProvince.set(province.id, payload);
    return payload;
  };

  const loadNeighborhoodsForProvince = async (provinceName) => {
    if (!provinceName.trim()) {
      resetDistrictNeighborhoodSelect();
      return;
    }

    resetDistrictNeighborhoodSelect("Mahalleler yükleniyor");
    const payload = await buildProvinceNeighborhoodIndex(provinceName);
    populateDistrictNeighborhoodSelect(payload.neighborhoods);
  };

  const findDistrictByNeighborhood = async (provinceName, neighborhoodName) => {
    const normalizedNeighborhood = normalizeText(neighborhoodName);
    const payload = await buildProvinceNeighborhoodIndex(provinceName);
    const matches = payload.records.filter((item) => isNeighborhoodMatch(normalizedNeighborhood, item.neighborhood));

    const uniqueMatches = matches.filter(
      (item, index, collection) =>
        collection.findIndex(
          (candidate) =>
            candidate.district === item.district &&
            candidate.town === item.town &&
            candidate.neighborhood === item.neighborhood,
        ) === index,
    );

    return uniqueMatches;
  };

  const handleFieldChange = async (fieldName, nextFieldName, value) => {
    resetDownstream(fieldName);
    if (DOWNSTREAM_FIELDS[fieldName].includes("flat")) {
      flatState = "idle";
      setSelectPlaceholder("flat", "Daire Numarası Seçiniz");
    }
    setWarningVisible(false);
    setWarningMessage("Gönderilen bilgiler için aktif kayıt bulunmamaktadır.");
    setResult("0");
    setPostalCode("-");
    updateSelectedPath();

    if (!value || !nextFieldName) {
      return;
    }

    try {
      await fetchOptions(nextFieldName, value);
      updateSelectedPath();
    } catch (error) {
      console.error(error);
      if (nextFieldName === "flat") {
        flatState = "missing";
        setSelectPlaceholder("flat", "Bu kapıda daire kaydı yok");
        setWarningMessage("Seçilen kapı için daire kaydı bulunamadı. Başka bir kapı numarası deneyin.");
      } else {
        setWarningMessage("Gönderilen bilgiler için aktif kayıt bulunmamaktadır.");
      }
      setWarningVisible(true);
    }
  };

  FIELD_ORDER.forEach((fieldName, index) => {
    const selectElement = elements.selects[fieldName];
    const nextFieldName = FIELD_ORDER[index + 1];

    selectElement.addEventListener("change", async (event) => {
      await handleFieldChange(fieldName, nextFieldName, event.target.value);
    });
  });

  elements.districtProvinceInput.addEventListener("change", async (event) => {
    try {
      elements.districtOutput.textContent = "Mahalle listesi hazırlanıyor.";
      await loadNeighborhoodsForProvince(event.target.value);
      elements.districtOutput.textContent = "Mahalleyi seçip ilçe bulabilirsin.";
    } catch (error) {
      console.error(error);
      resetDistrictNeighborhoodSelect("Mahalle yüklenemedi");
      elements.districtOutput.textContent = error.message;
    }
  });

  elements.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setLoading(true);
    setWarningVisible(false);
    updateSelectedPath();

    const selectedProvinceId = elements.selects.province.value;
    const selectedDistrictId = elements.selects.district.value;
    const selectedNeighborhoodName = getSelectedOptionText(elements.selects.neighborhood);
    const selectedStreetName = getSelectedOptionText(elements.selects.street);

    try {
      const selectedFlat = await resolveSelectedFlat();

      if (!selectedFlat || !selectedFlat.uavt) {
        setResult("0");
        setPostalCode("-");
        setWarningMessage(
          flatState === "missing"
            ? "Seçilen kapı için daire veya UAVT kaydı bulunamadı."
            : "Gönderilen bilgiler için aktif kayıt bulunmamaktadır.",
        );
        setWarningVisible(true);
        return;
      }

      setResult(selectedFlat.uavt);
      if (selectedProvinceId && selectedDistrictId) {
        try {
          const postalCode = await resolvePostalCodeFromPtt(
            selectedProvinceId,
            selectedDistrictId,
            selectedNeighborhoodName,
            selectedStreetName,
          );
          setPostalCode(postalCode);
        } catch (error) {
          console.error(error);
          setPostalCode("-");
        }
      } else {
        setPostalCode("-");
      }
    } catch (error) {
      console.error(error);
      setResult("0");
      setPostalCode("-");
      setWarningMessage("Gönderilen bilgiler için aktif kayıt bulunmamaktadır.");
      setWarningVisible(true);
    } finally {
      setLoading(false);
    }
  });

  elements.districtForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const provinceName = elements.districtProvinceInput.value;
    const neighborhoodName = elements.districtNeighborhoodInput.value;

    if (!provinceName.trim() || !neighborhoodName.trim()) {
      elements.districtOutput.textContent = "İl ve mahalle adını birlikte gir.";
      return;
    }

    setDistrictLoading(true);

    try {
      const matches = await findDistrictByNeighborhood(provinceName, neighborhoodName);
      renderDistrictResults(matches, provinceName.trim(), neighborhoodName.trim());
    } catch (error) {
      console.error(error);
      elements.districtOutput.textContent = error.message;
    } finally {
      setDistrictLoading(false);
    }
  });

  fetchOptions("province")
    .then(() => {
      elements.selects.province.disabled = false;
      resetDistrictNeighborhoodSelect();
    })
    .catch((error) => {
      console.error(error);
      setWarningVisible(true);
    });

  fetch(`${API_BASE_URL}/provinces`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("İl listesi alınamadı");
      }
      return response.json();
    })
    .then((payload) => {
      if (!payload.isSuccess || !Array.isArray(payload.data)) {
        throw new Error("İl listesi geçersiz");
      }
      optionCache.districtLookupProvince = payload.data;
      populateDistrictProvinceSelect(payload.data);
    })
    .catch((error) => {
      console.error(error);
      elements.districtOutput.textContent = "İl listesi hazır. İl seçip devam edebilirsin.";
    });
});
