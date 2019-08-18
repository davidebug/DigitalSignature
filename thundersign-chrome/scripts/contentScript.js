
// Content Script to inject in the page, it searches for attachments, urls and recipients inside the DOM.

console.log('contentScript.js - Injected');

var myAttachments = document.getElementsByClassName("aZo");  // Attachments list
var attachmentsList = [];
var urlsCollect = document.getElementsByClassName("aQy aZr e");  // Urls List

var recipient = document.getElementsByClassName("gD")[0].getAttribute("email");  // Actual Recipient
var myUrls = [];

for( var i = 0; i<urlsCollect.length; i++){
    myUrls.push(urlsCollect[i].getAttribute('href'));
}

for(var i = 0; i<myAttachments.length;i++){  
    attachmentsList.push(document.getElementsByClassName("aV3 zzV0ie")[i].innerText);
    console.log(myUrls[i]);
}

// Sends the attachments, the urls and the reply recipient to the popup script.
chrome.runtime.sendMessage({popupContent: attachmentsList, urls: myUrls, recipient: recipient }, function(response)
{});


