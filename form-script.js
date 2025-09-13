document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('customerForm');
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxvmhvHDmRY6fSGwcrld0EXBhadrCYMRbiWOA4I575ciHBYZhZnFFRlGbbbpPksLaOUbQ/exec";

  // Initialize IndexedDB for offline storage
  let db;
  const request = indexedDB.open('visitorFormDB', 1);

  request.onupgradeneeded = e => {
    db = e.target.result;
    if (!db.objectStoreNames.contains('submissions')) {
      db.createObjectStore('submissions', { keyPath: 'id', autoIncrement: true });
    }
  };
  request.onsuccess = e => { db = e.target.result; };
  request.onerror = e => { console.error('IndexedDB error:', e); };

  // Utility: save to IndexedDB
  const saveOffline = async data => {
    const tx = db.transaction('submissions', 'readwrite');
    tx.objectStore('submissions').add(data);
  };

  // Utility: sync offline submissions
  const syncOfflineSubmissions = async () => {
    const tx = db.transaction('submissions', 'readonly');
    const store = tx.objectStore('submissions');
    const all = store.getAll();

    all.onsuccess = async () => {
      const submissions = all.result;
      for (let s of submissions) {
        try {
          const formData = new FormData();
          for (let key in s) {
            if (key !== 'id') formData.append(key, s[key]);
          }
          const res = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
          if ((await res.text()).includes('SUCCESS')) {
            const delTx = db.transaction('submissions', 'readwrite');
            delTx.objectStore('submissions').delete(s.id);
          }
        } catch (err) {
          console.error('Sync failed:', err);
        }
      }
    };
  };

  // Auto-sync whenever online
  window.addEventListener('online', () => {
    console.log('Back online, syncing...');
    syncOfflineSubmissions();
  });

  // Form submission
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.classList.add('loading');

    const formData = new FormData(form);

    // Convert file inputs to Base64
    const fileToBase64 = async input => {
      if (!input.files.length) return null;
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(input.files[0]);
      });
    };

    const vcFront = await fileToBase64(document.getElementById('vcFront'));
    const vcBack = await fileToBase64(document.getElementById('vcBack'));
    if (vcFront) { formData.append('vcFrontBase64', vcFront); formData.append('vcFrontName', document.getElementById('vcFront').files[0].name); }
    if (vcBack) { formData.append('vcBackBase64', vcBack); formData.append('vcBackName', document.getElementById('vcBack').files[0].name); }

    const popup = document.getElementById('formPopup');

    // If offline, save locally
    if (!navigator.onLine) {
      const obj = {};
      formData.forEach((value, key) => { obj[key] = value; });
      await saveOffline(obj);
      submitBtn.classList.remove('loading');
      popup.textContent = '✅ Saved offline! Will submit when online.';
      popup.classList.remove('error');
      popup.style.display = 'block';
      form.reset();
      setTimeout(() => { popup.style.display = 'none'; }, 3000);
      return;
    }

    // If online, submit to server
    fetch(SCRIPT_URL, { method: 'POST', body: formData })
      .then(res => res.text())
      .then(msg => {
        submitBtn.classList.remove('loading');
        if (msg.includes('SUCCESS')) {
          popup.textContent = '✅ Form submitted successfully!';
          popup.classList.remove('error');
          form.reset();
        } else {
          popup.textContent = '❌ Form submission failed!';
          popup.classList.add('error');
        }
        popup.style.display = 'block';
        setTimeout(() => { popup.style.display = 'none'; }, 3000);
      })
      .catch(err => {
        submitBtn.classList.remove('loading');
        popup.textContent = '⚠️ Submission error! Saved offline.';
        popup.classList.add('error');
        popup.style.display = 'block';
        // save offline if failed
        const obj = {};
        formData.forEach((value, key) => { obj[key] = value; });
        saveOffline(obj);
        setTimeout(() => { popup.style.display = 'none'; }, 3000);
        console.error(err);
      });
  });

});
