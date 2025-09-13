document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('customerForm');
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxvmhvHDmRY6fSGwcrld0EXBhadrCYMRbiWOA4I575ciHBYZhZnFFRlGbbbpPksLaOUbQ/exec"; // <-- replace with your Apps Script Web App URL

  // Dynamic Other fields
  const fields = ["designation", "country", "state", "city", "business"];
  const otherFields = {
    designation: document.getElementById('designationOther'),
    country: document.getElementById('countryOther'),
    state: document.getElementById('stateOther'),
    city: document.getElementById('cityOther'),
    business: document.getElementById('businessOther')
  };

  // Tick icons appear only when field is filled
  form.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', () => {
      const tick = input.parentElement.querySelector('.tick');
      if (input.value) tick.style.transform = "translateY(-50%) scale(1)";
      else tick.style.transform = "translateY(-50%) scale(0)";
    });
  });

  // States & Cities
  const statesAndCities = {
    "Punjab":["Amritsar","Ludhiana","Jalandhar","Patiala","Bathinda","Mohali","Moga","Firozpur","Abohar"],
    "Maharashtra":["Mumbai","Pune","Nagpur","Nashik","Aurangabad"],
    "Karnataka":["Bengaluru","Mysuru","Hubballi","Mangaluru"],
    "Tamil Nadu":["Chennai","Coimbatore","Madurai","Tiruchirappalli"],
    "Delhi":["New Delhi","Dwarka","Rohini"],
    "West Bengal":["Kolkata","Howrah","Durgapur","Siliguri","Asansol"]
    // Add all other states & cities
  };

  const state = document.getElementById('state');
  const city = document.getElementById('city');

  // Populate states dropdown
  for (let st in statesAndCities) {
    const opt = document.createElement('option');
    opt.value = st;
    opt.textContent = st;
    state.appendChild(opt);
  }

  // Handle "Other" fields
  fields.forEach(f => {
    document.getElementById(f).addEventListener('change', () => {
      if (document.getElementById(f).value === "Other") {
        otherFields[f].style.display = "block";
      } else {
        otherFields[f].style.display = "none";
      }
    });
  });

  // Populate cities based on selected state
  state.addEventListener('change', () => {
    city.innerHTML = '<option value="">Select City</option>';
    otherFields.city.style.display = "none";

    if (statesAndCities[state.value]) {
      statesAndCities[state.value].forEach(ct => {
        const opt = document.createElement('option');
        opt.value = ct;
        opt.textContent = ct;
        city.appendChild(opt);
      });
      const otherOpt = document.createElement('option');
      otherOpt.value = "Other";
      otherOpt.textContent = "Other";
      city.appendChild(otherOpt);
    }
  });

  city.addEventListener('change', () => {
    otherFields.city.style.display = (city.value === "Other") ? "block" : "none";
  });

  // Convert uploaded images to Base64
  function getImageBase64(input) {
    return new Promise((resolve, reject) => {
      if (input.files.length === 0) {
        resolve(null);
        return;
      }
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => resolve({ base64: reader.result.split(',')[1], name: file.name });
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.classList.add('loading');

    // Convert images to Base64
    const vcFront = await getImageBase64(document.getElementById('vcFront'));
    const vcBack = await getImageBase64(document.getElementById('vcBack'));

    const formData = new FormData(form);
    if (vcFront) {
      formData.append('vcFrontBase64', vcFront.base64);
      formData.append('vcFrontName', vcFront.name);
    }
    if (vcBack) {
      formData.append('vcBackBase64', vcBack.base64);
      formData.append('vcBackName', vcBack.name);
    }

    // Send data to Google Apps Script
    fetch(SCRIPT_URL, { method: 'POST', body: formData })
      .then(res => res.text())
      .then(msg => {
        submitBtn.classList.remove('loading');
        const popup = document.getElementById('formPopup');

        if (msg.includes("SUCCESS")) {
          popup.textContent = "Form submitted successfully!";
          popup.classList.remove('error');
          popup.style.display = "block";
          form.reset();
          document.querySelectorAll('.tick').forEach(t => t.style.transform = 'translateY(-50%) scale(0)');
        } else {
          popup.textContent = "Form submission failed!";
          popup.classList.add('error');
          popup.style.display = "block";
        }

        setTimeout(() => { popup.style.display = "none"; }, 3000);
      })
      .catch(err => {
        submitBtn.classList.remove('loading');
        const popup = document.getElementById('formPopup');
        popup.textContent = "Submission error!";
        popup.classList.add('error');
        popup.style.display = "block";
        setTimeout(() => { popup.style.display = "none"; }, 3000);
        console.error(err);
      });
  });

});

