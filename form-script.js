document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('customerForm');
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxvmhvHDmRY6fSGwcrld0EXBhadrCYMRbiWOA4I575ciHBYZhZnFFRlGbbbpPksLaOUbQ/exec";

  const fields = ["designation","country","state","city","business"];
  const otherFields = {
    designation: document.getElementById('designationOther'),
    country: document.getElementById('countryOther'),
    state: document.getElementById('stateOther'),
    city: document.getElementById('cityOther'),
    business: document.getElementById('businessOther')
  };

  // --- IndexedDB setup ---
  let db;
  const request = indexedDB.open("VisitorFormDB", 1);
  request.onupgradeneeded = e => {
    db = e.target.result;
    db.createObjectStore("submissions", { keyPath: "id", autoIncrement: true });
  };
  request.onsuccess = e => { db = e.target.result; tryResendData(); };
  request.onerror = e => console.error("IndexedDB error:", e);

  function saveOffline(data) {
    const tx = db.transaction("submissions", "readwrite");
    tx.objectStore("submissions").add(data);
  }

  async function tryResendData() {
    if (!navigator.onLine || !db) return;
    const tx = db.transaction("submissions", "readwrite");
    const store = tx.objectStore("submissions");
    const getAll = store.getAll();

    getAll.onsuccess = async () => {
      for (const record of getAll.result) {
        try {
          const fd = new FormData();
          for (let k in record.data) fd.append(k, record.data[k]);
          await fetch(SCRIPT_URL, { method: "POST", body: fd });
          store.delete(record.id);

          showPopup("✅ Offline submission synced!", false);
        } catch (err) {
          console.error("Resend failed:", err);
        }
      }
    };
  }

  window.addEventListener("online", tryResendData);

  // Glow + validation
  form.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', () => {
      let isFilled = false;
      if(input.id === "name"){
        input.value = input.value.replace(/[^a-zA-Z\s]/g, '');
      }
      if(input.id === "phone"){
        input.value = input.value.replace(/[^\d+]/g, '');
      }
      if (["text","email","tel"].includes(input.type)) isFilled = input.value.trim() !== "";
      if (input.tagName.toLowerCase() === "select") isFilled = input.value !== "";
      if (input.type === "file") isFilled = input.files.length > 0;
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

  // --- Populate countries ---
  function populateCountries() {
    const countries = ["India", "United States", "United Kingdom", "Canada", "Australia", "Other"];
    country.innerHTML = "";
    countries.forEach(c => {
      country.insertAdjacentHTML('beforeend',
        `<option value="${c}" ${c === "India" ? "selected" : ""}>${c}</option>`);
    });
  }
  populateCountries();

  function populateStates(){
    state.innerHTML = '<option value="">Select State</option>';
    for(let st in statesAndCities){
      state.insertAdjacentHTML('beforeend', `<option value="${st}">${st}</option>`);
    }
    state.insertAdjacentHTML('beforeend', `<option value="Other">Other</option>`);
  }

  // Show/hide Other fields
  fields.forEach(f => {
    document.getElementById(f).addEventListener('change', () => {
      otherFields[f].style.display = (document.getElementById(f).value === "Other") ? "block" : "none";
    });
  });

  // Country logic
  country.addEventListener('change', () => {
    if(country.value === "India"){
      populateStates();
      state.style.display = "block";
      city.style.display = "block";
      otherFields.country.style.display = "none";
      otherFields.state.style.display = "none";
      otherFields.city.style.display = "none";
      city.innerHTML = '<option value="">Select City</option>';
    } else if(country.value === "Other"){
      otherFields.country.style.display = "block";
      state.style.display = "none";
      city.style.display = "none";
      otherFields.state.style.display = "block";
      otherFields.city.style.display = "block";
    } else {
      state.style.display = "none";
      city.style.display = "none";
      otherFields.country.style.display = "none";
      otherFields.state.style.display = "none";
      otherFields.city.style.display = "none";
    }
  });

  // State logic
  state.addEventListener('change', () => {
    city.innerHTML = '<option value="">Select City</option>';
    otherFields.city.style.display = "none";
    if(statesAndCities[state.value]){
      statesAndCities[state.value].forEach(ct => {
        city.insertAdjacentHTML('beforeend', `<option value="${ct}">${ct}</option>`);
      });
      city.insertAdjacentHTML('beforeend', `<option value="Other">Other</option>`);
      city.style.display = "block";
    } else if(state.value === "Other"){
      otherFields.state.style.display = "block";
      otherFields.city.style.display = "block";
    }
  });

  // City logic
  city.addEventListener('change', () => {
    otherFields.city.style.display = (city.value === "Other") ? "block" : "none";
  });

  // --- 📍 Location Capture ---
  function captureLocation() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          document.getElementById("latitude").value = pos.coords.latitude;
          document.getElementById("longitude").value = pos.coords.longitude;
          localStorage.setItem("lastLatitude", pos.coords.latitude);
          localStorage.setItem("lastLongitude", pos.coords.longitude);
        },
        err => {
          console.warn("Location capture failed:", err.message);
          if(localStorage.getItem("lastLatitude")){
            document.getElementById("latitude").value = localStorage.getItem("lastLatitude");
            document.getElementById("longitude").value = localStorage.getItem("lastLongitude");
          }
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }
  captureLocation();
  setInterval(captureLocation, 30000);

  // Convert image to Base64
  async function getImageBase64(input){
    return new Promise((resolve,reject)=>{
      if(input.files.length === 0){ resolve(null); return; }
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = ()=> resolve({base64:reader.result.split(',')[1], name:file.name});
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // Popup helper
  function showPopup(message, isError){
    const popup = document.getElementById('formPopup');
    popup.textContent = message;
    popup.classList.toggle('error', !!isError);
    popup.style.display = "block";
    setTimeout(()=>{popup.style.display='none';}, 3000);
  }

  // Form submission
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.classList.add('loading');

    const vcFront = await getImageBase64(document.getElementById('vcFront'));
    const vcBack = await getImageBase64(document.getElementById('vcBack'));

    const formData = new FormData(form);
    if(vcFront){ formData.append('vcFrontBase64', vcFront.base64); formData.append('vcFrontName', vcFront.name); }
    if(vcBack){ formData.append('vcBackBase64', vcBack.base64); formData.append('vcBackName', vcBack.name); }

    if (navigator.onLine) {
      fetch(SCRIPT_URL, {method:'POST', body: formData})
      .then(res=>res.text())
      .then(msg=>{
        submitBtn.classList.remove('loading');
        if(msg.includes("SUCCESS")){
          showPopup("✅ Form submitted successfully!", false);
          form.reset();
          form.querySelectorAll('input, select').forEach(i=>i.classList.remove("glow-success"));
          setTimeout(()=>location.reload(), 2000);
        } else {
          showPopup("❌ Form submission failed!", true);
        }
      })
      .catch(err=>{
        submitBtn.classList.remove('loading');
        showPopup("⚠️ Submission error!", true);
        console.error(err);
      });
    } else {
      let plainData = {};
      formData.forEach((val,key)=>plainData[key]=val);
      saveOffline({ data: plainData, timestamp: Date.now() });
      submitBtn.classList.remove('loading');
      showPopup("📩 You are offline. Form saved & will auto-submit later.", false);
      form.reset();
      form.querySelectorAll('input, select').forEach(i=>i.classList.remove("glow-success"));
    }
  });

  // Default setup for India
  if(country.value === "India"){ 
    populateStates(); 
    state.style.display = "block"; 
    city.style.display = "block"; 
  }
  form.querySelectorAll('input, select').forEach(input=> input.dispatchEvent(new Event('input')));
});
