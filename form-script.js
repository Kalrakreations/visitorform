<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Visitor Form - Sahil Kalra</title>
  <link rel="manifest" href="manifest.json" />
  <meta name="theme-color" content="#007bff" />

  <style>
    /* ===== RESET & BASE ===== */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      background: #f9f9f9;
      padding: 20px;
      color: #333;
    }
    h1 {
      text-align: center;
      margin-bottom: 20px;
      color: #007bff;
    }

    /* ===== FORM CONTAINER ===== */
    form {
      max-width: 800px;
      margin: auto;
      background: #fff;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    .form-row {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    .form-group {
      flex: 1;
      min-width: 220px;
      position: relative;
      margin-bottom: 20px;
    }

    input, select, textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #ccc;
      border-radius: 6px;
      outline: none;
      font-size: 14px;
      background: #fff;
    }
    input:focus, select:focus, textarea:focus {
      border-color: #007bff;
      box-shadow: 0 0 5px rgba(0,123,255,0.3);
    }

    /* ===== FLOATING LABELS ===== */
    .floating-label {
      position: absolute;
      left: 12px;
      top: 12px;
      color: #777;
      font-size: 14px;
      pointer-events: none;
      transition: 0.2s ease all;
      background: transparent;
    }
    input:focus + .floating-label,
    input.not-empty + .floating-label,
    select:focus + .floating-label,
    select.not-empty + .floating-label,
    textarea:focus + .floating-label,
    textarea.not-empty + .floating-label {
      top: -8px;
      left: 8px;
      font-size: 12px;
      color: #007bff;
      background: #fff;
      padding: 0 4px;
    }

    /* ===== BUTTONS ===== */
    button {
      padding: 12px 20px;
      border: none;
      background: #007bff;
      color: #fff;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      transition: 0.2s;
    }
    button:hover { background: #0056b3; }

    /* ===== IMAGE UPLOAD AREA ===== */
    .upload-area {
      border: 2px dashed #007bff;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      cursor: pointer;
      color: #555;
      transition: 0.2s;
    }
    .upload-area.dragover { background: #e9f5ff; }

    .preview-img {
      margin-top: 10px;
      max-width: 100%;
      height: auto;
      border: 1px solid #ddd;
      border-radius: 8px;
    }

    /* ===== STATUS MESSAGE ===== */
    .status {
      margin-top: 15px;
      font-size: 14px;
      text-align: center;
      font-weight: bold;
    }
    .status.success { color: green; }
    .status.error { color: red; }
  </style>
</head>
<body>
  <h1>Visitor Form</h1>
  <form id="visitorForm">
    <div class="form-row">
      <div class="form-group">
        <input type="text" id="name" name="name" required />
        <label class="floating-label" for="name">Full Name</label>
      </div>
      <div class="form-group">
        <input type="tel" id="phone" name="phone" required />
        <label class="floating-label" for="phone">Phone</label>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <input type="email" id="email" name="email" />
        <label class="floating-label" for="email">Email</label>
      </div>
      <div class="form-group">
        <input type="text" id="company" name="company" />
        <label class="floating-label" for="company">Company</label>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <select id="country" name="country" required>
          <option value=""></option>
          <option value="India">India</option>
          <option value="USA">USA</option>
          <option value="UK">UK</option>
        </select>
        <label class="floating-label" for="country">Country</label>
      </div>
      <div class="form-group">
        <input type="text" id="state" name="state" />
        <label class="floating-label" for="state">State</label>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <input type="text" id="city" name="city" />
        <label class="floating-label" for="city">City</label>
      </div>
      <div class="form-group">
        <input type="text" id="business" name="business" />
        <label class="floating-label" for="business">Business</label>
      </div>
    </div>

    <!-- Image Upload -->
    <div class="form-group">
      <div id="uploadArea" class="upload-area">
        Drag & Drop, Upload or Capture Visitor Card
        <input type="file" id="vcImage" accept="image/*" capture="environment" hidden />
      </div>
      <img id="preview" class="preview-img" style="display:none;" />
    </div>

    <!-- Remarks with fixed floating label -->
    <div class="form-group">
      <textarea id="remarks" name="remarks"></textarea>
      <label class="floating-label" for="remarks">Remarks / Comments</label>
    </div>

    <button type="submit">Submit</button>
    <div id="status" class="status"></div>
  </form>

  <script>
    // ===== FLOATING LABEL FIX =====
    document.querySelectorAll("input, select, textarea").forEach((field) => {
      function checkValue() {
        if (field.value.trim() !== "") {
          field.classList.add("not-empty");
        } else {
          field.classList.remove("not-empty");
        }
      }
      field.addEventListener("input", checkValue);
      field.addEventListener("blur", checkValue);
      checkValue();
    });

    // ===== IMAGE UPLOAD HANDLING =====
    const uploadArea = document.getElementById("uploadArea");
    const fileInput = document.getElementById("vcImage");
    const preview = document.getElementById("preview");

    uploadArea.addEventListener("click", () => fileInput.click());
    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.classList.add("dragover");
    });
    uploadArea.addEventListener("dragleave", () => {
      uploadArea.classList.remove("dragover");
    });
    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.classList.remove("dragover");
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        previewFile(fileInput.files[0]);
      }
    });
    fileInput.addEventListener("change", () => {
      if (fileInput.files.length) {
        previewFile(fileInput.files[0]);
      }
    });

    function previewFile(file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        preview.src = e.target.result;
        preview.style.display = "block";
      };
      reader.readAsDataURL(file);
    }

    // ===== OFFLINE SUBMISSION STORAGE =====
    async function saveOffline(data) {
      let submissions = JSON.parse(localStorage.getItem("submissions") || "[]");
      // Avoid duplicates
      if (!submissions.find((s) => JSON.stringify(s) === JSON.stringify(data))) {
        submissions.push(data);
        localStorage.setItem("submissions", JSON.stringify(submissions));
      }
    }

    async function syncSubmissions() {
      let submissions = JSON.parse(localStorage.getItem("submissions") || "[]");
      if (!navigator.onLine || submissions.length === 0) return;

      for (let i = 0; i < submissions.length; i++) {
        try {
          let res = await fetch("YOUR_GOOGLE_SCRIPT_WEBAPP_URL", {
            method: "POST",
            body: new URLSearchParams(submissions[i]),
          });
          if (res.ok) {
            submissions.splice(i, 1);
            i--;
          }
        } catch (err) {
          console.log("Sync error:", err);
        }
      }
      localStorage.setItem("submissions", JSON.stringify(submissions));
    }

    window.addEventListener("online", syncSubmissions);

    // ===== FORM SUBMIT =====
    document.getElementById("visitorForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const status = document.getElementById("status");
      status.textContent = "Submitting...";
      status.className = "status";

      const formData = new FormData(e.target);
      let data = {};
      formData.forEach((v, k) => (data[k] = v));

      // Handle image
      if (fileInput.files.length) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = async function () {
          data.vcImageBase64 = reader.result.split(",")[1];
          await processSubmission(data, status);
        };
        reader.readAsDataURL(file);
      } else {
        await processSubmission(data, status);
      }
    });

    async function processSubmission(data, status) {
      if (navigator.onLine) {
        try {
          let res = await fetch("YOUR_GOOGLE_SCRIPT_WEBAPP_URL", {
            method: "POST",
            body: new URLSearchParams(data),
          });
          if (res.ok) {
            status.textContent = "Submitted successfully!";
            status.className = "status success";
            document.getElementById("visitorForm").reset();
            document.querySelectorAll(".not-empty").forEach((el) => el.classList.remove("not-empty"));
            preview.style.display = "none";
          } else {
            throw new Error("Server error");
          }
        } catch (err) {
          status.textContent = "Offline: Saved locally.";
          status.className = "status error";
          await saveOffline(data);
        }
      } else {
        status.textContent = "Offline: Saved locally.";
        status.className = "status error";
        await saveOffline(data);
      }
    }

    // Sync on load
    window.addEventListener("load", syncSubmissions);
  </script>
</body>
</html>
