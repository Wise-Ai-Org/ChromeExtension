// Receive the mutation data sent from the content script
chrome.runtime.onMessage.addListener((mutationData) => {
    // Handle the received mutation data as needed
    console.log("Received mutation data:", mutationData);

  });  