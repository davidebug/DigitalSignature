
console.log('Popup.js - Started');

var signatureData = {
  type: "",
  filename: "",
  password: "",
  visible: false,
  useField: false,
  verticalPosition: "Top",
  horizontalPosition: "Left",
  pageNumber: 1,
  signatureField: "",
  image: "",
  tabUrl: "",
  toSign: [],

  /**
   * Reset signature data.
   */
  empty: function () {
      this.type = "";
      this.filename = "";
      this.password = "";
      this.visible = false;
      this.useField = false;
      this.verticalPosition = "Top";
      this.horizontalPosition = "Left";
      this.pageNumber = 1;
      this.signatureField = "";
      this.image = "";
      this.tabUrl = "";
      this.toSign = [];
  },

  copy: function (data) {
      this.type = data.type;
      this.filename = data.filename;
      this.password = data.password;
      this.visible = data.visible;
      this.useField = data.useField;
      this.verticalPosition = data.verticalPosition;
      this.horizontalPosition = data.horizontalPosition;
      this.pageNumber = data.pageNumber;
      this.signatureField = data.signatureField;
      this.image = data.image;
      this.tabUrl = data.tabUrl;
      this.toSign = data.toSign;
  }
};


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
}

function downloadAttachments(){
  for(var i = 0; i<attachments.length; i++){    
    if(document.getElementById(attachments[i]).checked){
      signatureData.toSign.push(attachments[i]);
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

function onStartedDownload(id) {
  console.log(`Started downloading: ${id}`);
}

function onFailed(error) {
  console.log(`Download failed: ${error}`);
}



function getData(){
  if(document.getElementById("cades").checked){
    signatureData.type = "cades"
  }
  else if(document.getElementById("pades").checked){
    signatureData.type = "pades"
  }
  else if(document.getElementById("visible-pades").checked){
    signatureData.type = "pades"
    signatureData.visible = true;
  }
  signatureData.password = document.getElementById("password").value;
}

$("#signAndReply").click(function(){
  downloadAttachments();
  getData()
  if(signatureData.type != "" && signatureData.password != ""){
    sendDataToSign();
    console.log("started " + signatureData.type + "sign and Reply")
  }  
    // else dai errore
});

$("#signAndSend").click(function(){
  downloadAttachments();
  getData();
  if(signatureData.type != "" && signatureData.password != ""){
    sendDataToSign();
    console.log("started " + signatureData.type + "sign and Send")
  }
    // else dai errore
  
});

$("#signAndSave").click(function(){
  downloadAttachments();
  getData();
  if(signatureData.type != "" && signatureData.password != ""){
    sendDataToSign();
    console.log("started " + signatureData.type + "sign and Save")
  }
    // else dai errore
  
});

function sendDataToSign(){
  browser.runtime.sendMessage({action: sign, data: signatureData }, function(response)  // aggiungere poi qui dati per il visible pades
  { 
    console.log("<<< received:")
    console.log(response.ack);
  });
}