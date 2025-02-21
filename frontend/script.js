// Set the backend API base URL
const API_BASE = "http://127.0.0.1:8000";

// List of basic dropdown filters (dynamic options)
const dropdownFilters = [
  "brand",
  "model",
  "year",
  "fuel_type",
  "hand_num",
  "brand_group",
];

// List of additional feature filters (static yes/no) that are only included after user interaction
const additionalFeatures = [
  "magnesium_wheels",
  "distance_control",
  "economical",
  "adaptive_cruise_control",
  "cruise_control",
  "four_wheel_drive",
];

// Debounce helper: delays execution until no changes occur for the specified delay
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Helper: Get current filter values.
// Only include a value if the field has been touched and a valid selection exists.
function getCurrentFilters() {
  const filters = {};

  // Process basic dynamic filters
  dropdownFilters.forEach((filter) => {
    const el = document.getElementById(filter);
    if (el && el.value !== "" && el.getAttribute("data-touched") === "true") {
      filters[filter] = el.value;
    }
  });

  // Process additional features (only if touched)
  additionalFeatures.forEach((filter) => {
    const el = document.getElementById(filter);
    if (el && el.value !== "" && el.getAttribute("data-touched") === "true") {
      filters[filter] = el.value;
    }
  });

  return filters;
}

// Show a temporary loading indicator in a select element
function showLoading(selectElement) {
  selectElement.innerHTML = `<option value="" disabled selected>Loading...</option>`;
}

// Update basic dropdown options from the dynamic-filters API while preserving selections
async function updateDropdowns() {
  const filters = getCurrentFilters();
  const queryParams = new URLSearchParams(filters);
  try {
    const response = await fetch(
      `${API_BASE}/dynamic-filters?${queryParams.toString()}`
    );
    const data = await response.json();

    // Update each basic dropdown with returned options
    dropdownFilters.forEach((filter) => {
      const select = document.getElementById(filter);
      if (select) {
        // Save the current selection if touched
        const isTouched = select.getAttribute("data-touched") === "true";
        const currentValue = isTouched ? select.value : "";

        // Show loading indicator while updating
        showLoading(select);

        // Rebuild the dropdown options with a placeholder
        // Note: The placeholder is not selectable (disabled)
        let optionsHtml = `<option value="" disabled>-- Select ${filter.replace(
          "_",
          " "
        )} --</option>`;
        if (data[filter] && data[filter].length > 0) {
          data[filter].forEach((item) => {
            optionsHtml += `<option value="${item}">${item}</option>`;
          });
        }
        select.innerHTML = optionsHtml;

        // Restore previous selection if it still exists among the options
        if (currentValue !== "") {
          select.value = currentValue;
        } else {
          select.selectedIndex = 0;
        }
      }
    });
    // Additional features remain static.
  } catch (error) {
    console.error("Error updating filters:", error);
  }
}

// Wrap updateDropdowns in a debounce (300ms delay)
const debouncedUpdateDropdowns = debounce(updateDropdowns, 300);

// Call price estimate endpoint with current filter values plus performance inputs
async function getPriceEstimate() {
  const params = { ...getCurrentFilters() };
  // Gather numeric performance inputs (if provided)
  const numFields = [
    "min_horse_power",
    "max_horse_power",
    "min_engine_volume",
    "max_engine_volume",
  ];
  numFields.forEach((field) => {
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

// Set up event listeners for basic dropdowns to update options dynamically.
// Mark the field as touched and call the debounced update function.
dropdownFilters.forEach((filter) => {
  const el = document.getElementById(filter);
  if (el) {
    el.addEventListener("change", () => {
      el.setAttribute("data-touched", "true");
      debouncedUpdateDropdowns();
    });
  }
});

// Set up event listeners for additional features to mark them as touched.
additionalFeatures.forEach((filter) => {
  const el = document.getElementById(filter);
  if (el) {
    el.addEventListener("focus", () => {
      if (el.getAttribute("data-touched") !== "true") {
        el.setAttribute("data-touched", "true");
      }
    });
  }
});

// Set up the Price Estimate button click event
document
  .getElementById("estimateBtn")
  .addEventListener("click", getPriceEstimate);

// On page load, initialize basic dropdowns.
window.addEventListener("DOMContentLoaded", updateDropdowns);
