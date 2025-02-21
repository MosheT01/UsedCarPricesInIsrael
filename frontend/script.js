const API_BASE = "http://127.0.0.1:8000";

// Show a given step (1-based) and update the progress bar
function showStep(stepNumber) {
  const steps = document.querySelectorAll(".step");
  steps.forEach((step, index) => {
    step.classList.toggle("active", index === stepNumber - 1);
  });
  const progress = document.getElementById("progress");
  progress.style.width = `${(stepNumber / steps.length) * 100}%`;
}

// Fetch and populate Brand dropdown
async function updateBrandDropdown() {
  try {
    const response = await fetch(`${API_BASE}/dynamic-filters`);
    const data = await response.json();
    const brandSelect = document.getElementById("brand");
    let optionsHtml = `<option value="" disabled selected>-- Select Brand --</option>`;
    if (data.brand && data.brand.length > 0) {
      data.brand.forEach((item) => {
        optionsHtml += `<option value="${item}">${item}</option>`;
      });
    }
    brandSelect.innerHTML = optionsHtml;
  } catch (error) {
    console.error("Error fetching brands:", error);
  }
}

// Fetch and populate Model dropdown based on selected Brand
async function updateModelDropdown() {
  const brand = document.getElementById("brand").value;
  if (!brand) return;
  try {
    const queryParams = new URLSearchParams({ brand });
    const response = await fetch(`${API_BASE}/dynamic-filters?${queryParams.toString()}`);
    const data = await response.json();
    const modelSelect = document.getElementById("model");
    let optionsHtml = `<option value="" disabled selected>-- Select Model --</option>`;
    optionsHtml += `<option value="none">Not specify</option>`;
    if (data.model && data.model.length > 0) {
      data.model.forEach((item) => {
        optionsHtml += `<option value="${item}">${item}</option>`;
      });
    }
    modelSelect.innerHTML = optionsHtml;
  } catch (error) {
    console.error("Error fetching models:", error);
  }
}

// Fetch additional filters for Step 3
async function updateStep3Dropdowns() {
  const brand = document.getElementById("brand").value;
  const modelVal = document.getElementById("model").value;
  const params = { brand };
  if (modelVal && modelVal !== "none") {
    params.model = modelVal;
  }
  try {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE}/dynamic-filters?${queryParams.toString()}`);
    const data = await response.json();
    const fields = ["year", "fuel_type", "hand_num", "brand_group"];
    fields.forEach((field) => {
      const select = document.getElementById(field);
      let optionsHtml = `<option value="" disabled selected>-- Select ${field.replace("_", " ")} --</option>`;
      if (data[field] && data[field].length > 0) {
        data[field].forEach((item) => {
          optionsHtml += `<option value="${item}">${item}</option>`;
        });
      }
      select.innerHTML = optionsHtml;
    });
  } catch (error) {
    console.error("Error fetching additional filters:", error);
  }
}

// Collect form data and fetch price estimate
async function getPriceEstimate() {
  const params = {};
  // Step 1: brand is required.
  params.brand = document.getElementById("brand").value;
  // Step 2: model if user selected one
  const modelVal = document.getElementById("model").value;
  if (modelVal && modelVal !== "none") {
    params.model = modelVal;
  }
  // Step 3: additional filters
  ["year", "fuel_type", "hand_num", "brand_group"].forEach((field) => {
    const el = document.getElementById(field);
    if (el && el.value !== "") {
      params[field] = el.value;
    }
  });
  // Optional features
  [
    "magnesium_wheels",
    "distance_control",
    "economical",
    "adaptive_cruise_control",
    "cruise_control",
    "four_wheel_drive",
  ].forEach((field) => {
    const el = document.getElementById(field);
    if (el && el.value !== "") {
      params[field] = el.value;
    }
  });
  // Performance specs
  [
    "min_horse_power",
    "max_horse_power",
    "min_engine_volume",
    "max_engine_volume",
  ].forEach((field) => {
    const el = document.getElementById(field);
    if (el && el.value !== "") {
      params[field] = el.value;
    }
  });

  const queryParams = new URLSearchParams(params);
  try {
    const response = await fetch(`${API_BASE}/estimate-price?${queryParams.toString()}`);
    const data = await response.json();
    const resultDiv = document.getElementById("priceEstimate");
    if (data.min_price && data.max_price) {
      resultDiv.textContent = `Estimated Price Range: ${data.min_price} - ${data.max_price} NIS`;
    } else if (data.message) {
      resultDiv.textContent = data.message;
    } else {
      resultDiv.textContent = "No price estimate available.";
    }
    // Pop animation
    resultDiv.classList.add("animate");
    setTimeout(() => {
      resultDiv.classList.remove("animate");
    }, 500);
  } catch (error) {
    console.error("Error fetching price estimate:", error);
  }
}

// Navigation
document.getElementById("nextStep1").addEventListener("click", async () => {
  const brand = document.getElementById("brand").value;
  if (!brand) {
    alert("Please select a brand.");
    return;
  }
  await updateModelDropdown();
  showStep(2);
});
document.getElementById("prevStep2").addEventListener("click", () => {
  showStep(1);
});
document.getElementById("nextStep2").addEventListener("click", async () => {
  await updateStep3Dropdowns();
  showStep(3);
});
document.getElementById("prevStep3").addEventListener("click", () => {
  showStep(2);
});
document.getElementById("estimateBtn").addEventListener("click", getPriceEstimate);

// Dark Mode Toggle
document.getElementById("darkModeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const toggleBtn = document.getElementById("darkModeToggle");
  toggleBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// Collapsible toggles
document
  .querySelector('#optionalFeatures .collapsible-legend')
  .addEventListener('click', () => {
    document.getElementById('optionalFeatures').classList.toggle('open');
  });
document
  .querySelector('#performanceSpecs .collapsible-legend')
  .addEventListener('click', () => {
    document.getElementById('performanceSpecs').classList.toggle('open');
  });

// 3D Card Tilt Effect
const card = document.querySelector('.card');
card.addEventListener('mousemove', (e) => {
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const midX = rect.width / 2;
  const midY = rect.height / 2;
  const deltaX = (x - midX) / midX;
  const deltaY = (y - midY) / midY;
  const maxTilt = 10;
  card.style.transform = `perspective(1000px) rotateX(${ -deltaY * maxTilt }deg) rotateY(${ deltaX * maxTilt }deg)`;
});
card.addEventListener('mouseleave', () => {
  card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
});

// Chat Assistant
document.getElementById("chatButton").addEventListener("click", () => {
  document.getElementById("chatAssistant").classList.toggle("active");
});
document.getElementById("closeChat").addEventListener("click", () => {
  document.getElementById("chatAssistant").classList.remove("active");
});
document.getElementById("chatInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const input = e.target.value.trim();
    if (input !== "") {
      const messagesDiv = document.querySelector(".chat-messages");
      const userMsg = document.createElement("p");
      userMsg.textContent = "You: " + input;
      messagesDiv.appendChild(userMsg);
      e.target.value = "";
      setTimeout(() => {
        const reply = document.createElement("p");
        reply.textContent = "Assistant: Let me know if you have any more questions!";
        messagesDiv.appendChild(reply);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }, 800);
    }
  }
});

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
  updateBrandDropdown();
  showStep(1);
});