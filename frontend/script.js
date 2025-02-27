// script.js

// Base URL for your API endpoints
const API_BASE = "https://ku55b83500.execute-api.eu-north-1.amazonaws.com/api"; // Update if needed

// ------------------ Utility & Existing Functions ------------------

// Easing function for smoother animation (easeOutQuad)
function easeOutQuad(t) {
  // t is progress from 0 to 1
  return t * (2 - t);
}

// Show a given step (1-based) and update the progress bar
function showStep(stepNumber) {
  // Select all steps
  const steps = document.querySelectorAll(".step");
  // Loop over steps and toggle "active" class based on the stepNumber
  steps.forEach((step, index) => {
    step.classList.toggle("active", index === stepNumber - 1);
  });

  // Update progress bar width
  const progress = document.getElementById("progress");
  progress.style.width = `${(stepNumber / steps.length) * 100}%`;
}

// Fetch and populate Brand dropdown; also store available brands globally
async function updateBrandDropdown() {
  try {
    const response = await fetch(`${API_BASE}/dynamic-filters`);
    const data = await response.json();

    const brandSelect = document.getElementById("brand");
    let optionsHtml = `<option value="" disabled selected>-- Select Brand --</option>`;
    if (data.brand && data.brand.length > 0) {
      window.availableBrands = data.brand; // For chat, search, etc.
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
  if (modelVal) {
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

// Animate number counter for average price result
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

// Show the Yearly Average Comparison Chart
async function showYearlyChart(brand, model, canvasId = "yearlyChart") {
  try {
    const queryParams = new URLSearchParams({ brand, model });
    const response = await fetch(`${API_BASE}/average-price-yearly?${queryParams.toString()}`);
    const data = await response.json();

    if (data.data) {
      const labels = data.data.map(item => item.year);
      const avgPrices = data.data.map(item => Math.round(item.avg_price));

      const container = document.getElementById(canvasId).parentNode;
      container.style.display = "block";

      const ctx = document.getElementById(canvasId).getContext("2d");
      if (window[canvasId + "Instance"]) {
        window[canvasId + "Instance"].destroy();
      }
      window[canvasId + "Instance"] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: `${brand} ${model} Yearly Average Price`,
            data: avgPrices,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: { enabled: true },
            legend: { display: true }
          },
          scales: {
            x: { title: { display: true, text: 'Year' } },
            y: { title: { display: true, text: 'Average Price (NIS)' } }
          }
        }
      });
    } else if (data.message) {
      console.error(data.message);
    }
  } catch (error) {
    console.error("Error fetching yearly average price data:", error);
  }
}

// Collect form data and fetch average price result, then show chart
async function getPriceEstimate() {
  const params = {};
  params.brand = document.getElementById("brand").value;
  const modelVal = document.getElementById("model").value;
  if (modelVal) {
    params.model = modelVal;
  }
  // Basic filters
  ["year", "fuel_type", "hand_num", "brand_group"].forEach((field) => {
    const el = document.getElementById(field);
    if (el && el.value !== "") {
      params[field] = el.value;
    }
  });
  // Optional features
  ["magnesium_wheels", "distance_control", "economical", "adaptive_cruise_control", "cruise_control", "four_wheel_drive"].forEach((field) => {
    const el = document.getElementById(field);
    if (el && el.value !== "") {
      params[field] = el.value;
    }
  });
  // Performance specs
  ["min_horse_power", "max_horse_power", "min_engine_volume", "max_engine_volume"].forEach((field) => {
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
    resultDiv.style.display = "block";

    if (data.min_price && data.max_price) {
      resultDiv.innerHTML = "";

      // Min Price
      const minElem = document.createElement("div");
      minElem.classList.add("price-text");
      minElem.textContent = `Minimum Price: ${data.min_price} NIS`;
      resultDiv.appendChild(minElem);

      // Max Price
      const maxElem = document.createElement("div");
      maxElem.classList.add("price-text");
      maxElem.textContent = `Maximum Price: ${data.max_price} NIS`;
      resultDiv.appendChild(maxElem);

      // Average Price
      const averageWrap = document.createElement("div");
      averageWrap.classList.add("price-text");
      averageWrap.innerHTML = `Average Price: <span id="avgPrice">0</span> NIS`;
      resultDiv.appendChild(averageWrap);

      let avgSpan = document.getElementById("avgPrice");
      const finalAvg = Math.round((data.min_price + data.max_price) / 2);
      animateValue(avgSpan, 0, finalAvg, 1000);
    } else if (data.message) {
      resultDiv.textContent = data.message;
    } else {
      resultDiv.textContent = "No price estimate available.";
    }

    // Hologram effect
    resultDiv.classList.add("hologram");
    setTimeout(() => {
      resultDiv.classList.remove("hologram");
    }, 1000);

    // "Estimate Another Car" button
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "Estimate Another Car";
    resetBtn.classList.add("reset-btn");
    resetBtn.addEventListener("click", resetEstimator);
    resultDiv.appendChild(resetBtn);

    // Show yearly chart if brand + model exist
    if (params.brand && params.model) {
      showYearlyChart(params.brand, params.model);
    }
  } catch (error) {
    console.error("Error fetching price estimate:", error);
  }
}

// Reset form and UI
function resetEstimator() {
  document.getElementById("filterForm").reset();
  updateBrandDropdown();
  showStep(1);
  document.getElementById("nextStep1").disabled = true;
  document.getElementById("nextStep2").disabled = true;

  const resultDiv = document.getElementById("priceEstimate");
  resultDiv.style.display = "none";
  resultDiv.innerHTML = "";

  document.getElementById("yearlyChartContainer").style.display = "none";
  if (window.yearlyChartInstance) {
    window.yearlyChartInstance.destroy();
  }
}

// ------------------ Chatbot Assistant Functions ------------------

// Process chat query by extracting brand/model, then calling /search-car
async function processChatQuery(query) {
  let brand = "";
  let model = "";

  if (window.availableBrands && window.availableBrands.length > 0) {
    for (let b of window.availableBrands) {
      if (query.toLowerCase().includes(b.toLowerCase())) {
        brand = b;
        break;
      }
    }
  }

  if (brand) {
    let regex = new RegExp(brand + "\\s+(\\w+)", "i");
    let match = query.match(regex);
    if (match && match[1]) {
      model = match[1];
    }
  }

  if (!brand || !model) {
    return "Please specify both the car brand and model in your query.";
  }

  const queryParams = new URLSearchParams({ brand, model });
  try {
    const response = await fetch(`${API_BASE}/search-car?${queryParams.toString()}`);
    const data = await response.json();
    if (data.message) {
      return data.message;
    }

    const estimate = data.estimate;
    let avgPrice = Math.round((estimate.min_price + estimate.max_price) / 2);
    let textResult = `The estimated price for ${brand} ${model} is around ${avgPrice} NIS.`;

    // Possibly also return yearly details if user wants them
    let lowerQuery = query.toLowerCase();
    let includeYearly =
      lowerQuery.includes("year") ||
      lowerQuery.includes("chart") ||
      lowerQuery.includes("graph") ||
      lowerQuery.includes("trend") ||
      lowerQuery.includes("detail");

    if (includeYearly && data.yearly && data.yearly.length > 0) {
      let yearlyInfo = "\nYearly averages:\n";
      data.yearly.forEach((item) => {
        yearlyInfo += `${item.year}: ${Math.round(item.avg_price)} NIS\n`;
      });
      textResult += yearlyInfo;
    }
    return textResult;
  } catch (error) {
    console.error("Error processing chat query:", error);
    return "Sorry, there was an error processing your request.";
  }
}

// Chat input event
document.getElementById("chatInput").addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    const input = e.target.value.trim();
    if (input !== "") {
      const messagesDiv = document.querySelector(".chat-messages");
      const userMsg = document.createElement("p");
      userMsg.textContent = "You: " + input;
      messagesDiv.appendChild(userMsg);
      e.target.value = "";

      // Show processing
      const processingMsg = document.createElement("p");
      processingMsg.textContent = "Assistant: Processing your request...";
      messagesDiv.appendChild(processingMsg);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;

      // Get reply
      const replyText = await processChatQuery(input);

      // Remove processing
      messagesDiv.removeChild(processingMsg);

      const reply = document.createElement("p");
      reply.textContent = "Assistant: " + replyText;
      messagesDiv.appendChild(reply);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  }
});

// ------------------ Search Modal & Voice Input Functions ------------------

// Open search modal
document.getElementById("searchIcon").addEventListener("click", () => {
  document.getElementById("searchModal").style.display = "block";
});

// Close search modal
document.getElementById("closeSearchModal").addEventListener("click", () => {
  document.getElementById("searchModal").style.display = "none";
});

// Auto‑complete suggestions
document.getElementById("searchQueryInput").addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  const suggestionsDiv = document.getElementById("searchSuggestions");
  suggestionsDiv.innerHTML = "";

  if (window.availableBrands && query.length > 0) {
    window.availableBrands.forEach((brand) => {
      if (brand.toLowerCase().startsWith(query)) {
        const suggestion = document.createElement("div");
        suggestion.classList.add("suggestion-item");
        suggestion.textContent = brand;
        suggestion.addEventListener("click", () => {
          document.getElementById("searchQueryInput").value = brand;
          suggestionsDiv.innerHTML = "";
        });
        suggestionsDiv.appendChild(suggestion);
      }
    });
  }
});

// Voice input using Web Speech API (if supported)
document.getElementById("voiceSearchButton").addEventListener("click", () => {
  if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
    alert("Voice recognition not supported in this browser.");
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.start();
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById("searchQueryInput").value = transcript;
  };
});

// Process search query
async function processSearchQuery(query) {
  let brand = "";
  let model = "";

  if (window.availableBrands && window.availableBrands.length > 0) {
    for (let b of window.availableBrands) {
      if (query.toLowerCase().includes(b.toLowerCase())) {
        brand = b;
        break;
      }
    }
  }
  if (brand) {
    let regex = new RegExp(brand + "\\s+(\\w+)", "i");
    let match = query.match(regex);
    if (match && match[1]) {
      model = match[1];
    }
  }

  if (!brand || !model) {
    return "Please specify both the car brand and model in your query.";
  }

  const queryParams = new URLSearchParams({ brand, model });
  try {
    const response = await fetch(`${API_BASE}/search-car?${queryParams.toString()}`);
    const data = await response.json();
    if (data.message) {
      return data.message;
    }
    const estimate = data.estimate;
    let avgPrice = Math.round((estimate.min_price + estimate.max_price) / 2);
    let textResult = `The estimated price for ${brand} ${model} is around ${avgPrice} NIS.`;

    // Show chart
    showYearlyChart(brand, model, "searchChart");
    return textResult;
  } catch (error) {
    console.error("Error processing search query:", error);
    return "Sorry, there was an error processing your request.";
  }
}

// When search button is clicked
document.getElementById("searchSubmit").addEventListener("click", async () => {
  const query = document.getElementById("searchQueryInput").value.trim();
  if (query === "") return;

  const result = await processSearchQuery(query);
  if (result) {
    document.getElementById("searchTextResult").textContent = result;
    document.getElementById("searchChartContainer").style.display = "none";
  } else {
    document.getElementById("searchChartContainer").style.display = "block";
  }
});

// ------------------ Navigation & Other Event Listeners ------------------

// STEP 1 -> 2
document.getElementById("nextStep1").addEventListener("click", async () => {
  const brand = document.getElementById("brand").value;
  if (!brand) {
    alert("Please select a brand.");
    return;
  }
  await updateModelDropdown();
  showStep(2);
});

// STEP 2 -> 1
document.getElementById("prevStep2").addEventListener("click", () => {
  showStep(1);
});

// STEP 2 -> 3
document.getElementById("nextStep2").addEventListener("click", async () => {
  const model = document.getElementById("model").value;
  if (!model) {
    alert("Please select a model.");
    return;
  }
  await updateStep3Dropdowns();
  showStep(3);
});

// STEP 3 -> 2
document.getElementById("prevStep3").addEventListener("click", () => {
  document.getElementById("priceEstimate").innerHTML = "";
  document.getElementById("priceEstimate").style.display = "none";
  showStep(2);
});

// Final estimate
document.getElementById("estimateBtn").addEventListener("click", getPriceEstimate);

// Disable next button (Step 1) until brand selected
document.getElementById("brand").addEventListener("change", function () {
  const nextBtn = document.getElementById("nextStep1");
  nextBtn.disabled = !this.value; // if brand is empty, remain disabled
});

// Disable next button (Step 2) until model selected
document.getElementById("model").addEventListener("change", function () {
  const nextBtn = document.getElementById("nextStep2");
  nextBtn.disabled = !this.value; // if model is empty, remain disabled
});

// Toggle dark mode
document.getElementById("darkModeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const toggleBtn = document.getElementById("darkModeToggle");
  toggleBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// Collapsible optional features
document
  .querySelector("#optionalFeatures .collapsible-legend")
  .addEventListener("click", () => {
    document.getElementById("optionalFeatures").classList.toggle("open");
  });

// Collapsible performance specs
document
  .querySelector("#performanceSpecs .collapsible-legend")
  .addEventListener("click", () => {
    document.getElementById("performanceSpecs").classList.toggle("open");
  });

// Chat panel
document.getElementById("chatButton").addEventListener("click", () => {
  document.getElementById("chatAssistant").classList.toggle("active");
});
document.getElementById("closeChat").addEventListener("click", () => {
  document.getElementById("chatAssistant").classList.remove("active");
});

// Close graph modal if clicked outside
window.addEventListener("click", (e) => {
  let modal = document.getElementById("graphModal");
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// Particles.js configuration
particlesJS("particles-js", {
  particles: {
    number: { value: 80, density: { enable: true, value_area: 800 } },
    color: { value: "#00ffff" },
    shape: { type: "star" },
    opacity: { value: 0.5, random: false },
    size: { value: 3, random: true },
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

// Initialize
window.addEventListener("DOMContentLoaded", () => {
  updateBrandDropdown();
  showStep(1);
});