


console.log('Hello, World! - from content.js');
var myAttachments =
document.getElementById("attachmentList").children[0].getAttribute("name");
browser.runtime.sendMessage({message: myAttachments}, function(response)
{});

// function notify(message) {
//     browser.runtime.sendMessage({content: "Function call: " + message});
    
//   }
  
// exportFunction(notify, window, {defineAs:'notify'});

