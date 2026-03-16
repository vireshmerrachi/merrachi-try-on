(function () {
  // Only run on product pages
  if (!window.location.pathname.includes("/products/")) return;

  // ─── CONFIG ──────────────────────────────────────────────────────────────────
  const APP_API_URL = "https://your-app-url.com"; // REPLACE with your hosted app URL
  // ─────────────────────────────────────────────────────────────────────────────

  // ─── CSS ─────────────────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    #merrachi-try-on-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 14px 24px;
      background: #111;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.05em;
      border: 2px solid #111;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
      width: 100%;
      justify-content: center;
    }
    #merrachi-try-on-btn:hover {
      background: #fff;
      color: #111;
    }
    #merrachi-modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.55);
      z-index: 99999;
      align-items: center;
      justify-content: center;
    }
    #merrachi-modal-overlay.open {
      display: flex;
    }
    #merrachi-modal {
      background: #fff;
      border-radius: 12px;
      padding: 36px;
      max-width: 480px;
      width: 90%;
      position: relative;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    #merrachi-modal h2 {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 6px;
    }
    #merrachi-modal p.subtitle {
      font-size: 13px;
      color: #666;
      margin: 0 0 24px;
    }
    .merrachi-close {
      position: absolute;
      top: 16px; right: 16px;
      background: none;
      border: none;
      font-size: 22px;
      cursor: pointer;
      color: #999;
      line-height: 1;
    }
    .merrachi-upload-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }
    .merrachi-upload-box {
      border: 2px dashed #ddd;
      border-radius: 8px;
      padding: 16px 12px;
      text-align: center;
      cursor: pointer;
      position: relative;
      transition: border-color 0.2s;
    }
    .merrachi-upload-box:hover { border-color: #111; }
    .merrachi-upload-box label {
      font-size: 12px;
      font-weight: 600;
      display: block;
      margin-bottom: 6px;
    }
    .merrachi-upload-box span {
      font-size: 11px;
      color: #999;
    }
    .merrachi-upload-box input[type="file"] {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
      width: 100%;
      height: 100%;
    }
    .merrachi-upload-box .preview {
      width: 100%;
      max-height: 120px;
      object-fit: cover;
      border-radius: 6px;
      display: none;
    }
    #merrachi-generate-btn {
      width: 100%;
      padding: 14px;
      background: #111;
      color: #fff;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    #merrachi-generate-btn:disabled { background: #ccc; cursor: not-allowed; }
    #merrachi-step-loading { text-align: center; padding: 20px 0; display: none; }
    #merrachi-step-loading .spinner {
      width: 40px; height: 40px;
      border: 4px solid #eee;
      border-top-color: #111;
      border-radius: 50%;
      animation: merrachispin 0.8s linear infinite;
      margin: 0 auto 14px;
    }
    @keyframes merrachispin { to { transform: rotate(360deg); } }
    #merrachi-step-result { display: none; text-align: center; }
    #merrachi-step-result img { width: 100%; border-radius: 8px; margin-bottom: 14px; }
    #merrachi-reset-btn {
      background: none; border: 2px solid #111; color: #111;
      padding: 10px 24px; border-radius: 4px; cursor: pointer; font-weight: 600;
    }
    .merrachi-saved-notice {
      font-size: 11px; color: #888; margin-top: 8px; text-align: center;
    }
  `;
  document.head.appendChild(style);

  // ─── HTML ─────────────────────────────────────────────────────────────────────
  function injectButton() {
    const addToCartBtn = document.querySelector(
      'form[action="/cart/add"] button[type="submit"], .product-form__submit, [data-testid="add-to-cart"]'
    );
    if (!addToCartBtn) return;

    const btn = document.createElement("button");
    btn.id = "merrachi-try-on-btn";
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
      </svg>
      Try On
    `;
    addToCartBtn.parentNode.insertBefore(btn, addToCartBtn.nextSibling);

    btn.addEventListener("click", () => openModal());
  }

  function createModal() {
    const overlay = document.createElement("div");
    overlay.id = "merrachi-modal-overlay";
    overlay.innerHTML = `
      <div id="merrachi-modal">
        <button class="merrachi-close">&times;</button>
        <h2>Virtual Try On</h2>
        <p class="subtitle">Upload your photos and see how this looks on you.</p>

        <div id="merrachi-step-upload">
          <div class="merrachi-upload-row">
            <div class="merrachi-upload-box" id="merrachi-closeup-box">
              <label>Close-up Face</label>
              <img class="preview" id="merrachi-closeup-preview"/>
              <span>Upload photo</span>
              <input type="file" id="merrachi-photo-closeup" accept="image/*">
            </div>
            <div class="merrachi-upload-box" id="merrachi-fullbody-box">
              <label>Full Body</label>
              <img class="preview" id="merrachi-fullbody-preview"/>
              <span>Upload photo</span>
              <input type="file" id="merrachi-photo-fullbody" accept="image/*">
            </div>
          </div>
          <button id="merrachi-generate-btn" disabled>Generate Try On</button>
          <p class="merrachi-saved-notice" id="merrachi-saved-msg"></p>
        </div>

        <div id="merrachi-step-loading">
          <div class="spinner"></div>
          <p>Generating your look...</p>
          <p style="font-size:12px;color:#999">This can take 15–30 seconds.</p>
        </div>

        <div id="merrachi-step-result">
          <img id="merrachi-result-image" src="" alt="Your Try On Result">
          <button id="merrachi-reset-btn">Try Again</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Close
    overlay.querySelector(".merrachi-close").addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });

    // File Previews
    setupFileInput("merrachi-photo-closeup", "merrachi-closeup-preview", "merrachi-closeup-box");
    setupFileInput("merrachi-photo-fullbody", "merrachi-fullbody-preview", "merrachi-fullbody-box");

    // Generate
    document.getElementById("merrachi-generate-btn").addEventListener("click", handleGenerate);

    // Reset
    document.getElementById("merrachi-reset-btn").addEventListener("click", () => {
      document.getElementById("merrachi-step-result").style.display = "none";
      document.getElementById("merrachi-step-upload").style.display = "block";
      document.getElementById("merrachi-result-image").src = "";
    });
  }

  function setupFileInput(inputId, previewId, boxId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const box = document.getElementById(boxId);

    input.addEventListener("change", () => {
      const file = input.files[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      preview.src = url;
      preview.style.display = "block";
      box.querySelector("span").style.display = "none";

      checkBothUploaded();
    });
  }

  function checkBothUploaded() {
    const c = document.getElementById("merrachi-photo-closeup").files[0];
    const f = document.getElementById("merrachi-photo-fullbody").files[0];
    document.getElementById("merrachi-generate-btn").disabled = !(c && f);
  }

  async function handleGenerate() {
    const closeupFile = document.getElementById("merrachi-photo-closeup").files[0];
    const fullbodyFile = document.getElementById("merrachi-photo-fullbody").files[0];
    const productImage = document.querySelector(
      ".product__media img, .product-single__photo img, [data-product-image]"
    )?.src || "";

    // Get product ID from page meta
    const productId =
      document.querySelector('[data-product-id]')?.dataset?.productId ||
      window.__st?.p_id ||
      "";

    // Get customer ID if logged in (Shopify injects this in meta tag)
    const customerId =
      document.querySelector('meta[name="shopify-checkout-api-token"]')?.content || "";

    document.getElementById("merrachi-step-upload").style.display = "none";
    document.getElementById("merrachi-step-loading").style.display = "block";

    try {
      const formData = new FormData();
      formData.append("closeup", closeupFile);
      formData.append("fullbody", fullbodyFile);
      formData.append("customerId", customerId);
      formData.append("productId", productId);
      formData.append("productImage", productImage);

      const res = await fetch(`${APP_API_URL}/api/try-on/generate`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();

      document.getElementById("merrachi-step-loading").style.display = "none";
      document.getElementById("merrachi-result-image").src = data.resultUrl;
      document.getElementById("merrachi-step-result").style.display = "block";
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
      document.getElementById("merrachi-step-loading").style.display = "none";
      document.getElementById("merrachi-step-upload").style.display = "block";
    }
  }

  function openModal() {
    document.getElementById("merrachi-modal-overlay").classList.add("open");
  }

  function closeModal() {
    document.getElementById("merrachi-modal-overlay").classList.remove("open");
  }

  // ─── INIT ─────────────────────────────────────────────────────────────────────
  function init() {
    createModal();
    injectButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
