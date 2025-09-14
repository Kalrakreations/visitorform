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

  // ---------- Static Data ----------
  const countriesData = [
    "India",
    "United Arab Emirates",
    "Saudi Arabia",
    "Qatar",
    "Oman",
    "Kuwait",
    "Bahrain",
    "United States",
    "United Kingdom",
    "Canada",
    "Singapore",
    "Australia"
    // Add/remove countries as needed
  ];

  const indiaData = {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati"],
    "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Tawang", "Pasighat", "Ziro"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tezpur"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga"],
    "Chhattisgarh": ["Raipur", "Bilaspur", "Durg", "Bhilai", "Korba"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar"],
    "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Hisar"],
    "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar"],
    "Karnataka": ["Bengaluru", "Mysuru", "Mangalore", "Hubli", "Belagavi"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
    "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad"],
    "Manipur": ["Imphal", "Thoubal", "Bishnupur"],
    "Meghalaya": ["Shillong", "Tura", "Jowai"],
    "Mizoram": ["Aizawl", "Lunglei", "Champhai"],
    "Nagaland": ["Kohima", "Dimapur", "Mokokchung"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Sambalpur"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"],
    "Sikkim": ["Gangtok", "Namchi", "Gyalshing"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
    "Tripura": ["Agartala", "Udaipur", "Dharmanagar"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Allahabad", "Noida", "Ghaziabad"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Haldwani", "Roorkee"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri", "Asansol"],
    "Delhi": ["New Delhi", "Delhi", "Dwarka", "Rohini"],
    "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
    "Ladakh": ["Leh", "Kargil"],
    "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam"],
    "Chandigarh": ["Chandigarh"],
    "Andaman and Nicobar Islands": ["Port Blair", "Havelock"],
    "Lakshadweep": ["Kavaratti", "Agatti"]
  };

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
  populateCountries();

  // --------- Your existing logic below (unchanged) ---------
  // ... (popup, offline, submit, etc. as you wrote)
});
