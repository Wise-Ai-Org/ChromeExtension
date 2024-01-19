document.addEventListener('DOMContentLoaded', function () {
  const captionsToggle = document.getElementById('captionsToggle');
  const recordingToggle = document.getElementById('recordingToggle');

  // Function to send a message to all tabs matching the specified pattern
  function sendToMatchingTabs(message, callback) {
    chrome.tabs.query({ url: '*://meet.google.com/*' }, function (tabs) {
      tabs.forEach(function (tab) {
        chrome.tabs.sendMessage(tab.id, message, callback);
      });
    });
  }

  // Read the extension's state from Chrome storage
  chrome.storage.sync.get(['recordingState', 'captionState'], function (result) {
    recordingToggle.checked = result.recordingState || false;
    captionsToggle.checked = result.captionState || false;

    const captionsCommand = captionsToggle.checked ? 'startCaption' : 'stopCaption';
    const recordingommand = recordingToggle.checked ? 'startRecording' : 'stopRecording';

    sendToMatchingTabs({ originFile: 'popup', destinationFile: 'content', command: captionsCommand });
    sendToMatchingTabs({ originFile: 'popup', destinationFile: 'content', command: recordingommand });
  });

  // Event listener for captions toggle
  captionsToggle.addEventListener('change', function () {
    const command = captionsToggle.checked ? 'startCaption' : 'stopCaption';

    // Send the command to all tabs matching the pattern
    sendToMatchingTabs({ originFile: 'popup', destinationFile: 'content', command });

    // Update the state in Chrome storage
    chrome.storage.sync.set({ 'captionState': captionsToggle.checked });
  });

  // Event listener for recording toggle
  recordingToggle.addEventListener('change', function () {
    const command = recordingToggle.checked ? 'startRecording' : 'stopRecording';

    // Send the command to all tabs matching the pattern
    sendToMatchingTabs({ originFile: 'popup', destinationFile: 'content', command });

    // Update the state in Chrome storage
    chrome.storage.sync.set({ 'recordingState': recordingToggle.checked });
  });
});
