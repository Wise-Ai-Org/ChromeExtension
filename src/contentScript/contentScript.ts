// Initialize an array to store the transcript script
let script: { speaker: string; script: string }[] = [];

// Initialize variables to keep track of the last span and speaker
let last_span: string = '';
let last_speaker: string = '';

let user_name = '';

// Create a MutationObserver instance for transcript changes
const transcriptObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    // Check if the mutation is related to the transcript
    if (mutation.target instanceof Element && mutation.target.classList.contains('iTTPOb')) {
      if (mutation.addedNodes.length) {
        const newNodes = mutation.addedNodes;
        const tempSpeaker: string | null = (newNodes[0]?.parentNode?.parentNode?.parentNode?.querySelector('.zs7s8d.jxFHg') as HTMLElement)?.textContent ?? null;
        const speaker: string | null = tempSpeaker !== 'You' ? tempSpeaker : user_name;

        if (speaker) {
          // Delay processing by 10 seconds to ensure the full transcript is loaded
          setTimeout(() => {
            if (newNodes.length) {
              if (last_speaker !== speaker) {
                script.push({ 'speaker': speaker, "script": (newNodes[0] as HTMLElement).innerText + "\r\n" });
                last_speaker = speaker;
              } else {
                const lastText = script.pop();
                lastText['script'] = lastText['script'] + (newNodes[0] as HTMLElement).innerText + "\r\n";
                script.push(lastText);
              }
            }
          }, 10000);
        }
      }
    }

    // Check for removed nodes
    for (const oldNode of mutation.removedNodes) {
      if (oldNode instanceof Element && oldNode.classList.value === 'TBMuR bj4p3b') {
        const lastConvo = script.shift();
        last_speaker = '';
        if (lastConvo) {
          lastConvo['Time'] = new Date().getTime();

          console.log({ "URL": document.URL, "Conversation": lastConvo });
          chrome.runtime.sendMessage({
            "URL": document.URL.includes('?') ? document.URL.split('?')[0] : document.URL,
            "Conversation": lastConvo, "action": "transmitTranscript"
          });
        }
      }
    }
  });
});

// Create a MutationObserver instance for detecting when hang up button is clicked
const meetingEndedObserver = new MutationObserver(() => {

  //const userNameXpath = '//div[@class="dwSJ2e"]';
  //const userNameXpathResult = document.evaluate(userNameXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  //const userName = userNameXpathResult.singleNodeValue;

  const hangUpButtonXpath = '//button[@jsname="CQylAd"]';
  const result = document.evaluate(hangUpButtonXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  const hangUpButton = result.singleNodeValue;

  if (user_name && hangUpButton){
    //user_name = userName.textContent // do what you must
    console.log('user name: ', user_name)
    hangUpButton.addEventListener('click', e => { 
      chrome.runtime.sendMessage({
        "URL": document.URL.includes('?') ? document.URL.split('?')[0] : document.URL,
        "Conversation": undefined, "action": "consolidateTranscript"
      });
      //chrome.runtime.sendMessage... or whatever
    })
    
    // Add event listeners for beforeunload and hangUpButton click
    window.addEventListener('beforeunload', e => { 
      chrome.runtime.sendMessage({
        "URL": document.URL.includes('?') ? document.URL.split('?')[0] : document.URL,
        "Conversation": undefined, "action": "consolidateTranscript"
      })
    });
    
    hangUpButton.addEventListener('click', () => { 
  // Your click event handling code here
});
    meetingEndedObserver.disconnect();
  }
});

// Create a MutationObserver instance for detecting the meeting page
const divObserver = new MutationObserver(() => {
  // XPath to find the closed caption button
  const ccButtonXpath = '//button[@jsname="r8qRAd"]';
  const result = document.evaluate(ccButtonXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  const ccButton = result.singleNodeValue;

  if (ccButton instanceof HTMLElement) {
    // Disconnect the divObserver since it's no longer needed
    divObserver.disconnect();
    console.log('The divObserver was disconnected');

    // Click the closed caption button
    ccButton.click();
    console.log('ccButton found')

    // XPath to find the caption div
    const captionDivXpath = '//div[@class="iOzk7"]';
    const captionDivXpathResult = document.evaluate(captionDivXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const captionDiv = captionDivXpathResult.singleNodeValue;
    user_name = captionDiv.parentNode.parentNode.parentNode.querySelector('.zWGUib').textContent

    // Configure MutationObserver to observe caption changes
    const config = {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    };

    // Start observing transcript changes
    transcriptObserver.observe(captionDiv, config);

    (captionDiv.parentNode.parentNode as HTMLElement).style.height = '1px';
  } else {
    console.log('ccButton not found');
  }
});

// Define the target node for divObserver
const targetNode = document.body;
const config = { childList: true, subtree: true };

// Start observing changes in the target node
divObserver.observe(targetNode, config);
meetingEndedObserver.observe(document, config);