// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed, creating context menu item");
  chrome.contextMenus.create(
    {
      id: "readSelectedText",
      title: "Read with WebReader",
      contexts: ["selection"],
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error creating context menu:",
          chrome.runtime.lastError.message || "Unknown error"
        );
      } else {
        console.log("Context menu created successfully");
      }
    }
  );
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log("Context menu clicked:", info.menuItemId);
  if (info.menuItemId === "readSelectedText") {
    const selectedText = info.selectionText;
    console.log(
      "Selected text:",
      selectedText ? selectedText.substring(0, 50) + "..." : "none"
    );

    if (selectedText) {
      // Get API key, voice, and model from storage
      console.log("Fetching settings from storage");
      chrome.storage.sync.get(
        ["apiKey", "selectedVoice", "selectedModel"],
        function (result) {
          console.log("Settings retrieved:", {
            hasApiKey: !!result.apiKey,
            hasVoice: !!result.selectedVoice,
            model: result.selectedModel || "default not set",
          });

          if (!result.apiKey || !result.selectedVoice) {
            // Notify user to set up API key
            console.log("API key or voice not set, sending notification");
            sendTabMessage(tab.id, {
              action: "showNotification",
              message:
                "Please set your ElevenLabs API key in the WebReader extension popup",
            }).catch((error) => {
              console.error(
                "Failed to send API key notification:",
                error.message || "Unknown error"
              );
            });
            return;
          }

          // Use default model if none is selected
          const modelId = result.selectedModel || "eleven_flash_v2_5";
          console.log("Using model:", modelId);

          // Send text to ElevenLabs API
          convertTextToSpeech(
            selectedText,
            result.apiKey,
            result.selectedVoice,
            modelId,
            tab.id
          );
        }
      );
    }
  }
});

// Helper function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // Replace window.btoa with a self-contained implementation
  return btoa(binary);
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background script:", message);

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
    if (message.action === "readText") {
      if (sender.tab) {
        handleTextToSpeech(message.text, sender.tab.id);
        clearTimeout(timeoutId);
        sendResponse({
          success: true,
          message: "Text received by background.",
        });
      } else {
        console.error("No tab information in sender");
        clearTimeout(timeoutId);
        sendResponse({ success: false, error: "No tab information" });
      }
      return true; // Required for async sendResponse
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
});

// Secure function to handle text-to-speech conversion
function handleTextToSpeech(text, tabId) {
  console.log("Fetching settings from storage to process text.");
  chrome.storage.sync.get(
    ["apiKey", "selectedVoice", "selectedModel"],
    (result) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error getting settings:",
          chrome.runtime.lastError.message
        );
        sendTabMessage(tabId, {
          action: "showNotification",
          message: "Error: Could not get extension settings.",
          isError: true,
        });
        return;
      }

      if (!result.apiKey || !result.selectedVoice) {
        console.log("API key or voice not set, sending notification");
        sendTabMessage(tabId, {
          action: "showNotification",
          message:
            "Please set your ElevenLabs API key in the WebReader extension popup",
          isError: true,
        });
        return;
      }

      const modelId = result.selectedModel || "eleven_flash_v2_5";
      console.log("Securely calling API with model:", modelId);

      // Call the existing convertTextToSpeech function with the securely retrieved credentials
      convertTextToSpeech(
        text,
        result.apiKey,
        result.selectedVoice,
        modelId,
        tabId
      );
    }
  );
}

// Improved error handling for tab messages
function sendTabMessage(tabId, message) {
  return new Promise((resolve, reject) => {
    // First, check if we need to inject the content script
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        function: () => {
          // This just checks if the content script is loaded
          return typeof window.webReaderContentScriptLoaded !== "undefined";
        },
      },
      (results) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error checking content script:",
            chrome.runtime.lastError.message
          );
          // Try to inject the content script
          injectContentScript(tabId)
            .then(() => sendMessageAfterDelay(tabId, message, resolve, reject))
            .catch((error) => reject(error));
        } else if (!results || !results[0] || results[0].result !== true) {
          // Content script not loaded, inject it
          console.log("Content script not detected, injecting it now");
          injectContentScript(tabId)
            .then(() => sendMessageAfterDelay(tabId, message, resolve, reject))
            .catch((error) => reject(error));
        } else {
          // Content script is loaded, send message directly
          sendMessageDirectly(tabId, message, resolve, reject);
        }
      }
    );
  });
}

// Helper function to inject the content script
function injectContentScript(tabId) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        files: ["content.js"],
      },
      (results) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error injecting content script:",
            chrome.runtime.lastError.message
          );
          reject(chrome.runtime.lastError);
        } else {
          console.log("Content script injected successfully");
          // Give the content script a moment to initialize
          setTimeout(resolve, 200);
        }
      }
    );
  });
}

// Helper function to send a message after a short delay
function sendMessageAfterDelay(tabId, message, resolve, reject) {
  // Wait a bit for the content script to initialize
  setTimeout(() => {
    sendMessageDirectly(tabId, message, resolve, reject);
  }, 300);
}

// Helper function to send a message directly
function sendMessageDirectly(tabId, message, resolve, reject) {
  try {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      // Check if there was an error with the message port
      if (chrome.runtime.lastError) {
        const errorMsg = chrome.runtime.lastError.message || "Unknown error";
        console.error("Error sending message to tab:", errorMsg);

        // Special handling for disconnected ports
        if (
          errorMsg.includes("Receiving end does not exist") ||
          errorMsg.includes("message port closed")
        ) {
          console.log(
            "Content script appears disconnected, attempting to reinject"
          );
          // Try to reinject the content script
          injectContentScript(tabId)
            .then(() => {
              // Try again after a delay
              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, message, (secondResponse) => {
                  if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                  } else {
                    resolve(secondResponse);
                  }
                });
              }, 500);
            })
            .catch((error) => reject(error));
        } else {
          reject(chrome.runtime.lastError);
        }
      } else {
        resolve(response);
      }
    });
  } catch (error) {
    console.error("Exception in sendMessageDirectly:", error);
    reject(error);
  }
}

// Convert text to speech using ElevenLabs API
function convertTextToSpeech(text, apiKey, voiceId, modelId, tabId) {
  console.log("Converting text to speech with voice ID:", voiceId);

  // Notify that processing has started
  sendTabMessage(tabId, {
    action: "showNotification",
    message: "Converting text to speech...",
  }).catch((error) => {
    console.error(
      "Failed to send start notification:",
      error.message || "Unknown error"
    );
  });

  const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  console.log("Making API request to:", apiUrl);

  fetch(apiUrl, {
    method: "POST",
    headers: {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text: text,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
      },
    }),
  })
    .then((response) => {
      console.log("API response status:", response.status);
      console.log("API response headers:", [...response.headers.entries()]);

      if (!response.ok) {
        return response
          .json()
          .then((errorData) => {
            console.error("API error details:", errorData);
            throw new Error(
              errorData.detail?.message ||
                `API request failed with status ${response.status}`
            );
          })
          .catch((e) => {
            // If we can't parse the error as JSON, just throw the status
            console.error("Failed to parse error response:", e);
            throw new Error(
              `API request failed with status ${response.status}`
            );
          });
      }
      return response.arrayBuffer();
    })
    .then((audioBuffer) => {
      console.log("Audio received, size:", audioBuffer.byteLength);
      console.log("Audio buffer valid:", audioBuffer instanceof ArrayBuffer);

      // Convert ArrayBuffer to Base64 string for transfer
      const audioBase64 = arrayBufferToBase64(audioBuffer);
      console.log("Audio converted to base64, length:", audioBase64.length);

      // Send audio data to content script
      return sendTabMessage(tabId, {
        action: "playAudio",
        audioData: audioBase64,
        mimeType: "audio/mpeg",
      }).catch((error) => {
        console.error("Failed to send audio to content script:", error);
        throw error; // Re-throw to be caught by the outer catch
      });
    })
    .then((response) => {
      console.log(
        "Audio data sent to content script successfully, response:",
        response
      );
    })
    .catch((error) => {
      console.error("Error converting text to speech:", error.message || error);

      // Notify user of error
      sendTabMessage(tabId, {
        action: "showNotification",
        message: `Error: ${error.message || "Unknown error"}`,
        isError: true,
      }).catch((notifyError) => {
        console.error(
          "Failed to send error notification:",
          notifyError.message || "Unknown error"
        );
      });
    });
}
