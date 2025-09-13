document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('customerForm');
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxvmhvHDmRY6fSGwcrld0EXBhadrCYMRbiWOA4I575ciHBYZhZnFFRlGbbbpPksLaOUbQ/exec";

  const offlineBanner = document.getElementById('offlineBanner');
  const connectionStatus = document.getElementById('connectionStatus');
  const queueList = document.getElementById('queueItems');

  /* =======================
     Validation: Name & Phone
     ======================= */
  const nameField = document.getElementById('name');
  const phoneField = document.getElementById('phone');

  nameField.addEventListener('input', () => {
    // allow only alphabets & spaces
    nameField.value = nameField.value.replace(/[^a-zA-Z\s]/g, '');
  });

  phoneField.addEventListener('input', () => {
    // allow only + and numbers
    phoneField.value = phoneField.value.replace(/[^0-9+]/g, '');
  });

  /* =======================
     Glow Success Logic
     ======================= */
  form.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', () => {
      let isValid = false;

      if (input.type === "text" || input.type === "email" || input.type === "tel") {
        isValid = input.value.trim() !== "";
      }
      if (input.tagName.toLowerCase() === "select") {
        isValid = input.value !== "";
      }
      if (input.type === "file") {
        isValid = input.files.length > 0;
      }

      input.classList.toggle("glow-success", isValid);
    });
  });

  /* =======================
     Drag & Drop Uploads
     ======================= */
  function setupFileDrop(inputId, dropId, previewId, removeId, progressId) {
    const input = document.getElementById(inputId);
    const drop = document.getElementById(dropId);
    const preview = document.getElementById(previewId);
    const removeBtn = document.getElementById(removeId);
    const progressBar = document.getElementById(progressId);

    function handleFile(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        preview.src = e.target.result;
        preview.style.display = "block";
        removeBtn.style.display = "inline-block";
        progressBar.style.width = "100%";
        input.classList.add("glow-success");
      };
      reader.readAsDataURL(file);
    }

    input.addEventListener('change', () => handleFile(input.files[0]));

    drop.addEventListener('dragover', e => {
      e.preventDefault();
      drop.classList.add('dragover');
    });

    drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));

    drop.addEventListener('drop', e => {
      e.preventDefault();
      drop.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        input.files = e.dataTransfer.files;
        handleFile(input.files[0]);
      }
    });

    removeBtn.addEventListener('click', () => {
      input.value = "";
      preview.style.display = "none";
      preview.src = "";
      removeBtn.style.display = "none";
      progressBar.style.width = "0%";
      input.classList.remove("glow-success");
    });
  }

  setupFileDrop('vcFront', 'dropFront', 'previewFront', 'removeFront', 'progressFront');
  setupFileDrop('vcBack', 'dropBack', 'previewBack', 'removeBack', 'progressBack');

  /* =======================
     Offline Queue (IndexedDB)
     ======================= */
  let db;
  const request = indexedDB.open("FormDB", 1);

  request.onupgradeneeded = e => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("queue")) {
      db.createObjectStore("queue", { autoIncrement: true });
    }
  };

  request.onsuccess = e => {
    db = e.target.result;
    processQueue();
  };

  request.onerror = e => console.error("IndexedDB error", e);

  function addToQueue(data) {
    const tx = db.transaction("queue", "readwrite");
    tx.objectStore("queue").add(data);
    tx.oncomplete = () => showQueue();
  }

  function showQueue() {
    const tx = db.transaction("queue", "readonly");
    const store = tx.objectStore("queue");
    const req = store.getAll();

    req.onsuccess = () => {
      queueList.innerHTML = "";
      req.result.forEach((item, i) => {
        const li = document.createElement('li');
        li.textContent = `#${i+1} ${item.get('name') || 'Form Data'}`;
        queueList.appendChild(li);
      });
    };
  }

  function processQueue() {
    if (!navigator.onLine) return;

    const tx = db.transaction("queue", "readwrite");
    const store = tx.objectStore("queue");
    const req = store.openCursor();

    req.onsuccess = e => {
      const cursor = e.target.result;
      if (cursor) {
        fetch(SCRIPT_URL, { method: "POST", body: cursor.value })
          .then(res => res.text())
          .then(msg => {
            if (msg.includes("SUCCESS")) {
              store.delete(cursor.key);
              cursor.continue();
            }
          });
      } else {
        showQueue();
      }
    };
  }

  /* =======================
     Form Submission
     ======================= */
  form.addEventListener('submit', e => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.classList.add('loading');

    const formData = new FormData(form);

    if (navigator.onLine) {
      fetch(SCRIPT_URL, { method: "POST", body: formData })
        .then(res => res.text())
        .then(msg => {
          submitBtn.classList.remove('loading');
          if (msg.includes("SUCCESS")) {
            showPopup("✅ Form submitted successfully!");
            form.reset();
            setTimeout(() => location.reload(), 2000);
          } else {
            showPopup("❌ Submission failed!", true);
          }
        })
        .catch(() => {
          submitBtn.classList.remove('loading');
          showPopup("⚠️ Error submitting form!", true);
        });
    } else {
      addToQueue(formData);
      submitBtn.classList.remove('loading');
      showPopup("📦 Saved offline. Will sync when online.");
      form.reset();
    }
  });

  /* =======================
     Connection Status
     ======================= */
  function updateConnectionStatus() {
    if (navigator.onLine) {
      offlineBanner.style.display = "none";
      connectionStatus.textContent = "🟢";
      connectionStatus.classList.remove("offline");
      processQueue();
    } else {
      offlineBanner.style.display = "block";
      connectionStatus.textContent = "🔴";
      connectionStatus.classList.add("offline");
    }
  }

  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
  updateConnectionStatus();

  /* =======================
     Popup Messages
     ======================= */
  function showPopup(msg, error = false) {
    const popup = document.createElement("div");
    popup.className = "form-popup";
    if (error) popup.classList.add("error");
    popup.textContent = msg;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 3000);
  }
});
