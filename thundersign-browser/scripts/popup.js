
console.log('Popup.js - Started');



 $(document).ready(function(){

    console.log('Try to execute contentScript');        


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

  var urls = [];
  var attachments = [];
  var toSign = [];

  function handleMessage(message) {
    console.log(message.popupContent);
    attachments = message.popupContent;
    addAttachments(attachments);
    urls = message.urls;
    
    // else if(message.action =="content"){
    //   console.log('content received');
    // }   
//sendResponse({response: "response from background script"});
}
browser.runtime.onMessage.addListener(handleMessage);

function addAttachments(attachments){
  document.getElementById("my-attachments").innerHtml="";
  for(var i=0; i<attachments.length; i++){
    var attach = '<input type="checkbox" id="'+ attachments[i] +'" name="checkbox" value="value" >&nbsp;&nbsp;' + attachments[i] + '<br>';
    $("#my-attachments").append(attach);
    
  }

  
  $("#signAndReply").click(function(){
    downloadAttachments();
    
  });

  $("#signAndSend").click(function(){
    downloadAttachments();
    
  });

  $("#signAndSave").click(function(){
    downloadAttachments();
    
  });

  function downloadAttachments(){
    for(var i = 0; i<attachments.length; i++){    
      if(document.getElementById(attachments[i]).checked){
        toSign.push(attachments[i]);
        var downloadUrl = urls[i];
        var downloading = browser.downloads.download({
          url : downloadUrl,
          filename: attachments[i],
          conflictAction : 'overwrite'
        });         
        downloading.then(onStartedDownload, onFailed);
        //To do download attachments

      }
    }
  }
}
function onStartedDownload(id) {
  console.log(`Started downloading: ${id}`);
}

function onFailed(error) {
  console.log(`Download failed: ${error}`);
}

