/* ===================================================
   Modern Form JS
   Handles: theme, validation, phone checks, states/cities,
   floating labels, Google Sheet submission, ripple effect
   =================================================== */

/* ---------- Theme Toggle (iOS style) ---------- */
const themeToggle = document.querySelector('.theme-toggle input');
const body = document.body;

themeToggle.addEventListener('change', () => {
  if (themeToggle.checked) {
    body.setAttribute('data-theme','dark');
  } else {
    body.setAttribute('data-theme','light');
  }
});

/* ---------- States and Cities ---------- */
const statesAndCities = {
  "Andhra Pradesh": ["Visakhapatnam","Vijayawada","Guntur","Nellore","Tirupati"],
  "Arunachal Pradesh": ["Itanagar","Naharlagun","Pasighat"],
  "Assam": ["Guwahati","Dibrugarh","Silchar","Jorhat"],
  "Bihar": ["Patna","Gaya","Bhagalpur","Muzaffarpur"],
  "Chhattisgarh": ["Raipur","Bilaspur","Durg","Korba"],
  "Goa": ["Panaji","Margao","Vasco da Gama"],
  "Gujarat": ["Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar"],
  "Haryana": ["Gurugram","Faridabad","Panipat","Hisar"],
  "Himachal Pradesh": ["Shimla","Dharamshala","Mandi","Solan"],
  "Jharkhand": ["Ranchi","Jamshedpur","Dhanbad","Bokaro"],
  "Karnataka": ["Bengaluru","Mysuru","Hubballi","Mangaluru"],
  "Kerala": ["Thiruvananthapuram","Kochi","Kozhikode","Thrissur"],
  "Madhya Pradesh": ["Bhopal","Indore","Gwalior","Jabalpur","Ujjain"],
  "Maharashtra": ["Mumbai","Pune","Nagpur","Nashik","Aurangabad"],
  "Manipur": ["Imphal","Thoubal","Bishnupur"],
  "Meghalaya": ["Shillong","Tura","Nongpoh"],
  "Mizoram": ["Aizawl","Lunglei","Champhai"],
  "Nagaland": ["Kohima","Dimapur","Mokokchung"],
  "Odisha": ["Bhubaneswar","Cuttack","Rourkela","Sambalpur"],
  "Punjab": ["Amritsar","Ludhiana","Jalandhar","Patiala","Bathinda"],
  "Rajasthan": ["Jaipur","Jodhpur","Udaipur","Kota","Ajmer"],
  "Sikkim": ["Gangtok","Geyzing","Namchi"],
  "Tamil Nadu": ["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Erode"],
  "Telangana": ["Hyderabad","Warangal","Nizamabad"],
  "Tripura": ["Agartala","Udaipur","Dharmanagar"],
  "Uttar Pradesh": ["Lucknow","Kanpur","Agra","Varanasi","Ghaziabad","Meerut","Noida"],
  "Uttarakhand": ["Dehradun","Haridwar","Roorkee"],
  "West Bengal": ["Kolkata","Howrah","Durgapur","Siliguri","Asansol"],
  "Chandigarh": ["Chandigarh","New Chandigarh"]
};

/* ---------- Populate Countries ---------- */
const countrySelect = document.getElementById('country');
const stateSelect = document.getElementById('state');
const citySelect = document.getElementById('city');

const countries = ["India","United States","United Kingdom","Canada","Australia","Other"];
countries.forEach(c=>{
  const opt = document.createElement('option');
  opt.value = c;
  opt.textContent = c;
  if(c==="India") opt.selected = true; // default
  countrySelect.appendChild(opt);
});

/* ---------- Populate States Based on Country ---------- */
function populateStates() {
  const country = countrySelect.value;
  stateSelect.innerHTML = `<option value="">Select State</option>`;
  citySelect.innerHTML = `<option value="">Select City</option>`;
  if(country==="India") {
    Object.keys(statesAndCities).forEach(st=>{
      const opt = document.createElement('option');
      opt.value = st;
      opt.textContent = st;
      stateSelect.appendChild(opt);
    });
  }
}

/* ---------- Populate Cities Based on State ---------- */
function populateCities() {
  const state = stateSelect.value;
  citySelect.innerHTML = `<option value="">Select City</option>`;
  if(statesAndCities[state]){
    statesAndCities[state].forEach(ct=>{
      const opt = document.createElement('option');
      opt.value = ct;
      opt.textContent = ct;
      citySelect.appendChild(opt);
    });
  }
}

countrySelect.addEventListener('change',populateStates);
stateSelect.addEventListener('change',populateCities);

/* ---------- Input Validation and Glow ---------- */
const inputs = document.querySelectorAll('.input-container input');
inputs.forEach(input=>{
  input.addEventListener('focus',()=>{
    input.classList.remove('valid','invalid');
  });
  input.addEventListener('input',()=>{
    // Phone validation
    if(input.id==='phone') {
      const country = countrySelect.value;
      let val = input.value.replace(/\D/g,''); // digits only
      if(country==="India") {
        if(val.length===10) {
          input.classList.add('valid'); input.classList.remove('invalid');
        } else {
          input.classList.add('invalid'); input.classList.remove('valid');
        }
      } else {
        input.classList.remove('valid','invalid');
      }
    } else {
      // Other input glow
      if(input.value.trim()!=='') input.classList.add('valid');
      else input.classList.remove('valid','invalid');
    }
  });
});

/* ---------- Ripple Effect for Submit Button ---------- */
const submitBtn = document.querySelector('button.submit-btn');
submitBtn.addEventListener('click', e=>{
  const ripple = document.createElement('span');
  ripple.classList.add('ripple');
  const rect = submitBtn.getBoundingClientRect();
  ripple.style.left = `${e.clientX - rect.left}px`;
  ripple.style.top = `${e.clientY - rect.top}px`;
  submitBtn.appendChild(ripple);
  setTimeout(()=>{ripple.remove();},600);
});

/* ---------- Form Submission ---------- */
const form = document.querySelector('form');
form.addEventListener('submit', async e=>{
  e.preventDefault();
  const data = new FormData(form);

  // Convert FormData to JSON
  let jsonData = {};
  for (let [key,value] of data.entries()) {
    jsonData[key] = value;
  }

  // Send to Apps Script
  try{
    const response = await fetch(form.action,{
      method: 'POST',
      body: new URLSearchParams(jsonData)
    });
    const text = await response.text();
    if(text.includes("SUCCESS")){
      showPopup("Form submitted successfully!","success");
      form.reset();
    } else if(text.includes("DUPLICATE")){
      showPopup("Duplicate entry detected.","error");
    } else {
      showPopup("Submission failed. Try again.","error");
    }
  } catch(err){
    showPopup("Error connecting to server.","error");
  }
});

/* ---------- Popup Notifications ---------- */
function showPopup(msg,type){
  const popup = document.createElement('div');
  popup.className = 'form-popup';
  if(type==='error') popup.classList.add('error');
  popup.textContent = msg;
  document.body.appendChild(popup);
  popup.style.display='block';
  setTimeout(()=>{popup.remove();},4000);
}

/* ---------- Initialize ---------- */
populateStates(); // initial population on page load
