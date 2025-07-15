# Privacy Policy for WebReader Chrome Extension

**Last Updated:** July 14, 2025

This Privacy Policy describes how the WebReader Chrome Extension ("the extension") handles your data. As the sole developer of this extension, I am committed to protecting your privacy.

## 1. Data Handled by the Extension

The extension is designed to function with minimal data handling. It only interacts with the following data when you actively use its features:

- **Authentication Information:** Your ElevenLabs API key, which you voluntarily provide in the extension's settings.

- **Website Content:** The specific text you highlight and select on a webpage when you choose to use the "Read with WebReader" feature.

The extension does **not** collect any other personally identifiable information, location data, web history, or user activity.

## 2. How Your Data Is Used

Your data is used for the sole purpose of providing the extension's text-to-speech functionality:

- **Your ElevenLabs API Key** is used to authenticate your requests with the ElevenLabs API. It is sent to ElevenLabs with each text-to-speech request you initiate.

- **The Selected Text** is sent to the ElevenLabs API as the direct input for the audio conversion.

Your data is never used for advertising, analytics, or any purpose unrelated to the core function of the extension.

## 3. Data Storage and Security

- Your ElevenLabs API key is stored locally on your device using the secure `chrome.storage` API. It is not stored on any remote server controlled by me.
- The selected text is processed in real-time and is not stored by the extension after being sent to the ElevenLabs API.

## 4. Third-Party Services

To provide its service, the extension sends your selected text and API key to the ElevenLabs API for processing. You are encouraged to review their privacy policy to understand how they handle data:

- **ElevenLabs Privacy Policy:** [https://elevenlabs.io/privacy](https://elevenlabs.io/privacy)

## 5. Changes to This Privacy Policy

I may update this Privacy Policy from time to time. Any changes will be reflected in this document. You are advised to review this Privacy Policy periodically for any changes.

## 6. Contact Me

If you have any questions about this Privacy Policy, you can contact me by opening an issue on the official GitHub repository for this project.
