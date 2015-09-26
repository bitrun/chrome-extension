var apiUrl = "https://bit.run";

chrome.management.getSelf(function(app) {
  if (app.installType == "development") {
    apiUrl = "https://bitrun.dev";
  }
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.messageName == "getApiUrl") {
    sendResponse({url: apiUrl});
  }
});