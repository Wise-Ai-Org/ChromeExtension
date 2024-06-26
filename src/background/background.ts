/*
The code below is for calendar integration.
*/
let isSendData = true; // Flag to determine whether data should be sent
let accessToken = undefined; // Access token for authentication
let syncToken = null; // Token for synchronization (initially null)

let userName = null;
let userEmail = null;

// Set the sendTranscriptToggle as true in chrome storage on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ sendTranscriptToggle: true, 
        googleAuthToken: undefined, userName: null, userEmail: null });
});

// Retrieve data from chrome.storage.sync when Chrome starts
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.sync.get(['sendTranscriptToggle', 'userName', 'userEmail', 'googleAuthToken', 'syncToken'], function(data) {
        userName = data.userName;
        userEmail = data.userEmail;
        accessToken = data.googleAuthToken;
        syncToken = data.syncToken;
        isSendData = data.sendTranscriptToggle;
        console.log('sendTranscriptToggle', userName);
        console.log('userName', userName);
        console.log('userEmail', userEmail);
        console.log('googleAuthToken', accessToken);
        console.log('syncToken', syncToken);
    });
});

// Log the changes in the status of the variable in the chrome storage
chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        // Update isSendData based on changes to 'sendTranscriptToggle'
        if (key === 'sendTranscriptToggle') {
            chrome.storage.sync.get('sendTranscriptToggle', (data) => {
                isSendData = data.sendTranscriptToggle;
            });
        }

        // Update accessToken and perform initial sync on changes to 'googleAuthToken'
        if (key === 'googleAuthToken') {
            console.log("User Changed");
            chrome.storage.sync.get('googleAuthToken', (data) => {
                accessToken = newValue;
                performInitialSync();
            });
        }
    }
});

// Function to perform initial synchronization
async function performInitialSync() {
    // Make the initial API request to fetch all events if accessToken is available
    if (accessToken) {
        await getUserProfile(accessToken);
        console.log("First Sync");
        console.log(accessToken);
        syncCalendar(accessToken); // Change here: Use await
    }
}

// Function to sync calendar events
async function syncCalendar(accessToken) { // Change here: Added async
    // Check if accessToken is null or undefined
    if (accessToken === null || accessToken === undefined) {
        chrome.storage.sync.get(['userName', 'userEmail', 'googleAuthToken', 'syncToken'], function(data) {
            userName = data.userName;
            userEmail = data.userEmail;
            accessToken = data.googleAuthToken;
            syncToken = data.syncToken;
            // Use the accessToken value here
            console.log('Access Token:', accessToken);
            console.log('User Name:', userName);
            console.log('User Email:', userEmail);

            if (accessToken !== null && accessToken !== undefined){
                syncCalendar(accessToken);
            }
        });
    }
    
    // Proceed with synchronization only if accessToken is available
    if (accessToken && userName && userEmail) {
        let apiUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

        // Append syncToken to the API URL if available
        if (syncToken) {
            apiUrl += `?syncToken=${encodeURIComponent(syncToken)}`;
        }else{
            const today = new Date();
            const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
            const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);

            // Format the dates as RFC3339 strings as required by the API
            const formattedStartDate = startDate.toISOString();
            const formattedEndDate = endDate.toISOString();

            apiUrl += `?timeMin=${formattedStartDate}&timeMax=${formattedEndDate}`;
        }

        // Fetch calendar events using the API
        try { // Change here: Added try-catch
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                },
            });
            const data = await response.json();
            console.log('Sync Token:', syncToken);
            console.log('Sync Response:', data);

            const postData = {
                name: userName,
                email: userEmail,
                events: data.items
            };

            const serverResponse = await fetch('https://inwise-node-functions.azurewebsites.net/api/orchestrators/calendar-orchestration?code=7snQBIDVe8sVFmlWH3qQNJSM31A_saCuiyEiJ0vasmRoAzFuT2Oc9A==', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData),
            });

            console.log("Server confirmed receipt of data:", serverResponse);
            console.log("The data:", data);

            // Extract and store the new syncToken for future use
            const newSyncToken = data.nextSyncToken;

            if (newSyncToken) {
                chrome.storage.sync.set({ 'syncToken': newSyncToken });
            }
            
            syncToken = newSyncToken;

            // Handle the initial sync data as needed
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

// Function to get user profile information
function getUserProfile(accessToken) {
    // Proceed only if accessToken is available
    if (accessToken) {
        // Define the API endpoint for fetching user profile information
        let apiUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';

        // Fetch user profile information using the API
        fetch(apiUrl, {
            headers: {
                'Authorization': 'Bearer ' + accessToken,
            },
        })
        .then(response => response.json())
        .then(data => {
            // Log user profile information to the console
            userName = data.name;
            userEmail = data.email;

            chrome.storage.sync.set({ 'userName': userName });
            chrome.storage.sync.set({ 'userEmail': userEmail });

            // Handle the profile information as needed
        }).catch(error => console.error('Error:', error));
    }
}

/*
The code below is used for transcript handling
 */
let dataBuffer = {}; // Array to store received data for 30 seconds
let toBeSentStack = {}; // Queue to hold data waiting to be sent to the server

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
        //console.log("The data:", data);
    } catch (error) {
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
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {

    if (message['action'] === "transmitTranscript") {
        // Push the received data to the buffer array
        if (!dataBuffer.hasOwnProperty(message['URL'])) {
            dataBuffer[message['URL']] = [];
        }
    
        if (isSendData) {
            let conversation = message["Conversation"];
            if (conversation['speaker'] === "You" && userName !== null) {
                conversation['speaker'] = userName;
            }
            dataBuffer[message['URL']].push(conversation);
        }
    } else if (message['action'] === "consolidateTranscript") {
        while (Object.keys(dataBuffer).length > 0) {
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for 100ms
        }

        console.log("Closed Window");

        try {
            const response = await fetch('https://inwise-node-functions.azurewebsites.net/api/orchestrators/orchestrate_meeting?code=7snQBIDVe8sVFmlWH3qQNJSM31A_saCuiyEiJ0vasmRoAzFuT2Oc9A==', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({"googleMeetUrl": message['URL']}),
            });
            console.log("Server confirmed receipt of data:", response);
            console.log("The consolidation URL:", message['URL']);
        } catch (error) {
            console.error(error);
        }
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
setInterval(queueDataAfterDelay, 30 * 1000);

// Set calander update to every 12 hours
setInterval(async () => {syncCalendar(accessToken);}, 20 * 60 * 1000);//12 * 60 * 60 * 1000); // 12 hours in milliseconds