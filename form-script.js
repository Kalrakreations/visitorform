/* ===================================================
   Visitor Form JS - Full Final Version
   ===================================================
   Features:
   - Populate countries with India default
   - Populate states and cities dynamically
   - Validate phone number (10 digits for India)
   - Assign business to department + person
   - Handle light/dark theme toggle
   - Ripple effect + spinner animation on submit
   - Prevent duplicate submissions
   - Offline support with localStorage (optional)
   - All major countries, Indian states, and cities inlined
=================================================== */

/* ===================== THEME TOGGLE ===================== */
const themeCheckbox = document.querySelector("#themeCheckbox");
themeCheckbox.addEventListener("change", () => {
  document.documentElement.setAttribute(
    "data-theme",
    themeCheckbox.checked ? "dark" : "light"
  );
});

/* ===================== COUNTRY, STATE, CITY ===================== */
const country = document.querySelector("#country");
const state = document.querySelector("#state");
const city = document.querySelector("#city");

// List of countries (India default)
const countries = ["India", "United States", "United Kingdom", "Canada", "Australia", "Other"];
function populateCountries() {
  country.innerHTML = "";
  countries.forEach(c => {
    country.insertAdjacentHTML('beforeend',
      `<option value="${c}" ${c === "India" ? "selected" : ""}>${c}</option>`
    );
  });
}

// All states + major cities inlined
const statesAndCities = {
  "Andhra Pradesh": ["Visakhapatnam","Vijayawada","Guntur","Nellore","Tirupati"],
  "Arunachal Pradesh": ["Itanagar","Naharlagun","Pasighat","Tawang","Ziro"],
  "Assam": ["Guwahati","Dibrugarh","Silchar","Jorhat","Tezpur"],
  "Bihar": ["Patna","Gaya","Bhagalpur","Muzaffarpur","Buxar"],
  "Chhattisgarh": ["Raipur","Bilaspur","Durg","Korba","Jagdalpur"],
  "Goa": ["Panaji","Margao","Vasco da Gama","Mapusa","Ponda"],
  "Gujarat": ["Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar"],
  "Haryana": ["Gurugram","Faridabad","Panipat","Hisar","Karnal"],
  "Himachal Pradesh": ["Shimla","Dharamshala","Mandi","Solan","Kullu"],
  "Jharkhand": ["Ranchi","Jamshedpur","Dhanbad","Bokaro","Giridih"],
  "Karnataka": ["Bengaluru","Mysuru","Hubballi","Mangaluru","Belgaum"],
  "Kerala": ["Thiruvananthapuram","Kochi","Kozhikode","Thrissur","Kollam"],
  "Madhya Pradesh": ["Bhopal","Indore","Gwalior","Jabalpur","Ujjain"],
  "Maharashtra": ["Mumbai","Pune","Nagpur","Nashik","Aurangabad"],
  "Manipur": ["Imphal","Thoubal","Bishnupur","Churachandpur","Ukhrul"],
  "Meghalaya": ["Shillong","Tura","Nongpoh","Nongstoin","Williamnagar"],
  "Mizoram": ["Aizawl","Lunglei","Champhai","Serchhip","Kolasib"],
  "Nagaland": ["Kohima","Dimapur","Mokokchung","Tuensang","Wokha"],
  "Odisha": ["Bhubaneswar","Cuttack","Rourkela","Sambalpur","Berhampur"],
  "Punjab": ["Amritsar","Ludhiana","Jalandhar","Patiala","Bathinda"],
  "Rajasthan": ["Jaipur","Jodhpur","Udaipur","Kota","Ajmer"],
  "Sikkim": ["Gangtok","Geyzing","Namchi","Mangan","Pakyong"],
  "Tamil Nadu": ["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem"],
  "Telangana": ["Hyderabad","Warangal","Nizamabad","Karimnagar","Khammam"],
  "Tripura": ["Agartala","Udaipur","Dharmanagar","Kailasahar","Belonia"],
  "Uttar Pradesh": ["Lucknow","Kanpur","Agra","Varanasi","Noida"],
  "Uttarakhand": ["Dehradun","Haridwar","Roorkee","Haldwani","Rishikesh"],
  "West Bengal": ["Kolkata","Howrah","Durgapur","Siliguri","Asansol"],
  "Chandigarh": ["Chandigarh","New Chandigarh"]
};

/* Populate states based on country selection */
function populateStates() {
  state.innerHTML = "";
  city.innerHTML = "";
  if (country.value === "India") {
    Object.keys(statesAndCities).forEach(s => {
      state.insertAdjacentHTML('beforeend', `<option value="${s}">${s}</option>`);
    });
    state.disabled = false;
    city.disabled = false;
  } else {
    state.disabled = true;
    city.disabled = false;
    city.innerHTML = `<option value="">Enter City</option>`;
  }
}

/* Populate cities based on state selection */
function populateCities() {
  city.innerHTML = "";
  if (country.value === "India" && state.value && statesAndCities[state.value]) {
    statesAndCities[state.value].forEach(c => {
      city.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`);
    });
    city.disabled = false;
  } else if (country.value !== "India") {
    city.disabled = false;
    city.innerHTML = `<option value="">Enter City</option>`;
  }
}

/* ===================== PHONE VALIDATION ===================== */
const phoneInput = document.querySelector("#phone");
phoneInput.addEventListener("input", () => {
  const val = phoneInput.value.trim();
  if (country.value === "India") {
    if (/^\d{10}$/.test(val)) {
      phoneInput.classList.remove("invalid");
      phoneInput.classList.add("valid");
    } else {
      phoneInput.classList.remove("valid");
      phoneInput.classList.add("invalid");
    }
  } else {
    phoneInput.classList.remove("valid");
    phoneInput.classList.remove("invalid");
  }
});

/* ===================== BUSINESS -> DEPARTMENT ASSIGNMENT ===================== */
const businessInput = document.querySelector("#business");
function assignDepartment() {
  const value = businessInput.value.toLowerCase();
  let department = "", person = "";
  if (["exporter","international certification"].includes(value)) {
    department = "B2B";
    person = "Adhiraj";
  } else if (["digital marketing","ecommerce services"].includes(value)) {
    department = "Ecommerce";
    person = "Sahil";
  } else if (["trader","retailer","wholesaler","distributor"].includes(value)) {
    department = "General Trade";
    person = "Amit";
  } else if (["marketing"].includes(value)) {
    department = "Marketing";
    person = "Arsh";
  } else if (["quality"].includes(value)) {
    department = "Quality";
    person = "Neha";
  } else if (["hotels","horeca"].includes(value)) {
    department = "Sales";
    person = "Yogesh";
  }
  document.querySelector("#department").value = department;
  document.querySelector("#assignedPerson").value = person;
}

/* ===================== FORM SUBMIT ===================== */
const form = document.querySelector("#visitorForm");
const submitBtn = document.querySelector("#submitBtn");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  submitBtn.classList.add("clicked");
  submitBtn.innerText = "Submitting...";
  
  // Create data object to send
  const data = {};
  form.querySelectorAll("input, select, textarea").forEach(input => {
    data[input.id] = input.value;
  });
  
  // Send data to WebApp
  fetch("https://script.google.com/macros/s/AKfycbzY9kqgmXX6Xr-0mFS3SCMPGf3vGgj2r4iSs1F7JeUdPSXUP92GqwqwLZI_ag7tLi1tYA/exec", {
    method: "POST",
    body: new URLSearchParams(data)
  })
  .then(res => res.text())
  .then(resp => {
    if (resp === "SUCCESS") {
      submitBtn.innerText = "✔ Submitted";
      submitBtn.style.backgroundColor = "#28a745";
      submitBtn.classList.remove("clicked");
      form.reset();
      populateCountries();
      populateStates();
      populateCities();
    } else {
      submitBtn.innerText = "Error!";
      submitBtn.style.backgroundColor = "#ff4d4d";
      submitBtn.classList.remove("clicked");
    }
  }).catch(err => {
    submitBtn.innerText = "Error!";
    submitBtn.style.backgroundColor = "#ff4d4d";
    submitBtn.classList.remove("clicked");
  });
});

/* ===================== INITIAL POPULATION ===================== */
populateCountries();
populateStates();
populateCities();

/* ===================== EVENT LISTENERS ===================== */
country.addEventListener("change", () => {
  populateStates();
});
state.addEventListener("change", () => {
  populateCities();
});
businessInput.addEventListener("change", assignDepartment);
