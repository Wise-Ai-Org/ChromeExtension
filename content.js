
let script = [];
let last_span = '';
let last_speaker = '';

// Create a MutationObserver instance for transcript changes
const transcriptObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    // Check if the mutation is related to the transcript
    if (mutation.target.classList && mutation.target.classList.contains('iTTPOb')) {
      if (mutation.addedNodes.length) {
        const newNodes = mutation.addedNodes;
        const speaker = newNodes[0]?.parentNode?.parentNode?.parentNode?.querySelector('.zs7s8d.jxFHg')?.textContent;

        if (speaker) {
          setTimeout(function () {
            if (newNodes.length) {
              if (last_speaker !== speaker) {
                script.push({'speaker':speaker, "script": newNodes["0"].innerText + "\r\n"});
                last_speaker = speaker;
                console.log('Speaker:', speaker, "Text:", script);
              } else {
                var lastText = script.pop();
                lastText['script']  = lastText['script'] + newNodes["0"].innerText + "\r\n";
                script.push(lastText);
              }
            }
          }, 10000);
        }
      }
    }

    for (const oldNode of mutation.removedNodes) {
      if (oldNode?.classList?.value==='TBMuR bj4p3b');{
        lastConvo = script.shift();
        last_speaker = '';
        if (lastConvo){
          console.log({ "URL":document.URL, lastConvo });
          chrome.runtime.sendMessage({ "URL":document.URL, lastConvo });
        }
      } 
    }
  });
});

// Create a MutationObserver instance for detecting the meeting page
const divObserver = new MutationObserver(() => {
  const ccButtonXpath = '//button[@jsname="r8qRAd"]';
  const result = document.evaluate(ccButtonXpath , document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  const ccButton = result.singleNodeValue;

  if (ccButton) {
    ccButton.click();
    console.log('ccButton found')
    const captionDivXpath = '//div[@class="iOzk7"]';
    const captionDivXpathResult = document.evaluate(captionDivXpath , document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const captionDiv = captionDivXpathResult.singleNodeValue;
    const config = {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    };
    divObserver.disconnect();
    console.log('The divObserver was disconnected');
    transcriptObserver.observe(captionDiv, config);
    //uncomment to hide cc div
    //targetNode.parentNode.parentNode.style.height = '1px'
  } else {
    console.log('ccButton not found');
  }
});

const targetNode = document.body;
const config = { childList: true, subtree: true };
divObserver.observe(targetNode, config);
