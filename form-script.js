document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("customerForm");
  const statusBox = document.getElementById("status");

  const countrySelect = document.getElementById("country");
  const stateSelect = document.getElementById("state");
  const citySelect = document.getElementById("city");

  const countryOther = document.getElementById("countryOther");
  const stateOther = document.getElementById("stateOther");
  const cityOther = document.getElementById("cityOther");

  // Example states and cities
  const indiaStates = {
    "Delhi": ["New Delhi", "Dwarka", "Rohini", "Other"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Other"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Other"],
    "Other": []
  };

  /* ========== Dynamic Dropdowns ========== */
  countrySelect.addEventListener("change", () => {
    if (countrySelect.value === "India") {
      stateSelect.innerHTML = `<option value="">Select State</option>`;
      for (let st in indiaStates) {
        let opt = document.createElement("option");
        opt.value = st;
        opt.textContent = st;
        stateSelect.appendChild(opt);
      }
      stateSelect.style.display = "block";
      stateOther.style.display = "none";
      countryOther.style.display = "none";
    } else {
      stateSelect.style.display = "none";
      stateOther.style.display = "block";
      countryOther.style.display = "block";

      citySelect.innerHTML = `<option value="Other">Other</option>`;
      citySelect.style.display = "none";
      cityOther.style.display = "block";
    }
  });

  stateSelect.addEventListener("change", () => {
    citySelect.innerHTML = `<option value="">Select City</option>`;
    if (indiaStates[stateSelect.value]) {
      indiaStates[stateSelect.value].forEach(c => {
        let opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        citySelect.appendChild(opt);
      });
    }
    citySelect.style.display = "block";
    cityOther.style.display = "none";
  });

  citySelect.addEventListener("change", () => {
    if (citySelect.value === "Other") {
      cityOther.style.display = "block";
    } else {
      cityOther.style.display = "none";
    }
  });

  /* ========== Validation ========== */
  document.getElementById("name").addEventListener("input", e => {
    e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
  });

  document.getElementById("phone").addEventListener("input", e => {
    e.target.value = e.target.value.replace(/[^0-9+]/g, "");
  });

  /* ========== Form Submission ========== */
  form.addEventListener("submit", e => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {};
    formData.forEach((val, key) => {
      data[key] = val;
    });

    if (navigator.onLine) {
      // Online → send to server
      fakeServerSend(data);
    } else {
      // Offline → save locally
      saveOffline(data);
      statusBox.textContent = "Offline: Data saved locally.";
      statusBox.style.color = "orange";
      setTimeout(() => location.reload(), 1500);
    }
  });

  /* ========== Sync when back online ========== */
  window.addEventListener("online", syncOfflineData);

  /* ---------- Helpers ---------- */

  function fakeServerSend(data) {
    // Simulate server API call
    console.log("Sending to server:", data);
    statusBox.textContent = "Form submitted successfully!";
    statusBox.style.color = "green";

    // Auto-refresh
    setTimeout(() => location.reload(), 1500);
  }

  function saveOffline(data) {
    let offlineData = JSON.parse(localStorage.getItem("offlineForms") || "[]");
    offlineData.push(data);
    localStorage.setItem("offlineForms", JSON.stringify(offlineData));
  }

  function syncOfflineData() {
    let offlineData = JSON.parse(localStorage.getItem("offlineForms") || "[]");
    if (offlineData.length > 0) {
      console.log("Syncing offline data:", offlineData);
      // Pretend to send to server
      localStorage.removeItem("offlineForms");
      statusBox.textContent = "Offline data synced!";
      statusBox.style.color = "blue";
    }
  }
});
