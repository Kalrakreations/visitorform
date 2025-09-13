document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('customerForm');
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxvmhvHDmRY6fSGwcrld0EXBhadrCYMRbiWOA4I575ciHBYZhZnFFRlGbbbpPksLaOUbQ/exec";

  // Dynamic "Other" fields
  const fields = ["designation","country","state","city","business"];
  const otherFields = {
    designation: document.getElementById('designationOther'),
    country: document.getElementById('countryOther'),
    state: document.getElementById('stateOther'),
    city: document.getElementById('cityOther'),
    business: document.getElementById('businessOther')
  };

  // Border glow logic instead of tick
  form.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', () => {
      let isFilled = false;

      if (["text","email","tel"].includes(input.type)) {
        isFilled = input.value.trim() !== "";
      }
      if (input.tagName.toLowerCase() === "select") {
        isFilled = input.value !== "";
      }
      if (input.type === "file") {
        isFilled = input.files.length > 0;
      }

      input.classList.toggle("glow-success", isFilled);
    });
  });

  // States & Cities
  const statesAndCities = {
    "Andhra Pradesh": ["Visakhapatnam","Vijayawada","Guntur","Nellore","Tirupati"],
    "Arunachal Pradesh": ["Itanagar","Naharlagun","Pasighat"],
    "Assam": ["Guwahati","Dibrugarh","Silchar","Jorhat"],
    "Bihar": ["Patna","Gaya","Bhagalpur","Muzaffarpur"],
    "Chhattisgarh": ["Raipur","Bilaspur","Durg","Korba"],
    "Goa": ["Panaji","Margao","Vasco da Gama"],
    "Gujarat": ["Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar"],
    "Haryana": ["Chandigarh","Gurugram","Faridabad","Panipat","Hisar"],
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
    "Punjab": ["Amritsar","Ludhiana","Jalandhar","Patiala","Bathinda","Mohali","Moga","Firozpur","Abohar"],
    "Rajasthan": ["Jaipur","Jodhpur","Udaipur","Kota","Ajmer"],
    "Sikkim": ["Gangtok","Geyzing","Namchi"],
    "Tamil Nadu": ["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Erode"],
    "Telangana": ["Hyderabad","Warangal","Nizamabad"],
    "Tripura": ["Agartala","Udaipur","Dharmanagar"],
    "Uttar Pradesh": ["Lucknow","Kanpur","Agra","Varanasi","Ghaziabad","Meerut","Noida"],
    "Uttarakhand": ["Dehradun","Haridwar","Roorkee"],
    "West Bengal": ["Kolkata","Howrah","Durgapur","Siliguri","Asansol"]
  };

  const country = document.getElementById('country');
  const state = document.getElementById('state');
  const city = document.getElementById('city');

  function populateStates() {
    state.innerHTML = '<option value="">Select State</option>';
    for (let st in statesAndCities) {
      state.insertAdjacentHTML('beforeend', `<option value="${st}">${st}</option>`);
    }
    state.insertAdjacentHTML('beforeend', `<option value="Other">Other</option>`);
  }

  // Show/hide "Other" fields
  fields.forEach(f => {
    document.getElementById(f).addEventListener('change', () => {
      otherFields[f].style.display = (document.getElementById(f).value === "Other") ? "block" : "none";
    });
  });

  // Country logic
  country.addEventListener('change', () => {
    if (country.value === "India") {
      otherFields.country.style.display = "none";
      state.style.display = "block";
      otherFields.state.style.display = "none";
      otherFields.city.style.display = "none";
      populateStates();
      city.innerHTML = '<option value="">Select City</option>';
    } else if (country.value === "Other") {
      otherFields.country.style.display = "block";
      state.style.display = "none";
      otherFields.state.style.display = "block";
      city.innerHTML = '<option value="Other">Other</option>';
      otherFields.city.style.display = "block";
    } else {
      otherFields.country.style.display = "none";
      state.style.display = "none";
      city.innerHTML = '<option value="">Select City</option>';
      otherFields.state.style.display = "none";
      otherFields.city.style.display = "none";
    }
  });

  // Populate cities
  state.addEventListener('change', () => {
    city.innerHTML = '<option value="">Select City</option>';
    otherFields.city.style.display = "none";

    if (statesAndCities[state.value]) {
      statesAndCities[state.value].forEach(ct => {
        city.insertAdjacentHTML('beforeend', `<option value="${ct}">${ct}</option>`);
      });
      city.insertAdjacentHTML('beforeend', `<option value="Other">Other</option>`);
    } else if (state.value === "Other") {
      otherFields.state.style.display = "block";
      city.innerHTML = '<option value="Other">Other</option>';
      otherFields.city.style.display = "block";
    }
  });

  city.addEventListener('change', () => {
    otherFields.city.style.display = (city.value === "Other") ? "block" : "none";
  });

  // Convert images to Base64
  async function getImageBase64(input){
    return new Promise((resolve, reject) => {
      if(input.files.length === 0){ resolve(null); return; }
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => resolve({ base64: reader.result.split(',')[1], name: file.name });
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // Form submission
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.classList.add('loading');

    const vcFront = await getImageBase64(document.getElementById('vcFront'));
    const vcBack = await getImageBase64(document.getElementById('vcBack'));

    const formData = new FormData(form);
    if(vcFront){ formData.append('vcFrontBase64', vcFront.base64); formData.append('vcFrontName', vcFront.name); }
    if(vcBack){ formData.append('vcBackBase64', vcBack.base64); formData.append('vcBackName', vcBack.name); }

    fetch(SCRIPT_URL, { method:'POST', body: formData })
      .then(res => res.text())
      .then(msg => {
        submitBtn.classList.remove('loading');
        const popup = document.getElementById('formPopup');
        if(msg.includes("SUCCESS")){
          popup.textContent = "✅ Form submitted successfully!";
          popup.classList.remove('error');
          popup.style.display = "block";
          form.reset();
          form.querySelectorAll('input, select').forEach(i=>i.classList.remove("glow-success"));
        } else {
          popup.textContent = "❌ Form submission failed!";
          popup.classList.add('error');
          popup.style.display = "block";
        }
        setTimeout(()=>{popup.style.display='none';}, 3000);
      })
      .catch(err => {
        submitBtn.classList.remove('loading');
        const popup = document.getElementById('formPopup');
        popup.textContent = "⚠️ Submission error!";
        popup.classList.add('error');
        popup.style.display = "block";
        setTimeout(()=>{popup.style.display='none';}, 3000);
        console.error(err);
      });
  });

  // Trigger glow on load if pre-filled
  form.querySelectorAll('input, select').forEach(input => {
    input.dispatchEvent(new Event('input'));
  });
});
