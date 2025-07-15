document.addEventListener("DOMContentLoaded", function () {
  // Main elements
  const apiKeyInput = document.getElementById("apiKeyInput");
  const apiKeySettingInput = document.getElementById("apiKeySettingInput");
  const voiceSelect = document.getElementById("voiceSelect");
  const modelSelect = document.getElementById("modelSelect");
  const startButton = document.getElementById("startButton");
  const saveApiKeyButton = document.getElementById("saveApiKeyButton");
  const statusDiv = document.getElementById("status");

  // Screens
  const welcomeScreen = document.getElementById("welcome-screen");
  const settingsScreen = document.getElementById("settings-screen");
  const apiKeyScreen = document.getElementById("api-key-screen");
  const usageGuideScreen = document.getElementById("usage-guide-screen");

  // Navigation elements
  const apiKeyMenuItem = document.getElementById("apiKeyMenuItem");
  const usageGuideMenuItem = document.getElementById("usageGuideMenuItem");
  const apiKeyBackButton = document.getElementById("apiKeyBackButton");
  const usageGuideBackButton = document.getElementById("usageGuideBackButton");

  // Load saved settings
  chrome.storage.sync.get(
    ["apiKey", "selectedVoice", "selectedModel"],
    function (result) {
      if (result.apiKey) {
        // If API key exists, show settings screen directly
        apiKeyInput.value = result.apiKey;
        apiKeySettingInput.value = result.apiKey;

        showScreen(settingsScreen);

        // Fetch voices with the saved API key
        fetchVoices(result.apiKey, result.selectedVoice);
      } else {
        // Show welcome screen if no API key is saved
        showScreen(welcomeScreen);

        // Disable voice select until API key is provided
        voiceSelect.innerHTML = '<option value="">Enter API key first</option>';
        voiceSelect.disabled = true;
      }

      // Set the selected model if available
      if (result.selectedModel) {
        modelSelect.value = result.selectedModel;
      }
    }
  );

  // Navigation event listeners
  apiKeyMenuItem.addEventListener("click", function () {
    showScreen(apiKeyScreen);
  });

  usageGuideMenuItem.addEventListener("click", function () {
    showScreen(usageGuideScreen);
  });

  apiKeyBackButton.addEventListener("click", function () {
    showScreen(settingsScreen);
  });

  usageGuideBackButton.addEventListener("click", function () {
    showScreen(settingsScreen);
  });

  // Start button event listener (on welcome screen)
  startButton.addEventListener("click", function () {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showStatus("Please enter your ElevenLabs API key", "error");
      return;
    }

    // Show loading state
    showStatus("Validating API key...", "info");

    // Validate API key by fetching voices
    validateAndSwitchToSettings(apiKey);
  });

  // Save API Key button event listener (on API key screen)
  saveApiKeyButton.addEventListener("click", function () {
    const apiKey = apiKeySettingInput.value.trim();

    if (!apiKey) {
      showStatus("Please enter your ElevenLabs API key", "error");
      return;
    }

    // Show loading state
    showStatus("Saving API key...", "info");

    // Validate and save the API key
    validateAndSaveApiKey(apiKey);
  });

  // Auto-save when model is changed
  modelSelect.addEventListener("change", function () {
    saveModelSettings();
  });

  // Auto-save when voice is changed
  voiceSelect.addEventListener("change", function () {
    saveVoiceSettings();
  });

  // Helper function to show a specific screen and hide others
  function showScreen(screenToShow) {
    // Hide all screens
    welcomeScreen.style.display = "none";
    settingsScreen.style.display = "none";
    apiKeyScreen.style.display = "none";
    usageGuideScreen.style.display = "none";

    // Show the selected screen
    screenToShow.style.display = "block";
  }

  // Validate API key and switch to settings screen
  function validateAndSwitchToSettings(apiKey) {
    fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        Accept: "application/json",
        "xi-api-key": apiKey,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Invalid API key or network error: ${response.status}`
          );
        }
        return response.json();
      })
      .then((data) => {
        // API key is valid, save it and switch to settings screen
        chrome.storage.sync.set({ apiKey: apiKey }, function () {
          // Switch to settings screen
          showScreen(settingsScreen);

          // Set API key in settings screen too
          apiKeySettingInput.value = apiKey;

          // Update voices dropdown
          updateVoicesDropdown(data.voices);

          // Select first voice by default if none is selected
          if (!voiceSelect.value && data.voices && data.voices.length > 0) {
            voiceSelect.value = data.voices[0].voice_id;
            saveVoiceSettings();
          }

          showStatus("API key validated successfully!", "success");
        });
      })
      .catch((error) => {
        console.error("Error validating API key:", error);
        showStatus(`Error: ${error.message}`, "error");
      });
  }

  // Validate and save API key from settings screen
  function validateAndSaveApiKey(apiKey) {
    fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        Accept: "application/json",
        "xi-api-key": apiKey,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Invalid API key or network error: ${response.status}`
          );
        }
        return response.json();
      })
      .then((data) => {
        // API key is valid, save it
        chrome.storage.sync.set({ apiKey: apiKey }, function () {
          // Return to settings screen
          showScreen(settingsScreen);

          // Update voices dropdown with new data
          updateVoicesDropdown(data.voices);

          showStatus("API key saved successfully!", "success");
        });
      })
      .catch((error) => {
        console.error("Error validating API key:", error);
        showStatus(`Error: ${error.message}`, "error");
      });
  }

  // Fetch available voices from ElevenLabs
  function fetchVoices(apiKey, selectedVoice) {
    voiceSelect.innerHTML =
      '<option value="loading">Loading voices...</option>';
    voiceSelect.disabled = true;

    fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        Accept: "application/json",
        "xi-api-key": apiKey,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Invalid API key or network error: ${response.status}`
          );
        }
        return response.json();
      })
      .then((data) => {
        updateVoicesDropdown(data.voices);

        if (selectedVoice) {
          voiceSelect.value = selectedVoice;
        } else if (data.voices && data.voices.length > 0) {
          // Select first voice by default
          voiceSelect.value = data.voices[0].voice_id;
          saveVoiceSettings();
        }
      })
      .catch((error) => {
        console.error("Error fetching voices:", error);
        voiceSelect.innerHTML =
          '<option value="">Failed to load voices</option>';
        voiceSelect.disabled = true;
        showStatus(`Error: ${error.message}`, "error");
      });
  }

  // Helper function to update voices dropdown
  function updateVoicesDropdown(voices) {
    voiceSelect.innerHTML = "";
    voiceSelect.disabled = false;

    if (!voices || voices.length === 0) {
      voiceSelect.innerHTML = '<option value="">No voices available</option>';
      throw new Error("No voices found in account");
    }

    voices.forEach((voice) => {
      const option = document.createElement("option");
      option.value = voice.voice_id;
      option.textContent = voice.name;
      voiceSelect.appendChild(option);
    });
  }

  // Save voice selection
  function saveVoiceSettings() {
    const selectedVoice = voiceSelect.value;

    if (!selectedVoice) {
      return;
    }

    chrome.storage.sync.set({ selectedVoice: selectedVoice }, function () {
      console.log("Voice setting saved");
    });
  }

  // Save model selection
  function saveModelSettings() {
    const selectedModel = modelSelect.value;

    chrome.storage.sync.set({ selectedModel: selectedModel }, function () {
      console.log("Model setting saved");
    });
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = "status " + type;
    statusDiv.style.display = "block";

    // Only auto-hide success and info messages
    if (type === "success" || type === "info") {
      setTimeout(() => {
        statusDiv.style.display = "none";
      }, 3000);
    }
  }
});
