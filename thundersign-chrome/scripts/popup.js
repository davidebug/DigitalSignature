
console.log('Popup.js - Started');

/**
* Id of the current chrome tab where the popup has been opened
*/
var tabId = 0;

// Gets the actual gmail tab and sends it to the background script
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  var activeTab = tabs[0];
  tabId = activeTab.id;
  chrome.runtime.sendMessage({
    action: popupMessageType.wakeup,
    tabId: tabId
  }, function (response) {
    console.log("background wakeup");
  });
  console.log(tabId);
});

/**
* Signature data required by the background script to sign the document.
*
*/
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
};

/**
* Gets the backgound page and its data.
*
*/
const background = chrome.extension.getBackgroundPage();
console.log(background.appCurrentState);
const popupMessageType = background.popupMessageType; //types of message from the popup that background script can handle
const appStateEnum = background.StateEnum;
let appCurrentState = background.appCurrentState;

/**
* Urls of the attachments found in the page.
*/
var urls = [];
/**
* Attachments found in the page.
*/
var attachments = [];
/**
* Local file path of the new signed attachments.
*/
var newFilesPath = [];
/**
* List of the fields on the popup page.
*/
var fieldsList = [];
/**
* Recipient for the new mail.
*/
var recipient = "";
var replyRecipient = "";
/**
* Attachments selected ready to be downloaded by the background page.
*/
var toDownload = [];
/**
*  Attachments selected ready to be sent by the background page.
*/
var toSend = [];
/**
* Attachments selected ready to be signed by the background page.
*/
var toSign = [];

/**
* Send mode of the mail ( reply or not)
*/
var sendMode = background.sendMode;
/**
* Subject of the mail.
*/
var subject = "";
/**
* Body of the mail.
*/
var body = "";


/**
* Clears the signatureData 
*/ 
function clearSignData(){
  signatureData.type= "";
  signatureData.filename= "";
  signatureData.visible= false;
  signatureData.useField= false;
  signatureData.verticalPosition= "Top";
  signatureData.horizontalPosition= "Left";
  signatureData.pageNumber= 1;
  signatureData.signatureField= "";
  signatureData.tabUrl= "";
}

/**
* Clears the popup Data 
*/ 
function clearPopupData(){

  newFilesPath = [];

  fieldsList = [];

  recipient = "";

  toDownload = [];

  toSend = [];

  toSign = [];

  infoCount = 0;

  sendMode = background.sendMode;

  subject = "";

  body = "";
}



// Little change on the path of the input image (visible pades).
$('#inputGroupFile02').on('change',function(){
  var fullPath = $(this).val();
  var fileName = fullPath.replace(/^.*[\\\/]/, '');
  $(this).next('.custom-file-label').html(fileName);
})

// When the popup is opened the content script is injected in the page to find possible attachments and their urls.
 $(document).ready(function(){

   checkCurrenState();

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
    $("#signature-field").change(function(){
        if($(this).is(':checked')) {
          $(".collapse-1").css("display","none");
      } else {
        $(".collapse-1").css("display","inline");
      }
    });

    //on document loaded the script tries to load the image in the input file.
    const img_input = document.getElementById("inputGroupFile02");
    const reader = new FileReader();
        img_input.addEventListener('change', (e) => {
            img_input.parentNode.parentNode.classList.remove("is-success");
            img_input.disabled = true;
            console.log(img_input.files);

            if (img_input.files.length > 0) {          
                var file = event.target.files[0];

                reader.readAsDataURL(file);
                reader.onloadend = function () {
                    base64data = reader.result;
                    console.log(base64data);
                    signatureData.image = base64data;
                    img_input.parentNode.parentNode.classList.add("is-success");
                    img_input.disabled = false;
                }
            }
        });


 });

 

/**
* Adds the attachments loaded by the content script on the popup; 
* Also adds their manual position settings.
* @param {*} attachments - list of attachments to add on the popup 
*/  
function addAttachments(attachments){

  document.getElementById("my-attachments").innerHtml="";
  document.getElementById("my-attachments").innerText="";
  for(var i=0; i<attachments.length; i++){
    var attach = '<input type="checkbox" id="'+ attachments[i] +'-'+i+'" name="checkbox" value="value" >&nbsp;&nbsp;' + attachments[i] + '<br>';
    $("#my-attachments").append(attach);
    if(!attachments[i].endsWith('pdf')){
      document.getElementById("pades-wrapper").style.display = "none";
    }


    // Add manual positions

    var toAppend = '     <div style="font-size:14px;" class="container" id="set-position" >'
                      +'         <div class="input-group" style="width:100px;margin-top:10px;">Page:&nbsp; &nbsp;'                  
                      +'                  <input type="text" class="form-control" id="page'+ attachments[i] +'" style="height:20px;" value="1" required >'
                      +'          </div>'      
                      +'        <div id="vertical-pos'+ attachments[i] +'" class="input-group" style="font-size: 14px;"> Vertical Position:&nbsp; &nbsp;'
                      +'            <input id="top '+ attachments[i] +'" type="radio" name="vertical-pos'+ attachments[i] +'" value="top" checked>&nbsp;&nbsp;Top&nbsp;&nbsp;'
                      +'            <input id="middle'+ attachments[i] +'" type="radio" name="vertical-pos'+ attachments[i] +'" value="middle">&nbsp;Middle&nbsp;&nbsp;'
                      +'            <input id="bottom'+ attachments[i] +'" type="radio" name="vertical-pos'+ attachments[i] +'" value="bottom">&nbsp;Bottom&nbsp;'
                      +'        </div>'
                      +'        <div id="horizontal-pos'+ attachments[i] +'" class="input-group" style="font-size:14px"> Horizontal Position:&nbsp; &nbsp;'
                      +'                <input id="left'+ attachments[i] +'" type="radio" name="horizontal-pos'+ attachments[i] +'" value="left" checked>&nbsp;Left&nbsp;&nbsp;'
                      +'                <input id="center'+ attachments[i] +'" type="radio" name="horizontal-pos'+ attachments[i] +'" value="center">&nbsp;Center&nbsp;&nbsp;'
                      +'                <input id="right'+ attachments[i] +'" type="radio" name="horizontal-pos'+ attachments[i] +'" value="right">&nbsp;Right&nbsp;'
                      +'        </div>'
                      +'    </div>'
                      +'  </div>    '
                      
                      +'<br>';



    var manual = '<p> - ' + attachments[i] + '</p>';
    $("#manual-position").append(manual);
    $("#manual-position").append(toAppend);

  }
}

if(attachments.length === 0 || attachments == undefined){
  $("#my-attachments").append("No attachments found");
}


/**
* Gets the data per attachment selected on the popup and fills the lists required by the background page.
* @param {*} i - index of the current attachment
*/ 
function getData(i){
  
    clearSignData();
    var send = {
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
    }
    send.image = signatureData.image;
    send.password = signatureData.password;
    if(document.getElementById(attachments[i]+"-"+i).checked){
      console.log("PUSHO");
      console.log(attachments);
      toSign.push(attachments[i]);
      if(document.getElementById("cades").checked){
        send.type = "cades"
      }
      else if(document.getElementById("pades").checked){
        send.type = "pades"
      }
      else if(document.getElementById("visible-pades").checked){
        send.type = "pades"
        send.visible = true;
        send.useField = document.getElementById("signature-field").checked;
        if(send.useField === false){
          send.verticalPosition= document.querySelector('input[name="vertical-pos'+ attachments[i] +'"]:checked').value;
          send.horizontalPosition= document.querySelector('input[name="horizontal-pos'+ attachments[i] +'"]:checked').value;
          var pageNum = document.getElementById("page"+ attachments[i]).value;
          console.log("PAGE NUM-->");
          console.log(pageNum);
          if(pageNum > 0 && pageNum != "" && !isNaN(pageNum))
            send.pageNumber = pageNum;
          else{
            showError("Select a valid page number");
            hideLoading();
            return false;
          }  
        
        }

      }
      console.log("verifico-->" + attachments[i]);
      toDownload.push(urls[i]);
      toSend.push(send);
      console.log(toSend[toSend.length -1].pageNumber);
  }
  return true;
}


// Listeners for Click on Reply, Send or Save buttons.

$("#signAndReply").click(function(){
  signatureData.password = document.getElementById("password").value;

  if(signatureData.password != ""){
    for(var i = 0; i<attachments.length; i++){
      if(!getData(i))
        return;
    } 
      sendMode = "reply";
      displayMailInfo();
      console.log("started " + signatureData.type + " sign and Reply")
  }
  else{
    showError("Password needed");
  }  
});

$("#signAndSend").click(function(){
  signatureData.password = document.getElementById("password").value;

  if(signatureData.password != ""){
    for(var i = 0; i<attachments.length; i++){
      if(!getData(i))
        return;
    } 
      sendMode = "send";
      displayMailInfo();
      console.log("started " + signatureData.type + " sign and Send")
  }
  else{
    showError("Password needed");
  }  
});

$("#signAndSave").click(function(){
  signatureData.password = document.getElementById("password").value;

  if(signatureData.password != ""){
    for(var i = 0; i<attachments.length; i++){
      if(!getData(i))
        return;
    }      
    if(toSend[0].useField == false){ 
      recipient = "";    
      sendDataToSign();
    }
    else{
      requestInfo();
    }  
      console.log("started " + signatureData.type + " sign and Save")
  }
  else{
    showError("Password needed");
  }  
});


// In the case of signature field selection the sendInfo button is shown 
// and the user is forced to select a field before he can proceed.
// after he selects the field, a "sign" message is sent to the background page ( download is not required ).

$("#sendInfo").click(function(){
  var fieldsToSend = [];
  $("#fields-container").css("display","none");
  for(var i = 0; i< toSign.length; i++){
    for(var j = 0; j<fieldsList.length; j++){
      if(document.getElementById(toSign[i]+j+"field").checked){
        var field = document.getElementById(toSign[i]+j+"field").value;
        fieldsToSend.push(field);
        break;
      }
    }
  }  
  chrome.runtime.sendMessage({
    action: popupMessageType.init,
}, function (response) {
    console.log("opening connection to native app");
});

  chrome.runtime.sendMessage({
    action: popupMessageType.sign,
    fieldsList: fieldsToSend,
    subject: subject,
    body: body,
    recipient: recipient,


}, function (response) {
    console.log("Loading background app");
    showLoading("Signing on selected fields, please wait, it could takes few minutes..");
    console.log(response.ack);    // restituisce "success" quando la procedura di background è conclusa.
});
    clearSignData();
    $("#fields").html("");
    toSend = [];
    fieldsList = [];
    
  
});

/**
* Waits an amount of time
*/ 
function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}


/**
* In case of Send or Reply selection, text boxes for Subject, Recipient and Body of the mail are shown.
* A send-button will trigger the signature process.
*/ 
function displayMailInfo(){
  console.log(sendMode);
  submitButtons.style.display = "none";
  document.getElementById("mail").style.display = "inline";
  if(sendMode == "send"){
    document.getElementById("compose-to").style.display = "inline";
  }

}

//Listener on the send mail button
$("#send-button").click(function(){
    
  if(sendMode == "send"){
    recipient = document.getElementById("compose-to").value;
    console.log(recipient +"selezionato");
  }
  else{
    recipient = replyRecipient;
  }
  subject = document.getElementById("compose-subject").value;
  body = document.getElementById("compose-message").value;
  
  if(recipient == "" || subject == ""){
    showError("Missing arguments");
  }
  else{
    console.log("TOSEND-->");
    console.log(toSend);
    if(toSend[0].useField == false){ 
      sendDataToSign();
    }
    else{
      requestInfo();
    }  
  }  
});


/**
* Triggered by the selection of a signature field, it asks for fields to the background script.
*/ 
function requestInfo(){
  showLoading("Requesting signature fields, don't close the popup..");
    hideError();
    chrome.runtime.sendMessage({
      action: popupMessageType.init,
  }, function (response) {
      console.log("opening connection to native app");
  });
  
    console.log(toSend[0].pageNumber);
    chrome.runtime.sendMessage({
      action: popupMessageType.info,
      data: toSend,
      urls: toDownload
  }, function (response) {
      console.log("Loading background app");
      showLoading("Requesting signature fields, don't close the popup..");
      console.log(response.ack);    
  });
      clearSignData();
      $("#fields").html("");
  
}


/**
* Sends the signature data to the backgroung script, requiring a "sign and download" procedure.
*/ 
function sendDataToSign(){
    showLoading("Downloading and signing, please wait, it could takes few minutes..");
    hideError();
    chrome.runtime.sendMessage({
      action: popupMessageType.init,
  }, function (response) {
      console.log("opening connection to native app");
  });
  
    console.log("mando a " + recipient);
    console.log(toSend[0].pageNumber);
    chrome.runtime.sendMessage({
      action: popupMessageType.download_and_sign,
      data: toSend,
      urls: toDownload,
      recipient: recipient,
      subject: subject,
      body: body,
      sendMode: sendMode

  }, function (response) {
      console.log("Loading background app");
      showLoading("Downloading and signing, please wait, it could takes few minutes..");
      console.log(response.ack);    
  });
      clearSignData();
      $("#fields").html("");      
}


/**
* Checks the current app state and updates the popup if something is loading.
*/ 
 function checkCurrenState() {
            // console.log("App Current State:" + appCurrentState);
            if (appCurrentState == undefined) {
                clearSignData();
            }
            if (appCurrentState == appStateEnum.signing || appCurrentState == appStateEnum.downloadFile) {
                console.log("LOADING");
                showLoading("Signing requested file ..");
            } else if (appCurrentState == appStateEnum.complete || appCurrentState == appStateEnum.error) {
                clearSignData();
            } else if ( appCurrentState == appStateEnum.info){
              console.log("LOADING");
                showLoading("Requesting signature fields, don't close the popup..");
            }
        };

const loadingMsg = document.getElementById("loading-info");
const errorMsg = document.getElementById("error-info");
const submitButtons = document.getElementById("submit-buttons");
const endMsg = document.getElementById("end-msg");

/**
* Shows an error on the popup
*@param {string} errorMessage - message of the error
*/ 
function showError(errorMessage) {
  hideLoading();
  errorMsg.textContent = errorMessage;
  document.getElementById("error-section").style.display = "inline";
  clearPopupData();
  clearSignData();
}

/**
* Hides the error on the popup
*/ 
function hideError() {
  
  errorMsg.textContent = "";
  document.getElementById("error-section").style.display = "none";
}

/**
* Shows a loading on the popup
*@param {string} message - loading message 
*/ 
function showLoading(message) {
  document.getElementById("compose-to").style.display = "none";
  document.getElementById("mail").style.display = "none";
  
  submitButtons.style.display = "none";
  loadingMsg.textContent = message;
  document.getElementById("loading").style.display = "inline";
  
}

/**
* Hides the loading on the popup
*/ 
function hideLoading() {
  submitButtons.style.display = "inline";
  loadingMsg.textContent = "";
  document.getElementById("loading").style.display = "none";
  
}

/**
* Shows the fields on the popup
*/ 
function showfields(){
  hideLoading();
  submitButtons.style.display = "none";
}

/**
* Shows the ending of the signature process.
* @param {string} message - the ending message
*/ 
function showEnd(message) {
  document.getElementById("compose-to").style.display = "none";
  document.getElementById("mail").style.display = "none";
  submitButtons.style.display = "none";
  endMsg.textContent = message;
  document.getElementById("end-section").style.display = "inline";
  
}

/**
* Hides the end message and restore the popup.
*/ 
function hideEnd() {
  submitButtons.style.display = "inline";
  endMsg.textContent = "";
  document.getElementById("end-section").style.display = "none";
  
}

//Listener on the Close button when the end message is shown, clears all the data and closes the connection with background script.
$("#close-end").click(function(){

  hideEnd();
  chrome.runtime.sendMessage({
    action: popupMessageType.disconnect,
  }, function (response) {
    console.log("CONNECTION CLOSED and DATA CLEARED");
  });

});

/**
* Counter for the signature field List update.
*/ 
var infoCount = 0;

/**
* Updates the signature fields list on the popup.
*/ 
function updateSignatureFieldList() {
 
  var manual = " - "+toSign[infoCount]+"<p style='text:align-left; font-size:15px; display:block'>";
  $("#fields").append(manual);

    if (fieldsList != undefined && fieldsList.length != 0 )
    {
      console.log(infoCount);
      for(var i = 0; i<fieldsList.length; i++){    
        var toAppend = "<input id='"+ toSign[infoCount]+i+"field' type='radio' name='"+toSign[infoCount]+"fields' style='margin-left:30px' value ='"+ fieldsList[i].name+ "'>&nbsp;" + fieldsList[i].name+"&nbsp;";    
        
        $("#fields").append(toAppend);
        
      }
      $("#fields").append("<br>");
    }
    else{
              showError("Signature field not found, please retry");
              return;
    }
    $("#fields").append("<br>");
    infoCount +=1;
    console.log("INFOCOUNT -- ");
    console.log(infoCount);
    console.log("toSIGN -- ");
    console.log(toSign.length);
    if(infoCount === toSign.length){ // Shows the signature fields container on the popup
      console.log("SHOW FIELDS");
      $("#fields-container").css("display","inline");
      showfields();
    }  
}

// Listener for the message passing between Popup Script, Background Script and Content Script.
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
      console.log("<<< received:")
      console.log(request);

      if (request.hasOwnProperty("state")) {
          switch (request.state) {

              case "file":  // New filePath 
                  newFilesPath.push(request.localPath);
                  break;

              case "end": // Background procedure has ended
                  console.log("ENDED");
                  appCurrentState = appStateEnum.ready;
                  hideLoading();
                  if(request.sendMode != "" && request.sendMode != "save")
                    showEnd("Mail sent to "+ recipient);
                  else{
                    showEnd();
                  }  
                  clearSignData();
                  clearPopupData();
                  break;

              case "end-size": //Background procedure has ended for size
                  console.log("ENDED for SIZE or Host app error");
                  appCurrentState = appStateEnum.ready;
                  hideLoading();
                  sendMode = background.sendMode;
                  if(sendMode != "" && sendMode != "save"){
                    console.log("SendMode -->");
                    console.log(sendMode);
                    showEnd("Could not send the email, signed file size exceeds the maximum accepted");
                  }  
                  else{
                    showEnd();
                  }
                  clearSignData();
                  clearPopupData();  
                  break;  
                   
              case "info": // Backgorund returned the field list
                  fieldsList = request.fields;
                  updateSignatureFieldList();
                  break;

              case "error": // Background has returned some errors
                   showError(request.error);
                   hideLoading();
                  break;

              case "end-error-app": // Native Host error, sets the listener for the link.
                  showError("Unable to find Native Host or Drivers installed, you can download your installer from ");
                  $("#error-info").append('<a id= "error-link" href="">Here</a> ');
                  $("#error-link").click(function(){
                    chrome.tabs.create({
                      url: "https://1drv.ms/u/s!ArvmRG8fou1fihQq4P42U0gTuyyH?e=5pQcyv"
                     }, function (downloadItemID) {
                     });
                  });
                  hideLoading();
                  break;  

              default:
                  break;
          }
      }
      else if(request.hasOwnProperty("popupContent") ){  // Content Script content, searches for attachments and urls
        console.log(request.popupContent);
        attachments = request.popupContent;
        addAttachments(attachments);
        urls = request.urls;
        replyRecipient = request.recipient;
        console.log(recipient);
      }

  });        
