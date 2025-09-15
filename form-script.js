document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('customerForm');
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzUeEwhUrglj58LQ9D8eR5IzCaLgrSoqJF-AFsCZlXhD91HuQoPvi8Q04w5-R6N182Eag/exec";

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

  // --- Save offline only if unique ---
  function saveOffline(data) {
    if(!db) return;
    const tx = db.transaction("submissions", "readwrite");
    const store = tx.objectStore("submissions");

    const getAll = store.getAll();
    getAll.onsuccess = () => {
      const hash = JSON.stringify(data);
      const exists = getAll.result.some(record => JSON.stringify(record.data) === hash);
      if(!exists) store.add(data);
    };
  }

  // --- Try resending offline data ---
  async function tryResendData() {
    if (!navigator.onLine || !db) return;
    const tx = db.transaction("submissions", "readwrite");
    const store = tx.objectStore("submissions");
    const getAll = store.getAll();

    getAll.onsuccess = async () => {
      for(const record of getAll.result){
        try {
          const fd = new FormData();
          for(let k in record.data) fd.append(k, record.data[k]);
          const res = await fetch(SCRIPT_URL, { method: "POST", body: fd });
          const text = await res.text();
          if(text.includes("SUCCESS")){
            store.delete(record.id);
            console.log("Offline record synced:", record.id);
            showPopup("✅ Offline submission synced!", false);
          }
        } catch(err){ console.error("Offline resend failed:", err); }
      }
    };
  }
  window.addEventListener("online", tryResendData);

  // --- Glow & validation ---
  form.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('input', () => {
      let isFilled = false;
      if(input.id==="name") input.value=input.value.replace(/[^a-zA-Z\s]/g,'');
      if(input.id==="phone") input.value=input.value.replace(/[^\d+]/g,'');
      if(["text","email","tel","textarea"].includes(input.type) || input.tagName.toLowerCase()==="textarea") isFilled=input.value.trim()!=="";
      if(input.tagName.toLowerCase()==="select") isFilled=input.value!=="";
      if(input.type==="file") isFilled=input.files.length>0;
      input.classList.toggle("glow-success", isFilled);
    });
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
    const countries = ["India","United States","United Kingdom","Canada","Australia","Other"];
    country.innerHTML=""; countries.forEach(c=>country.insertAdjacentHTML('beforeend', `<option value="${c}" ${c==="India"?"selected":""}>${c}</option>`));
  }
  populateCountries();

  function populateStates(){
    state.innerHTML='<option value="">Select State</option>';
    for(let st in statesAndCities) state.insertAdjacentHTML('beforeend', `<option value="${st}">${st}</option>`);
    state.insertAdjacentHTML('beforeend', `<option value="Other">Other</option>`);
  }

  fields.forEach(f=>document.getElementById(f).addEventListener('change',()=>otherFields[f].style.display=(document.getElementById(f).value==="Other")?"block":"none")));

  country.addEventListener('change',()=>{
    if(country.value==="India"){ populateStates(); state.style.display="block"; city.style.display="block"; otherFields.country.style.display="none"; otherFields.state.style.display="none"; otherFields.city.style.display="none"; city.innerHTML='<option value="">Select City</option>'; }
    else if(country.value==="Other"){ otherFields.country.style.display="block"; state.style.display="none"; city.style.display="none"; otherFields.state.style.display="block"; otherFields.city.style.display="block"; }
    else { state.style.display="none"; city.style.display="none"; otherFields.country.style.display="none"; otherFields.state.style.display="none"; otherFields.city.style.display="none"; }
  });

  state.addEventListener('change',()=>{
    city.innerHTML='<option value="">Select City</option>'; otherFields.city.style.display="none";
    if(statesAndCities[state.value]){ statesAndCities[state.value].forEach(ct=>city.insertAdjacentHTML('beforeend',`<option value="${ct}">${ct}</option>`)); city.insertAdjacentHTML('beforeend',`<option value="Other">Other</option>`); city.style.display="block"; }
    else if(state.value==="Other"){ otherFields.state.style.display="block"; otherFields.city.style.display="block"; }
  });

  city.addEventListener('change',()=>{ otherFields.city.style.display=(city.value==="Other")?"block":"none"; });

  // --- Location ---
  function captureLocation(){
    const latInput = document.getElementById("latitude") || document.createElement("input");
    const lonInput = document.getElementById("longitude") || document.createElement("input");
    latInput.type="hidden"; latInput.id="latitude"; latInput.name="latitude";
    lonInput.type="hidden"; lonInput.id="longitude"; lonInput.name="longitude";
    form.appendChild(latInput); form.appendChild(lonInput);
    if("geolocation" in navigator){
      navigator.geolocation.getCurrentPosition(pos=>{ latInput.value=pos.coords.latitude; lonInput.value=pos.coords.longitude; localStorage.setItem("lastLatitude", pos.coords.latitude); localStorage.setItem("lastLongitude", pos.coords.longitude); },
      err=>{ if(localStorage.getItem("lastLatitude") && localStorage.getItem("lastLongitude")){ latInput.value=localStorage.getItem("lastLatitude"); lonInput.value=localStorage.getItem("lastLongitude"); } },
      {enableHighAccuracy:true, timeout:5000});
    } else if(localStorage.getItem("lastLatitude") && localStorage.getItem("lastLongitude")){ latInput.value=localStorage.getItem("lastLatitude"); lonInput.value=localStorage.getItem("lastLongitude"); }
  }
  captureLocation(); setInterval(captureLocation, 30000);

  // --- Image optimization & drag/drop ---
  async function resizeImage(file, maxWidth=800, maxHeight=800){
    return new Promise((resolve,reject)=>{
      const img = new Image();
      const reader = new FileReader();
      reader.onload = e=>{
        img.src = e.target.result;
      };
      reader.onerror = err=>reject(err);
      img.onload = ()=>{
        let canvas=document.createElement("canvas");
        let ctx=canvas.getContext("2d");
        let ratio=Math.min(maxWidth/img.width, maxHeight/img.height, 1);
        canvas.width = img.width*ratio;
        canvas.height = img.height*ratio;
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        canvas.toBlob(blob=>resolve({base64:canvas.toDataURL("image/jpeg").split(',')[1], name:file.name}), "image/jpeg", 0.8);
      };
      reader.readAsDataURL(file);
    });
  }

  async function getImageBase64(input){
    if(input.files.length===0) return null;
    return await resizeImage(input.files[0]);
  }

  // --- Popup & ripple ---
  function showPopup(message,isError){ const popup=document.getElementById('formPopup'); popup.textContent=message; popup.classList.toggle('error', !!isError); popup.style.display="block"; setTimeout(()=>{popup.style.display='none';},3000);}
  function addRippleEffect(e,button,success){ const ripple=document.createElement("span"); ripple.className="ripple"; ripple.style.left=`${e.offsetX}px`; ripple.style.top=`${e.offsetY}px`; button.appendChild(ripple); button.classList.add(success?"success":"error","bounce"); setTimeout(()=>{ripple.remove(); button.classList.remove("bounce","success","error");},3000); }

  // --- Submit ---
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]'); submitBtn.classList.add('loading');

    const vcFront = await getImageBase64(document.getElementById('vcFront'));
    const vcBack = await getImageBase64(document.getElementById('vcBack'));

    const formData = new FormData(form);
    if(vcFront){ formData.append('vcFrontBase64', vcFront.base64); formData.append('vcFrontName', vcFront.name); }
    if(vcBack){ formData.append('vcBackBase64', vcBack.base64); formData.append('vcBackName', vcBack.name); }

    let plainData={}; formData.forEach((val,key)=>plainData[key]=val);

    if(navigator.onLine){
      try {
        const res = await fetch(SCRIPT_URL,{method:'POST',body:formData});
        const text = await res.text();
        submitBtn.classList.remove('loading');
        if(text.includes("SUCCESS")){
          showPopup("✅ Form submitted successfully!",false);
          form.reset(); form.querySelectorAll('input,select,textarea').forEach(i=>i.classList.remove("glow-success")); addRippleEffect(e,submitBtn,true);
        } else {
          saveOffline({data:plainData,timestamp:Date.now()});
          showPopup("❌ Submission failed! Saved offline.",true); addRippleEffect(e,submitBtn,false);
        }
      } catch(err){
        submitBtn.classList.remove('loading'); saveOffline({data:plainData,timestamp:Date.now()}); showPopup("⚠️ Submission error! Saved offline.",true); console.error(err); addRippleEffect(e,submitBtn,false);
      }
    } else {
      saveOffline({data:plainData,timestamp:Date.now()}); submitBtn.classList.remove('loading'); showPopup("📩 You are offline. Form saved & will auto-submit later.",false); form.reset(); form.querySelectorAll('input,select,textarea').forEach(i=>i.classList.remove("glow-success")); addRippleEffect(e,submitBtn,true);
    }
  });

  if(country.value==="India"){ populateStates(); state.style.display="block"; city.style.display="block"; }
  form.querySelectorAll('input,select,textarea').forEach(input=>input.dispatchEvent(new Event('input')));
});
