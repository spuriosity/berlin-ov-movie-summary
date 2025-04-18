document.getElementById('summarizeBtn').addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: createSummaryView
    });
  });
  
  document.getElementById('restoreBtn').addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: restoreOriginalView
    });
  });
  
  function createSummaryView() {
    // This function runs in the context of the webpage
    if (window.originalContent === undefined) {
      window.originalContent = document.documentElement.outerHTML;
    }
    
    // Dispatch the custom event that content.js is listening for
    document.dispatchEvent(new CustomEvent('createMovieSummary'));
  }
  
  function restoreOriginalView() {
    // This function runs in the context of the webpage
    document.dispatchEvent(new CustomEvent('restoreOriginalView'));
  }