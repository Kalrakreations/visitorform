/**
 * Visitor Form Full Script (600+ lines)
 * Features:
 * - Optimized animations
 * - Sun ↔ Moon iOS-style theme toggle with rotation
 * - Haptic feedback on theme change
 * - Ripple + loading submit button
 * - Submit button changes to "Successful" after form submission
 * - IndexedDB offline storage
 * - Geolocation auto-capture
 * - Optimized remarks label behavior
 */

// ------------------------------ GLOBAL SETUP ------------------------------

document.addEventListener('DOMContentLoaded', async () => {
  // --- Constants & Config ---
  const form = document.getElementById('customerForm');
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzUeEwhUrglj58LQ9D8eR5IzCaLgrSoqJF-AFsCZlXhD91HuQoPvi8Q04w5-R6N182Eag/exec";

  // Fields that have "Other" option
  const fields = ["designation", "country", "state", "city", "business"];
  const otherFields = {
    designation: document.getElementById("designationOther"),
    country: document.getElementById("countryOther"),
    state: document.getElementById("stateOther"),
    city: document.getElementById("cityOther"),
    business: document.getElementById("businessOther"),
  };

  // ------------------------------ INDEXEDDB ------------------------------
  let db;
  const request = indexedDB.open("VisitorFormDB", 1);
  request.onupgradeneeded = (e) => {
    db = e.target.result;
    db.createObjectStore("submissions", { keyPath: "id", autoIncrement: true });
  };
  request.onsuccess = (e) => {
    db = e.target.result;
    tryResendData();
  };
  request.onerror = (e) => console.error("IndexedDB error:", e);

  function saveOffline(data) {
    if (!db) return;
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
        if (!existingHashes.has(hash)) {
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

          if (text.includes("SUCCESS")) {
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

  // ------------------------------ VALIDATION ------------------------------
  form.querySelectorAll("input, select, textarea").forEach((input) => {
    input.addEventListener("input", () => {
      let isFilled = false;

      if (input.id === "name")
        input.value = input.value.replace(/[^a-zA-Z\s]/g, "");
      if (input.id === "phone")
        input.value = input.value.replace(/[^\d+]/g, "");

      if (
        ["text", "email", "tel", "textarea"].includes(input.type) ||
        input.tagName.toLowerCase() === "textarea"
      )
        isFilled = input.value.trim() !== "";
      if (input.tagName.toLowerCase() === "select") isFilled = input.value !== "";
      if (input.type === "file") isFilled = input.files.length > 0;

      input.classList.toggle("glow-success", isFilled);
    });
  });

  // ------------------------------ STATES & CITIES ------------------------------
  const statesAndCities = {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur"],
    Bihar: ["Patna", "Gaya", "Bhagalpur"],
    Delhi: ["New Delhi", "Dwarka", "Karol Bagh"],
    Maharashtra: ["Mumbai", "Pune", "Nagpur"],
    Rajasthan: ["Jaipur", "Jodhpur", "Udaipur"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi"],
  };

  const country = document.getElementById("country");
  const state = document.getElementById("state");
  const city = document.getElementById("city");

  function populateCountries() {
    const countries = [
      "India",
      "United States",
      "United Kingdom",
      "Canada",
      "Australia",
      "Other",
    ];
    country.innerHTML = "";
    countries.forEach((c) =>
      country.insertAdjacentHTML(
        "beforeend",
        `<option value="${c}" ${c === "India" ? "selected" : ""}>${c}</option>`
      )
    );
  }
  populateCountries();

  function populateStates() {
    state.innerHTML = '<option value="">Select State</option>';
    for (let st in statesAndCities)
      state.insertAdjacentHTML("beforeend", `<option value="${st}">${st}</option>`);
    state.insertAdjacentHTML("beforeend", `<option value="Other">Other</option>`);
  }

  fields.forEach((f) => {
    document.getElementById(f).addEventListener("change", () => {
      otherFields[f].style.display =
        document.getElementById(f).value === "Other" ? "block" : "none";
    });
  });

  country.addEventListener("change", () => {
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

  state.addEventListener("change", () => {
    city.innerHTML = '<option value="">Select City</option>';
    otherFields.city.style.display = "none";
    if (statesAndCities[state.value]) {
      statesAndCities[state.value].forEach((ct) =>
        city.insertAdjacentHTML("beforeend", `<option value="${ct}">${ct}</option>`)
      );
      city.insertAdjacentHTML("beforeend", `<option value="Other">Other</option>`);
      city.style.display = "block";
    } else if (state.value === "Other") {
      otherFields.state.style.display = "block";
      otherFields.city.style.display = "block";
    }
  });

  city.addEventListener(
    "change",
    () => (otherFields.city.style.display = city.value === "Other" ? "block" : "none")
  );

  // ------------------------------ LOCATION ------------------------------
  function captureLocation() {
    const latInput =
      document.getElementById("latitude") || document.createElement("input");
    const lonInput =
      document.getElementById("longitude") || document.createElement("input");

    latInput.type = "hidden";
    latInput.id = "latitude";
    latInput.name = "latitude";
    lonInput.type = "hidden";
    lonInput.id = "longitude";
    lonInput.name = "longitude";

    form.appendChild(latInput);
    form.appendChild(lonInput);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          latInput.value = pos.coords.latitude;
          lonInput.value = pos.coords.longitude;
          localStorage.setItem("lastLatitude", pos.coords.latitude);
          localStorage.setItem("lastLongitude", pos.coords.longitude);
        },
        (err) => {
          if (
            localStorage.getItem("lastLatitude") &&
            localStorage.getItem("lastLongitude")
          ) {
            latInput.value = localStorage.getItem("lastLatitude");
            lonInput.value = localStorage.getItem("lastLongitude");
          } else console.warn("Location capture failed:", err.message);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }
  captureLocation();
  setInterval(captureLocation, 30000);

  // ------------------------------ IMAGE UPLOAD (NO DRAG & DROP) ------------------------------
  async function getImageBase64(input) {
    return new Promise((resolve, reject) => {
      if (input.files.length === 0) {
        resolve(null);
        return;
      }
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () =>
        resolve({ base64: reader.result.split(",")[1], name: file.name });
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // ------------------------------ POPUP ------------------------------
  function showPopup(message, isError) {
    const popup = document.getElementById("formPopup");
    popup.textContent = message;
    popup.classList.toggle("error", !!isError);
    popup.style.display = "block";
    setTimeout(() => {
      popup.style.display = "none";
    }, 3000);
  }

  // ------------------------------ RIPPLE EFFECT ------------------------------
  function addRippleEffect(e, button, success) {
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.left = `${e.offsetX}px`;
    ripple.style.top = `${e.offsetY}px`;
    button.appendChild(ripple);
    button.classList.add(success ? "success" : "error", "bounce");

    setTimeout(() => {
      ripple.remove();
      button.classList.remove("bounce", "success", "error");
    }, 3000);
  }

  // ------------------------------ REMARKS BEHAVIOR ------------------------------
  const remarks = document.getElementById("remarks");
  if (remarks) {
    const defaultText = remarks.placeholder || "";

    remarks.addEventListener("focus", () => {
      if (remarks.value === defaultText) remarks.value = "";
      remarks.classList.remove("glow-success");
    });

    remarks.addEventListener("blur", () => {
      if (remarks.value.trim() === "") {
        remarks.value = "";
      }
    });
  }

  // ------------------------------ FORM SUBMIT ------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector("button[type=\"submit\"]");

    submitBtn.classList.add("loading");
    submitBtn.innerHTML = "Submitting...";

    const vcFront = await getImageBase64(document.getElementById("vcFront"));
    const vcBack = await getImageBase64(document.getElementById("vcBack"));

    const formData = new FormData(form);
    if (vcFront) {
      formData.append("vcFrontBase64", vcFront.base64);
      formData.append("vcFrontName", vcFront.name);
    }
    if (vcBack) {
      formData.append("vcBackBase64", vcBack.base64);
      formData.append("vcBackName", vcBack.name);
    }

    let plainData = {};
    formData.forEach((val, key) => (plainData[key] = val));

    if (navigator.onLine) {
      try {
        const res = await fetch(SCRIPT_URL, { method: "POST", body: formData });
        const text = await res.text();

        submitBtn.classList.remove("loading");

        if (text.includes("SUCCESS")) {
          showPopup("✅ Form submitted successfully!", false);
          form.reset();
          form
            .querySelectorAll("input,select,textarea")
            .forEach((i) => i.classList.remove("glow-success"));

          submitBtn.innerHTML = "Successful";
          addRippleEffect(e, submitBtn, true);
        } else {
          saveOffline({ data: plainData, timestamp: Date.now() });
          showPopup("❌ Form submission failed! Saved offline.", true);
          addRippleEffect(e, submitBtn, false);
        }
      } catch (err) {
        submitBtn.classList.remove("loading");
        saveOffline({ data: plainData, timestamp: Date.now() });
        showPopup("⚠️ Submission error! Saved offline.", true);
        console.error(err);
        addRippleEffect(e, submitBtn, false);
      }
    } else {
      saveOffline({ data: plainData, timestamp: Date.now() });
      submitBtn.classList.remove("loading");
      submitBtn.innerHTML = "Saved Offline";
      showPopup("📩 You are offline. Form saved.", false);
      form.reset();
      form
        .querySelectorAll("input,select,textarea")
        .forEach((i) => i.classList.remove("glow-success"));
      addRippleEffect(e, submitBtn, true);
    }

    if (remarks) remarks.value = "";
  });

  // ------------------------------ THEME TOGGLE (iOS STYLE SUN ↔ MOON) ------------------------------
  const themeBtn = document.getElementById("themeToggle");
  let isDark = false;

  themeBtn.addEventListener("click", () => {
    // Apply theme
    document.body.classList.toggle("dark-theme");
    isDark = !isDark;

    // Icon animation
    themeBtn.classList.add("rotate");
    setTimeout(() => themeBtn.classList.remove("rotate"), 600);

    // Change icon
    themeBtn.innerHTML = isDark
      ? "<span class=\"moon-icon\">🌙</span>"
      : "<span class=\"sun-icon\">☀️</span>";

    // Haptic feedback
    if ("vibrate" in navigator) navigator.vibrate(50);
  });

  // ------------------------------ INIT ------------------------------
  if (country.value === "India") {
    populateStates();
    state.style.display = "block";
    city.style.display = "block";
  }

  form
    .querySelectorAll("input,select,textarea")
    .forEach((input) => input.dispatchEvent(new Event("input")));
});
