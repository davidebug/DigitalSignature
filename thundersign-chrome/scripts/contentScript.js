


console.log('contentScript.js - Injected');

var myAttachments = document.getElementsByClassName("aZo");
var attachmentsList = [];
var urlsCollect = document.getElementsByClassName("aQy aZr e");

var recipient = document.getElementsByClassName("gD")[0].getAttribute("email");
var myUrls = [];

for( var i = 0; i<urlsCollect.length; i++){
    myUrls.push(urlsCollect[i].getAttribute('href'));
}

for(var i = 0; i<myAttachments.length;i++){
    
    attachmentsList.push(document.getElementsByClassName("aV3 zzV0ie")[i].innerText);
    console.log(myUrls[i]);
}


chrome.runtime.sendMessage({popupContent: attachmentsList, urls: myUrls, recipient: recipient }, function(response)
{});

// function notify(message) {
//     chrome.runtime.sendMessage({content: "Function call: " + message});
    
//   }
  
// exportFunction(notify, window, {defineAs:'notify'});

