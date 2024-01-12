import React, { useState, useEffect } from "react";
import './popup.css';

const Popup = () => {
    // State variables for toggle states
    const [recordingToggle, setRecordingToggle] = useState(true);
    const [captionsToggle, setCaptionsToggle] = useState(false);

    // Effect to handle Chrome storage and update state
    useEffect(() => {
        // Retrieve state from Chrome storage
        chrome.storage.sync.get(['recordingToggle', 'captionsToggle'], (result) => {
            setRecordingToggle(result.recordingToggle ?? true);
            setCaptionsToggle(result.captionsToggle ?? false);
        });
    }, []);

    // Effect to update Chrome storage when toggles change
    useEffect(() => {
        // Save state to Chrome storage
        chrome.storage.sync.set({ recordingToggle, captionsToggle });
    }, [recordingToggle, captionsToggle]);

    return (
        <div className="popup">
            <img src="inwise-logo.png" alt="Inwise.ai logo" className="logo" />
            <div id="toggles">
                <div className="toggleContainer">
                    <div className="toggleLabel">Recording</div>
                    <label className="switch">
                        <input
                            type="checkbox"
                            id="recordingToggle"
                            checked={recordingToggle}
                            onChange={() => setRecordingToggle(!recordingToggle)}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
                <div className="toggleContainer">
                    <div className="toggleLabel">Show captions</div>
                    <label className="switch">
                        <input
                            type="checkbox"
                            id="captionsToggle"
                            checked={captionsToggle}
                            onChange={() => setCaptionsToggle(!captionsToggle)}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
            </div>
            <div id="addedTextContainer"></div>
        </div>
    );
};

export default Popup;
