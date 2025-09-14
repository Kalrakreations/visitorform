document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('customerForm');
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxvmhvHDmRY6fSGwcrld0EXBhadrCYMRbiWOA4I575ciHBYZhZnFFRlGbbbpPksLaOUbQ/exec";
  const popup = document.getElementById('formPopup');

  const fields = ["designation","country","state","city","business"];
  const otherFields = {
    designation: document.getElementById('designationOther'),
    country: document.getElementById('countryOther'),
    state: document.getElementById('stateOther'),
    city: document.getElementById('cityOther'),
    business: document.getElementById('businessOther')
  };

  // ---------- Helper: show popup ----------
  function showPopup(message, isError = false) {
    popup.textContent = message;
    popup.classList.toggle('error', isError);
    popup.style.display = "block";
    setTimeout(() => popup.style.display = "none", 3000);
  }

  // ---------- Convert image to Base64 ----------
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

  // ---------- Save form data offline ----------
  async function saveFormOffline() {
    const vcFront = await getImageBase64(document.getElementById('vcFront'));
    const vcBack = await getImageBase64(document.getElementById('vcBack'));

    const formData = {};
    new FormData(form).forEach((v,k) => formData[k] = v);

    if(vcFront){ formData.vcFrontBase64 = vcFront.base64; formData.vcFrontName = vcFront.name; }
    if(vcBack){ formData.vcBackBase64 = vcBack.base64; formData.vcBackName = vcBack.name; }

    let queue = JSON.parse(localStorage.getItem("formQueue") || "[]");
    queue.push(formData);
    localStorage.setItem("formQueue", JSON.stringify(queue));

    showPopup("📩 You are offline. Form saved locally & will auto-submit when back online.");
  }

  // ---------- Try resubmitting offline data ----------
  async function submitQueuedForms() {
    let queue = JSON.parse(localStorage.getItem("formQueue") || "[]");
    if(queue.length === 0) return;

    for(let data of queue){
      const fd = new FormData();
      for(let key in data){ fd.append(key, data[key]); }
      try {
        const res = await fetch(SCRIPT_URL, { method: "POST", body: fd });
        const msg = await res.text();
        if(msg.includes("SUCCESS")){
          showPopup("✅ Offline form submitted successfully!");
          queue = queue.filter(f => f !== data); // remove successful one
          localStorage.setItem("formQueue", JSON.stringify(queue));
        }
      } catch (err) {
        console.error("Resubmit failed:", err);
      }
    }
  }

  // ---------- Submit Handler ----------
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.classList.add('loading');

    if(!navigator.onLine){
      await saveFormOffline();
      submitBtn.classList.remove('loading');
      form.reset();
      return;
    }

    const vcFront = await getImageBase64(document.getElementById('vcFront'));
    const vcBack = await getImageBase64(document.getElementById('vcBack'));

    const formData = new FormData(form);
    if(vcFront){ formData.append('vcFrontBase64', vcFront.base64); formData.append('vcFrontName', vcFront.name); }
    if(vcBack){ formData.append('vcBackBase64', vcBack.base64); formData.append('vcBackName', vcBack.name); }

    fetch(SCRIPT_URL, {method:'POST', body: formData})
    .then(res=>res.text())
    .then(msg=>{
      submitBtn.classList.remove('loading');
      if(msg.includes("SUCCESS")){
        showPopup("✅ Form submitted successfully!");
        form.reset();
        form.querySelectorAll('input, select').forEach(i=>i.classList.remove("glow-success"));
      } else {
        showPopup("❌ Form submission failed!", true);
      }
    })
    .catch(async err=>{
      console.warn("Network error, saving offline:", err);
      await saveFormOffline();
      submitBtn.classList.remove('loading');
      form.reset();
    });
  });

  // ---------- Auto-submit stored forms when back online ----------
  window.addEventListener("online", submitQueuedForms);

  // ---------- Initialize (your existing code continues) ----------
  // States, city logic etc...
  // (Keep your existing state/city population code here unchanged)
});
