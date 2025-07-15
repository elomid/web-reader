# WebReader

A Chrome extension that uses the ElevenLabs API to convert selected text to speech and read it aloud.

## Features

- Right-click on selected text and choose "Read with WebReader" to convert it to speech
- Modern, sleek UI with loading, playing, and paused states
- Progress bar indicating playback position
- Play/pause controls for audio playback
- Error handling for API requests

## Installation

1. Clone this repository or download the ZIP file and extract it
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the folder containing the extension files
5. The extension should now be installed and visible in your Chrome toolbar

## Setup

1. Click the extension icon in the Chrome toolbar
2. Enter your ElevenLabs API key
3. Select your preferred voice
4. Save settings

## Usage

1. Select text on any webpage
2. Right-click and select "Read with WebReader" from the context menu
3. The extension will convert the text to speech using the ElevenLabs API
4. A player UI will appear in the bottom right corner of the page
5. You can play/pause the audio or close the player at any time

## UI Implementation

The extension features a modern UI implemented directly in the content script. The UI has several states:

- **Loading**: Displays while the text is being processed by the ElevenLabs API
- **Playing**: Shows a pause button and progress bar while audio is playing
- **Paused**: Shows a play button and progress bar when audio is paused
- **Error**: Displays when there's an issue processing the text or playing the audio

## Testing

The extension includes a test HTML file (`direct-ui-test.html`) that allows you to test the UI without the need for the extension. Open this file in a browser to test the different UI states and interactions.

## Debug Tools

For development and troubleshooting, the extension includes a debug script (`debug.js`) that can be used to:

- Test the text-to-speech functionality directly on a page
- Check for errors in the conversion process
- Verify that the content script is loaded correctly

To use the debug tools, open the browser console on a page where the extension is active and use:

```javascript
// Reset the UI if it gets stuck
window.resetWebReaderUI();

// Test with sample text
document.dispatchEvent(
  new CustomEvent("webReaderTest", {
    detail: { text: "This is a test message to read aloud." },
  })
);
```

## Developer Notes

- The UI is styled using inline CSS for reliable rendering across different websites
- Audio playback is handled by the built-in Audio API
- The extension uses a background script to handle API requests and communicate with the content script
- Progress updates are managed through event listeners on the audio element

## Troubleshooting

If the extension doesn't work as expected:

1. Make sure your ElevenLabs API key is valid
2. Check that you have sufficient credits in your ElevenLabs account
3. Verify that you've selected a voice in the extension settings
4. Check the browser console for any error messages
5. Try reloading the extension and/or the page

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

- Uses the [ElevenLabs API](https://elevenlabs.io/) for text-to-speech conversion
- Icons from [Material Design Icons](https://material.io/resources/icons/)
