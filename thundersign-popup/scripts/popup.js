// Below is what we'll log to the console.
console.log('Popup.js - Started');



 $(document).ready(function(){

   

     // browser.tabs.query({windowId: browser.windows.WINDOW_ID_CURRENT})
            //  .then(tabs =>  console.log(tabs));

    console.log('Try to execute contentScript');        
    //  browser.tabs.get(1).then(Tab => console.log(Tab));

     browser.tabs.create({
      url: 'https://example.org'
    });

    browser.tabs.executeScript({
                
      file: 'scripts/contentScript.js'
    });

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

  function sendMessage(){
    browser.runtime.sendMessage({action: 'start'}, function(response)
    {});
  }
  // function handleMessage(request, sender, sendResponse) {
  //   console.log(`content script sent a message: ${request.content}`);
  //   sendResponse({response: "response from background script"});
  // }
  
  // browser.runtime.onMessage.addListener(handleMessage);