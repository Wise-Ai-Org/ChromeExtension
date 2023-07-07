/*
let script = [];
last_span = '';
let last_speaker = "";

// Create a MutationObserver instance
const transcriptObserver = new MutationObserver((mutations) => {
  //chrome.runtime.sendMessage({ mutations });
  
  mutations.forEach((mutation) => {
    if (mutation.target.classList && mutation.target.classList.contains("iTTPOb")){
      if (mutation.addedNodes.length) {
        var newNodes = mutation.addedNodes;
        var speaker = newNodes["0"]?.parentNode?.parentNode?.parentNode?.querySelector(".zs7s8d.jxFHg")?.textContent;
        console.log(newNodes["0"]);
        //console.log(newNodes["0"]?.textContent);
        if (speaker) {
          setTimeout(function () {
            if (newNodes.length) {
              if (last_speaker != speaker) {
                console.log("Speaker:" + speaker);
                console.log(newNodes["0"]);
              } else {
              }
            }
          }, 10000);
        }
      }
    }
  });
});

const divObserver = new MutationObserver(() => {
  var divT4LgNb = document.getElementsByClassName("T4LgNb")[0];
  
  if (divT4LgNb) {
    var divkFwPee = divT4LgNb.getElementsByClassName("kFwPee")[0];
    
    if (divkFwPee) {
      var divcrqnQb = divkFwPee.getElementsByClassName("crqnQb")[0];
      
      if (divcrqnQb) {
        var diva4cQT = divcrqnQb.getElementsByClassName("a4cQT")[0];
        
        if (diva4cQT) {
          firstSubElementa4CQT = diva4cQT.children[0].children[0];
          
          if (firstSubElementa4CQT) {
            console.log("The div iOzk7 is present", firstSubElementa4CQT);
            
            const targetNode = firstSubElementa4CQT;

            //const config = { childList: true, subtree: true, characterData: true};
            const config = { childList: true, subtree: true, attributes: false, characterData: false,};

            divObserver.disconnect();
            console.log("The divObserver was disconnected");

            transcriptObserver.observe(targetNode, config);

          } else {
            console.log("The div iOzk7 is not present");
          }
        } else {
          console.log("The div a4cQT is not present. Meeting is not joined yet.");
        }
      
      } else {
        console.log("The div crqnQb is not present");
      }
    } else {
      console.log("The div kFwPee is not present. It is the meet.google.com page. Not the meeting page");
    }
  } else {
    console.log("The div T4LgNb is not present");
  }
});

const targetNode = document.body;

const config = { childList: true, subtree: true };

divObserver.observe(targetNode, config);
*/

let script = [];
let last_span = '';
let last_speaker = '';

// Create a MutationObserver instance for transcript changes
const transcriptObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    //chrome.runtime.sendMessage({ mutations });

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
                //script.push(speaker + " : " + newNodes["0"].innerText + "\r\n");
                last_speaker = speaker;
                //console.log('Speaker:', speaker);
                //console.log(newNodes[0]);
                //console.log('Speaker:', speaker, "Text:", script);
              } else {
                var lastText = script.pop();
                //lastText = lastText.slice(0, -2);
                lastText['script']  = lastText['script'] + newNodes["0"].innerText + "\r\n";
                script.push(lastText);
              }
            }
          }, 10000);
        }
      }
    }

    for (const oldNode of mutation.removedNodes) {
      if (oldNode.classList.value==='TBMuR bj4p3b');{
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
  const divT4LgNb = document.getElementsByClassName('T4LgNb')[0];
  
  if (divT4LgNb) {
    const divkFwPee = divT4LgNb.getElementsByClassName('kFwPee')[0];
    
    if (divkFwPee) {
      const divcrqnQb = divkFwPee.getElementsByClassName('crqnQb')[0];
      
      if (divcrqnQb) {
        const diva4cQT = divcrqnQb.getElementsByClassName('a4cQT')[0];
        
        if (diva4cQT) {
          const firstSubElementa4CQT = diva4cQT.children[0].children[0];
          
          if (firstSubElementa4CQT) {
            console.log('The div iOzk7 is present', firstSubElementa4CQT);
            
            const targetNode = firstSubElementa4CQT;
            const config = {
              childList: true,
              subtree: true,
              attributes: false,
              characterData: false,
            };
            
            divObserver.disconnect();
            console.log('The divObserver was disconnected');
            
            transcriptObserver.observe(targetNode, config);
          } else {
            console.log('The div iOzk7 is not present');
          }
        } else {
          console.log('The div a4cQT is not present. Meeting is not joined yet.');
        }
      } else {
        console.log('The div crqnQb is not present');
      }
    } else {
      console.log('The div kFwPee is not present. It is the meet.google.com page. Not the meeting page');
    }
  } else {
    console.log('The div T4LgNb is not present');
  }
});

const targetNode = document.body;
const config = { childList: true, subtree: true };

divObserver.observe(targetNode, config);
