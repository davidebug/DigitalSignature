


console.log('contentScript.js - Injected');

var myAttachments = document.getElementsByClassName("aZo");
var attachmentsList = [];
var urlsCollect = document.getElementsByClassName("aQy aZr e");
var myUrls = [];

for( var i = 0; i<urlsCollect.length; i++){
    myUrls.push(urlsCollect[i].getAttribute('href'));
}

for(var i = 0; i<myAttachments.length;i++){
    
    attachmentsList.push(document.getElementsByClassName("aV3 zzV0ie")[i].innerText);
    console.log(attachmentsList[i]);
}
browser.runtime.sendMessage({popupContent: attachmentsList, urls: myUrls }, function(response)
{});

// function notify(message) {
//     browser.runtime.sendMessage({content: "Function call: " + message});
    
//   }
  
// exportFunction(notify, window, {defineAs:'notify'});

