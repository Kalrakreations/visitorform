document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('customerForm');
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxvmhvHDmRY6fSGwcrld0EXBhadrCYMRbiWOA4I575ciHBYZhZnFFRlGbbbpPksLaOUbQ/exec";

  // IndexedDB setup
  let db;
  const request = indexedDB.open('visitorFormDB', 1);

  request.onupgradeneeded = e => {
    db = e.target.result;
    if (!db.objectStoreNames.contains('forms')) {
      db.createObjectStore('forms', { autoIncrement: true });
    }
  };

  request.onsuccess = e => {
    db = e.target.result;
    // Try sending stored forms on load
    sendStoredForms();
  };

  request.onerror = e => console.error("IndexedDB error:", e);

  // Dynamic "Other" fields
  const fields = ["designation","country","state","city","business"];
  const otherFields = {
    designation: document.getElementById('designationOther'),
    country: document.getElementById('countryOther'),
    state: document.getElementById('stateOther'),
    city: document.getElementById('cityOther'),
    business: document.getElementById('businessOther')
  };

  // Border glow logic
  form.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', () => {
      let isFilled = false;
      if (["text","email","tel"].includes(input.type)) isFilled = input.value.trim() !== "";
      if (input.tagName.toLowerCase() === "select") isFilled = input.value !== "";
      if (input.type === "file") isFilled = input.files.length > 0;
      input.classList.toggle("glow-success", isFilled);
    });
  });

  // States & Cities
  const statesAndCities = {
    "Andhra Pradesh":["Visakhapatnam","Vijayawada","Guntur","Nellore","Tirupati"],
    "Arunachal Pradesh":["Itanagar","Naharlagun","Pasighat"],
    "Assam":["Guwahati","Dibrugarh","Silchar","Jorhat"],
    "Bihar":["Patna","Gaya","Bhagalpur","Muzaffarpur"],
    "Chhattisgarh":["Raipur","Bilaspur","Durg","Korba"],
    "Goa":["Panaji","Margao","Vasco da Gama"],
    "Gujarat":["Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar"],
    "Haryana":["Chandigarh","Gurugram","Faridabad","Panipat","Hisar"],
    "Himachal Pradesh":["Shimla","Dharamshala","Mandi","Solan"],
    "Jharkhand":["Ranchi","Jamshedpur","Dhanbad","Bokaro"],
    "Karnataka":["Bengaluru","Mysuru","Hubballi","Mangaluru"],
    "Kerala":["Thiruvananthapuram","Kochi","Kozhikode","Thrissur"],
    "Madhya Pradesh":["Bhopal","Indore","Gwalior","Jabalpur","Ujjain"],
    "Maharashtra":["Mumbai","Pune","Nagpur","Nashik","Aurangabad"],
    "Manipur":["Imphal","Thoubal","Bishnupur"],
    "Meghalaya":["Shillong","Tura","Nongpoh"],
    "Mizoram":["Aizawl","Lunglei","Champhai"],
    "Nagaland":["Kohima","Dimapur","Mokokchung"],
    "Odisha":["Bhubaneswar","Cuttack","Rourkela","Sambalpur"],
    "Punjab":["Amritsar","Ludhiana","Jalandhar","Patiala","Bathinda","Mohali","Moga","Firozpur","Abohar"],
    "Rajasthan":["Jaipur","Jodhpur","Udaipur","Kota","Ajmer"],
    "Sikkim":["Gangtok","Geyzing","Namchi"],
    "Tamil Nadu":["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Erode"],
    "Telangana":["Hyderabad","Warangal","Nizamabad"],
    "Tripura":["Agartala","Udaipur","Dharmanagar"],
    "Uttar Pradesh":["Lucknow","Kanpur","Agra","Varanasi","Ghaziabad","Meerut","Noida"],
    "Uttarakhand":["Dehradun","Haridwar","Roorkee"],
    "West Bengal":["Kolkata","Howrah","Durgapur","Siliguri","Asansol"]
  };

  const country = document.getElementById('country');
  const state = document.getElementById('state');
  const city = document.getElementById('city');

  function populateStates() {
    state.innerHTML = '<option value="">Select State</option>';
    Object.keys(statesAndCities).forEach(st => {
      state.insertAdjacentHTML('beforeend', `<option value="${st}">${st}</option>`);
    });
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

  // Save form to IndexedDB
  function saveFormOffline(data) {
    const tx = db.transaction('forms', 'readwrite');
    tx.objectStore('forms').add(data);
    tx.oncomplete = () => console.log('Form saved offline.');
    tx.onerror = e => console.error('Error saving offline:', e);
  }

  // Send stored forms
  function sendStoredForms() {
    if (!navigator.onLine) return;
    const tx = db.transaction('forms', 'readonly');
    const store = tx.objectStore('forms');
    const req = store.openCursor();
    req.onsuccess = e => {
      const cursor = e.target.result;
      if(cursor) {
        fetch(SCRIPT_URL, { method:'POST', body: cursor.value })
          .then(res => res.text())
          .then(msg => {
            if(msg.includes("SUCCESS")) {
              const deleteTx = db.transaction('forms', 'readwrite');
              deleteTx.objectStore('forms').delete(cursor.key);
              console.log('Offline form synced.');
            }
          })
          .catch(err => console.error('Error syncing offline form:', err));
        cursor.continue();
      }
    };
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

    function showPopup(message, success=true){
      submitBtn.classList.remove('loading');
      const popup = document.getElementById('formPopup');
      popup.textContent = message;
      popup.classList.toggle('error', !success);
      popup.style.display = "block";
      setTimeout(()=>popup.style.display='none', 3000);
      if(success){
        form.reset();
        form.querySelectorAll('input, select').forEach(i=>i.classList.remove("glow-success"));
      }
    }

    if(navigator.onLine){
      fetch(SCRIPT_URL, { method:'POST', body: formData })
        .then(res => res.text())
        .then(msg => {
          if(msg.includes("SUCCESS")){
            showPopup("✅ Form submitted successfully!");
          } else {
            showPopup("❌ Form submission failed!", false);
          }
        })
        .catch(err => {
          console.error(err);
          showPopup("⚠️ Submission error!", false);
          saveFormOffline(formData);
        });
    } else {
      saveFormOffline(formData);
      showPopup("⚠️ No internet. Form saved offline.", true);
    }
  });

  // Listen for online event to auto-send offline forms
  window.addEventListener('online', sendStoredForms);

  // Trigger glow on load if pre-filled
  form.querySelectorAll('input, select').forEach(input => {
    input.dispatchEvent(new Event('input'));
  });
});
