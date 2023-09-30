document.addEventListener('DOMContentLoaded', function () {
  function sendToggleMessage(toggleId, isChecked) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const tabId = tabs[0].id;
      if (tabId) {
        console.log('Sending message from popup_logic.js');
        chrome.tabs.sendMessage(tabId, { toggleId, isChecked }, function (response) {
          if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError);
          }
        });
      }
    });
  }

  document.getElementById('recordingToggle').addEventListener('change', function () {
    sendToggleMessage('recordingToggle', this.checked);
  });

  document.getElementById('captionsToggle').addEventListener('change', function () {
    sendToggleMessage('captionsToggle', this.checked);
  });
});


