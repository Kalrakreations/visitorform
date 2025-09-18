/**************************************************************
 * Master JavaScript File
 * ------------------------------------------------------------
 * Features:
 * 1. Theme Toggle (Light / Dark) with iOS-style sun & moon animation
 * 2. Form Validation with glow (blue focus, red invalid, green valid)
 * 3. Phone validation (10 digits required if India is selected)
 * 4. Country, State, City dropdown logic:
 *    - India is default
 *    - If India is selected → states & cities dropdown active
 *    - If other country → only city input active
 * 5. Business Type → Department & Person auto assignment
 * 6. Submit Button:
 *    - Ripple effect
 *    - Loading spinner & "Submitting..."
 *    - Success animation → green with "Submitted Successfully"
 * 7. Integration with Google Apps Script WebApp endpoint
 * ------------------------------------------------------------
 * Author: Sahil Kalra
 * Version: Final Optimized Build
 **************************************************************/

// ====================================================================
// GLOBAL ELEMENTS
// ====================================================================
const themeToggle = document.getElementById("themeToggle");
const form = document.getElementById("visitorForm");
const submitButton = document.getElementById("submitBtn");
const rippleContainer = document.querySelector(".ripple-container");
const countrySelect = document.getElementById("country");
const stateSelect = document.getElementById("state");
const citySelect = document.getElementById("city");
const phoneInput = document.getElementById("phone");
const businessTypeSelect = document.getElementById("business");
const departmentField = document.getElementById("department");
const assignedPersonField = document.getElementById("assignedPerson");

// ====================================================================
// THEME TOGGLE: Light / Dark with iOS Animation
// ====================================================================
let isDark = false;

themeToggle.addEventListener("click", () => {
  isDark = !isDark;
  document.body.classList.toggle("dark-theme", isDark);
  document.body.classList.toggle("light-theme", !isDark);

  // Animate toggle icon
  themeToggle.classList.toggle("sun", !isDark);
  themeToggle.classList.toggle("moon", isDark);
});

// ====================================================================
// FORM VALIDATION & INPUT GLOWS
// ====================================================================
function addValidationGlow(input, validationFn) {
  input.addEventListener("focus", () => {
    input.classList.remove("valid", "invalid");
    input.classList.add("focus");
  });

  input.addEventListener("blur", () => {
    input.classList.remove("focus");
    if (validationFn(input.value)) {
      input.classList.add("valid");
    } else {
      input.classList.add("invalid");
    }
  });
}

// Phone validation → exactly 10 digits if India
function validatePhone(value) {
  const country = countrySelect.value;
  if (country === "India") {
    return /^\d{10}$/.test(value);
  } else {
    return value.length > 5; // basic check for non-India
  }
}

// Name validation → not empty
function validateName(value) {
  return value.trim().length > 1;
}

// Email validation → simple regex
function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Attach validation
addValidationGlow(phoneInput, validatePhone);
addValidationGlow(document.getElementById("name"), validateName);
addValidationGlow(document.getElementById("email"), validateEmail);

// ====================================================================
// COUNTRY, STATE & CITY LOGIC
// ====================================================================
const statesAndCities = {
  "Andhra Pradesh": ["Visakhapatnam","Vijayawada","Guntur","Nellore","Tirupati"],
  "Arunachal Pradesh": ["Itanagar","Naharlagun","Pasighat","Roing","Bomdila"],
  "Assam": ["Guwahati","Dibrugarh","Silchar","Jorhat","Tezpur"],
  "Bihar": ["Patna","Gaya","Bhagalpur","Muzaffarpur","Darbhanga"],
  "Chhattisgarh": ["Raipur","Bilaspur","Durg","Korba","Jagdalpur"],
  "Goa": ["Panaji","Margao","Vasco da Gama","Mapusa"],
  "Gujarat": ["Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar"],
  "Haryana": ["Gurugram","Faridabad","Panipat","Hisar","Ambala"],
  "Himachal Pradesh": ["Shimla","Dharamshala","Mandi","Solan","Kullu"],
  "Jharkhand": ["Ranchi","Jamshedpur","Dhanbad","Bokaro","Hazaribagh"],
  "Karnataka": ["Bengaluru","Mysuru","Hubballi","Mangaluru","Belagavi"],
  "Kerala": ["Thiruvananthapuram","Kochi","Kozhikode","Thrissur","Alappuzha"],
  "Madhya Pradesh": ["Bhopal","Indore","Gwalior","Jabalpur","Ujjain"],
  "Maharashtra": ["Mumbai","Pune","Nagpur","Nashik","Aurangabad"],
  "Manipur": ["Imphal","Thoubal","Bishnupur","Ukhrul"],
  "Meghalaya": ["Shillong","Tura","Nongpoh","Jowai"],
  "Mizoram": ["Aizawl","Lunglei","Champhai","Serchhip"],
  "Nagaland": ["Kohima","Dimapur","Mokokchung","Wokha"],
  "Odisha": ["Bhubaneswar","Cuttack","Rourkela","Sambalpur","Berhampur"],
  "Punjab": ["Amritsar","Ludhiana","Jalandhar","Patiala","Bathinda"],
  "Rajasthan": ["Jaipur","Jodhpur","Udaipur","Kota","Ajmer"],
  "Sikkim": ["Gangtok","Geyzing","Namchi","Mangan"],
  "Tamil Nadu": ["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem"],
  "Telangana": ["Hyderabad","Warangal","Nizamabad","Karimnagar"],
  "Tripura": ["Agartala","Udaipur","Dharmanagar","Kailashahar"],
  "Uttar Pradesh": ["Lucknow","Kanpur","Agra","Varanasi","Ghaziabad","Noida"],
  "Uttarakhand": ["Dehradun","Haridwar","Roorkee","Haldwani"],
  "West Bengal": ["Kolkata","Howrah","Durgapur","Siliguri","Asansol"],
  "Delhi": ["New Delhi","Dwarka","Rohini","Karol Bagh","Saket"],
  "Chandigarh": ["Chandigarh","New Chandigarh"]
};

// Populate countries
function populateCountries() {
  const countries = ["India","United States","United Kingdom","Canada","Australia","Germany","France","China","Japan","UAE","Other"];
  countrySelect.innerHTML = "";
  countries.forEach(c => {
    countrySelect.insertAdjacentHTML("beforeend", `<option value="${c}" ${c==="India"?"selected":""}>${c}</option>`);
  });
}

// Populate states for India
function populateStates() {
  stateSelect.innerHTML = "<option disabled selected>Select State</option>";
  Object.keys(statesAndCities).forEach(state => {
    stateSelect.insertAdjacentHTML("beforeend", `<option value="${state}">${state}</option>`);
  });
}

// Populate cities based on state
function populateCities(state) {
  citySelect.innerHTML = "<option disabled selected>Select City</option>";
  if (statesAndCities[state]) {
    statesAndCities[state].forEach(c => {
      citySelect.insertAdjacentHTML("beforeend", `<option value="${c}">${c}</option>`);
    });
  }
}

// Handle country change
countrySelect.addEventListener("change", () => {
  if (countrySelect.value === "India") {
    stateSelect.disabled = false;
    citySelect.disabled = false;
    populateStates();
  } else {
    stateSelect.disabled = true;
    citySelect.innerHTML = "<option value=''>Enter City Manually</option>";
    citySelect.disabled = false;
  }
});

// Handle state change
stateSelect.addEventListener("change", () => {
  populateCities(stateSelect.value);
});

// ====================================================================
// BUSINESS TYPE → DEPARTMENT & PERSON ASSIGNMENT
// ====================================================================
function assignDepartmentAndPerson(businessType) {
  let department = "";
  let person = "";

  switch (businessType.toLowerCase()) {
    case "exporter":
    case "international certification":
      department = "B2B Department";
      person = "Adhiraj";
      break;
    case "digital marketing":
    case "ecommerce services":
      department = "Ecommerce Department";
      person = "Sahil";
      break;
    case "trader":
    case "retailer":
    case "wholesaler":
    case "distributor":
      department = "General Trade Department";
      person = "Amit";
      break;
    case "marketing":
      department = "Marketing Department";
      person = "Arsh";
      break;
    case "quality":
      department = "Quality Department";
      person = "Neha";
      break;
    case "hotels":
    case "horeca":
      department = "Sales Department";
      person = "Yogesh";
      break;
    default:
      department = "Unassigned";
      person = "N/A";
  }

  departmentField.value = department;
  assignedPersonField.value = person;
}

// Attach listener
businessTypeSelect.addEventListener("change", () => {
  assignDepartmentAndPerson(businessTypeSelect.value);
});

// ====================================================================
// SUBMIT BUTTON WITH RIPPLE EFFECT & LOADING ANIMATION
// ====================================================================
function createRipple(event) {
  const button = event.currentTarget;
  const circle = document.createElement("span");
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
  circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
  circle.classList.add("ripple");

  const ripple = button.getElementsByClassName("ripple")[0];
  if (ripple) {
    ripple.remove();
  }
  button.appendChild(circle);
}

submitButton.addEventListener("click", createRipple);

// Form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Show loading animation
  submitButton.disabled = true;
  submitButton.innerHTML = `<span class="loader"></span> Submitting...`;

  const formData = new FormData(form);

  try {
    const response = await fetch("https://script.google.com/macros/s/AKfycbw2aJGeowXAbi1Rjbhokit9ueEMSRQaw6RHfcrqjzV4MuQxnqaT8uFhMEwX8RAdovdXBg/exec", {
      method: "POST",
      body: formData
    });

    const result = await response.text();

    if (result.includes("SUCCESS")) {
      submitButton.innerHTML = "✅ Submitted Successfully";
      submitButton.classList.add("success");
    } else {
      submitButton.innerHTML = "❌ Error, Try Again";
      submitButton.classList.add("error");
      submitButton.disabled = false;
    }

  } catch (err) {
    submitButton.innerHTML = "⚠️ Network Error";
    submitButton.classList.add("error");
    submitButton.disabled = false;
  }
});

// ====================================================================
// INITIALIZE FORM ON LOAD
// ====================================================================
document.addEventListener("DOMContentLoaded", () => {
  populateCountries();
  if (countrySelect.value === "India") {
    populateStates();
  }
});

/**************************************************************
 * END OF SCRIPT
 **************************************************************/







