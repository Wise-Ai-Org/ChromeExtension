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

                    // Once signed in, get the ID token and send it to your backend
                    auth.currentUser.getIdToken(/* forceRefresh */ true)
                    .then(idToken => {
                        console.log('ID token:',idToken);
                    }).catch(error => {
                        console.error('Error getting ID token:', error);
                    });
                })
                .catch(err => {
                    console.log(`SSO ended with an error: ${err}`);
                });
        });
    };    

    return (
        <div className="popup ml-6 mr-6">
            <img src="icon.png" alt="Inwise.ai logo" className="logo ms-3"/>
            <div id="toggles" className="mt-4">
                {/* Toggle Switch */}
                <label className={`relative inline-flex items-center cursor-pointer ${sendTranscriptToggle ? 'text-teal-500' : 'text-cyan-700'} justify-between w-full`} style={{}}>
                    <span className="text-base font-sans font-semibold" style={{color:"#2B3674"}}>Send Transcript</span>
                    <input
                        type="checkbox"
                        value=""
                        className="sr-only peer"
                        checked={sendTranscriptToggle}
                        onChange={handleToggleChange}
                    />
                    <div className={`w-11 h-6 rounded-full peer bg-[#0F738C] peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 ${sendTranscriptToggle ? 'peer-checked:bg-[#35A99A]' : 'peer-checked:bg-[#0F738C]'} pl-[2px]`}>

                    </div>
                </label>
            </div>
            <div className="w-full flex justify-center">
                {user ? (
                    <div className="w-full my-4">
                        <h1 className="text-sm font-sans text-center" style={{color:"#A3AED0"}}>Signed in as {user.displayName}.</h1>
                        <button className="bg-[#35A99A] text-white px-4 py-2 rounded-2xl mt-[4px] w-full" onClick={() => auth.signOut()}>Sign Out</button>
                    </div>
                ) : (
                    <button
                        className="bg-[#0F738C] text-white px-4 py-2 rounded-2xl mt-4 w-full"
                        onClick={signInWithGoogle}
                    >
                        Sign In with Google
                    </button>
                )}
            </div>
        </div>
    );
};

export default Popup;
