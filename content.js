// Set a global flag to indicate the content script is loaded
window.webReaderContentScriptLoaded = true;

// Audio player element
let audioPlayer = null;

// UI state tracking
let uiState = {
  isLoading: false,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  container: null,
  playerUI: null,
  progressBar: null,
  progressFilled: null,
};

console.log("WebReader content script loaded");

// Create UI elements for the player
function createPlayerUI() {
  console.log("Creating WebReader UI elements");

  // Create main container
  uiState.container = document.createElement("div");
  uiState.container.id = "web-reader-player";
  uiState.container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 320px;
    background: #222;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    z-index: 10000;
    overflow: hidden;
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateY(20px);
    pointer-events: none;
    display: flex;
    align-items: center;
    padding: 12px 16px;
    gap: 16px;
  `;
  document.body.appendChild(uiState.container);

  // Initially hide the container
  hidePlayerUI();

  console.log("WebReader UI container added to page");
}

// Show loading UI
function showLoading(message = "Processing...") {
  console.log("Showing loading UI:", message);

  // Create UI if not exists
  if (!uiState.container) {
    createPlayerUI();
  }

  uiState.isLoading = true;

  // Update UI content
  uiState.container.innerHTML = `
    <div style="width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: linear-gradient(135deg, #4f46e5, #7c3aed); position: relative; overflow: hidden;">
      <div style="width: 24px; height: 24px; border: 2px solid rgba(255, 255, 255, 0.3); border-radius: 50%; border-top-color: white; animation: spin 1s linear infinite;"></div>
    </div>
    <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 8px;">
      <div style="font-size: 14px; font-weight: 500; margin: 0; color: rgba(255, 255, 255, 0.9);">${message}</div>
    </div>
    <button style="background: none; border: none; color: rgba(255, 255, 255, 0.7); cursor: pointer; padding: 4px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; margin-left: auto;" aria-label="Close">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  // Add style for animation
  if (!document.getElementById("web-reader-styles")) {
    const style = document.createElement("style");
    style.id = "web-reader-styles";
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  // Add event listener to close button
  uiState.container
    .querySelector("button")
    .addEventListener("click", hidePlayerUI);

  // Show the UI
  showPlayerUI();
}

// Show error UI
function showError(message) {
  console.log("Showing error UI:", message);

  // Create UI if not exists
  if (!uiState.container) {
    createPlayerUI();
  }

  uiState.isLoading = false;

  // Update UI content
  uiState.container.innerHTML = `
    <div style="width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: linear-gradient(135deg, #ef4444, #f87171);">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    </div>
    <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 8px;">
      <div style="font-size: 14px; font-weight: 500; margin: 0; color: rgba(255, 255, 255, 0.9);">${message}</div>
    </div>
    <button style="background: none; border: none; color: rgba(255, 255, 255, 0.7); cursor: pointer; padding: 4px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; margin-left: auto;" aria-label="Close">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  // Add event listener to close button
  uiState.container
    .querySelector("button")
    .addEventListener("click", hidePlayerUI);

  // Show the UI
  showPlayerUI();

  // Hide after 5 seconds
  setTimeout(hidePlayerUI, 5000);
}

// Update player UI based on current state
function updatePlayerUI() {
  if (uiState.isLoading) {
    return; // Don't update if we're in loading state
  }

  // Calculate progress percentage
  const progress = uiState.duration
    ? (uiState.currentTime / uiState.duration) * 100
    : 0;

  // Use the appropriate icon based on playback state
  const iconHtml = uiState.isPlaying
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
      </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>`;

  const iconBackground = uiState.isPlaying
    ? "linear-gradient(135deg, #6366f1, #818cf8)"
    : "linear-gradient(135deg, #3b82f6, #60a5fa)";

  // Update UI content
  uiState.container.innerHTML = `
    <div style="width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: ${iconBackground}; cursor: pointer;" class="play-pause-btn">
      ${iconHtml}
    </div>
    <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 8px;">
      <div style="position: relative; height: 4px; background: rgba(255, 255, 255, 0.2); border-radius: 2px; cursor: pointer; overflow: hidden;" class="progress-container">
        <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${progress}%; background: white; border-radius: 2px;" class="progress-filled"></div>
        <div style="position: absolute; top: 0; left: ${progress}%; right: 0; height: 100%; background: rgba(255, 255, 255, 0.2); border-radius: 2px;" class="progress-empty"></div>
      </div>
    </div>
    <button style="background: none; border: none; color: rgba(255, 255, 255, 0.7); cursor: pointer; padding: 4px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; margin-left: auto;" aria-label="Close">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  // Save references to UI elements for later updates
  uiState.progressBar = uiState.container.querySelector(".progress-container");
  uiState.progressFilled = uiState.container.querySelector(".progress-filled");

  // Add event listeners
  uiState.container
    .querySelector(".play-pause-btn")
    .addEventListener("click", togglePlayPause);
  uiState.container
    .querySelector("button")
    .addEventListener("click", hidePlayerUI);
  uiState.progressBar.addEventListener("click", handleProgressClick);
}

// Show player UI
function showPlayerUI() {
  uiState.container.style.opacity = "1";
  uiState.container.style.transform = "translateY(0)";
  uiState.container.style.pointerEvents = "auto";
}

// Hide player UI
function hidePlayerUI() {
  uiState.container.style.opacity = "0";
  uiState.container.style.transform = "translateY(20px)";
  uiState.container.style.pointerEvents = "none";

  // If hiding while playing, stop the audio
  if (uiState.isPlaying && audioPlayer) {
    audioPlayer.pause();
    uiState.isPlaying = false;
  }

  // Reset loading state
  uiState.isLoading = false;
}

// Toggle play/pause
function togglePlayPause() {
  if (!audioPlayer) return;

  if (uiState.isPlaying) {
    audioPlayer.pause();
  } else {
    audioPlayer.play().catch((error) => {
      console.error("Error playing audio:", error);
      showError("Error playing audio: " + error.message);
    });
  }
}

// Handle progress bar click
function handleProgressClick(e) {
  if (!audioPlayer || !uiState.duration) return;

  const rect = e.currentTarget.getBoundingClientRect();
  const clickPosition = (e.clientX - rect.left) / rect.width;

  const newTime = clickPosition * uiState.duration;
  audioPlayer.currentTime = newTime;
  updateProgress();
}

// Update progress bar
function updateProgress() {
  if (!uiState.progressFilled || !uiState.duration) return;

  const progress = (uiState.currentTime / uiState.duration) * 100;
  uiState.progressFilled.style.width = `${progress}%`;

  const progressEmpty = uiState.container.querySelector(".progress-empty");
  if (progressEmpty) {
    progressEmpty.style.left = `${progress}%`;
  }
}

// Secure listener for test events from the debug script
document.addEventListener("webReaderTest", (event) => {
  console.log(
    "Secure test event received in content script:",
    event.detail.text.substring(0, 30) + "..."
  );

  // Show loading UI immediately
  showLoading("Processing your request...");

  // Notify the page that we received the event
  document.dispatchEvent(
    new CustomEvent("webReaderEvent", {
      detail: { action: "testReceived", status: "processing" },
    })
  );

  // Securely send ONLY the text to the background script
  chrome.runtime.sendMessage(
    {
      action: "readText",
      text: event.detail.text,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        const errorMsg = chrome.runtime.lastError.message || "Unknown error";
        console.error("Error sending text to background:", errorMsg);
        showError("Error: Could not communicate with extension.");

        // Notify the page of the error
        document.dispatchEvent(
          new CustomEvent("webReaderEvent", {
            detail: {
              action: "error",
              message: "Error communicating with extension: " + errorMsg,
            },
          })
        );
        return;
      }

      if (response && response.success) {
        console.log("Background script acknowledged receipt of text.");
      } else {
        console.error(
          "Background script failed to process request:",
          response.message
        );
        showError(
          "Error: " + (response.message || "An unknown error occurred.")
        );

        // Notify the page of the error
        document.dispatchEvent(
          new CustomEvent("webReaderEvent", {
            detail: {
              action: "error",
              message:
                "Processing failed: " + (response.message || "Unknown error"),
            },
          })
        );
      }
    }
  );
});

// Listen for messages from extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in content script:", message);

  // Set a timeout to ensure sendResponse is always called
  const timeoutId = setTimeout(() => {
    console.warn("Message response timed out:", message);
    try {
      sendResponse({ success: false, error: "Response timed out" });
    } catch (err) {
      console.error("Error sending timeout response:", err);
    }
  }, 30000); // 30 second timeout

  try {
    // Show notification
    if (message.action === "showNotification") {
      console.log("Showing notification:", message.message);
      if (message.message.includes("Converting text to speech...")) {
        showLoading("Converting text to speech...");
      } else {
        showError(message.message);
      }
      clearTimeout(timeoutId);
      sendResponse({ success: true });
    }

    // Play audio from base64 data
    else if (message.action === "playAudio") {
      console.log("Playing audio from data");
      playAudioFromData(message.audioData, message.mimeType);
      clearTimeout(timeoutId);
      sendResponse({ success: true });
    } else {
      // Unknown action
      console.warn("Unknown message action:", message.action);
      clearTimeout(timeoutId);
      sendResponse({ success: false, error: "Unknown action" });
    }
  } catch (error) {
    console.error("Error handling message:", error);
    clearTimeout(timeoutId);
    sendResponse({ success: false, error: error.message });
  }

  return true; // Keep the message channel open for async responses
});

// Play audio from base64 data
function playAudioFromData(base64Data, mimeType) {
  console.log("playAudioFromData called with mime type:", mimeType);
  console.log("base64Data length:", base64Data ? base64Data.length : 0);

  try {
    if (!base64Data) {
      throw new Error("No audio data received");
    }

    // Convert base64 to blob
    let byteCharacters;
    try {
      console.log("Attempting to decode base64 data...");
      byteCharacters = atob(base64Data);
      console.log(
        "Base64 decoded successfully, length:",
        byteCharacters.length
      );
    } catch (e) {
      console.error("Failed to decode base64 data:", e);
      throw new Error("Invalid audio data format: " + e.message);
    }

    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    console.log("Creating blob from byte arrays...");
    const blob = new Blob(byteArrays, { type: mimeType || "audio/mpeg" });
    console.log("Blob created successfully, size:", blob.size);

    const audioUrl = URL.createObjectURL(blob);
    console.log("Audio URL created:", audioUrl);

    // Play the audio
    playAudio(audioUrl);
  } catch (error) {
    console.error("Error processing audio data:", error);
    showError("Error processing audio data: " + error.message);

    // Notify the page of the error
    document.dispatchEvent(
      new CustomEvent("webReaderEvent", {
        detail: {
          action: "error",
          message: "Error processing audio: " + error.message,
        },
      })
    );
  }
}

// Play audio from URL
function playAudio(audioUrl) {
  console.log("Playing audio with URL:", audioUrl.substring(0, 30) + "...");

  try {
    if (!audioUrl) {
      throw new Error("No audio URL provided");
    }

    // Create UI if not exists
    if (!uiState.container) {
      createPlayerUI();
    }

    // Reset loading state if it was set
    uiState.isLoading = false;

    // Stop any existing audio
    if (audioPlayer) {
      console.log("Stopping existing audio player");
      audioPlayer.pause();

      try {
        if (audioPlayer.src && audioPlayer.src.startsWith("blob:")) {
          URL.revokeObjectURL(audioPlayer.src);
        }
      } catch (e) {
        console.warn("Error revoking previous audio URL:", e);
      }
    } else {
      console.log("Creating new audio player");
      audioPlayer = new Audio();

      // Set up event listeners
      audioPlayer.addEventListener("play", () => {
        console.log("Audio playback started");
        uiState.isPlaying = true;
        updatePlayerUI();
      });

      audioPlayer.addEventListener("pause", () => {
        console.log("Audio playback paused");
        uiState.isPlaying = false;
        updatePlayerUI();
      });

      audioPlayer.addEventListener("ended", () => {
        console.log("Audio playback ended");
        uiState.isPlaying = false;
        hidePlayerUI();
        if (audioPlayer.src && audioPlayer.src.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(audioPlayer.src);
          } catch (e) {
            console.warn("Error revoking audio URL on end:", e);
          }
        }
      });

      audioPlayer.addEventListener("timeupdate", () => {
        uiState.currentTime = audioPlayer.currentTime;
        uiState.duration = audioPlayer.duration;
        updateProgress();
      });

      audioPlayer.addEventListener("error", (e) => {
        const errorMessage = e.target.error
          ? `Code: ${e.target.error.code}, Message: ${
              e.target.error.message || "Unknown"
            }`
          : "Unknown playback error";
        console.error("Audio playback error:", errorMessage);
        showError("Error playing audio: " + errorMessage);

        document.dispatchEvent(
          new CustomEvent("webReaderEvent", {
            detail: {
              action: "error",
              message: "Audio playback error: " + errorMessage,
            },
          })
        );
      });
    }

    // Set new audio source
    audioPlayer.src = audioUrl;

    // Update UI immediately
    uiState.isPlaying = false;
    updatePlayerUI();
    showPlayerUI();

    // Play the audio with a slight delay to ensure it's loaded
    setTimeout(() => {
      const playPromise = audioPlayer.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Audio playback started successfully");
          })
          .catch((error) => {
            console.error("Error starting audio playback:", error);
            showError("Error playing audio: " + error.message);

            document.dispatchEvent(
              new CustomEvent("webReaderEvent", {
                detail: {
                  action: "error",
                  message: "Failed to start audio: " + error.message,
                },
              })
            );
          });
      }
    }, 100);
  } catch (error) {
    console.error("Exception in playAudio:", error);
    showError("Error playing audio: " + error.message);

    document.dispatchEvent(
      new CustomEvent("webReaderEvent", {
        detail: {
          action: "error",
          message: "Error in audio playback: " + error.message,
        },
      })
    );
  }
}

// Debug helper function to reset UI if it gets stuck
window.resetWebReaderUI = function () {
  if (uiState.container) {
    hidePlayerUI();
    return "UI reset";
  } else {
    return "UI not initialized";
  }
};

// Helper function to check if stream is active/valid
function isStreamActive(stream) {
  if (!stream) return false;

  const tracks = stream.getTracks();
  return (
    tracks.length > 0 && tracks.some((track) => track.readyState === "live")
  );
}

// Debug helper function to test content script
window.testWebReader = function (text, apiKey, voiceId, modelId) {
  console.log("Testing WebReader with text:", text);

  // Show loading UI while we wait for response
  showLoading("Initializing test...");

  // Send test message to background script
  chrome.runtime.sendMessage(
    {
      action: "testTextToSpeech",
      text: text || "This is a test of the WebReader extension.",
      apiKey: apiKey,
      voiceId: voiceId,
      modelId: modelId || "eleven_multilingual_v2",
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error in test message:", chrome.runtime.lastError);
        showError(
          "Test failed: " +
            (chrome.runtime.lastError.message || "Unknown error")
        );
        return;
      }

      console.log("Test message response:", response);
      if (!response || !response.success) {
        showError("Test failed: " + (response?.error || "Unknown error"));
      }
    }
  );
};

// Debug helper to check content script is loaded
window.isWebReaderLoaded = true;
