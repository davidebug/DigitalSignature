// Below is what we'll log to the console.
console.log('Hello, World! - from popup.js');

// function loadContentScript() {
//     console.log('avvio script');
//     browser.tabs.executeScript({
//         file: 'contentScript.js'
//     });
//     console.log('finito');
//   }


 $(document).ready(function(){
    browser.runtime.sendMessage({action: 'getAttachments'}, function(response)
    {});
    
    $("#cades").click(function(){
      $(".collapse").collapse('hide');
    });
    $("#pades").click(function(){
      $(".collapse").collapse('hide');
    });
    $("#visible-pades").click(function(){
      $(".collapse").collapse('show');
    });
   
  });

  // function handleMessage(request, sender, sendResponse) {
  //   console.log(`content script sent a message: ${request.content}`);
  //   sendResponse({response: "response from background script"});
  // }
  
  // browser.runtime.onMessage.addListener(handleMessage);