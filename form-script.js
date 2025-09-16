/* =========================================================================
   Visitor Form script.js  — Fully-updated long version (700+ lines)
   - Offline-first using IndexedDB
   - Duplicate prevention
   - Improved submit button UX (ripple, loading, success text)
   - Haptic feedback on theme toggle & success
   - Floating label persistence for textarea (remarks)
   - iOS-style sun & moon icons that rotate/transition on toggle
   - Preserves all states/cities/countries data and original logic
   - Drag & drop removed (no drop handling)
   - No image compression (as requested)
   - Website auto-format (www. ... .com) while typing
   - India phone minimum length validation (>= 10 digits) with red glow and submit-block
   - Dynamic meta theme-color update
   - Lots of comments and helper utilities for readability
   ========================================================================= */

document.addEventListener('DOMContentLoaded', async () => {
  // ========================================================================
  // CONFIGURATION & DOM references
  // ========================================================================
  const form = document.getElementById('customerForm');
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxpduRNvWMK9FvaSiEKOh36Dp08bCefcAIPTXs0j-kcEW54aGaDXIw2e77aYO1_R2NagQ/exec";

  // Fields that can have "Other" input elements
  const fields = ["designation", "country", "state", "city", "business"];
  const otherFields = {
    designation: document.getElementById('designationOther'),
    country: document.getElementById('countryOther'),
    state: document.getElementById('stateOther'),
    city: document.getElementById('cityOther'),
    business: document.getElementById('businessOther')
  };

  // Keep some UI references handy
  const popupEl = document.getElementById('formPopup');
  const phoneInput = document.getElementById('phone');
  const remarksEl = document.getElementById('remarks');

  // Website input (we'll add support - if it doesn't exist in your HTML, you can add later)
  // We'll attempt to find it; if not found we create one dynamically at the end of the form (non-intrusive)
  let websiteInput = document.getElementById('website'); // optional, might not exist in current HTML

  // Theme toggle input reference (we'll create or find)
  let toggle = document.querySelector('.theme-toggle input[type="checkbox"]');

  // ========================================================================
  // INDEXEDDB SETUP (VisitorFormDB)
  // ========================================================================
  let db = null;
  const DB_NAME = 'VisitorFormDB';
  const STORE_NAME = 'submissions';
  let _syncInProgress = false; // avoids simultaneous sync attempts

  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = evt => {
    db = evt.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
    }
  };
  request.onsuccess = evt => {
    db = evt.target.result;
    // Try to resend queued items (if online)
    tryResendData();
  };
  request.onerror = evt => {
    console.error("IndexedDB open error:", evt);
  };

  // ========================================================================
  // UTILITIES
  // ========================================================================
  // stable stringify (sort keys) for deduplication
  function stableStringify(obj) {
    try {
      const keys = Object.keys(obj).sort();
      const sorted = {};
      keys.forEach(k => sorted[k] = obj[k]);
      return JSON.stringify(sorted);
    } catch (err) {
      return JSON.stringify(obj);
    }
  }

  // tiny safe vibrate wrapper
  function vibrate(pattern) {
    if ('vibrate' in navigator) {
      try { navigator.vibrate(pattern); } catch (e) { /* ignore */ }
    }
  }

  // small delay
  function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  // simple logger wrapper (centralized)
  function log(...args) {
    if (window.console) console.log(...args);
  }

  // ========================================================================
  // OFFLINE SAVE (deduplicated)
  // ========================================================================
  function saveOffline(data) {
    if (!db) {
      console.warn("IndexedDB not ready — cannot save offline.");
      return;
    }
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const getAll = store.getAll();
      getAll.onsuccess = () => {
        const records = getAll.result || [];
        const hash = stableStringify(data);
        const exists = records.some(r => stableStringify(r.data) === hash);
        if (!exists) {
          store.add({ data, timestamp: Date.now() });
          log("Saved offline (unique).");
        } else {
          log("Duplicate offline — not saved.");
        }
      };
      getAll.onerror = err => {
        console.error("Error checking duplicates", err);
        try { store.add({ data, timestamp: Date.now() }); } catch (e) { console.error(e); }
      };
    } catch (ex) {
      console.error("saveOffline failed", ex);
    }
  }

  // ========================================================================
  // SYNC QUEUED DATA WHEN ONLINE
  // ========================================================================
  async function tryResendData() {
    if (!navigator.onLine || !db) return;
    if (_syncInProgress) { log("Sync already running. Skipping another invocation."); return; }
    _syncInProgress = true;

    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const getAll = store.getAll();

      getAll.onsuccess = async () => {
        const rows = getAll.result || [];
        if (!rows.length) { _syncInProgress = false; return; }

        // unique by content
        const unique = new Map();
        for (const r of rows) {
          const h = stableStringify(r.data);
          if (!unique.has(h)) unique.set(h, r);
        }

        const sendList = Array.from(unique.values()).sort((a, b) => a.timestamp - b.timestamp);

        for (const rec of sendList) {
          try {
            const fd = new FormData();
            for (let k in rec.data) fd.append(k, rec.data[k]);

            const res = await fetch(SCRIPT_URL, { method: "POST", body: fd });
            const text = await res.text();
            if (text && text.includes("SUCCESS")) {
              store.delete(rec.id);
              showPopup("✅ Offline submission synced!", false);
              vibrate(30);
              log("Deleted offline record id:", rec.id);
              await delay(160);
            } else {
              console.warn("Server didn't acknowledge success for queued id", rec.id, text);
            }
          } catch (err) {
            console.error("Failed to resend queued id:", rec.id, err);
            // keep record for next time
          }
        }

        _syncInProgress = false;
      };

      getAll.onerror = err => {
        console.error("Error reading queued store:", err);
        _syncInProgress = false;
      };
    } catch (outerErr) {
      console.error("tryResendData outer error:", outerErr);
      _syncInProgress = false;
    }
  }

  window.addEventListener('online', tryResendData);

  // ========================================================================
  // FLOATING LABEL + CONTAINER 'filled' STATE HELPERS
  // - ensures label lifts when element has content
  // - ensures green glow on focus (and green glow when filled)
  // - ensures red glow for invalid phone (India < 10 digits)
  // ========================================================================
  function setContainerFilledState(el) {
    if (!el) return;
    const container = el.closest('.input-container');
    if (!container) return;

    // For file inputs, filled when file chosen
    if (el.type === 'file') {
      container.classList.toggle('filled', el.files && el.files.length > 0);
      return;
    }

    // For selects and inputs/textareas
    const val = (el.tagName.toLowerCase() === 'select') ? el.value : (el.value || "");
    const hasValue = val.toString().trim() !== "";

    container.classList.toggle('filled', hasValue);

    // Also toggle green glow if focused or filled (except phone which has special validation)
    // We'll add a separate focus handler to show green glow during focus.
  }

  // Add event listeners to all inputs/selects/textareas for fill/focus/blur behavior
  function attachInputHandlers(root = document) {
    const inputs = root.querySelectorAll('input, select, textarea');

    inputs.forEach(inp => {
      // prevent adding handlers multiple times
      if (inp.__visitorHandlersAttached) return;
      inp.__visitorHandlersAttached = true;

      // initial filled state
      setContainerFilledState(inp);

      // input event: update filled state & green glow
      inp.addEventListener('input', (ev) => {
        // sanitize name and phone as earlier
        try {
          if (inp.id === "name") inp.value = inp.value.replace(/[^a-zA-Z\s]/g, '');
          if (inp.id === "phone") inp.value = inp.value.replace(/[^\d+]/g, '');
        } catch (e) { /* ignore */ }

        // set filled
        setContainerFilledState(inp);

        // green glow for non-invalid fields
        if (inp.id === 'phone') {
          // phone has special validation when Country = India
          handlePhoneValidation(inp);
        } else {
          // For other fields: add glow-success if there's content
          const isFilled = (inp.value && inp.value.toString().trim() !== "") || (inp.tagName.toLowerCase() === 'select' && inp.value !== "");
          if (isFilled) {
            inp.classList.add('glow-success');
            const cont = inp.closest('.input-container'); if (cont) cont.classList.add('filled');
          } else {
            inp.classList.remove('glow-success');
            const cont = inp.closest('.input-container'); if (cont) cont.classList.remove('filled');
          }
        }
      });

      // focus / blur handlers for nicer UX (green glow on focus)
      inp.addEventListener('focus', () => {
        // add green glow during focus (except phone invalid)
        if (inp.id !== 'phone') {
          inp.classList.add('glow-success');
        } else {
          // phone focus: if invalid, keep red glow; if valid or no-country-not-india, show green
          handlePhoneValidation(inp, { onFocus: true });
        }

        // ensure label moves up visually: some CSS rules use :focus + label but we toggle .filled on container as well
        setContainerFilledState(inp);
      });

      inp.addEventListener('blur', () => {
        // Remove focus-only glow unless field has content (then keep green)
        if (inp.id !== 'phone') {
          // on blur keep green only if filled
          const isFilled = (inp.value && inp.value.toString().trim() !== "") || (inp.tagName.toLowerCase() === 'select' && inp.value !== "");
          if (!isFilled) inp.classList.remove('glow-success');
          // keep container .filled state accurate
          setContainerFilledState(inp);
        } else {
          // phone blur: re-run validation and update glow accordingly
          handlePhoneValidation(inp, { onBlur: true });
        }
      });

      // For selects we also want to ensure label behavior is correct
      if (inp.tagName.toLowerCase() === 'select') {
        inp.addEventListener('change', () => setContainerFilledState(inp));
      }
    });
  }

  // attach handlers initially
  if (form) attachInputHandlers(form);

  // ========================================================================
  // PHONE VALIDATION (India-specific rules)
  // - if country === India, phone must be numeric and at least 10 digits
  // - shows red glow (error) until 10 digits
  // - prevents submission until valid; displays popup message
  // ========================================================================
  function getDigitsOnly(str) {
    if (!str) return "";
    return String(str).replace(/\D/g, '');
  }

  function isPhoneValidForIndia(value) {
    const digits = getDigitsOnly(value);
    // Allow optional leading country code like +91; but we only require that digits length (excluding leading country) >= 10
    // We'll consider last 10 or more digits; require at least 10 digits total
    return digits.length >= 10;
  }

  // handler updates phone glow and returns boolean valid
  function handlePhoneValidation(inputEl = phoneInput, options = {}) {
    if (!inputEl) return true;
    const countryVal = (country && country.value) ? country.value : "India";
    const digits = getDigitsOnly(inputEl.value || "");
    const container = inputEl.closest('.input-container');

    // Default: remove any error classes
    inputEl.classList.remove('error-glow');
    if (container) container.classList.remove('error');

    if (countryVal === "India") {
      // when India, require >=10 digits
      if (!isPhoneValidForIndia(inputEl.value)) {
        // show red glow until valid
        inputEl.classList.add('error-glow'); // css should style this as red
        if (container) container.classList.add('error');
        // ensure green glow removed
        inputEl.classList.remove('glow-success');
        // don't allow submit (we'll check during submit)
        return false;
      } else {
        // valid: show green glow & filled
        inputEl.classList.remove('error-glow');
        inputEl.classList.add('glow-success');
        if (container) {
          container.classList.add('filled');
          container.classList.remove('error');
        }
        return true;
      }
    } else {
      // For non-India we treat phone as optional/less strict; remove red glow
      inputEl.classList.remove('error-glow');
      if (container) container.classList.remove('error');
      // if some digits present, show green glow
      if (digits.length > 0) inputEl.classList.add('glow-success');
      return true;
    }
  }

  // Run phone validation on load & when its value changes
  if (phoneInput) {
    // initial check
    handlePhoneValidation(phoneInput);

    phoneInput.addEventListener('input', () => {
      // sanitize inside input handler above; now run validation
      handlePhoneValidation(phoneInput);
    });
  }

  // When country changes, re-check phone validation rules
  if (country) {
    country.addEventListener('change', () => {
      // if user selected not India, we may show the country name + city inputs (see next section)
      handleCountrySpecificUI(country.value);
      // re-validate phone because rule depends on country
      handlePhoneValidation(phoneInput);
    });
  }

  // ========================================================================
  // STATES & CITIES DATA (unchanged)
  // ========================================================================
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

  // ========================================================================
  // UI population helpers (countries & states)
  // ========================================================================
  function populateCountries() {
    const countries = ["India", "United States", "United Kingdom", "Canada", "Australia", "Other"];
    if (!country) return;
    country.innerHTML = "";
    countries.forEach(c => {
      country.insertAdjacentHTML('beforeend', `<option value="${c}" ${c === "India" ? "selected": ""}>${c}</option>`);
    });
  }
  populateCountries();

  function populateStates() {
    if (!state) return;
    state.innerHTML = '<option value="">Select State</option>';
    for (const st in statesAndCities) {
      state.insertAdjacentHTML('beforeend', `<option value="${st}">${st}</option>`);
    }
    state.insertAdjacentHTML('beforeend', `<option value="Other">Other</option>`);
  }

  // wire up otherFields toggles (preserve previous behavior)
  fields.forEach(f => {
    const el = document.getElementById(f);
    if (!el) return;
    el.addEventListener('change', () => {
      const showOther = document.getElementById(f).value === "Other";
      if (otherFields[f]) otherFields[f].style.display = showOther ? "block" : "none";
      if (otherFields[f]) setContainerFilledState(otherFields[f]);
    });
  });

  // When country changes: show/hide other fields and handle non-India special UI
  function handleCountrySpecificUI(countryValue) {
    // If countryValue is "India": show state & city selects as before
    if (!country) return;
    if (countryValue === "India") {
      populateStates();
      if (state) state.style.display = "block";
      if (city) city.style.display = "block";
      if (otherFields.country) otherFields.country.style.display = "none";
      if (otherFields.state) otherFields.state.style.display = "none";
      if (otherFields.city) otherFields.city.style.display = "none";
      if (city) city.innerHTML = '<option value="">Select City</option>';
    } else {
      // For non-India: show country input (so user can type full country name) and show city input (text)
      // The requirement: "when selected any other country than India two options must appear country name and city"
      // We'll show a text input for country and a text input for city (instead of selects)
      // 'countryOther' and 'cityOther' are the text inputs in your HTML; show them.
      if (otherFields.country) otherFields.country.style.display = "block"; // user-entered country name
      if (otherFields.city) otherFields.city.style.display = "block";       // user-entered city
      if (state) state.style.display = "none";
      if (city) city.style.display = "none";
      // Also ensure .filled class and input handlers attached
      if (otherFields.country) attachInputHandlersToSingle(otherFields.country);
      if (otherFields.city) attachInputHandlersToSingle(otherFields.city);
    }
  }

  // small helper to attach handlers to single dynamically shown elements (avoid reattaching to all)
  function attachInputHandlersToSingle(el) {
    if (!el) return;
    // mark not to reattach
    if (!el.__visitorHandlersAttached) {
      attachInputHandlers(el.parentElement || document);
    }
  }

  // state change populates city
  if (state) {
    state.addEventListener('change', () => {
      if (!city) return;
      city.innerHTML = '<option value="">Select City</option>';
      if (statesAndCities[state.value]) {
        statesAndCities[state.value].forEach(ct => city.insertAdjacentHTML('beforeend', `<option value="${ct}">${ct}</option>`));
        city.insertAdjacentHTML('beforeend', `<option value="Other">Other</option>`);
        city.style.display = "block";
      } else if (state.value === "Other") {
        if (otherFields.state) otherFields.state.style.display = "block";
        if (otherFields.city) otherFields.city.style.display = "block";
      }
    });
  }

  if (city) {
    city.addEventListener('change', () => {
      if (otherFields.city) otherFields.city.style.display = (city.value === "Other") ? "block" : "none";
    });
  }

  // ========================================================================
  // GEOLOCATION CAPTURE
  // ========================================================================
  function captureLocation() {
    const latInput = document.getElementById("latitude") || document.createElement("input");
    const lonInput = document.getElementById("longitude") || document.createElement("input");
    latInput.type = "hidden"; latInput.id = "latitude"; latInput.name = "latitude";
    lonInput.type = "hidden"; lonInput.id = "longitude"; lonInput.name = "longitude";
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
          console.warn("Location capture failed:", err && err.message ? err.message : err);
        }
      }, { enableHighAccuracy: true, timeout: 5000 });
    } else if (localStorage.getItem("lastLatitude") && localStorage.getItem("lastLongitude")) {
      latInput.value = localStorage.getItem("lastLatitude");
      lonInput.value = localStorage.getItem("lastLongitude");
    }
  }
  captureLocation();
  setInterval(captureLocation, 30000);

  // ========================================================================
  // IMAGE READ (NO COMPRESSION)
  // ========================================================================
  async function getImageBase64(input) {
    return new Promise((resolve, reject) => {
      if (!input) return resolve(null);
      try {
        if (!input.files || input.files.length === 0) { resolve(null); return; }
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          try { resolve({ base64: reader.result.split(',')[1], name: file.name }); }
          catch (e) { resolve({ base64: reader.result, name: file.name }); }
        };
        reader.onerror = err => reject(err);
        reader.readAsDataURL(file);
      } catch (err) {
        reject(err);
      }
    });
  }

  // ========================================================================
  // POPUP / RIPPLE / BUTTON HELPERS
  // ========================================================================
  function showPopup(message, isError) {
    if (!popupEl) { alert(message); return; }
    popupEl.textContent = message;
    popupEl.classList.toggle('error', !!isError);
    popupEl.style.display = "block";
    // hide after 3s
    setTimeout(() => { popupEl.style.display = 'none'; }, 3000);
  }

  // ripple: small and optimized
  function addRippleEffect(e, button, success) {
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const span = document.createElement('span');
    span.className = 'ripple';
    const x = (e && typeof e.clientX === 'number') ? (e.clientX - rect.left) : rect.width / 2;
    const y = (e && typeof e.clientY === 'number') ? (e.clientY - rect.top) : rect.height / 2;
    span.style.position = 'absolute';
    span.style.left = x + 'px';
    span.style.top = y + 'px';
    span.style.transform = 'translate(-50%,-50%)';
    span.style.pointerEvents = 'none';
    span.style.borderRadius = '50%';
    span.style.width = span.style.height = '14px';
    span.style.background = success ? 'rgba(40,167,69,0.18)' : 'rgba(255,77,77,0.18)';
    span.style.transition = 'all 420ms ease-out';
    button.appendChild(span);

    requestAnimationFrame(() => {
      span.style.width = span.style.height = Math.max(rect.width, rect.height) * 2 + 'px';
      span.style.opacity = '0';
    });

    setTimeout(() => { span.remove(); }, 520);
  }

  function setButtonLoading(btn, loading, loadingText = "Submitting…") {
    if (!btn) return;
    if (loading) {
      btn.dataset.origText = btn.textContent;
      btn.textContent = loadingText;
      btn.classList.add('loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('loading');
      btn.disabled = false;
      const orig = btn.dataset.origText || 'Submit';
      btn.textContent = orig;
      delete btn.dataset.origText;
    }
  }

  function setButtonSuccess(btn, successText = "Successful") {
    if (!btn) return;
    btn.classList.add('success');
    btn.disabled = true;
    btn.textContent = successText;
    vibrate(50);
    setTimeout(() => {
      btn.classList.remove('success');
      const orig = btn.dataset.origText || 'Submit';
      btn.textContent = orig;
      btn.disabled = false;
    }, 1800);
  }

  // ========================================================================
  // THEME TOGGLE SETUP (sun/moon icons, haptic, meta theme-color update)
  // ========================================================================
  (function setupThemeToggle() {
    const toggleWrapper = document.querySelector('.theme-toggle');
    if (!toggleWrapper) return;

    // ensure toggle input exists and is accessible via 'toggle'
    toggle = toggleWrapper.querySelector('input[type="checkbox"]');
    if (!toggle) {
      toggle = document.createElement('input');
      toggle.type = 'checkbox';
      toggle.id = 'darkModeSwitch';
      toggleWrapper.appendChild(toggle);
    }

    // create sun icon
    let sun = toggleWrapper.querySelector('.theme-icon-sun');
    if (!sun) {
      sun = document.createElement('span');
      sun.className = 'theme-icon-sun';
      sun.setAttribute('aria-hidden','true');
      sun.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3" stroke="#9aa0a6" stroke-width="1.2"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="#9aa0a6" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      toggleWrapper.insertBefore(sun, toggleWrapper.firstChild);
    }

    // create moon icon
    let moon = toggleWrapper.querySelector('.theme-icon-moon');
    if (!moon) {
      moon = document.createElement('span');
      moon.className = 'theme-icon-moon';
      moon.setAttribute('aria-hidden','true');
      moon.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="#9aa0a6" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      toggleWrapper.appendChild(moon);
    }

    // transitions & initial states
    sun.style.display = moon.style.display = 'inline-flex';
    sun.style.alignItems = moon.style.alignItems = 'center';
    sun.style.justifyContent = moon.style.justifyContent = 'center';
    sun.style.transition = moon.style.transition = 'transform 420ms cubic-bezier(.22,.9,.38,1), opacity 320ms ease';

    const root = document.documentElement;
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      root.setAttribute('data-theme', 'dark');
      toggle.checked = true;
      sun.style.opacity = '0';
      moon.style.opacity = '1';
      updateThemeColor('dark');
    } else if (saved === 'light') {
      root.setAttribute('data-theme', 'light');
      toggle.checked = false;
      sun.style.opacity = '1';
      moon.style.opacity = '0';
      updateThemeColor('light');
    } else {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.setAttribute('data-theme','dark');
        toggle.checked = true;
        moon.style.opacity = '1';
        sun.style.opacity = '0';
        updateThemeColor('dark');
      } else {
        root.setAttribute('data-theme','light');
        toggle.checked = false;
        sun.style.opacity = '1';
        moon.style.opacity = '0';
        updateThemeColor('light');
      }
    }

    // toggle handler
    toggle.addEventListener('change', () => {
      if (toggle.checked) {
        // animate sun -> moon
        sun.style.transform = 'rotate(-120deg) scale(0.6)';
        sun.style.opacity = '0';
        moon.style.transform = 'rotate(40deg) scale(1)';
        moon.style.opacity = '1';
        root.setAttribute('data-theme','dark');
        localStorage.setItem('theme','dark');
        updateThemeColor('dark');
        vibrate([20,30,20]);
      } else {
        moon.style.transform = 'rotate(120deg) scale(0.6)';
        moon.style.opacity = '0';
        sun.style.transform = 'rotate(-10deg) scale(1)';
        sun.style.opacity = '1';
        root.setAttribute('data-theme','light');
        localStorage.setItem('theme','light');
        updateThemeColor('light');
        vibrate(40);
      }
    });
  })();

  // ========================================================================
  // Update <meta name="theme-color"> dynamically
  // ========================================================================
  function updateThemeColor(theme) {
    const meta = document.querySelector("meta[name=theme-color]");
    if (!meta) return;
    if (theme === "dark") meta.setAttribute("content", "#121212");
    else meta.setAttribute("content", "#007bff");
  }

  // ========================================================================
  // REMARKS TEXTAREA PERSISTENCE FIX (floating label)
  // - Ensure label lifts on focus and stays lifted if text exists
  // ========================================================================
  (function remarksFix() {
    const remarks = remarksEl;
    if (!remarks) return;
    const container = remarks.closest('.input-container');

    function sync() {
      setContainerFilledState(remarks);
      if (remarks.value && remarks.value.trim() !== "") {
        if (container) container.classList.add('filled');
      } else {
        if (container) container.classList.remove('filled');
      }
    }

    remarks.addEventListener('input', sync);
    remarks.addEventListener('focus', () => {
      // lift label visually
      if (container) container.classList.add('filled');
    });
    remarks.addEventListener('blur', sync);
    sync();
  })();

  // ========================================================================
  // WEBSITE FIELD: auto-insert "www." prefix and ".com" suffix while typing
  // - live format: user types main portion; script ensures prefix & suffix present in value
  // - visible to user: we show value with prefix/suffix; cursor management tries to keep user editing middle part
  // ========================================================================
  (function setupWebsiteAutoFormat() {
    // If website input doesn't exist in HTML, add it at end of form before submit button
    if (!websiteInput && form) {
      // create container markup consistent with rest of form
      const container = document.createElement('div');
      container.className = 'input-container';
      container.style.marginTop = '8px';

      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'website';
      input.name = 'website';
      input.placeholder = ' ';
      input.autocomplete = 'off';

      const label = document.createElement('label');
      label.htmlFor = 'website';
      label.textContent = 'Website';

      container.appendChild(input);
      container.appendChild(label);

      // insert before submit button
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) form.insertBefore(container, submitBtn);
      websiteInput = document.getElementById('website');

      // attach handlers to new input
      attachInputHandlers(form);
    }

    if (!websiteInput) return;

    // Helper to ensure value has prefix and suffix
    function normalizeWebsiteValue(raw) {
      if (!raw) return 'www..com'; // fallback (shouldn't happen)
      // Remove existing prefix/suffix if user pasted a full URL
      let val = raw.trim();

      // Remove leading protocol
      val = val.replace(/^(https?:\/\/)?/i, '');

      // Remove leading www. if present, we'll re-add
      val = val.replace(/^www\./i, '');

      // Remove trailing slashes
      val = val.replace(/\/+$/g, '');

      // Remove trailing .com or other tld if present — we will append .com
      val = val.replace(/(\.com|\.in|\.net|\.org|\.co|\.io|\.app)\/?$/i, '');

      // Remove any spaces
      val = val.replace(/\s+/g, '');

      // Ensure only allowed characters in domain label portion (basic)
      val = val.replace(/[^a-zA-Z0-9\-\.]/g, '');

      // final ensure: not empty
      if (val.length === 0) return 'www..com';

      return `www.${val}.com`;
    }

    // Cursor management: keep the caret in the 'middle' editing area as best effort
    function setCaretToMiddle(el) {
      try {
        const len = el.value.length;
        // find start index of middle content (after 'www.')
        const prefix = 'www.';
        const suffix = '.com';
        const start = el.value.indexOf(prefix) >= 0 ? el.value.indexOf(prefix) + prefix.length : 0;
        const end = el.value.lastIndexOf(suffix) >= 0 ? el.value.lastIndexOf(suffix) : len;
        // place caret near start (user edits middle)
        const pos = Math.min(Math.max(start, Math.floor((start + end) / 2)), len);
        el.setSelectionRange(pos, pos);
      } catch (e) { /* non-fatal */ }
    }

    // Input handler: live format as user types
    let isComposing = false;
    websiteInput.addEventListener('compositionstart', () => { isComposing = true; });
    websiteInput.addEventListener('compositionend', () => { isComposing = false; });

    websiteInput.addEventListener('input', (ev) => {
      if (isComposing) return; // don't interfere with IME
      const raw = websiteInput.value || '';
      // Determine where the user is editing: if they haven't touched prefix/suffix, we helpfully add them
      const normalized = normalizeWebsiteValue(raw);
      // If normalized equals current, no change
      if (normalized === websiteInput.value) {
        // still ensure container filled classes
        setContainerFilledState(websiteInput);
        return;
      }
      // Replace value and attempt to keep caret in middle
      const prevSelectionStart = websiteInput.selectionStart;
      websiteInput.value = normalized;
      setContainerFilledState(websiteInput);
      // Try to move caret sensibly
      setTimeout(() => setCaretToMiddle(websiteInput), 0);
    });

    // On focus ensure caret in middle
    websiteInput.addEventListener('focus', () => setCaretToMiddle(websiteInput));
    websiteInput.addEventListener('blur', () => {
      // On blur ensure final normalization
      websiteInput.value = normalizeWebsiteValue(websiteInput.value || '');
      setContainerFilledState(websiteInput);
    });
  })();

  // ========================================================================
  // FORM SUBMISSION FLOW
  // - preserves original logic but blocks submit if (India & phone < 10 digits)
  // - improved button UX (loading/success)
  // ========================================================================
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();

    // Validate phone for India
    if (country && country.value === 'India' && phoneInput) {
      if (!isPhoneValidForIndia(phoneInput.value)) {
        // Show error and prevent submission
        handlePhoneValidation(phoneInput);
        showPopup("❌ Phone number must be at least 10 digits for India.", true);
        vibrate([30, 20]);
        return;
      }
    }

    // Proceed with submission logic (same as before)
    const submitBtn = form.querySelector('button[type="submit"]') || document.querySelector('button.submit-btn');
    setButtonLoading(submitBtn, true, "Submitting…");

    // Read images
    let vcFront = null, vcBack = null;
    try { vcFront = await getImageBase64(document.getElementById('vcFront')); } catch (e) { console.warn("vcFront error", e); }
    try { vcBack = await getImageBase64(document.getElementById('vcBack')); } catch (e) { console.warn("vcBack error", e); }

    // Build FormData
    const formData = new FormData(form);
    if (vcFront) { formData.append('vcFrontBase64', vcFront.base64); formData.append('vcFrontName', vcFront.name); }
    if (vcBack) { formData.append('vcBackBase64', vcBack.base64); formData.append('vcBackName', vcBack.name); }

    // Plain object for offline dedup
    const plainData = {};
    formData.forEach((v, k) => plainData[k] = v);

    // Try to submit online
    if (navigator.onLine) {
      try {
        const res = await fetch(SCRIPT_URL, { method: "POST", body: formData });
        const text = await res.text();
        setButtonLoading(submitBtn, false);

        if (text && text.includes("SUCCESS")) {
          setButtonSuccess(submitBtn, "Successful");
          showPopup("✅ Form submitted successfully!", false);
          vibrate(60);
          await delay(700);
          form.reset();
          // Clear filled states
          form.querySelectorAll('.input-container').forEach(c => c.classList.remove('filled'));
          // Re-attach handlers for new empty inputs (if any)
          attachInputHandlers(form);
        } else {
          saveOffline({ data: plainData, timestamp: Date.now() });
          showPopup("❌ Submission failed — saved offline.", true);
          vibrate([30, 20]);
        }
      } catch (err) {
        console.error("Submit failed", err);
        saveOffline({ data: plainData, timestamp: Date.now() });
        setButtonLoading(submitBtn, false);
        showPopup("⚠️ Submission error — saved offline.", true);
        vibrate([30, 20, 10]);
      }
    } else {
      // offline
      saveOffline({ data: plainData, timestamp: Date.now() });
      setButtonLoading(submitBtn, false);
      showPopup("📩 Offline — saved and will auto-submit later.", false);
      form.reset();
      form.querySelectorAll('.input-container').forEach(c => c.classList.remove('filled'));
      vibrate(40);
    }

    // Try to resend queued if now online
    if (navigator.onLine) tryResendData();
  });

  // ========================================================================
  // INITIAL UI SYNC (run once at load)
  // ========================================================================
  // If country initially India, populate states
  if (country && country.value === "India") {
    populateStates();
    if (state) state.style.display = "block";
    if (city) city.style.display = "block";
  } else if (country) {
    handleCountrySpecificUI(country.value);
  }

  // Ensure initial filled states
  if (form) form.querySelectorAll('input,select,textarea').forEach(i => i.dispatchEvent(new Event('input')));

  // ========================================================================
  // HELPERS & DEV ACCESSORS
  // ========================================================================
  window.__visitorForm = {
    dbName: DB_NAME,
    storeName: STORE_NAME,
    forceSync: tryResendData,
    listQueued: async () => {
      return new Promise((resolve, reject) => {
        if (!db) return resolve([]);
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = e => reject(e);
      });
    },
    clearQueued: async () => {
      return new Promise((resolve, reject) => {
        if (!db) return resolve(false);
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve(true);
        req.onerror = e => reject(e);
      });
    }
  };

  // Warn user if trying to leave while sync in progress
  window.addEventListener('beforeunload', (e) => {
    if (_syncInProgress) {
      e.preventDefault();
      e.returnValue = "Sync in progress. Leaving may interrupt uploads. Continue?";
      return e.returnValue;
    }
  });

  // Final debug log
  console.info("Visitor Form script loaded — IndexedDB ready:", !!db);

}); // DOMContentLoaded

/* =========================================================================
   End of script.js
   ========================================================================= */
