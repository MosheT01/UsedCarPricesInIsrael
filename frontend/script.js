// Base URL for your API endpoints
const API_BASE = "https://ku55b83500.execute-api.eu-north-1.amazonaws.com/api"; // API base URL

// ------------------ Utility & Existing Functions ------------------

// Easing function for smoother animation (easeOutQuad)
function easeOutQuad(t) { // Define easing function for animations
  return t * (2 - t); // Return eased progress value
}

// Show a given step (1-based) and update the progress bar
function showStep(stepNumber) { // Function to show a specific form step
  const steps = document.querySelectorAll(".step"); // Get all steps
  steps.forEach((step, index) => { // Loop through each step
    step.classList.toggle("active", index === stepNumber - 1); // Toggle active class based on step number
  });
  const progress = document.getElementById("progress"); // Get progress bar element
  progress.style.width = `${(stepNumber / steps.length) * 100}%`; // Set progress bar width
}

// Fetch and populate Brand dropdown; also store available brands globally for chatbot and search auto‑complete
async function updateBrandDropdown() { // Function to update the brand dropdown
  try {
    const response = await fetch(`${API_BASE}/dynamic-filters`); // Fetch dynamic filters from API
    const data = await response.json(); // Parse JSON response
    const brandSelect = document.getElementById("brand"); // Get brand select element
    let optionsHtml = `<option value="" disabled selected>-- Select Brand --</option>`; // Default option HTML
    if (data.brand && data.brand.length > 0) { // If brand data exists
      window.availableBrands = data.brand; // Store available brands globally for auto‑complete
      data.brand.forEach((item) => { // Loop through each brand
        optionsHtml += `<option value="${item}">${item}</option>`; // Append brand option
      });
    }
    brandSelect.innerHTML = optionsHtml; // Set inner HTML of brand select
  } catch (error) { // Catch any errors
    console.error("Error fetching brands:", error); // Log error
  }
}

// Fetch and populate Model dropdown based on selected Brand
async function updateModelDropdown() { // Function to update model dropdown based on brand
  const brand = document.getElementById("brand").value; // Get selected brand value
  if (!brand) return; // Exit if no brand selected
  try {
    const queryParams = new URLSearchParams({ brand }); // Create query parameters with brand
    const response = await fetch(`${API_BASE}/dynamic-filters?${queryParams.toString()}`); // Fetch model data
    const data = await response.json(); // Parse JSON response
    const modelSelect = document.getElementById("model"); // Get model select element
    let optionsHtml = `<option value="" disabled selected>-- Select Model --</option>`; // Default option HTML
    if (data.model && data.model.length > 0) { // If model data exists
      data.model.forEach((item) => { // Loop through each model
        optionsHtml += `<option value="${item}">${item}</option>`; // Append model option
      });
    }
    modelSelect.innerHTML = optionsHtml; // Set inner HTML of model select
  } catch (error) { // Catch errors
    console.error("Error fetching models:", error); // Log error
  }
}

// Fetch additional filters for Step 3
async function updateStep3Dropdowns() { // Function to update dropdowns for step 3 filters
  const brand = document.getElementById("brand").value; // Get selected brand
  const modelVal = document.getElementById("model").value; // Get selected model
  const params = { brand }; // Create params object with brand
  if (modelVal) { // If model is provided
    params.model = modelVal; // Add model to params
  }
  try {
    const queryParams = new URLSearchParams(params); // Create query parameters from params
    const response = await fetch(`${API_BASE}/dynamic-filters?${queryParams.toString()}`); // Fetch additional filters
    const data = await response.json(); // Parse JSON response
    const fields = ["year", "fuel_type", "hand_num", "brand_group"]; // List of fields to update
    fields.forEach((field) => { // Loop through each field
      const select = document.getElementById(field); // Get select element for the field
      let optionsHtml = `<option value="" disabled selected>-- Select ${field.replace("_", " ")} --</option>`; // Default option HTML
      if (data[field] && data[field].length > 0) { // If data exists for the field
        data[field].forEach((item) => { // Loop through each option
          optionsHtml += `<option value="${item}">${item}</option>`; // Append option
        });
      }
      select.innerHTML = optionsHtml; // Set inner HTML for the select element
    });
  } catch (error) { // Catch errors
    console.error("Error fetching additional filters:", error); // Log error
  }
}

// Animate number counter for average price result
function animateValue(element, start, end, duration) { // Function to animate numeric value
  let startTimestamp = null; // Initialize start timestamp
  const step = (timestamp) => { // Define animation step function
    if (!startTimestamp) startTimestamp = timestamp; // Set start timestamp on first call
    let progress = (timestamp - startTimestamp) / duration; // Calculate progress
    progress = Math.min(progress, 1); // Cap progress at 1
    const easedProgress = easeOutQuad(progress); // Apply easing function
    const value = Math.floor(easedProgress * (end - start) + start); // Calculate current value
    element.textContent = value; // Update element text with current value
    if (progress < 1) { // If animation is not complete
      requestAnimationFrame(step); // Request next animation frame
    }
  };
  requestAnimationFrame(step); // Start animation
}

// Show the Yearly Average Comparison Chart
async function showYearlyChart(brand, model, canvasId = "yearlyChart") { // Function to display the yearly average price chart
  try {
    const queryParams = new URLSearchParams({ brand, model }); // Build query parameters with brand and model
    const response = await fetch(`${API_BASE}/average-price-yearly?${queryParams.toString()}`); // Fetch yearly average data
    const data = await response.json(); // Parse JSON response
    if (data.data) { // If data exists
      const labels = data.data.map(item => item.year); // Extract years for chart labels
      const avgPrices = data.data.map(item => Math.round(item.avg_price)); // Extract and round average prices
      
      const container = document.getElementById(canvasId).parentNode; // Get parent container of canvas
      container.style.display = "block"; // Make container visible
      
      const ctx = document.getElementById(canvasId).getContext("2d"); // Get canvas context for Chart.js
      if (window[canvasId + "Instance"]) { // If a chart already exists on this canvas
        window[canvasId + "Instance"].destroy(); // Destroy the existing chart
      }
      window[canvasId + "Instance"] = new Chart(ctx, { // Create new chart instance
        type: 'line', // Chart type is line
        data: { // Chart data configuration
          labels: labels, // X-axis labels (years)
          datasets: [{
            label: `${brand} ${model} Yearly Average Price`, // Dataset label
            data: avgPrices, // Data points
            borderColor: 'rgba(54, 162, 235, 1)', // Solid line color
            backgroundColor: 'rgba(54, 162, 235, 0.7)', // More opaque fill color for clarity
            fill: true, // Enable fill under the line
            tension: 0.3 // Smoothing factor for line curves
          }]
        },
        options: { // Chart options configuration
          responsive: true, // Make chart responsive
          plugins: {
            tooltip: { enabled: true }, // Enable tooltips
            legend: { display: true } // Display legend
          },
          scales: {
            x: { title: { display: true, text: 'Year' } }, // X-axis title
            y: { title: { display: true, text: 'Average Price (NIS)' } } // Y-axis title
          }
        }
      });
    } else if (data.message) { // If an error message is returned
      console.error(data.message); // Log the error message
    }
  } catch (error) { // Catch any errors
    console.error("Error fetching yearly average price data:", error); // Log error
  }
}

// Collect form data and fetch average price result, then show yearly chart
async function getPriceEstimate() { // Function to get price estimate based on form filters
  const params = {}; // Initialize parameters object
  params.brand = document.getElementById("brand").value; // Get brand from form
  const modelVal = document.getElementById("model").value; // Get model from form
  if (modelVal) { // If model is provided
    params.model = modelVal; // Add model to parameters
  }
  // Loop through basic filter fields and add to params if set
  ["year", "fuel_type", "hand_num", "brand_group"].forEach((field) => {
    const el = document.getElementById(field); // Get field element
    if (el && el.value !== "") { // If field has a value
      params[field] = el.value; // Add to parameters
    }
  });
  // Loop through optional features and add to params if set
  ["magnesium_wheels", "distance_control", "economical", "adaptive_cruise_control", "cruise_control", "four_wheel_drive"].forEach((field) => {
    const el = document.getElementById(field); // Get field element
    if (el && el.value !== "") { // If field has a value
      params[field] = el.value; // Add to parameters
    }
  });
  // Loop through performance specifications and add to params if set
  ["min_horse_power", "max_horse_power", "min_engine_volume", "max_engine_volume"].forEach((field) => {
    const el = document.getElementById(field); // Get field element
    if (el && el.value !== "") { // If field has a value
      params[field] = el.value; // Add to parameters
    }
  });
  const queryParams = new URLSearchParams(params); // Build query string from parameters
  try {
    const response = await fetch(`${API_BASE}/estimate-price?${queryParams.toString()}`); // Fetch price estimate from API
    const data = await response.json(); // Parse JSON response
    const resultDiv = document.getElementById("priceEstimate"); // Get price estimate result div
    resultDiv.style.display = "block"; // Make result div visible
    if (data.min_price && data.max_price) { // If both min and max price are returned
      resultDiv.innerHTML = `<div class="price-text">Average Price: <span id="avgPrice">0</span> NIS</div>`; // Display average price container
      let avgSpan = document.getElementById("avgPrice"); // Get span for average price
      const finalAvg = Math.round((data.min_price + data.max_price) / 2); // Calculate average price
      animateValue(avgSpan, 0, finalAvg, 1000); // Animate the average price counter
    } else if (data.message) { // If API returns a message
      resultDiv.textContent = data.message; // Show the message
    } else {
      resultDiv.textContent = "No price estimate available."; // Default message
    }
    resultDiv.classList.add("hologram"); // Add hologram effect class
    setTimeout(() => { // Remove hologram effect after 1 second
      resultDiv.classList.remove("hologram");
    }, 1000);
    const resetBtn = document.createElement("button"); // Create reset button
    resetBtn.textContent = "Estimate Another Car"; // Set button text
    resetBtn.classList.add("reset-btn"); // Add reset button styling class
    resetBtn.addEventListener("click", resetEstimator); // Add event listener to reset the estimator
    resultDiv.appendChild(resetBtn); // Append reset button to result div
    
    // Show the yearly average chart if both brand and model are selected
    if (params.brand && params.model) { // Check if brand and model exist in params
      showYearlyChart(params.brand, params.model); // Call function to display yearly chart
    }
  } catch (error) { // Catch errors
    console.error("Error fetching price estimate:", error); // Log error
  }
}

// Reset form and UI to initial state
function resetEstimator() { // Function to reset the estimator UI and form
  document.getElementById("filterForm").reset(); // Reset the form
  updateBrandDropdown(); // Update the brand dropdown
  showStep(1); // Show the first step
  document.getElementById("nextStep1").disabled = true; // Disable the next button on step 1
  document.getElementById("priceEstimate").style.display = "none"; // Hide price estimate div
  document.getElementById("priceEstimate").innerHTML = ""; // Clear price estimate content
  document.getElementById("yearlyChartContainer").style.display = "none"; // Hide yearly chart container
  if (window.yearlyChartInstance) { // If a yearly chart exists
    window.yearlyChartInstance.destroy(); // Destroy the chart instance
  }
}

// ------------------ Chatbot Assistant Functions ------------------

// Process chat query by extracting car details and calling the /api/search-car endpoint
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
    const response = await fetch(API_BASE + "/search-car?" + queryParams.toString());
    const data = await response.json();
    if (data.message) {
      return data.message;
    }
    const estimate = data.estimate;
    let avgPrice = Math.round((estimate.min_price + estimate.max_price) / 2);
    let textResult = `The estimated price for ${brand} ${model} is around ${avgPrice} NIS.`;
    
    // Check if the query asks for more details (yearly averages, chart, etc.)
    let lowerQuery = query.toLowerCase();
    let includeYearly = lowerQuery.includes("year") || lowerQuery.includes("chart") || lowerQuery.includes("graph") || lowerQuery.includes("trend") || lowerQuery.includes("detail");
    
    if (includeYearly && data.yearly && data.yearly.length > 0) {
      let yearlyInfo = "\nYearly averages:\n";
      data.yearly.forEach(item => {
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

// Chat input event listener that processes chat queries using processChatQuery
document.getElementById("chatInput").addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    const input = e.target.value.trim();
    if (input !== "") {
      const messagesDiv = document.querySelector(".chat-messages");
      const userMsg = document.createElement("p");
      userMsg.textContent = "You: " + input;
      messagesDiv.appendChild(userMsg);
      e.target.value = "";
      // Show processing message
      const processingMsg = document.createElement("p");
      processingMsg.textContent = "Assistant: Processing your request...";
      messagesDiv.appendChild(processingMsg);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
      const replyText = await processChatQuery(input);
      // Remove processing message
      messagesDiv.removeChild(processingMsg);
      const reply = document.createElement("p");
      reply.textContent = "Assistant: " + replyText;
      messagesDiv.appendChild(reply);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  }
});

// ------------------ Search Modal & Voice Input Functions ------------------

// Open search modal when search icon is clicked
document.getElementById("searchIcon").addEventListener("click", () => {
  document.getElementById("searchModal").style.display = "block";
});

// Close search modal when close button is clicked
document.getElementById("closeSearchModal").addEventListener("click", () => {
  document.getElementById("searchModal").style.display = "none";
});

// Auto‑complete suggestions for search input based on available brands
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
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert("Voice recognition not supported in this browser.");
    return;
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.start();
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById("searchQueryInput").value = transcript;
  };
});

// Process search query using the new /api/search-car endpoint
async function processSearchQuery(query) {
  // Extract brand and model from the query
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
    showYearlyChart(brand, model, "searchChart");
    return textResult;
  } catch (error) {
    console.error("Error processing search query:", error);
    return "Sorry, there was an error processing your request.";
  }
}

// When search button is clicked in the search modal
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

// Navigation event listeners for the multi‑step form
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
  const model = document.getElementById("model").value;
  if (!model) {
    alert("Please select a model.");
    return;
  }
  await updateStep3Dropdowns();
  showStep(3);
});
document.getElementById("prevStep3").addEventListener("click", () => {
  document.getElementById("priceEstimate").innerHTML = "";
  document.getElementById("priceEstimate").style.display = "none";
  showStep(2);
});
document.getElementById("estimateBtn").addEventListener("click", getPriceEstimate);

// Disable next button until a brand is selected
document.getElementById("brand").addEventListener("change", function () {
  const nextBtn = document.getElementById("nextStep1");
  nextBtn.disabled = !this.value;
});

// Disable next button until a model is selected
document.getElementById("model").addEventListener("change", function () {
  const nextBtn = document.getElementById("nextStep2");
  nextBtn.disabled = !this.value;
});

// Toggle dark mode when the dark mode button is clicked
document.getElementById("darkModeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const toggleBtn = document.getElementById("darkModeToggle");
  toggleBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});
document.querySelector("#optionalFeatures .collapsible-legend").addEventListener("click", () => {
  document.getElementById("optionalFeatures").classList.toggle("open");
});
document.querySelector("#performanceSpecs .collapsible-legend").addEventListener("click", () => {
  document.getElementById("performanceSpecs").classList.toggle("open");
});
document.getElementById("chatButton").addEventListener("click", () => {
  document.getElementById("chatAssistant").classList.toggle("active");
});
document.getElementById("closeChat").addEventListener("click", () => {
  document.getElementById("chatAssistant").classList.remove("active");
});
window.addEventListener("click", (e) => {
  let modal = document.getElementById("graphModal");
  if (e.target === modal) {
    modal.style.display = "none";
  }
});
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
window.addEventListener("DOMContentLoaded", () => {
  updateBrandDropdown();
  showStep(1);
});