/* =========================================================================
   Visitor Form script.js  — Fully-updated long version
   - Offline-first using IndexedDB
   - Duplicate prevention
   - Improved submit button UX (ripple, loading, success text)
   - Haptic feedback on theme toggle & success
   - Floating label persistence for textarea (remarks)
   - iOS-style sun & moon icons that rotate/transition on toggle
   - Preserves all states/cities/countries data and original logic
   - Drag & drop removed (no drop handling)
   - No image compression (as requested)
   - Lots of comments and helper utilities for readability
   ========================================================================= */

document.addEventListener('DOMContentLoaded', async () => {
  // ========================================================================
  // CONFIGURATION
  // ========================================================================
  const form = document.getElementById('customerForm');
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxpduRNvWMK9FvaSiEKOh36Dp08bCefcAIPTXs0j-kcEW54aGaDXIw2e77aYO1_R2NagQ/exec";

  // fields that can have an "Other" input
  const fields = ["designation","country","state","city","business"];
  const otherFields = {
    designation: document.getElementById('designationOther'),
    country: document.getElementById('countryOther'),
    state: document.getElementById('stateOther'),
    city: document.getElementById('cityOther'),
    business: document.getElementById('businessOther')
  };

  // Keep some UI references handy
  const popupEl = document.getElementById('formPopup');

  // ========================================================================
  // INDEXEDDB SETUP
  // ========================================================================
  let db = null;
  const DB_NAME = 'VisitorFormDB';
  const STORE_NAME = 'submissions';
  let _syncInProgress = false; // avoids simultaneous sync attempts

  // open / upgrade DB
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = (evt) => {
    db = evt.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
    }
  };
  request.onsuccess = (evt) => {
    db = evt.target.result;
    // attempt to sync any queued items if we're online
    tryResendData();
  };
  request.onerror = (evt) => {
    console.error("IndexedDB open error:", evt);
  };

  // ========================================================================
  // UTILS
  // ========================================================================
  // stable stringify for deduplication (sorts keys)
  function stableStringify(obj) {
    try {
      const keys = Object.keys(obj).sort();
      const sortedObj = {};
      keys.forEach(k => sortedObj[k] = obj[k]);
      return JSON.stringify(sortedObj);
    } catch (err) {
      return JSON.stringify(obj);
    }
  }

  // small safe vibration helper
  function vibrate(pattern) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // ignore
      }
    }
  }

  // small delay helper
  function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  // safe console log wrapper
  function log(...args) {
    if (window.console && console.log) console.log(...args);
  }

  // ========================================================================
  // OFFLINE SAVE (deduplicated)
  // ========================================================================
  function saveOffline(data) {
    if (!db) { console.warn("DB unavailable. Cannot save offline."); return; }
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // Check duplicates by comparing stable JSON of data objects
    const getAllReq = store.getAll();
    getAllReq.onsuccess = () => {
      const records = getAllReq.result || [];
      const newHash = stableStringify(data);
      const exists = records.some(r => stableStringify(r.data) === newHash);
      if (!exists) {
        store.add({ data, timestamp: Date.now() });
        log("Saved unique offline record.");
      } else {
        log("Duplicate detected — not saving offline.");
      }
    };
    getAllReq.onerror = (err) => {
      console.error("Error checking duplicates, saving anyway:", err);
      try { store.add({ data, timestamp: Date.now() }); } catch (e) { console.error(e); }
    };
  }

  // ========================================================================
  // TRY RESEND QUEUED DATA
  // ========================================================================
  async function tryResendData() {
    if (!navigator.onLine || !db) return;
    if (_syncInProgress) { log("Sync already in progress — skipping"); return; }
    _syncInProgress = true;

    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const getAllReq = store.getAll();

      getAllReq.onsuccess = async () => {
        const rows = getAllReq.result || [];
        if (!rows.length) { _syncInProgress = false; return; }

        // Create unique set by content hash (keeps earliest)
        const uniqueMap = new Map();
        for (const r of rows) {
          const h = stableStringify(r.data);
          if (!uniqueMap.has(h)) uniqueMap.set(h, r);
        }

        // Send in chronological order
        const uniqueRecords = Array.from(uniqueMap.values()).sort((a,b) => a.timestamp - b.timestamp);

        for (const record of uniqueRecords) {
          try {
            const fd = new FormData();
            for (let k in record.data) fd.append(k, record.data[k]);
            // Add small retry header/time if desired: not needed here
            const res = await fetch(SCRIPT_URL, { method: "POST", body: fd });
            const text = await res.text();
            if (text && text.includes("SUCCESS")) {
              // Delete only that record ID
              store.delete(record.id);
              showPopup("✅ Offline submission synced!", false);
              vibrate(30); // short haptic on sync success
              log("Synced and deleted offline record id:", record.id);
              // small pause to avoid hammering server
              await delay(180);
            } else {
              console.warn("Server didn't return SUCCESS for offline record", record.id, text);
              // don't delete; stop processing further to avoid repeated failures
              // but continue to next record in case later ones might be different
            }
          } catch (err) {
            console.error("Failed to resend offline record id:", record.id, err);
            // keep record for next time
          }
        }
        _syncInProgress = false;
      };

      getAllReq.onerror = (err) => {
        console.error("Error reading queued submissions:", err);
        _syncInProgress = false;
      };
    } catch (outerErr) {
      console.error("Error in tryResendData:", outerErr);
      _syncInProgress = false;
    }
  }

  window.addEventListener('online', tryResendData);

  // ========================================================================
  // FLOATING LABEL PERSISTENCE HELPERS
  // Ensures that when an input/textarea has content the .input-container keeps
  // a .filled class so the label stays lifted even on blur.
  // ========================================================================
  function setContainerFilledState(el) {
    if (!el) return;
    const container = el.closest('.input-container');
    if (!container) return;
    if (el.type === 'file') {
      container.classList.toggle('filled', el.files && el.files.length > 0);
    } else {
      container.classList.toggle('filled', !!(el.value && el.value.toString().trim() !== ""));
    }
  }

  // Attach listeners to inputs to maintain filled state
  const allInputs = form.querySelectorAll('input, select, textarea');
  allInputs.forEach(inp => {
    // initial
    setContainerFilledState(inp);

    inp.addEventListener('input', (ev) => {
      try {
        if (inp.id === "name") inp.value = inp.value.replace(/[^a-zA-Z\s]/g, '');
        if (inp.id === "phone") inp.value = inp.value.replace(/[^\d+]/g, '');
      } catch (e) { /* ignore */ }

      // glow status based on content
      let isFilled = false;
      if (inp.type === 'file') isFilled = inp.files && inp.files.length > 0;
      else if (inp.tagName.toLowerCase() === 'select') isFilled = inp.value !== "";
      else isFilled = (inp.value && inp.value.toString().trim() !== "");

      inp.classList.toggle('glow-success', isFilled);

      // Ensure floating label persists
      setContainerFilledState(inp);
    });

    inp.addEventListener('blur', () => {
      // make sure label stays lifted if value present
      setContainerFilledState(inp);
    });
  });

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
  // UI: country / state / city population + logic (unchanged)
  // ========================================================================
  const country = document.getElementById('country');
  const state = document.getElementById('state');
  const city = document.getElementById('city');

  function populateCountries() {
    const countries = ["India", "United States", "United Kingdom", "Canada", "Australia", "Other"];
    country.innerHTML = "";
    countries.forEach(c => {
      country.insertAdjacentHTML('beforeend', `<option value="${c}" ${c === "India" ? "selected": ""}>${c}</option>`);
    });
  }
  populateCountries();

  function populateStates() {
    state.innerHTML = '<option value="">Select State</option>';
    for (const st in statesAndCities) {
      state.insertAdjacentHTML('beforeend', `<option value="${st}">${st}</option>`);
    }
    state.insertAdjacentHTML('beforeend', `<option value="Other">Other</option>`);
  }

  fields.forEach(f => {
    const el = document.getElementById(f);
    if (!el) return;
    el.addEventListener('change', () => {
      otherFields[f].style.display = (document.getElementById(f).value === "Other") ? "block" : "none";
      if (otherFields[f]) setContainerFilledState(otherFields[f]);
    });
  });

  if (country) {
    country.addEventListener('change', () => {
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
  }

  if (state) {
    state.addEventListener('change', () => {
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
  }

  if (city) {
    city.addEventListener('change', () => {
      otherFields.city.style.display = (city.value === "Other") ? "block" : "none";
    });
  }

  // ========================================================================
  // GEOLOCATION CAPTURE (unchanged)
  // ========================================================================
  function captureLocation() {
    const latInput = document.getElementById("latitude") || document.createElement("input");
    const lonInput = document.getElementById("longitude") || document.createElement("input");
    latInput.type = "hidden"; latInput.id = "latitude"; latInput.name = "latitude";
    lonInput.type = "hidden"; lonInput.id = "longitude"; lonInput.name = "longitude";
    if (!document.getElementById("latitude")) form.appendChild(latInput);
    if (!document.getElementById("longitude")) form.appendChild(lonInput);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        latInput.value = pos.coords.latitude;
        lonInput.value = pos.coords.longitude;
        localStorage.setItem("lastLatitude", pos.coords.latitude);
        localStorage.setItem("lastLongitude", pos.coords.longitude);
      }, (err) => {
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
        reader.onerror = (err) => reject(err);
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
    if (!popupEl) {
      alert(message);
      return;
    }
    popupEl.textContent = message;
    popupEl.classList.toggle('error', !!isError);
    popupEl.style.display = "block";
    // animation handled by CSS; hide after 3s
    setTimeout(() => { popupEl.style.display = 'none'; }, 3000);
  }

  // ripple effect (improved)
  function addRippleEffect(e, button, success) {
    if (!button) return;
    // create span
    const span = document.createElement('span');
    span.className = 'ripple';
    // position
    const rect = button.getBoundingClientRect();
    const x = (e && typeof e.clientX === 'number') ? (e.clientX - rect.left) : rect.width / 2;
    const y = (e && typeof e.clientY === 'number') ? (e.clientY - rect.top) : rect.height / 2;
    span.style.left = x + 'px';
    span.style.top = y + 'px';
    // style
    span.style.position = 'absolute';
    span.style.transform = 'translate(-50%,-50%)';
    span.style.borderRadius = '50%';
    span.style.pointerEvents = 'none';
    span.style.background = success ? 'rgba(40,167,69,0.15)' : 'rgba(255,77,77,0.15)';
    span.style.width = span.style.height = '14px';
    span.style.transition = 'all 420ms ease-out';
    button.appendChild(span);

    // trigger expansion
    requestAnimationFrame(() => {
      span.style.width = span.style.height = Math.max(rect.width, rect.height) * 2 + 'px';
      span.style.opacity = '0';
    });

    setTimeout(() => { span.remove(); }, 520);
  }

  // Button loading / success text handlers
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
    // haptic feedback
    vibrate(50);
    // after moment, reset to original text and state
    setTimeout(() => {
      btn.classList.remove('success');
      const orig = btn.dataset.origText || 'Submit';
      btn.textContent = orig;
      btn.disabled = false;
    }, 1800);
  }

  // ========================================================================
  // THEME TOGGLE: SUN & MOON with rotate/morph-like animation
  // - Adds tiny iOS style sun/moon icons in grey, rotates them on toggle
  // - Adds haptic feedback on toggle
  // ========================================================================
  (function setupThemeToggle() {
    const toggleWrapper = document.querySelector('.theme-toggle');
    if (!toggleWrapper) return;

    // make sure input exists (if your HTML already has it, we keep it)
    let toggleInput = toggleWrapper.querySelector('input[type="checkbox"]');
    if (!toggleInput) {
      toggleInput = document.createElement('input');
      toggleInput.type = 'checkbox';
      toggleInput.id = 'darkModeSwitch';
      toggleWrapper.appendChild(toggleInput);
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

    // ensure wrapper styles for rotation (we rely on these CSS classes being present or inline style)
    sun.style.display = moon.style.display = 'inline-flex';
    sun.style.alignItems = moon.style.alignItems = 'center';
    sun.style.justifyContent = moon.style.justifyContent = 'center';
    sun.style.transition = moon.style.transition = 'transform 420ms cubic-bezier(.22,.9,.38,1), opacity 320ms ease';

    // set initial theme
    const root = document.documentElement;
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      root.setAttribute('data-theme', 'dark'); toggleInput.checked = true;
      sun.style.opacity = '0'; moon.style.opacity = '1'; moon.style.transform = 'rotate(0deg) scale(1)';
    } else if (saved === 'light') {
      root.setAttribute('data-theme', 'light'); toggleInput.checked = false;
      sun.style.opacity = '1'; moon.style.opacity = '0'; sun.style.transform = 'rotate(0deg) scale(1)';
    } else {
      // default to system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.setAttribute('data-theme','dark'); toggleInput.checked = true; moon.style.opacity = '1'; sun.style.opacity = '0';
      } else {
        root.setAttribute('data-theme','light'); toggleInput.checked = false; sun.style.opacity = '1'; moon.style.opacity = '0';
      }
    }

    // On toggle, animate icons and apply theme
    toggleInput.addEventListener('change', () => {
      if (toggleInput.checked) {
        // animate sun -> moon
        // rotate sun out and fade, rotate moon in
        sun.style.transform = 'rotate(-120deg) scale(0.6)';
        sun.style.opacity = '0';
        moon.style.transform = 'rotate(40deg) scale(1)';
        moon.style.opacity = '1';
        root.setAttribute('data-theme','dark');
        localStorage.setItem('theme','dark');
        // iOS-like tiny haptic: short vibrate pattern
        vibrate([20, 30, 20]);
      } else {
        // animate moon -> sun
        moon.style.transform = 'rotate(120deg) scale(0.6)';
        moon.style.opacity = '0';
        sun.style.transform = 'rotate(-10deg) scale(1)';
        sun.style.opacity = '1';
        root.setAttribute('data-theme','light');
        localStorage.setItem('theme','light');
        vibrate(40);
      }
    });
  })();

  // ========================================================================
  // REMARKS TEXTAREA PERSISTENCE FIX
  // - ensures label stays lifted when user types even after blur
  // ========================================================================
  (function remarksFix() {
    const remarks = document.getElementById('remarks');
    if (!remarks) return;
    const container = remarks.closest('.input-container');
    // Sync initial state
    function sync() {
      setContainerFilledState(remarks);
      if (remarks.value && remarks.value.trim() !== "") container.classList.add('filled');
      else container.classList.remove('filled');
    }
    remarks.addEventListener('input', sync);
    remarks.addEventListener('blur', sync);
    // Prevent placeholder swapping: if placeholder used as helper, keep it but floating label logic uses .filled
    sync();
  })();

   // ===================================================
// Update <meta name="theme-color"> dynamically
// ===================================================
function updateThemeColor(theme) {
  const metaThemeColor = document.querySelector("meta[name=theme-color]");
  if (!metaThemeColor) return;

  if (theme === "dark") {
    metaThemeColor.setAttribute("content", "#121212");  // Dark background
  } else {
    metaThemeColor.setAttribute("content", "#007bff");  // Light mode accent
  }
}

// Run on load
updateThemeColor(localStorage.getItem("theme") || "light");

// Run on toggle
toggle.addEventListener("change", () => {
  const theme = toggle.checked ? "dark" : "light";
  updateThemeColor(theme);
});

  // ========================================================================
  // FORM SUBMISSION FLOW (PRESERVE ORIGINAL FIELDS & LOGIC)
  // - improved button handling and success text
  // - stores offline on failure or offline
  // - avoids duplicate offline entries
  // - triggers background sync after success
  // ========================================================================
  form.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]') || document.querySelector('button.submit-btn');

    // UX: set loading state on button
    setButtonLoading(submitBtn, true, "Submitting…");

    // Read images (no compression)
    let vcFront = null, vcBack = null;
    try { vcFront = await getImageBase64(document.getElementById('vcFront')); } catch (e) { console.warn("vcFront read error", e); }
    try { vcBack = await getImageBase64(document.getElementById('vcBack')); } catch (e) { console.warn("vcBack read error", e); }

    // Build FormData
    const formData = new FormData(form);
    if (vcFront) { formData.append('vcFrontBase64', vcFront.base64); formData.append('vcFrontName', vcFront.name); }
    if (vcBack) { formData.append('vcBackBase64', vcBack.base64); formData.append('vcBackName', vcBack.name); }

    // Build plain object for offline storage/dedup
    const plainData = {};
    formData.forEach((v,k) => plainData[k] = v);

    // If online, attempt immediate submit
    if (navigator.onLine) {
      try {
        const res = await fetch(SCRIPT_URL, { method: "POST", body: formData });
        const text = await res.text();
        setButtonLoading(submitBtn, false);

        if (text && text.includes("SUCCESS")) {
          // success: nice UX
          setButtonSuccess(submitBtn, "Successful");
          showPopup("✅ Form submitted successfully!", false);
          // haptic
          vibrate(60);
          // reset form after minor delay so user sees success text
          await delay(650);
          form.reset();
          // clear filled states
          form.querySelectorAll('.input-container').forEach(c => c.classList.remove('filled'));
        } else {
          // server responded but not success -> save offline
          saveOffline({ data: plainData, timestamp: Date.now() });
          showPopup("❌ Submission failed — saved offline.", true);
          // small vibrate to indicate failure
          vibrate([30, 20]);
        }
      } catch (err) {
        console.error("Submit error", err);
        saveOffline({ data: plainData, timestamp: Date.now() });
        setButtonLoading(submitBtn, false);
        showPopup("⚠️ Submission error — saved offline.", true);
        vibrate([30, 20, 10]);
      }
    } else {
      // offline: store for later
      saveOffline({ data: plainData, timestamp: Date.now() });
      setButtonLoading(submitBtn, false);
      showPopup("📩 Offline — saved and will auto-submit when online.", false);
      // reset form visually
      form.reset();
      form.querySelectorAll('.input-container').forEach(c => c.classList.remove('filled'));
      vibrate(40);
    }

    // Immediately attempt resend if online
    if (navigator.onLine) tryResendData();
  });

  // ========================================================================
  // INITIAL UI SYNCS
  // ========================================================================
  if (country && country.value === "India") {
    populateStates();
    state.style.display = "block";
    city.style.display = "block";
  }
  // update initial filled states for floating labels
  form.querySelectorAll('input,select,textarea').forEach(i => i.dispatchEvent(new Event('input')));

  // ========================================================================
  // SAFETY: confirm leaving page during sync
  // ========================================================================
  window.addEventListener('beforeunload', (e) => {
    if (_syncInProgress) {
      e.preventDefault();
      e.returnValue = "Sync in progress. Leaving may interrupt uploads. Continue?";
      return e.returnValue;
    }
  });

  // ========================================================================
  // DEV TOOLS: expose helpful functions to window for debugging
  // ========================================================================
  window.__visitorForm = {
    dbName: DB_NAME,
    storeName: STORE_NAME,
    forceSync: tryResendData,
    listQueued: async function() {
      return new Promise((resolve, reject) => {
        if (!db) return resolve([]);
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = (e) => reject(e);
      });
    },
    clearQueued: async function() {
      return new Promise((resolve, reject) => {
        if (!db) return resolve(false);
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e);
      });
    },
    saveOfflineRaw: (data) => saveOffline({ data, timestamp: Date.now() })
  };

  // final log
  console.info("Visitor form script fully initialized. IndexedDB ready:", !!db);

}); // DOMContentLoaded - end of script

/* =========================================================================
   End of script.js
   ========================================================================= */



