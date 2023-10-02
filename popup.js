// chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
//     console.log('test')
//     if (message.transcriptObserverStarted) {
//       // Enable your toggles or take any other action in the popup
//       console.log('Transcript observer has started. Enable toggles!');
//       document.getElementById('toggleContainer').style.display = 'flex'
//     }
//   });

//   // Request the observer state from the background script
// chrome.runtime.sendMessage({ getObserverState: true }, function (response) {
//     if (response && response.transcriptObserverStarted) {
//       // Enable your toggles or take any other action in the popup
//       console.log('Transcript observer has started. Enable toggles!');
//     } else {
//       // Handle the case where the observer has not started
//       console.log('Transcript observer has not started. Toggles will not be enabled.');
//     }
//   });

  
  document.addEventListener('DOMContentLoaded', function() {
    // Send a message to content.js when the popup is opened
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { command: 'popupOpened' });
    });
    
    // Listen for messages from content.js
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.from === 'content' && request.command === 'contentToPopup') {
        // Handle the message from content.js here
        console.log('Message from content.js:', request.data);
        document.getElementById('toggles').style.display = 'flex'
      }
    });
  });
  