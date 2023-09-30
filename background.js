let dataBuffer = {}; // Array to store received data for 30 seconds
let toBeSentStack = {}; // Queue to hold data waiting to be sent to the server
let transcriptObserverStarted = false; // Track the state of the transcript observer

// Function to send data to the server
async function sendDataToServer(data) {
    // Simulate a POST request to the server (replace with your actual code)
    // You can use fetch or any other HTTP library for this purpose
    try {
        const response = await fetch('https://inwise-node-functions.azurewebsites.net/api/dump_delta_transcript?code=FwBcCM4aXiYlOZVlXHb2p-GwuIg7X6pvIyPL3mCADA3NAzFu4ytNLA==', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        console.log("Server confirmed receipt of data:", response);
        console.log("The data:", data);} catch (error) {
        console.error(error);
    }

    // when successful response from the server
    setTimeout(() => {
        delete toBeSentStack[data["URL"]]; // Remove the oldest item from the queue
        if (Object.keys(toBeSentStack).length > 0) {
            // If there is pending data in the queue, send the next one immediately
            const oldestUrl = Object.keys(toBeSentStack)[0];
            sendDataToServer({ "URL": oldestUrl, "Conversation": toBeSentStack[oldestUrl] });
        }
    }, 2000); // Simulating a 2-second delay for the server response
}

// Receive the mutation data sent from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.transcriptObserverStarted) {
        transcriptObserverStarted = true;
        chrome.runtime.sendMessage({ transcriptObserverStarted: transcriptObserverStarted });
    }

    // Push the received data to the buffer array
    if (!dataBuffer.hasOwnProperty(message['URL'])) {
        dataBuffer[message['URL']] = [];
    }
    dataBuffer[message['URL']].push(message["Conversation"]);
});
chrome.runtime.sendMessage({ transcriptObserverStarted: true }, function (response) {
    console.log('Message sent to popup:', response);
});
// Function to queue data from dataBuffer to toBeSentStack after 30 seconds
function queueDataAfterDelay() {
    if (Object.keys(dataBuffer).length > 0) {
        for (const url in dataBuffer) {
            if (dataBuffer.hasOwnProperty(url)) {
                if (!toBeSentStack.hasOwnProperty(url)) {
                    toBeSentStack[url] = [];
                }
                toBeSentStack[url].push(dataBuffer[url].slice()); // Update or add data to toBeSentStack
            }
        }
        dataBuffer = {}; // Clear dataBuffer
    }
    // Attempt to send the oldest item in the queue if not already sending
    if (Object.keys(toBeSentStack).length > 0) {
        const oldestUrl = Object.keys(toBeSentStack)[0];
        sendDataToServer({ "URL": oldestUrl, "Conversation": toBeSentStack[oldestUrl] });
    }
}

// Set an interval to queue data every 30 seconds
setInterval(queueDataAfterDelay, 30000);
// Send a message to background.js when the content script is loaded
chrome.runtime.sendMessage({ from: 'content', command: 'contentScriptLoaded' });

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.command === 'popupOpened') {
    // Handle the message from popup.js here
    console.log('Popup opened message received in content.js');
    
    // Send a message to popup.js
    chrome.runtime.sendMessage({ from: 'content', command: 'contentToPopup', data: 'Hello from content.js' });
  }
});