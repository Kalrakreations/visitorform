document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('customerForm');
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxvmhvHDmRY6fSGwcrld0EXBhadrCYMRbiWOA4I575ciHBYZhZnFFRlGbbbpPksLaOUbQ/exec";
  const popup = document.getElementById('formPopup');
  // Select fields
  const countrySelect = document.getElementById('country');
  const stateSelect = document.getElementById('state');
  const citySelect = document.getElementById('city');
  // "Others" fields
  const otherFields = {
    designation: document.getElementById('designationOther'),
    country: document.getElementById('countryOther'),
    state: document.getElementById('stateOther'),
    city: document.getElementById('cityOther'),
    business: document.getElementById('businessOther')
  };

  let countriesData = [];
  let indiaData = {};

  // --------- Fetch JSON files ---------
  async function loadData() {
    // Adjust paths/URLs as needed
    const [countriesRes, indiaRes] = await Promise.all([
      fetch('countries.json'),
      fetch('india.json')
    ]);
    countriesData = await countriesRes.json();
    indiaData = await indiaRes.json();
    populateCountries();
  }

  // --------- Populate Country Select ---------
  function populateCountries() {
    countrySelect.innerHTML = "";
    countriesData.forEach(country => {
      const opt = document.createElement('option');
      opt.value = country;
      opt.textContent = country;
      countrySelect.appendChild(opt);
    });
    // Always add "Others"
    const othersOpt = document.createElement('option');
    othersOpt.value = "Others";
    othersOpt.textContent = "Others";
    countrySelect.appendChild(othersOpt);
  }

  // --------- Populate State Select ---------
  function populateStates() {
    stateSelect.innerHTML = "";
    if (countrySelect.value === "India") {
      Object.keys(indiaData).forEach(state => {
        const opt = document.createElement('option');
        opt.value = state;
        opt.textContent = state;
        stateSelect.appendChild(opt);
      });
    }
    // Always add "Others"
    const othersOpt = document.createElement('option');
    othersOpt.value = "Others";
    othersOpt.textContent = "Others";
    stateSelect.appendChild(othersOpt);
    stateSelect.value = ""; // Reset selection
    populateCities(); // Reset cities
  }

  // --------- Populate City Select ---------
  function populateCities() {
    citySelect.innerHTML = "";
    if (countrySelect.value === "India" && indiaData[stateSelect.value]) {
      indiaData[stateSelect.value].forEach(city => {
        const opt = document.createElement('option');
        opt.value = city;
        opt.textContent = city;
        citySelect.appendChild(opt);
      });
    }
    // Always add "Others"
    const othersOpt = document.createElement('option');
    othersOpt.value = "Others";
    othersOpt.textContent = "Others";
    citySelect.appendChild(othersOpt);
    citySelect.value = ""; // Reset selection
  }

  // --------- Show/hide "Others" input fields ---------
  function toggleOtherField(field, select) {
    if(select.value === "Others") {
      otherFields[field].style.display = "block";
      otherFields[field].required = true;
    } else {
      otherFields[field].style.display = "none";
      otherFields[field].required = false;
    }
  }

  // --------- Event listeners ---------
  countrySelect.addEventListener('change', () => {
    populateStates();
    toggleOtherField("country", countrySelect);
  });
  stateSelect.addEventListener('change', () => {
    populateCities();
    toggleOtherField("state", stateSelect);
  });
  citySelect.addEventListener('change', () => {
    toggleOtherField("city", citySelect);
  });

  // --------- Initial load ---------
  loadData();

  // --------- Your existing logic below (unchanged) ---------
  // ... (popup, offline, submit, etc. as you wrote)
});
