/* =========================================================================
   Visitor Form script.js
   - Offline-first using IndexedDB
   - Duplicate prevention
   - Improved submit button UX (ripple, loading, success text)
   - Haptic feedback on theme toggle & success
   - Floating label persistence for textarea (remarks)
   - Preserves all states/cities/countries data and original logic
   ========================================================================= */

document.addEventListener('DOMContentLoaded', async () => {
  // -------------------------------
  // Configuration
  // -------------------------------
  const form = document.getElementById('customerForm');
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzUeEwhUrglj58LQ9D8eR5IzCaLgrSoqJF-AFsCZlXhD91HuQoPvi8Q04w5-R6N182Eag/exec";

  // fields that have "Other" fallback inputs
  const fields = ["designation","country","state","city","business"];
  const otherFields = {
    designation: document.getElementById('designationOther'),
    country: document.getElementById('countryOther'),
    state: document.getElementById('stateOther'),
    city: document.getElementById('cityOther'),
    business: document.getElementById('businessOther')
  };

  // -------------------------------
  // IndexedDB setup (VisitorFormDB)
  // -------------------------------
  let db;
  const DB_NAME = 'VisitorFormDB';
  const STORE_NAME = 'submissions';

  const request = indexedDB.open(DB_NAME, 1);

  request.onupgradeneeded = e => {
    db = e.target.result;
    if(!db.objectStoreNames.contains(STORE_NAME)){
      db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
    }
  };

  request.onsuccess = e => {
    db = e.target.result;
    // attempt background resend, but only if online
    tryResendData();
  };

  request.onerror = e => {
    console.error('IndexedDB error:', e);
  };

  // -------------------------------
  // Helper: compute basic hash from object for deduplication
  // (we use stable JSON stringify ordering by keys)
  // -------------------------------
  function stableStringify(obj){
    const allKeys = [];
    JSON.stringify(obj, (k, v) => { allKeys.push(k); return v; }); // collect keys
    // Build new object with sorted keys
    const sorted = {};
    Object.keys(obj).sort().forEach(k => sorted[k] = obj[k]);
    try {
      return JSON.stringify(sorted);
    } catch (err) {
      return JSON.stringify(obj);
    }
  }

  // -------------------------------
  // Save offline but avoid duplicates
  // - We check existing store for same data hash
  // -------------------------------
  function saveOffline(data) {
    if (!db) {
      console.warn("IndexedDB not ready — cannot save offline.");
      return;
    }
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const getAll = store.getAll();
    getAll.onsuccess = () => {
      const entries = getAll.result || [];
      const newHash = stableStringify(data);
      const exists = entries.some(rec => stableStringify(rec.data) === newHash);
      if (!exists) {
        store.add({ data, timestamp: Date.now() });
        console.debug("Saved offline (unique).");
      } else {
        console.debug("Duplicate offline submission detected — not saving.");
      }
    };
    getAll.onerror = (err) => {
      console.error("Error checking duplicates in IDB:", err);
      // fallback: add anyway
      store.add({ data, timestamp: Date.now() });
    };
  }

  // -------------------------------
  // Try resend data when online.
  // - De-duplicates records locally before sending.
  // - Deletes record only after confirmed SUCCESS from server.
  // - Uses a session flag to avoid repeating send loops during long page lifetime.
  // -------------------------------
  let _syncInProgress = false;

  async function tryResendData() {
    if (!navigator.onLine || !db) return;
    if (_syncInProgress) {
      console.debug("Sync already in progress — skipping.");
      return;
    }
    _syncInProgress = true;

    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getAll = store.getAll();

    getAll.onsuccess = async () => {
      try {
        const rows = getAll.result || [];
        // Build unique list by stable stringify
        const uniqueMap = new Map(); // hash -> first record
        for (const r of rows) {
          const hash = stableStringify(r.data);
          if (!uniqueMap.has(hash)) uniqueMap.set(hash, r);
        }

        // Send them in order of timestamp (to preserve chronological order)
        const uniqueRecords = Array.from(uniqueMap.values()).sort((a,b)=>a.timestamp - b.timestamp);

        for (const record of uniqueRecords) {
          try {
            const fd = new FormData();
            for (let k in record.data) fd.append(k, record.data[k]);

            // Post to server
            const res = await fetch(SCRIPT_URL, { method: "POST", body: fd });
            const text = await res.text();

            if (text && text.includes("SUCCESS")) {
              // delete only the *matching* record id
              store.delete(record.id);
              console.debug("Synced offline record id:", record.id);
              showPopup("✅ Offline submission synced!", false);
              if ('vibrate' in navigator) navigator.vibrate(30);
            } else {
              console.warn("Server returned non-SUCCESS while syncing offline record:", text);
            }
          } catch (err) {
            console.error("Resend failed for record:", record.id, err);
            // Keep it for next attempt
          }
        }
      } catch (outerErr) {
        console.error("Error during tryResendData:", outerErr);
      } finally {
        _syncInProgress = false;
      }
    };

    getAll.onerror = (err) => {
      console.error("Error reading submissions store:", err);
      _syncInProgress = false;
    };
  }

  window.addEventListener("online", tryResendData);

  // -------------------------------
  // Glow + validation logic (preserve original)
  // Also adds 'filled' class to container when input has content,
  // so floating labels remain lifted even after blur.
  // -------------------------------
  function setContainerFilledState(el) {
    if (!el) return;
    const container = el.closest('.input-container');
    if (!container) return;
    if (el.type === 'file') {
      container.classList.toggle('filled', el.files.length > 0);
    } else {
      container.classList.toggle('filled', el.value && el.value.trim() !== "");
    }
  }

  const allInputs = form.querySelectorAll('input, select, textarea');
  allInputs.forEach(input => {
    // initial filled state
    setContainerFilledState(input);

    input.addEventListener('input', (ev) => {
      let isFilled = false;
      if (input.id === "name") input.value = input.value.replace(/[^a-zA-Z\s]/g, '');
      if (input.id === "phone") input.value = input.value.replace(/[^\d+]/g, '');
      if (["text","email","tel"].includes(input.type) || input.tagName.toLowerCase()==="textarea") {
        isFilled = input.value.trim() !== "";
      }
      if (input.tagName.toLowerCase() === "select") isFilled = input.value !== "";
      if (input.type === "file") isFilled = input.files.length > 0;

      input.classList.toggle("glow-success", isFilled);

      // make floating label persist when value exists
      setContainerFilledState(input);
    });

    // On blur ensure label stays lifted if has content
    input.addEventListener('blur', () => {
      setContainerFilledState(input);
    });
  });

  // -------------------------------
  // States & Cities data (unchanged)
  // -------------------------------
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

  // -------------------------------
  // UI population helpers (countries & states)
  // -------------------------------
  const country = document.getElementById('country');
  const state = document.getElementById('state');
  const city = document.getElementById('city');

  function populateCountries() {
    const countries = ["India", "United States", "United Kingdom", "Canada", "Australia", "Other"];
    country.innerHTML = "";
    countries.forEach(c => country.insertAdjacentHTML('beforeend', `<option value="${c}" ${c==="India" ? "selected":""}>${c}</option>`));
  }
  populateCountries();

  function populateStates(){
    state.innerHTML = '<option value="">Select State</option>';
    for (let st in statesAndCities) state.insertAdjacentHTML('beforeend', `<option value="${st}">${st}</option>`);
    state.insertAdjacentHTML('beforeend', `<option value="Other">Other</option>`);
  }

  // Show/hide additional "Other" inputs when user selects Other
  fields.forEach(f => {
    const el = document.getElementById(f);
    if (!el) return;
    el.addEventListener('change', () => {
      otherFields[f].style.display = (document.getElementById(f).value === "Other") ? "block" : "none";
      // if changed, keep floating label states updated
      const otherEl = otherFields[f];
      if (otherEl) setContainerFilledState(otherEl);
    });
  });

  // Country change logic
  if (country) country.addEventListener('change', () => {
    if (country.value === "India") {
      populateStates();
      state.style.display = "block";
      city.style.display = "block";
      otherFields.country.style.display = "none";
      otherFields.state.style.display = "none";
      otherFields.city.style.display = "none";
      city.innerHTML = '<option value="">Select City</option>';
    } else if (country.value === "Other") {
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

  // State change logic
  if (state) state.addEventListener('change', () => {
    city.innerHTML = '<option value="">Select City</option>';
    otherFields.city.style.display = "none";
    if (statesAndCities[state.value]) {
      statesAndCities[state.value].forEach(ct => city.insertAdjacentHTML('beforeend', `<option value="${ct}">${ct}</option>`));
      city.insertAdjacentHTML('beforeend', `<option value="Other">Other</option>`);
      city.style.display = "block";
    } else if (state.value === "Other") {
      otherFields.state.style.display = "block";
      otherFields.city.style.display = "block";
    }
  });

  if (city) city.addEventListener('change', () => {
    otherFields.city.style.display = (city.value === "Other") ? "block" : "none";
  });

  // -------------------------------
  // Geolocation capture (preserve original)
  // -------------------------------
  function captureLocation() {
    const latInput = document.getElementById("latitude") || document.createElement("input");
    const lonInput = document.getElementById("longitude") || document.createElement("input");
    latInput.type = "hidden"; latInput.id = "latitude"; latInput.name = "latitude";
    lonInput.type = "hidden"; lonInput.id = "longitude"; lonInput.name = "longitude";
    // append only if not already in DOM
    if (!document.getElementById("latitude")) form.appendChild(latInput);
    if (!document.getElementById("longitude")) form.appendChild(lonInput);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(pos => {
        latInput.value = pos.coords.latitude;
        lonInput.value = pos.coords.longitude;
        localStorage.setItem("lastLatitude", pos.coords.latitude);
        localStorage.setItem("lastLongitude", pos.coords.longitude);
      }, err => {
        if (localStorage.getItem("lastLatitude") && localStorage.getItem("lastLongitude")) {
          latInput.value = localStorage.getItem("lastLatitude");
          lonInput.value = localStorage.getItem("lastLongitude");
        } else {
          console.warn("Location capture failed:", err.message);
        }
      }, { enableHighAccuracy: true, timeout: 5000 });
    } else if (localStorage.getItem("lastLatitude") && localStorage.getItem("lastLongitude")) {
      latInput.value = localStorage.getItem("lastLatitude");
      lonInput.value = localStorage.getItem("lastLongitude");
    }
  }
  captureLocation();
  setInterval(captureLocation, 30000);

  // -------------------------------
  // Image conversion to base64 (no compression per request)
  // -------------------------------
  async function getImageBase64(input) {
    return new Promise((resolve, reject) => {
      if (!input) return resolve(null);
      if (input.files.length === 0) { resolve(null); return; }
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => resolve({ base64: reader.result.split(',')[1], name: file.name });
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // -------------------------------
  // Popup and ripple helpers
  // -------------------------------
  function showPopup(message, isError) {
    const popup = document.getElementById('formPopup');
    if (!popup) {
      alert(message); // fallback
      return;
    }
    popup.textContent = message;
    popup.classList.toggle('error', !!isError);
    popup.style.display = "block";
    // animate in/out: rely on CSS
    setTimeout(() => { popup.style.display = 'none'; }, 3000);
  }

  // Ripple effect for buttons (optimized)
  function addRippleEffect(e, button, success) {
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    // position relative to button
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    // style adjustments
    ripple.style.position = "absolute";
    ripple.style.transform = "translate(-50%, -50%)";
    ripple.style.pointerEvents = "none";
    ripple.style.width = ripple.style.height = "16px";
    ripple.style.borderRadius = "50%";
    ripple.style.background = success ? "rgba(40,167,69,0.18)" : "rgba(255,77,77,0.18)";
    ripple.style.transition = "width 420ms ease-out, height 420ms ease-out, opacity 420ms ease-out";
    ripple.style.opacity = "0.9";
    button.appendChild(ripple);

    // expand
    requestAnimationFrame(() => {
      ripple.style.width = ripple.style.height = Math.max(rect.width, rect.height) * 2 + "px";
      ripple.style.opacity = "0";
    });

    // cleanup
    setTimeout(() => { ripple.remove(); }, 500);
  }

  // -------------------------------
  // Theme toggle + sun/moon icons + haptics
  // - we dynamically add small grey sun & moon icons beside the switch
  // -------------------------------
  (function setupThemeToggle(){
    const toggleWrapper = document.querySelector('.theme-toggle');
    if(!toggleWrapper) return;

    // ensure checkbox exists
    let toggleInput = toggleWrapper.querySelector('input[type="checkbox"]');
    if(!toggleInput){
      toggleInput = document.createElement('input');
      toggleInput.type = 'checkbox';
      toggleInput.id = 'darkModeSwitch';
      toggleWrapper.appendChild(toggleInput);
    }

    // create icons (if not existing)
    if(!toggleWrapper.querySelector('.theme-icon-sun')){
      const sun = document.createElement('span');
      sun.className = 'theme-icon-sun';
      sun.setAttribute('aria-hidden','true');
      // simple SVG grey sun
      sun.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3" stroke="#9aa0a6" stroke-width="1.2"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="#9aa0a6" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      toggleWrapper.insertBefore(sun, toggleWrapper.firstChild);
    }
    if(!toggleWrapper.querySelector('.theme-icon-moon')){
      const moon = document.createElement('span');
      moon.className = 'theme-icon-moon';
      moon.setAttribute('aria-hidden','true');
      moon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="#9aa0a6" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      toggleWrapper.appendChild(moon);
    }

    // respond to user preference stored in localStorage
    const root = document.documentElement;
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      root.setAttribute('data-theme', 'dark');
      toggleInput.checked = true;
    } else if (saved === 'light') {
      root.setAttribute('data-theme','light');
      toggleInput.checked = false;
    } else {
      // respect system by default
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.setAttribute('data-theme','dark'); toggleInput.checked = true;
      } else {
        root.setAttribute('data-theme','light'); toggleInput.checked = false;
      }
    }

    // haptic + toggle behavior
    toggleInput.addEventListener('change', () => {
      if (toggleInput.checked) {
        root.setAttribute('data-theme','dark');
        localStorage.setItem('theme','dark');
        // double short vibration to indicate dark mode
        if ('vibrate' in navigator) { navigator.vibrate([30, 40, 30]); }
      } else {
        root.setAttribute('data-theme','light');
        localStorage.setItem('theme','light');
        // single short vibration to indicate light mode
        if ('vibrate' in navigator) { navigator.vibrate(40); }
      }
    });
  })();

  // -------------------------------
  // Remarks textarea persistence fix
  // - ensures its floating label remains lifted when value present
  // - ensures it does not revert on blur if text exists
  // -------------------------------
  (function remarksFloatingFix(){
    const remarks = document.getElementById('remarks');
    if (!remarks) return;
    // on input keep container .filled
    const container = remarks.closest('.input-container');
    function sync() {
      setContainerFilledState(remarks);
      // add a class to show textarea is "persistent" when has content
      if (remarks.value && remarks.value.trim() !== "") {
        if (container) container.classList.add('filled');
      } else {
        if (container) container.classList.remove('filled');
      }
    }
    remarks.addEventListener('input', sync);
    remarks.addEventListener('blur', sync);
    // initial
    sync();
  })();

  // -------------------------------
  // Button UX improvements
  // - Smooth loading spinner
  // - Text changes: Submit -> Submitting… -> Successful
  // - Reusable helpers
  // -------------------------------
  function setButtonLoading(btn, isLoading, textWhenLoading = "Submitting\u2026") {
    if (!btn) return;
    if (isLoading) {
      btn.setAttribute('data-original-text', btn.textContent);
      btn.textContent = textWhenLoading;
      btn.classList.add('loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('loading');
      btn.disabled = false;
      const original = btn.getAttribute('data-original-text') || 'Submit';
      btn.textContent = original;
      btn.removeAttribute('data-original-text');
    }
  }

  function setButtonSuccess(btn, text = "Successful") {
    if (!btn) return;
    btn.classList.add('success');
    btn.textContent = text;
    btn.disabled = true;
    // gentle bounce via class removal later
    setTimeout(() => {
      btn.classList.remove('success');
      // restore default text after a short delay
      setTimeout(() => {
        const original = btn.getAttribute('data-original-text') || 'Submit';
        btn.textContent = original;
        btn.disabled = false;
      }, 1600);
    }, 700);
  }

  // -------------------------------
  // Drag & Drop / Camera hooks (basic)
  // - Provides drop area behavior for visiting card inputs
  // - Supports fallback to regular file input
  // - You can style .drop-area in CSS to show a nicer box
  // -------------------------------
  (function setupDropAreas(){
    // create optional drop areas next to file inputs if needed
    const fileIds = ['vcFront','vcBack'];
    fileIds.forEach(id => {
      const input = document.getElementById(id);
      if (!input) return;
      const container = input.closest('.input-container') || input.parentElement;
      // create drop area element if not present
      let drop = container.querySelector('.drop-area');
      if (!drop) {
        drop = document.createElement('div');
        drop.className = 'drop-area';
        drop.style.minHeight = '40px';
        drop.style.display = 'flex';
        drop.style.alignItems = 'center';
        drop.style.justifyContent = 'center';
        drop.style.marginTop = '8px';
        drop.style.border = '1px dashed rgba(0,0,0,0.08)';
        drop.style.borderRadius = '8px';
        drop.style.padding = '8px';
        drop.textContent = 'Drag & drop or tap to choose image';
        container.appendChild(drop);
      }

      // clicking drop area opens file picker
      drop.addEventListener('click', () => input.click());

      // drag events
      drop.addEventListener('dragover', (ev) => {
        ev.preventDefault();
        drop.style.borderColor = 'rgba(0,123,255,0.6)';
        drop.style.background = 'rgba(0,123,255,0.03)';
      });
      drop.addEventListener('dragleave', () => {
        drop.style.borderColor = 'rgba(0,0,0,0.08)';
        drop.style.background = 'transparent';
      });
      drop.addEventListener('drop', (ev) => {
        ev.preventDefault();
        drop.style.borderColor = 'rgba(0,0,0,0.08)';
        drop.style.background = 'transparent';
        const files = ev.dataTransfer.files;
        if (files && files.length) {
          // assign to input's files via DataTransfer (works in many modern browsers)
          try {
            const dt = new DataTransfer();
            dt.items.add(files[0]);
            input.files = dt.files;
            // update container/persistence state
            setContainerFilledState(input);
          } catch (err) {
            // fallback: we cannot assign; show instruction
            console.warn("Drop fallback:", err);
          }
        }
      });

      // camera capture on mobile
      // ensure input accepts capture (HTML attribute on input: accept="image/*" capture)
      // no extra JS needed; we just allow the input to be used.
    });
  })();

  // -------------------------------
  // Form submission handler
  // - Uses improved button UX
  // - Saves offline when offline or error
  // - Avoids duplicate offline saves
  // - Triggers haptic on success
  // -------------------------------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]') || document.querySelector('button.submit-btn');

    // UX: set loading
    setButtonLoading(submitBtn, true, "Submitting\u2026");

    // Collect images (base64)
    let vcFront = null, vcBack = null;
    try {
      vcFront = await getImageBase64(document.getElementById('vcFront'));
    } catch (err) {
      console.warn('vcFront read error', err);
    }
    try {
      vcBack = await getImageBase64(document.getElementById('vcBack'));
    } catch (err) {
      console.warn('vcBack read error', err);
    }

    // Build FormData
    const formData = new FormData(form);
    if (vcFront) { formData.append('vcFrontBase64', vcFront.base64); formData.append('vcFrontName', vcFront.name); }
    if (vcBack)  { formData.append('vcBackBase64', vcBack.base64);  formData.append('vcBackName', vcBack.name); }

    // Build plain data for offline storage
    const plainData = {};
    formData.forEach((val, key) => plainData[key] = val);

    // Submit online if possible
    if (navigator.onLine) {
      try {
        const res = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const text = await res.text();
        setButtonLoading(submitBtn, false);

        if (text && text.includes("SUCCESS")) {
          // Success UI
          setButtonSuccess(submitBtn, "Successful");
          showPopup("✅ Form submitted successfully!", false);
          // haptic feedback
          if ('vibrate' in navigator) navigator.vibrate(50);
          // reset form
          form.reset();
          // clear filled states for all containers
          form.querySelectorAll('.input-container').forEach(c => c.classList.remove('filled'));
        } else {
          // Server responded but not success -> save offline and inform user
          saveOffline({ data: plainData, timestamp: Date.now() });
          setButtonLoading(submitBtn, false);
          showPopup("❌ Submission failed – saved offline.", true);
        }
      } catch (err) {
        // Network or other error -> save offline
        console.error("Submit error:", err);
        saveOffline({ data: plainData, timestamp: Date.now() });
        setButtonLoading(submitBtn, false);
        showPopup("⚠️ Submission error – saved offline.", true);
      }
    } else {
      // Offline: save and inform
      saveOffline({ data: plainData, timestamp: Date.now() });
      setButtonLoading(submitBtn, false);
      showPopup("📩 You are offline — form saved and will auto-submit later.", false);
      // Reset form and visual states; keep remark filled persistence handled elsewhere
      form.reset();
      form.querySelectorAll('.input-container').forEach(c => c.classList.remove('filled'));
    }

    // After any submission action, attempt a background sync (if online)
    if (navigator.onLine) tryResendData();
  });

  // -------------------------------
  // Initial DOM sync: ensure floating labels updated
  // -------------------------------
  if (country && country.value === "India") {
    populateStates();
    state.style.display = "block";
    city.style.display = "block";
  }
  // dispatch input to set initial glow/fill states
  form.querySelectorAll('input,select,textarea').forEach(input => input.dispatchEvent(new Event('input')));

  // -------------------------------
  // Extra improvement: beforeunload guard to avoid accidental navigation while syncing
  // -------------------------------
  window.addEventListener('beforeunload', (ev) => {
    if (_syncInProgress) {
      ev.preventDefault();
      ev.returnValue = "Sync in progress. Are you sure you want to leave?";
    }
  });

  // -------------------------------
  // Debug helper (expose some methods in window for console experimentation)
  // -------------------------------
  window.__visitorForm = {
    dbName: DB_NAME,
    storeName: STORE_NAME,
    forceSync: tryResendData,
    saveOfflineRaw: (data) => saveOffline({ data, timestamp: Date.now() }),
    listOffline: async () => {
      return new Promise((resolve, reject) => {
        if (!db) return resolve([]);
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const getAll = store.getAll();
        getAll.onsuccess = () => resolve(getAll.result || []);
        getAll.onerror = e => reject(e);
      });
    }
  };

  // final log
  console.info("Visitor form script loaded. IndexedDB ready:", !!db);

}); // end DOMContentLoaded
