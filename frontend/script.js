const API_BASE = "https://ku55b83500.execute-api.eu-north-1.amazonaws.com/api";

// Easing function for smoother animation (easeOutQuad)
function easeOutQuad(t) {
  return t * (2 - t);
}

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
    const response = await fetch(
      `${API_BASE}/dynamic-filters?${queryParams.toString()}`
    );
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
    const response = await fetch(
      `${API_BASE}/dynamic-filters?${queryParams.toString()}`
    );
    const data = await response.json();
    const fields = ["year", "fuel_type", "hand_num", "brand_group"];
    fields.forEach((field) => {
      const select = document.getElementById(field);
      let optionsHtml = `<option value="" disabled selected>-- Select ${field.replace(
        "_",
        " "
      )} --</option>`;
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

// Animate number counter for price estimate with easing
function animateValue(element, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    let progress = (timestamp - startTimestamp) / duration;
    progress = Math.min(progress, 1);
    const easedProgress = easeOutQuad(progress);
    const value = Math.floor(easedProgress * (end - start) + start);
    element.textContent = value;
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };
  requestAnimationFrame(step);
}

// Collect form data and fetch price estimate, then show modal
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
    const response = await fetch(
      `${API_BASE}/estimate-price?${queryParams.toString()}`
    );
    const data = await response.json();
    const resultDiv = document.getElementById("priceEstimate");
    resultDiv.style.display = "block";
    if (data.min_price && data.max_price) {
      resultDiv.innerHTML = `<div class="price-text">Estimated Price Range: <span id="minPrice">0</span> - <span id="maxPrice">0</span> NIS</div>`;
      let minSpan = document.getElementById("minPrice");
      let maxSpan = document.getElementById("maxPrice");
      animateValue(minSpan, 0, data.min_price, 1000);
      animateValue(maxSpan, 0, data.max_price, 1000);
    } else if (data.message) {
      resultDiv.textContent = data.message;
    } else {
      resultDiv.textContent = "No price estimate available.";
    }
    // Holographic price reveal effect
    resultDiv.classList.add("hologram");
    setTimeout(() => {
      resultDiv.classList.remove("hologram");
    }, 1000);
    // Append "Estimate Another Car" button below the price text
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "Estimate Another Car";
    resetBtn.classList.add("reset-btn");
    resetBtn.addEventListener("click", resetEstimator);
    resultDiv.appendChild(resetBtn);
  } catch (error) {
    console.error("Error fetching price estimate:", error);
  }
}

// Reset form and UI to initial state
function resetEstimator() {
  document.getElementById("filterForm").reset();
  updateBrandDropdown();
  showStep(1);
  document.getElementById("nextStep1").disabled = true;
  const resultDiv = document.getElementById("priceEstimate");
  resultDiv.style.display = "none";
  resultDiv.innerHTML = "";
}

// Navigation event listeners
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
  document.getElementById("priceEstimate").innerHTML = "";
  document.getElementById("priceEstimate").style.display = "none";
  showStep(2);
});
document
  .getElementById("estimateBtn")
  .addEventListener("click", getPriceEstimate);
document.getElementById("brand").addEventListener("change", function () {
  const nextBtn = document.getElementById("nextStep1");
  nextBtn.disabled = !this.value;
});
document.getElementById("darkModeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const toggleBtn = document.getElementById("darkModeToggle");
  toggleBtn.textContent = document.body.classList.contains("dark")
    ? "☀️"
    : "🌙";
});
document
  .querySelector("#optionalFeatures .collapsible-legend")
  .addEventListener("click", () => {
    document.getElementById("optionalFeatures").classList.toggle("open");
  });
document
  .querySelector("#performanceSpecs .collapsible-legend")
  .addEventListener("click", () => {
    document.getElementById("performanceSpecs").classList.toggle("open");
  });
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
        reply.textContent =
          "Assistant: Let me know if you have any more questions!";
        messagesDiv.appendChild(reply);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }, 800);
    }
  }
});

// Particle Background Initialization with interactive "space" stars
particlesJS("particles-js", {
  particles: {
    number: {
      value: 80,
      density: {
        enable: true,
        value_area: 800,
      },
    },
    color: { value: "#00ffff" },
    shape: {
      type: "star",
    },
    opacity: {
      value: 0.5,
      random: false,
    },
    size: {
      value: 3,
      random: true,
    },
    line_linked: {
      enable: true,
      distance: 150,
      color: "#00ffff",
      opacity: 0.4,
      width: 1,
    },
    move: {
      enable: true,
      speed: 2,
      direction: "none",
      random: false,
      straight: false,
      out_mode: "out",
      bounce: false,
    },
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: { enable: true, mode: "grab" },
      onclick: { enable: true, mode: "push" },
    },
    modes: {
      grab: { distance: 140, line_linked: { opacity: 1 } },
      push: { particles_nb: 4 },
    },
  },
  retina_detect: true,
});

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
  updateBrandDropdown();
  showStep(1);
});
