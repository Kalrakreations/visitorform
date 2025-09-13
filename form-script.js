document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('customerForm');
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyZDIFUA8QZ01dptKXHil5SP1EtKC0gd-HGNXxkX5RMiR7JM_qXe92CN_ubHv5zQ2HDdA/exec"; // Replace with your Apps Script Web App URL

  const fields = ["designation", "country", "state", "city", "business"];
  const otherFields = {
    designation: document.getElementById('designationOther'),
    country: document.getElementById('countryOther'),
    state: document.getElementById('stateOther'),
    city: document.getElementById('cityOther'),
    business: document.getElementById('businessOther')
  };

  // Tick icons
  form.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', () => {
      const tick = input.parentElement.querySelector('.tick');
      tick.style.display = input.value ? "block" : "none";
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

  // Populate states
  for (let st in statesAndCities) {
    const option = document.createElement('option');
    option.value = st;
    option.textContent = st;
    state.appendChild(option);
  }

  // Handle Other fields
  fields.forEach(f => {
    document.getElementById(f).addEventListener('change', () => {
      otherFields[f].style.display = (document.getElementById(f).value === "Other") ? "block" : "none";
    });
  });

  // Populate cities dynamically
  state.addEventListener('change', () => {
    city.innerHTML = '<option value="">Select City</option>';
    otherFields.city.style.display = "none";

    if (state.value === "Other") {
      otherFields.state.style.display = "block";
    } else {
      otherFields.state.style.display = "none";
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
    }
  });

  city.addEventListener('change', () => {
    otherFields.city.style.display = (city.value === "Other") ? "block" : "none";
  });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.classList.add('loading');

    const formData = new FormData();

    // Collect all input values, handling Other fields
    fields.forEach(f => {
      const val = document.getElementById(f).value;
      formData.append(f, val === "Other" ? otherFields[f].value : val);
    });

    ["eventName", "name", "phone", "email", "company"].forEach(f => {
      formData.append(f, form.querySelector(`[name="${f}"]`).value);
    });

    // Handle image uploads
    const imageFields = ["vcFront", "vcBack"];
    const readImages = imageFields.map(id => {
      return new Promise(resolve => {
        const fileInput = document.getElementById(id);
        if (fileInput.files.length > 0) {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            formData.append(id + "Base64", base64);
            formData.append(id + "Name", fileInput.files[0].name);
            resolve();
          };
          reader.readAsDataURL(fileInput.files[0]);
        } else resolve(); // No file uploaded
      });
    });

    // Wait for all images to be read
    await Promise.all(readImages);

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
          document.querySelectorAll('.tick').forEach(t => t.style.display = 'none');
        } else {
          popup.textContent = "Form submission failed!";
          popup.classList.add('error');
          popup.style.display = "block";
        }

        setTimeout(() => { popup.style.display = "none"; }, 3000);
      }).catch(err => {
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
