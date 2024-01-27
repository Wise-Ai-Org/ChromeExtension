let dataBuffer = {}; // Object to store received data for 30 seconds
let toBeSentStack = {}; // Object to hold data waiting to be sent to the server
let isSendData = true;

// Set the sendTranscriptToggle as true in chrome storage on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ sendTranscriptToggle: true });
});

// Log the changes in the status of the variable in the chrome storage
chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let key in changes) {
        let { oldValue, newValue } = changes[key];

        if (key === 'sendTranscriptToggle') {
            chrome.storage.sync.get('sendTranscriptToggle', (data) => {
                isSendData = data.sendTranscriptToggle;
                console.log('sendTranscriptToggle value changed from ' + oldValue + ' to ' + newValue);
            });
        }

        // Assuming you want to handle loading changes for sign-in/sign-out logic
        if (key === 'loading') {
            chrome.storage.sync.get(['user', 'loading'], (data) => {
                console.log('Loading value changed from ' + oldValue + ' to ' + newValue);

                // Assuming you want to trigger sign-in logic when loading is set to true
                if (newValue.state === true) {
                    console.log("Inside Loading");
                    if (newValue.command === "signOut") {
                        console.log("Sign Out");
                        // Assuming you want to set a dummy user for illustration
                        chrome.storage.sync.set({ loading: { state: false, command: undefined } });
                    } else if (newValue.command === "signIn") {
                        console.log("Sign In");
                        chrome.storage.sync.set({ loading: { state: false, command: undefined } });
                        chrome.storage.sync.set({ user: { displayName: 'John Doe' } });
                    }
                }
            });
        }
    }
});


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
            console.log(toBeSentStack[data["URL"]]);
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

    // Push the received data to the buffer array
    if (!dataBuffer.hasOwnProperty(message['URL'])) {
        dataBuffer[message['URL']] = [];
    }
    if(isSendData){
        dataBuffer[message['URL']].push(message["Conversation"]);
    }
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
    if (Object.keys(toBeSentStack).length > 0 ) {
        const oldestUrl = Object.keys(toBeSentStack)[0];
        sendDataToServer({ "URL": oldestUrl, "Conversation": toBeSentStack[oldestUrl] });
    }
}

// Set an interval to queue data every 30 seconds
setInterval(queueDataAfterDelay, 30000);