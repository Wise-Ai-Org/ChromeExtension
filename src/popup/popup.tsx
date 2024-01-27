import React, { useState, useEffect } from "react";

const Popup = () => {
    // State variables for toggle states
    const [sendTranscriptToggle, setSendTranscriptToggle] = useState(true);
    const [user, setUser] = useState({ displayName: "" }); // Set displayName to an empty string
    const [loading, setLoading] = useState({ state: false, command: undefined });

    // Effect to handle Chrome storage and update state
    useEffect(() => {
        // Retrieve state from Chrome storage for sendTranscriptToggle, user, and loading
        chrome.storage.sync.get(['sendTranscriptToggle', 'user', 'loading'], (result) => {
            setSendTranscriptToggle(result.sendTranscriptToggle ?? true);
            setUser(result.user);
            setLoading(result.loading);
        });
    }, []);

    // Effect to update Chrome storage when toggles change or user changes
    useEffect(() => {
        // Save state to Chrome storage
        chrome.storage.sync.set({ sendTranscriptToggle, user, loading }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving state to Chrome storage:", chrome.runtime.lastError);
            }
        });
    }, [sendTranscriptToggle, user, loading]);

    // Function to handle toggle change
    const handleToggleChange = () => {
        setSendTranscriptToggle(!sendTranscriptToggle);
    };

    const signInWithGoogle = () => {
        setLoading({ state: true, command: "signIn" });
        // Implement sign-in logic here
    };

    const signOut = () => {
        // Implement sign-out logic if needed
        setLoading({ state: true, command: "signOut" });
    };

    return (
        <div className="popup">
            <img src="icon.png" alt="Inwise.ai logo" className="logo" />
            <div id="toggles">
                {/* Toggle Switch */}
                <label className={`toggle-label ${sendTranscriptToggle ? 'teal' : 'cyan'}`}>
                    <span className="toggle-label-text">Send Transcript</span>
                    <input
                        type="checkbox"
                        value=""
                        className="toggle-input"
                        checked={sendTranscriptToggle}
                        onChange={handleToggleChange}
                    />
                    <div className={`toggle-slider ${sendTranscriptToggle ? 'teal' : 'cyan'}`}></div>
                </label>
            </div>
            {user && user.displayName ? (
                <div>
                    <h1>Signed in as {user.displayName}.</h1>
                    <button onClick={signOut}>Sign Out</button>
                </div>
            ) : (
                <div>
                    <button
                        className={`sign-in-button ${loading && loading.state ? 'disabled' : ''}`}
                        onClick={signInWithGoogle}
                        disabled={loading && loading.state}
                    >
                        {loading && loading.state ? "Loading" : "Sign In with Google"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Popup;
