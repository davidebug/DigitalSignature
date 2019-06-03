
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
  tabUrl: ""
  

  /**
   * Reset signature data.
   */
  // empty: function () {
  //     this.type = "";
  //     this.filename = "";
  //     this.password = "";
  //     this.visible = false;
  //     this.useField = false;
  //     this.verticalPosition = "Top";
  //     this.horizontalPosition = "Left";
  //     this.pageNumber = 1;
  //     this.signatureField = "";
  //     this.image = "";
  //     this.tabUrl = "";
  //     this.toSign = [];
  // },

  // copy: function (data) {
  //     this.type = data.type;
  //     this.filename = data.filename;
  //     this.password = data.password;
  //     this.visible = data.visible;
  //     this.useField = data.useField;
  //     this.verticalPosition = data.verticalPosition;
  //     this.horizontalPosition = data.horizontalPosition;
  //     this.pageNumber = data.pageNumber;
  //     this.signatureField = data.signatureField;
  //     this.image = data.image;
  //     this.tabUrl = data.tabUrl;
  //     this.toSign = data.toSign;
  // }
};


 $(document).ready(function(){

    console.log('Try to execute contentScript');        


    chrome.tabs.executeScript({          
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
chrome.runtime.onMessage.addListener(handleMessage);

function addAttachments(attachments){
  document.getElementById("my-attachments").innerHtml="";
  for(var i=0; i<attachments.length; i++){
    var attach = '<input type="checkbox" id="'+ attachments[i] +'" name="checkbox" value="value" >&nbsp;&nbsp;' + attachments[i] + '<br>';
    $("#my-attachments").append(attach);
    if(!attachments[i].endsWith('pdf')){
      document.getElementById("pades-wrapper").style.display = "none";
    }
  }
  if(attachments.length === 0){
    $("#my-attachments").append("No attachments found");
  }
}




var toDownload = [];
function getData(){
  for(var i = 0; i<attachments.length; i++){   
    if(document.getElementById(attachments[i]).checked){
      toSign.push(attachments[i]);
      toDownload.push(urls[i]);
    }  
  }  

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
  
  getData();
  if(signatureData.type != "" && signatureData.password != ""){
    sendDataToSign();
    console.log("started " + signatureData.type + " sign and Reply")
  }  
    // else dai errore
});

$("#signAndSend").click(function(){
 
  getData();
  if(signatureData.type != "" && signatureData.password != ""){
    sendDataToSign();
    console.log("started " + signatureData.type + " sign and Send")
  }
    // else dai errore
  
});

$("#signAndSave").click(function(){
 
  getData();
  if(signatureData.type != "" && signatureData.password != ""){
    sendDataToSign();
    console.log("started " + signatureData.type + " sign and Save")
  }
    // else dai errore
  
});

const background = chrome.extension.getBackgroundPage();
const popupMessageType = background.popupMessageType; //types of message from the popup that background script can handle
//const appStateEnum = background.StateEnum;


function sendDataToSign(){

    chrome.runtime.sendMessage({
      action: popupMessageType.init,
  }, function (response) {
      console.log("opening connection to native app");
  });
  

    chrome.runtime.sendMessage({
      action: popupMessageType.sign,
      data: signatureData,
      toSign: toSign,
      toDownload: toDownload
  }, function (response) {
      console.log("Successfully signed");
      console.log(response.ack);    // restituisce "success" quando la procedura di background è conclusa.
  });
      clearData();
}

function clearData(){
  toDownload = [];
  signatureData.type= "";
  signatureData.filename= "";
  signatureData.password= "";
  signatureData.visible= false;
  signatureData.useField= false;
  signatureData.verticalPosition= "Top";
  signatureData.horizontalPosition= "Left";
  signatureData.pageNumber= 1;
  signatureData.signatureField= "";
  signatureData.image= "";
  signatureData.tabUrl= "";
  toSign = [];
}