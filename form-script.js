<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Customer Form</title>
  <link rel="stylesheet" href="style.css">

  <!-- Manifest for PWA -->
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#0d6efd">

  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
          .then(reg => console.log("✅ Service Worker registered", reg))
          .catch(err => console.error("❌ SW registration failed:", err));
      });
    }
  </script>

  <style>
    body {
      background: #f4f4f9;
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #222;
    }
    .container {
      max-width: 700px;
      margin: auto;
      background: #fff;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.1);
    }
    h2 { text-align:center; margin-bottom:20px; }

    /* Floating label wrapper */
    .input-group {
      position: relative;
      margin-top: 18px;
    }
    .input-group input,
    .input-group select,
    .input-group textarea {
      width: 100%;
      padding: 14px 10px 10px 10px;
      border: 1px solid #ccc;
      border-radius: 6px;
      outline: none;
      font-size: 16px;
      background: transparent;
    }
    .input-group label {
      position: absolute;
      left: 12px;
      top: 14px;
      color: #666;
      font-size: 16px;
      transition: all 0.2s ease;
      pointer-events: none;
    }
    .input-group input:focus + label,
    .input-group select:focus + label,
    .input-group textarea:focus + label,
    .input-group.filled label {
      top: -8px;
      left: 8px;
      font-size: 12px;
      background: #fff;
      padding: 0 4px;
      color: #0d6efd;
    }

    /* Remarks textarea height */
    textarea { resize: vertical; min-height: 80px; }

    /* Glow effect */
    input.glow-success, select.glow-success, textarea.glow-success {
      border-color: #28a745;
      box-shadow: 0 0 6px #28a745;
    }

    button {
      width: 100%;
      margin-top: 22px;
      padding: 14px;
      background: #0d6efd;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
    }
    button.loading { opacity: 0.7; pointer-events:none; }

    #formPopup {
      display: none;
      text-align: center;
      padding: 12px;
      margin-top: 16px;
      border-radius: 6px;
    }
    #formPopup.error { background: #ffcccc; color: #900; }
    #formPopup:not(.error) { background: #d4edda; color: #155724; }

    /* Drag-drop */
    .drop-zone {
      border: 2px dashed #aaa;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      cursor: pointer;
      margin-top: 10px;
    }
    .drop-zone.dragover { border-color:#0d6efd; background:#eef4ff; }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      body { background: #121212; color:#f1f1f1; }
      .container { background: #1e1e1e; color:#f1f1f1; }
      .input-group input,
      .input-group select,
      .input-group textarea {
        background:#2b2b2b;
        color:#f1f1f1;
        border:1px solid #444;
      }
      .input-group label { background:#1e1e1e; }
      button { background:#0d6efd; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Customer Information Form</h2>
    <form id="customerForm">

      <div class="input-group">
        <input type="text" id="name" name="name" required>
        <label for="name">Full Name</label>
      </div>

      <div class="input-group">
        <input type="tel" id="phone" name="phone" required>
        <label for="phone">Phone Number</label>
      </div>

      <div class="input-group">
        <input type="email" id="email" name="email" required>
        <label for="email">Email</label>
      </div>

      <div class="input-group">
        <select id="designation" name="designation" required>
          <option value=""></option>
          <option value="Owner">Owner</option>
          <option value="Manager">Manager</option>
          <option value="Staff">Staff</option>
          <option value="Other">Other</option>
        </select>
        <label for="designation">Designation</label>
      </div>
      <div class="input-group" id="designationOtherGroup" style="display:none;">
        <input type="text" id="designationOther" name="designationOther">
        <label for="designationOther">Other Designation</label>
      </div>

      <div class="input-group">
        <select id="country" name="country" required>
          <option value=""></option>
          <option value="India">India</option>
          <option value="Other">Other</option>
        </select>
        <label for="country">Country</label>
      </div>
      <div class="input-group" id="countryOtherGroup" style="display:none;">
        <input type="text" id="countryOther" name="countryOther">
        <label for="countryOther">Other Country</label>
      </div>

      <div class="input-group" id="stateGroup" style="display:none;">
        <select id="state" name="state"></select>
        <label for="state">State</label>
      </div>
      <div class="input-group" id="stateOtherGroup" style="display:none;">
        <input type="text" id="stateOther" name="stateOther">
        <label for="stateOther">Other State</label>
      </div>

      <div class="input-group" id="cityGroup" style="display:none;">
        <select id="city" name="city"></select>
        <label for="city">City</label>
      </div>
      <div class="input-group" id="cityOtherGroup" style="display:none;">
        <input type="text" id="cityOther" name="cityOther">
        <label for="cityOther">Other City</label>
      </div>

      <div class="input-group">
        <select id="business" name="business" required>
          <option value=""></option>
          <option value="Retail">Retail</option>
          <option value="Wholesale">Wholesale</option>
          <option value="Distributor">Distributor</option>
          <option value="Other">Other</option>
        </select>
        <label for="business">Business Type</label>
      </div>
      <div class="input-group" id="businessOtherGroup" style="display:none;">
        <input type="text" id="businessOther" name="businessOther">
        <label for="businessOther">Other Business</label>
      </div>

      <!-- Drag & Drop for Visiting Card Front -->
      <div class="drop-zone" id="frontDrop">Drop VC Front / Click to Upload
        <input type="file" id="vcFront" name="vcFront" accept="image/*" hidden>
      </div>

      <!-- Drag & Drop for Visiting Card Back -->
      <div class="drop-zone" id="backDrop">Drop VC Back / Click to Upload
        <input type="file" id="vcBack" name="vcBack" accept="image/*" hidden>
      </div>

      <!-- Remarks -->
      <div class="input-group">
        <textarea id="remarks" name="remarks"></textarea>
        <label for="remarks">Comments / Remarks</label>
      </div>

      <button type="submit">Submit</button>
    </form>
    <div id="formPopup"></div>
  </div>

  <script>
    document.addEventListener("DOMContentLoaded", () => {
      const groups = document.querySelectorAll(".input-group input, .input-group select, .input-group textarea");
      groups.forEach(el => {
        const parent = el.parentElement;
        const check = () => {
          if (el.value.trim() !== "") parent.classList.add("filled");
          else parent.classList.remove("filled");
        };
        el.addEventListener("input", check);
        el.addEventListener("blur", check);
        el.addEventListener("focus", () => parent.classList.add("filled"));
        check();
      });

      // Drag & drop
      function setupDrop(dropId, inputId) {
        const dropZone = document.getElementById(dropId);
        const input = document.getElementById(inputId);
        dropZone.addEventListener("click", () => input.click());
        dropZone.addEventListener("dragover", e => {
          e.preventDefault();
          dropZone.classList.add("dragover");
        });
        dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
        dropZone.addEventListener("drop", e => {
          e.preventDefault();
          dropZone.classList.remove("dragover");
          if (e.dataTransfer.files.length) {
            input.files = e.dataTransfer.files;
          }
        });
      }
      setupDrop("frontDrop", "vcFront");
      setupDrop("backDrop", "vcBack");
    });
  </script>
</body>
</html>
