document.addEventListener('DOMContentLoaded', ()=>{
  const form = document.getElementById('customerForm');
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwoH0q9an6s4z86ohkgvsHKgk48zLGjwF7I-leG_GssxMEKynX0-wD_Cz2SY5YXKd2emw/exec"; // <---- REPLACE with your Apps Script Web App URL

  // Inputs for dynamic "Other"
  const fields = ["designation","country","state","city","business"];
  const otherFields = {
    designation: document.getElementById('designationOther'),
    country: document.getElementById('countryOther'),
    state: document.getElementById('stateOther'),
    city: document.getElementById('cityOther'),
    business: document.getElementById('businessOther')
  };

  // Tick icons
  const ticks = document.querySelectorAll('.tick');

  // Show tick when input is filled
  form.querySelectorAll('input, select').forEach(input=>{
    input.addEventListener('input',()=>{
      const tick = input.parentElement.querySelector('.tick');
      if(input.value) tick.style.display="block";
      else tick.style.display="none";
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
    // Add all other states and cities here
  };

  const state = document.getElementById('state');
  const city = document.getElementById('city');

  // Populate state dropdown
  for(let st in statesAndCities){
    const option = document.createElement('option');
    option.value = st;
    option.textContent = st;
    state.appendChild(option);
  }

  // Handle "Other" fields
  fields.forEach(f=>{
    document.getElementById(f).addEventListener('change',()=>{
      if(document.getElementById(f).value==="Other") otherFields[f].style.display="block";
      else otherFields[f].style.display="none";
    });
  });

  // Populate city based on state
  state.addEventListener('change',()=>{
    city.innerHTML='<option value="">Select City</option>';
    otherFields.city.style.display="none";

    if(statesAndCities[state.value]){
      statesAndCities[state.value].forEach(ct=>{
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

  // Show other city field
  city.addEventListener('change',()=>{
    otherFields.city.style.display = (city.value==="Other")?"block":"none";
  });

  // Form submit
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.classList.add('loading');

    const formData = new FormData(form);

    // Send to Google Sheets via Apps Script
    fetch(SCRIPT_URL, {method:'POST', body:formData})
      .then(res=>res.text())
      .then(msg=>{
        submitBtn.classList.remove('loading');
        const popup = document.getElementById('formPopup');

        if(msg.includes("SUCCESS")){
          popup.textContent = "Form submitted successfully!";
          popup.classList.remove('error');
          popup.style.display = "block";
          form.reset();
          document.querySelectorAll('.tick').forEach(t=>t.style.display='none');
        } else {
          popup.textContent = "Form submission failed!";
          popup.classList.add('error');
          popup.style.display = "block";
        }

        setTimeout(()=>{ popup.style.display="none"; },3000);
      }).catch(err=>{
        submitBtn.classList.remove('loading');
        const popup = document.getElementById('formPopup');
        popup.textContent = "Submission error!";
        popup.classList.add('error');
        popup.style.display = "block";
        setTimeout(()=>{ popup.style.display="none"; },3000);
        console.error(err);
      });
  });
});

