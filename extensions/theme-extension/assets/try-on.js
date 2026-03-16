document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById("merrachi-try-on-modal");
  const btn = document.getElementById("merrachi-try-on-btn");
  const span = document.getElementsByClassName("merrachi-close")[0];
  const generateBtn = document.getElementById("merrachi-generate-btn");
  const resetBtn = document.getElementById("merrachi-reset-btn");
  
  const stepUpload = document.getElementById("merrachi-step-upload");
  const stepLoading = document.getElementById("merrachi-step-loading");
  const stepResult = document.getElementById("merrachi-step-result");
  const resultImage = document.getElementById("merrachi-result-image");

  if (!btn || !modal) return;

  // Open Modal
  btn.onclick = function() {
    modal.style.display = "block";
    // Check if user has saved photos (optional enhancement)
    // fetchSavedPhotos();
  }

  // Close Modal
  span.onclick = function() {
    modal.style.display = "none";
  }

  // Click outside to close
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }

  // Generate Try On
  generateBtn.onclick = async function() {
    const closeupFile = document.getElementById("merrachi-photo-closeup").files[0];
    const fullbodyFile = document.getElementById("merrachi-photo-fullbody").files[0];
    const customerId = btn.dataset.customerId;
    const productId = btn.dataset.productId;
    const productImage = btn.dataset.productImage;

    if (!closeupFile || !fullbodyFile) {
      alert("Please upload both photos.");
      return;
    }

    // Show Loading
    stepUpload.style.display = "none";
    stepLoading.style.display = "block";

    try {
      // Create FormData to send files
      const formData = new FormData();
      formData.append("closeup", closeupFile);
      formData.append("fullbody", fullbodyFile);
      formData.append("customerId", customerId);
      formData.append("productId", productId);
      formData.append("productImage", productImage);

      // Call Backend (App Proxy)
      // Ensure you configure App Proxy in Partner Dashboard to /apps/try-on
      const response = await fetch("/apps/try-on/generate", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const data = await response.json();
      
      if (data.resultUrl) {
        resultImage.src = data.resultUrl;
        stepLoading.style.display = "none";
        stepResult.style.display = "block";
      } else {
        throw new Error("No result URL returned");
      }

    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
      stepLoading.style.display = "none";
      stepUpload.style.display = "block";
    }
  }

  // Reset
  resetBtn.onclick = function() {
    stepResult.style.display = "none";
    stepUpload.style.display = "block";
    resultImage.src = "";
  }
});
