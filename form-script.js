/* ===== Base Reset ===== */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #f9f9f9;
  color: #222;
  line-height: 1.5;
}

h1, h2, h3, h4 {
  margin: 0 0 0.5em;
}

a {
  color: #007bff;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* ===== Header ===== */
.site-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #007bff;
  color: #fff;
  padding: 0.75em 1em;
  font-size: 0.9rem;
}

.site-header .header-right {
  display: flex;
  align-items: center;
}

#connectionStatus {
  font-size: 1.2rem;
  line-height: 1;
  margin-right: 8px;
  color: limegreen;
}

#connectionStatus.offline {
  color: red;
}

/* ===== Offline Banner ===== */
.offline-banner {
  background: #ffebcc;
  color: #333;
  text-align: center;
  padding: 0.5em;
  font-size: 0.85rem;
  border-bottom: 1px solid #e0c080;
}

/* ===== Form Layout ===== */
.form-container {
  max-width: 600px;
  margin: 1.5em auto;
  padding: 1.5em;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.input-container {
  position: relative;
  margin-bottom: 1.25em;
}

.input-container input,
.input-container select {
  width: 100%;
  padding: 0.8em 0.6em;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.95rem;
  background: #fff;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-container label {
  position: absolute;
  top: -0.65em;
  left: 0.75em;
  background: #fff;
  padding: 0 0.25em;
  font-size: 0.75rem;
  color: #555;
}

input:focus,
select:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.15);
}

input.glow-success,
select.glow-success {
  border-color: #28a745 !important;
  box-shadow: 0 0 0 2px rgba(40,167,69,0.25) !important;
}

/* ===== File Upload ===== */
.file-fieldset {
  border: 1px dashed #ccc;
  padding: 1em;
  border-radius: 6px;
  margin-bottom: 1.25em;
}

.file-fieldset legend {
  padding: 0 0.5em;
  font-size: 0.9rem;
  font-weight: bold;
}

.file-drop {
  position: relative;
  border: 2px dashed #bbb;
  border-radius: 6px;
  text-align: center;
  padding: 1em;
  margin-bottom: 1em;
  background: #fafafa;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.file-drop:hover,
.file-drop.dragover {
  border-color: #007bff;
  background: #f0f8ff;
}

.file-drop input[type="file"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.drop-instructions {
  font-size: 0.85rem;
  color: #666;
}

.thumb-wrap {
  margin-top: 0.5em;
  position: relative;
}

.thumb-wrap img {
  max-width: 100%;
  max-height: 120px;
  border-radius: 6px;
  display: block;
  margin: 0.25em auto;
}

.remove-file {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #dc3545;
  border: none;
  color: #fff;
  padding: 0.2em 0.5em;
  font-size: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  display: none;
}

.remove-file:hover {
  background: #c82333;
}

/* Progress bar */
.progress {
  margin-top: 0.25em;
  background: #eee;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  background: #007bff;
  height: 100%;
  width: 0%;
  transition: width 0.3s;
}

/* ===== Actions ===== */
.form-actions {
  display: flex;
  align-items: center;
  margin-top: 1em;
}

.submit-btn {
  padding: 0.75em 1.25em;
  font-size: 1rem;
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover {
  background: #0069d9;
}

.submit-btn.loading {
  opacity: 0.6;
  cursor: wait;
}

button.muted {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
}

button.muted:hover {
  text-decoration: underline;
}

/* ===== Queue List ===== */
.queue-list {
  margin-top: 1.5em;
  padding: 1em;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.queue-list ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.queue-list li {
  padding: 0.4em 0;
  border-bottom: 1px solid #ddd;
  font-size: 0.9rem;
}

.queue-list li:last-child {
  border-bottom: none;
}

/* ===== Popup Messages ===== */
.form-popup {
  position: fixed;
  bottom: 1em;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.8em 1.2em;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: bold;
  color: #fff;
  background: #28a745; /* green by default */
  box-shadow: 0 2px 6px rgba(0,0,0,0.25);
  animation: fadeInOut 3s ease forwards;
  z-index: 999;
}

.form-popup.error {
  background: #dc3545;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translate(-50%, 20px); }
  10% { opacity: 1; transform: translate(-50%, 0); }
  90% { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, 20px); }
}

/* ===== Dark Mode ===== */
@media (prefers-color-scheme: dark) {
  body {
    background: #121212;
    color: #eee;
  }

  .form-container {
    background: #1e1e1e;
    box-shadow: 0 2px 8px rgba(0,0,0,0.6);
  }

  .input-container input,
  .input-container select {
    background: #2c2c2c;
    color: #eee;
    border: 1px solid #555;
  }

  .input-container label {
    background: #1e1e1e;
    color: #aaa;
  }

  .file-drop {
    background: #2a2a2a;
    border-color: #444;
  }

  .drop-instructions {
    color: #aaa;
  }

  .queue-list {
    background: #1e1e1e;
    border-color: #444;
  }
}
