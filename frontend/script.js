const API_BASE = "http://127.0.0.1:8000";

// Helper function to show a specific step (1-indexed)
function showStep(stepNumber) {
  const steps = document.querySelectorAll(".step");
  steps.forEach((step, index) => {
    step.style.display = index === stepNumber - 1 ? "block" : "none";
  });
}

// STEP 1: Update the Brand dropdown using the dynamic-filters API
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

// STEP 2: Update the Model dropdown based on the selected Brand
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
    // Always provide an option to not specify the model
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

// STEP 3: Update additional basic filters (year, fuel_type, hand_num, brand_group)
// based on selected Brand and Model.
async function updateStep3Dropdowns() {
  const brand = document.getElementById("brand").value;
  const modelVal = document.getElementById("model").value;
  // Build params object: include model only if it’s not "none"
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

// Collect all filter values and call the estimate-price endpoint
async function getPriceEstimate() {
  const params = {};
  // Step 1: brand is required.
  params.brand = document.getElementById("brand").value;
  // Step 2: Include model only if user specified one (omit if "Not specify" is selected)
  const modelVal = document.getElementById("model").value;
  if (modelVal && modelVal !== "none") {
    params.model = modelVal;
  }
  // Step 3: Additional basic filters.
  ["year", "fuel_type", "hand_num", "brand_group"].forEach((field) => {
    const el = document.getElementById(field);
    if (el && el.value !== "") {
      params[field] = el.value;
    }
  });
  // Optional features.
  const optionalFeatures = [
    "magnesium_wheels",
    "distance_control",
    "economical",
    "adaptive_cruise_control",
    "cruise_control",
    "four_wheel_drive",
  ];
  optionalFeatures.forEach((field) => {
    const el = document.getElementById(field);
    if (el && el.value !== "") {
      params[field] = el.value;
    }
  });
  // Performance specifications.
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
    if (data.min_price && data.max_price) {
      resultDiv.textContent = `Estimated Price Range: ${data.min_price} - ${data.max_price} NIS`;
    } else if (data.message) {
      resultDiv.textContent = data.message;
    } else {
      resultDiv.textContent = "No price estimate available.";
    }
  } catch (error) {
    console.error("Error fetching price estimate:", error);
  }
}

// Navigation Event Listeners
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
  // Model is optional; no validation needed.
  await updateStep3Dropdowns();
  showStep(3);
});

document.getElementById("prevStep3").addEventListener("click", () => {
  showStep(2);
});

document
  .getElementById("estimateBtn")
  .addEventListener("click", getPriceEstimate);

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
  updateBrandDropdown();
  showStep(1);
});
