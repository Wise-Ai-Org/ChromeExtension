
import { firebaseApp, auth } from './firebase_config';
import {
    getAuth,
    signInWithCredential,
    signOut,
    GoogleAuthProvider,
    setPersistence,
    browserLocalPersistence,
} from 'firebase/auth';

let dataBuffer = {};
let toBeSentStack = {};
let isSendData = true;

function signInWithGoogle() {
    chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
        // Use the token for authentication.
        console.log(token);
        // You can make authenticated requests using the token here.
        getGoogleCalendarEvents(token);
    });
}

function getGoogleCalendarEvents(token) {
    // Fetch the first five Google Calendar events
    fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=5', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => response.json())
    .then(data => {
        // Handle the retrieved calendar events
        console.log('Calendar Events:', data.items);
        // You can do further processing with the events here
    })
    .catch(error => {
        console.error('Error fetching calendar events:', error);
    });
}

/*
const configureAuthPersistence = async () => {
    try {
        await setPersistence(auth, browserLocalPersistence);
        console.log('Firebase authentication persistence set to LOCAL');
    } catch (error) {
        console.error('Error setting Firebase authentication persistence:', error);
    }
};
*/
/*
const signInWithGoogle = () => {
    chrome.identity.getAuthToken({ interactive: true }, token => {
        if (chrome.runtime.lastError || !token) {
            console.error(`SSO ended with an error: ${JSON.stringify(chrome.runtime.lastError)}`);
            return;
        }

        /*
        const credential = GoogleAuthProvider.credential(null, token);
        signInWithCredential(auth, credential)
            .then(res => {
                console.log('signed in!');
            })
            .catch(err => {
                console.error(`SSO ended with an error: ${err}`);
            });
        
    });
};
*/
const signOutFromGoogle = () => {
    /*
    signOut(auth)
        .then(() => {
            console.log('signed out!');
        })
        .catch(err => {
            console.error(`Sign-out ended with an error: ${err}`);
        });
        */
};

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ sendTranscriptToggle: true });
    //configureAuthPersistence(); // Configure persistence on installation
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let key in changes) {
        let { oldValue, newValue } = changes[key];

        if (key === 'sendTranscriptToggle') {
            chrome.storage.sync.get('sendTranscriptToggle', (data) => {
                isSendData = data.sendTranscriptToggle;
                console.log('sendTranscriptToggle value changed from ' + oldValue + ' to ' + newValue);
            });
        }

        if (key === 'loading') {
            chrome.storage.sync.get(['user', 'loading'], (data) => {
                console.log('Loading value changed from ' + oldValue + ' to ' + newValue);

                if (newValue && newValue.state === true) {
                    if (newValue.command === "signOut") {
                        console.log("Sign Out");
                        //signOutFromGoogle();
                        chrome.storage.sync.set({ loading: { state: false, command: undefined } });
                        chrome.storage.sync.set({ user: undefined });
                    } else if (newValue.command === "signIn") {
                        console.log("Sign In");
                        signInWithGoogle();
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