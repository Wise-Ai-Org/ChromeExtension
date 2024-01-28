import React, { useState, useEffect } from "react";
import { firebaseApp, auth } from './firebase_config';
import {
    getAuth,
    signInWithCredential,
    GoogleAuthProvider,
    setPersistence,
    browserLocalPersistence,
} from 'firebase/auth';

const Popup = () => { 
    // State variables for toggle states
    const [sendTranscriptToggle, setSendTranscriptToggle] = useState(true);
    const [user, setUser] = useState(undefined);

    // Effect to handle Chrome storage and update state
    useEffect(() => {
        // Retrieve state from Chrome storage
        chrome.storage.sync.get(['sendTranscriptToggle'], (result) => {
            setSendTranscriptToggle(result.sendTranscriptToggle ?? true);
        });

        auth.onAuthStateChanged(user => {
            setUser(user && user.uid ? user : null);
        });

        auth.onIdTokenChanged(user => {
            setUser(user && user.uid ? user : null);
          });
    }, []);

    // Effect to update Chrome storage when toggles change
    useEffect(() => {
        // Save state to Chrome storage
        chrome.storage.sync.set({ sendTranscriptToggle });
    }, [sendTranscriptToggle]);

    // Function to handle toggle change
    const handleToggleChange = () => {
        setSendTranscriptToggle(!sendTranscriptToggle);
    };

    const signInWithGoogle = () => {
        chrome.identity.getAuthToken({ interactive: true }, token => {
            if (chrome.runtime.lastError || !token) {
                console.log(`SSO ended with an error: ${JSON.stringify(chrome.runtime.lastError)}`);
                return;
            }
            
            // Store the token in chrome.storage.sync for future use
            chrome.storage.sync.set({ 'googleAuthToken': token }, () => {
                console.log('Token saved to chrome.storage.sync');
            });
    
            const credential = GoogleAuthProvider.credential(null, token);
            signInWithCredential(auth, credential)
                .then(res => {
                    console.log('signed in!');
                })
                .catch(err => {
                    console.log(`SSO ended with an error: ${err}`);
                });
        });
    };    

    return (
        <div className="popup">
            <img src="icon.png" alt="Inwise.ai logo" className="logo" />
            <div id="toggles">
                {/* Toggle Switch */}
                <label className={`relative inline-flex items-center me-5 cursor-pointer ${sendTranscriptToggle ? 'text-teal-500' : 'text-cyan-700'}`}>
                    <span className="ms-3 text-sm text-black dark:text-gray-300">Send Transcript</span>
                    <input
                        type="checkbox"
                        value=""
                        className="sr-only peer"
                        checked={sendTranscriptToggle}
                        onChange={handleToggleChange}
                    />
                    <div className={`w-11 h-6 rounded-full peer dark:bg-gray-700 peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 ${sendTranscriptToggle ? 'peer-checked:bg-teal-500' : 'peer-checked:bg-cyan-700'}`}></div>
                </label>
            </div>
            {user ? (
                <div>
                    <h1>Signed in as {user.displayName}.</h1>
                    <button onClick={() => auth.signOut()}>Sign Out</button>
                </div>
            ) : (
                <button
                    className="bg-cyan-700 text-white px-4 py-2 rounded-md mt-4"
                    onClick={signInWithGoogle}
                >
                    Sign In with Google
                </button>
            )}
        </div>
    );
};

export default Popup;
