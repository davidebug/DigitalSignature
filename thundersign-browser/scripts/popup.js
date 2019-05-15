
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

  function handleMessage(message) {
    console.log(message.popupContent);
    var attachments = message.popupContent;
    addAttachments(attachments);
    var urls = message.urls;
    // else if(message.action =="content"){
    //   console.log('content received');
    // }   
//sendResponse({response: "response from background script"});
}
browser.runtime.onMessage.addListener(handleMessage);

function addAttachments(attachments){
  document.getElementById("my-attachments").innerHtml="";
  for(var i=0; i<attachments.length; i++){
    var attach = '<input type="checkbox" id=' + attachments[i] +' name="checkbox" value="value" >&nbsp;&nbsp;' + attachments[i] +'<br>';
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
    var checkboxes = document.getElementById("my-attachments").children;
    for(var i = 0; i<checkboxes.length; i++){
      if(checkboxes[i].checked){
        
        //To do download attachments

      }
    }
  }
}
  
