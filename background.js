let dataBuffer = []; // Array to store received data for 30 seconds
let toBeSentStack = []; // Queue to hold data waiting to be sent to the server

// Function to send data to the server
function sendDataToServer(data) {
    // Simulate a POST request to the server (replace with your actual code)
    // You can use fetch or any other HTTP library for this purpose
    console.log("Sending data to server:", data);
    try {
        const response = await fetch('https://inwise-node-functions.azurewebsites.net/api/dump_delta_transcript?code=FwBcCM4aXiYlOZVlXHb2p-GwuIg7X6pvIyPL3mCADA3NAzFu4ytNLA==', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

    // Simulate a successful response for demonstration purposes
    setTimeout(() => {
        console.log("Server confirmed receipt of data:", data);
        toBeSentStack.shift(); // Remove the oldest item from the queue
        if (toBeSentStack.length > 0) {
            // If there is pending data in the queue, send the next one immediately
            sendDataToServer(toBeSentStack[0]);
        }
    }, 2000); // Simulating a 2-second delay for the server response
}

// Receive the mutation data sent from the content script
chrome.runtime.onMessage.addListener((mutationData) => {
    // Push the received data to the buffer array
    dataBuffer.push(mutationData);
});

// Function to queue data from dataBuffer to toBeSentStack after 30 seconds
function queueDataAfterDelay() {
    if (dataBuffer.length > 0) {
        toBeSentStack.push(dataBuffer.slice()); // Queue a copy of dataBuffer
        dataBuffer = []; // Clear dataBuffer
        // Attempt to send the oldest item in the queue if not already sending
        if (toBeSentStack.length === 1) {
            sendDataToServer(toBeSentStack[0]);
        }
    }
}

// Set an interval to queue data every 30 seconds
setInterval(queueDataAfterDelay, 30000);