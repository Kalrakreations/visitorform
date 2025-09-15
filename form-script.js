document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('customerForm');
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxpduRNvWMK9FvaSiEKOh36Dp08bCefcAIPTXs0j-kcEW54aGaDXIw2e77aYO1_R2NagQ/exec";

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
    if(!db) return;
    const tx = db.transaction("submissions", "readwrite");
    tx.objectStore("submissions").add(data);
  }

  async function tryResendData() {
    if (!navigator.onLine || !db) return;
    const tx = db.transaction("submissions", "readwrite");
    const store = tx.objectStore("submissions");
    const getAll = store.getAll();

    getAll.onsuccess = async () => {
      const uniqueRecords = [];
      const existingHashes = new Set();

      for (const record of getAll.result) {
        const hash = JSON.stringify(record.data);
        if(!existingHashes.has(hash)){
          uniqueRecords.push(record);
          existingHashes.add(hash);
        }
      }

      for (const record of uniqueRecords) {
        try {
          const fd = new FormData();
          for (let k in record.data) fd.append(k, record.data[k]);
          const res = await fetch(SCRIPT_URL, { method: "POST", body: fd });
          const text = await res.text();
          if(text.includes("SUCCESS")){
            store.delete(record.id);
            showPopup("✅ Offline submission synced!", false);
          }
        } catch (err) {
          console.error("Resend failed:", err);
        }
      }
    };
  }

  window.addEventListener("online", tryResendData);

  // --- Floating Labels + Glow/Validation for all inputs ---
  form.querySelectorAll('input, select, textarea').forEach(input => {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if(label){
      label.style.transition = "all 0.2s ease";
      label.style.position = "absolute";
      label.style.left = "0.5rem";
      label.style.top = "0.5rem";
      label.style.color = "#999";
    }

    input.style.paddingTop = "1.5rem";
    input.style.marginBottom = "1.8rem"; // spacing to avoid collision

    const updateLabel = () => {
      if(input.value.trim() !== "" || document.activeElement === input){
        if(label){
          label.style.top = "-0.7rem";
          label.style.fontSize = "0.75rem";
          label.style.color = "#3f51b5";
        }
      } else {
        if(label){
          label.style.top = "0.5rem";
          label.style.fontSize = "1rem";
          label.style.color = "#999";
        }
      }
    };

    input.addEventListener('input', () => {
      let isFilled = false;
      if(input.id === "name") input.value = input.value.replace(/[^a-zA-Z\s]/g, '');
      if(input.id === "phone") input.value = input.value.replace(/[^\d+]/g, '');
      if (["text","email","tel","textarea"].includes(input.type) || input.tagName.toLowerCase()==="textarea") {
        isFilled = input.value.trim() !== "";
      }
      if (input.tagName.toLowerCase() === "select") isFilled = input.value !== "";
      if (input.type === "file") isFilled = input.files.length > 0;
      input.classList.toggle("glow-success", isFilled);

      updateLabel();
    });

    input.addEventListener("focus", updateLabel);
    input.addEventListener("blur", updateLabel);
    updateLabel();
  });

  // --- States & Cities ---
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

  const country = document.getElementById('country');
  const state = document.getElementById('state');
  const city = document.getElementById('city');

  function populateCountries() {
    const countries = ["India", "United States", "United Kingdom", "Canada", "Australia", "Other"];
    country.innerHTML = "";
    countries.forEach(c => {
      country.insertAdjacentHTML('beforeend', `<option value="${c}" ${c==="India"?"selected":""}>${c}</option>`);
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

  fields.forEach(f => {
    document.getElementById(f).addEventListener('change', () => {
      otherFields[f].style.display = (document.getElementById(f).value === "Other") ? "block" : "none";
    });
  });

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

  state.addEventListener('change', () => {
    city.innerHTML = '<option value="">Select City</option>';
    otherFields.city.style.display = "none";
    if(statesAndCities[state.value]){
      statesAndCities[state.value].forEach(ct => city.insertAdjacentHTML('beforeend', `<option value="${ct}">${ct}</option>`));
      city.insertAdjacentHTML('beforeend', `<option value="Other">Other</option>`);
      city.style.display = "block";
    } else if(state.value==="Other"){
      otherFields.state.style.display = "block";
      otherFields.city.style.display = "block";
    }
  });

  city.addEventListener('change', () => {
    otherFields.city.style
