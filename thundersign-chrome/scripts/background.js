console.log("Start background");

/**
* Port of the native app for native messaging
*/
var nativeAppPort = null;

/**
* State of the app
*/
var StateEnum = {
  start: "start",
  ready: "ready",
  downloadFile: "downloadFile",
  running: "running",
  signing: "signing",
  info: "info",
  error: "error",
  complete: "complete"
};
Object.freeze(StateEnum)

/**
* Current state of the app
*/
var appCurrentState = StateEnum.start;

/**
* Current Token Stored
*/
var tokenStored ="";

/**
* Signature data stored
*/
var storedSignatureData = {
  signatureData: "",
  infoPDF: "",

  empty: function () {
    this.signatureData = "";
    this.infoPDF = "";
  },

  isEmpty: function () {
    if (this.signatureData == "")
      return true;
    return false;
  }
}

/**
* Name of native app
*/
const app = 'com.unical.digitalsignature.mailsigner';

/**
*List of encoded files to attach in the mail
*/
var encoded_files = [];

/**
*Names of the signed attachments
*/
var signedNames = [];

/**
*Recipient of the mail
*/
var recipient = "";

/**
*Subject of the mail
*/
var subject = "";

/**
*Body of the mail
*/
var body = "";

/**
*Number of files sent to the native application
*/
var sentToNative = 0;

/**
*Send mode of the mail (reply or not)
*/
var sendMode = "";

/**
*Gmail tab id 
*/
var gmailTabId = 0;

/**
*Number of attachments to sign
*/
var toSign = 0;

/**
*Number of fields to search
*/
var fieldsToSearch = 0;

/**
*Type of popup script message
*/
var popupMessageType = {
  wakeup: 'wakeup',
  init: 'init',
  disconnect: 'disconnect',
  download_and_sign: 'download_and_sign',
  sign: 'sign',
  download_and_getInfo: 'donwload_and_getInfo',
  info: 'info',
  zoom: 'zoom',
  resetState: "resetState"
  }



/**
*Signature data stored after field is found
*/
var storedForField = [];

/**
*Add to storedForField list 
*@param data - Signature data to add
*/
function addToList(data){

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

  signatureData.type = data.type;
  signatureData.filename = data.filename;
  signatureData.password = data.password;
  signatureData.visible = data.visible;
  signatureData.useField = data.useField;
  signatureData.verticalPosition = data.verticalPosition;
  signatureData.horizontalPosition = data.horizontalPosition;
  signatureData.pageNumber = data.pageNumber;
  signatureData.signatureField = data.signatureField;
  signatureData.image = data.image;
  signatureData.tabUrl = data.tabUrl;
  storedForField.push(signatureData);

}  


/**
*Clear background stored data
*/
function clearData(){
 // nativeAppPort = null;
 // gmailTabId = 0;
  toSign = 0;
  fieldsToSearch = 0;

  encoded_files = [];
  signedNames = [];
  recipient = "";
  subject = "";
  body = "";
  sentToNative = 0;
  sendMode = "";

  appCurrentState = StateEnum.start;

  storedForField = [];
  storedSignatureData.empty();
}

/**
 * Opens connection with native app and set native messages listeners.
 */
function openConnection() {
    
  nativeAppPort = chrome.runtime.connectNative(app);

  console.log("Native port -->");
  console.log(nativeAppPort);

  nativeAppPort.onMessage.addListener(function (msg) {
    console.log("RECEIVED FROM NATIVE APP:");
    console.log(msg);

    if (msg.hasOwnProperty("native_app_message")) {
      if (msg.native_app_message == "end") {

        appCurrentState = StateEnum.complete;
        encoded_files.push(msg.encoded_file);
        var tmp = msg.local_path_newFile.replace(/\\/g, "\\\\");
        signedNames.push(tmp.substring(tmp.lastIndexOf("\\")+1));

        chrome.runtime.sendMessage({
          state: "file",                        
          localPath: msg.local_path_newFile
        }, function (response) {});

        console.log(signedNames.length);
        console.log(toSign);
        if(signedNames.length == toSign){
          console.log("TENTO DI INVIARE");
          if(recipient != "")
            authAndSendMail(encoded_files, signedNames, msg.signature_type)
          else{
            console.log("CONCLUDO PROCEDURA");
            appCurrentState = StateEnum.complete;      
            chrome.runtime.sendMessage({
              state: "end",
              sendMode: sendMode
            }, function (response) {});
            encoded_files = [];
            signedNames = [];
            endProcedure();
          }  
         
        }
      }  else if (msg.native_app_message == "info") {
        
        appCurrentState = StateEnum.ready;
        storedSignatureData.infoPDF = {
          pageNumber: msg.pageNumber,
          pages: msg.pages,
          fields: msg.fields
        }                                    

        //forward fields list to popup
          chrome.runtime.sendMessage({
            state: 'info',
            pageNumber: msg.pageNumber,
            pages: msg.pages,
            fields: msg.fields
          }, function (response) {});
        // appCurrentState = StateEnum.running;

      } else if (msg.native_app_message == "error") {
        console.log("ERROR:" + msg.error);
        appCurrentState = StateEnum.error;      
        chrome.runtime.sendMessage({
          state: 'error',
          error: msg.error + ", if the problem persists launch the usb token autorun to install the driver"
        }, function (response) {});
        endProcedure();
      }
    
    }

  });

  // Sets the listener for the Disconnection
  nativeAppPort.onDisconnect.addListener(function () {
    console.log("Disconnected");  
    console.log(appCurrentState);
    console.log("Sent to native -->");
    console.log(sentToNative);
    console.log("TOSIGN -->");
    console.log(toSign);
    console.log("Signed names -->");
    console.log(signedNames.length);
    console.log(chrome.runtime.lastError.message);
    if(sentToNative > toSign){
      endProcedure();
      appCurrentState = StateEnum.error;
      return ;
    }
    if(chrome.runtime.lastError.message === "Specified native messaging host not found."){
      console.log("NATIVE APP ERROR -  UNABLE TO FIND NATIVE HOST");
      endProcedure();
      
      chrome.runtime.sendMessage({
        state: "end-error-app"
      }, function (response) {});

      // Starts the Native Host APP downloads
      chrome.downloads.download({
        url: "https://srv-file6.gofile.io/download/zhNIcd/ThunderSign-JavaAPP.exe"
      }, function (downloadItemID) {
      });
      appCurrentState = StateEnum.error;
      return;
    }
    else if(sentToNative === toSign && appCurrentState != StateEnum.complete && appCurrentState != StateEnum.error){
      endProcedure();
      chrome.runtime.sendMessage({
        state: "end-size"
      }, function (response) {});
    }
    appCurrentState = StateEnum.ready;
  });
  
  return nativeAppPort;
}


/**
 * Close connection with native app.
 */
function closeConnection() {
  nativeAppPort.disconnect();
}


/**
 * Send data to native app for signing
 * @param {*} data - data to send to native app for signing 
 */
function sendDataForSign(data) {

    appCurrentState = StateEnum.signing;
    data.action = "sign";
    data.filename = data.filename.replace(/\\/g, "/");
    data.tabUrl = "file:///" + data.filename;
    console.log("Send message to native app, data: ");
    console.log(data);
    openConnection().postMessage(data);
    sentToNative +=1;
};

/**
 * Send data to native app for ask information about pdf like: fields and pages number
 * @param {*} data - data to send to native app
 */
function requestPDFInfo(data) {
  appCurrentState = StateEnum.info;
  console.log("Send message to native app...")
  // console.log(data);
  data.action = popupMessageType.info;
  openConnection().postMessage(data);
  delete data.action;
  storedSignatureData.signatureData = data;
  updateSignatureDataPopup("filename", storedSignatureData.signatureData.filename);
}

/**
 * Send a message to the Popup for update its signature data
 * @param {string} fieldToUpdate : field of signature data to update
 * @param {*} value : new value
 */
function updateSignatureDataPopup(fieldToUpdate, value) {
  chrome.runtime.sendMessage({
    state: 'updateSignatureData',
    fieldToUpdate: fieldToUpdate,
    value: value
  }, function (response) {});
}


/**
 * Dowload the pdf, get local path of downloaded file and call callback.
 * @param {function(data):void} callback - callback
 */

function downloadFile(url,callback){
  console.log("Going to download: " + url);


      chrome.downloads.download({
        url: url
      }, function (downloadItemID) {
        getLocalPath(downloadItemID);
      });

      function getLocalPath(downloadItemID) {

        console.log("GET LOCAL PATH...")
        chrome.downloads.search({
          id: downloadItemID,
          state: "complete"
        }, function (item) {
          if (item.length == 0) {
            console.log("Downloading....");
            sleep(1500).then(() => { //wait X second
              getLocalPath(downloadItemID);
            });
          } else {
            console.log(item[0].filename);
            storedSignatureData.signatureData.filename = item[0].filename;
            console.log("File Found, send data for sign...");
            console.log(appCurrentState);
            if(appCurrentState == StateEnum.signing || appCurrentState == StateEnum.ready )
              sendDataForSign(storedSignatureData.signatureData);
            else if (appCurrentState == StateEnum.info){
              addToList(storedSignatureData.signatureData);
              requestPDFInfo(storedSignatureData.signatureData);
            }  
            if (callback)
              callback(data)
          }
        });
      }

}



/**
 * Wait an amount of time
 * @param  time - time to wait (millisec)
 */
function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}



/**
 * Tries to start the download and sign procedure, else wait and retries.
 * @param  url - url to download
 * @param  data - signature data
 */
function tryHandleProcedure(url,data){
  if(appCurrentState != StateEnum.error){
    if(appCurrentState != StateEnum.signing){
        appCurrentState = StateEnum.signing;
        storedSignatureData.signatureData = data;
        console.log(appCurrentState);
        downloadFile(url);  
      }
      else{
        sleep(1500).then(() => { 
          tryHandleProcedure(url,data);
        });
      }
  }
}

/**
 * Tries to start the download and get info procedure, else wait and retries.
 * @param  url - url to download
 * @param  data - signature data
 */
function tryHandleInfo(url,data){
  if(appCurrentState != StateEnum.error){
    if(appCurrentState != StateEnum.info){
      appCurrentState = StateEnum.info;
    storedSignatureData.signatureData = data;
      
      downloadFile(url);  
    }
    else{
      sleep(1500).then(() => { 
        tryHandleInfo(url,data);
      });
    }
  }
}

/**
 * Try to start to sign on the selected field without download, else wait and retry.
 * @param  field - field to sign
 * @param  data - signature data
 */
function tryHandleField(field,data){
  if(appCurrentState != StateEnum.signing){
    console.log(appCurrentState);
    appCurrentState = StateEnum.signing;
    data.signatureField = field;  
	  storedSignatureData.signatureData = data;
    
    sendDataForSign(data);
  }
  else{
    sleep(1500).then(() => { 
      tryHandleField(field,data);
    });
  }
}

/**
 * End the whole background procedure
 */
function endProcedure(){
 
  clearData();
  closeConnection();
  console.log("ENDED_PROCEDURE");
}


// Message Listener Popup -> Background
// Starts the procedures when a new signature data arrives from the Popup
chrome.runtime.onMessage.addListener(
function (request, sender, sendResponse) {
  switch (request.action) {

    case popupMessageType.wakeup:
      console.log("Background wakeup");
      if(gmailTabId != request.tabId){
        gmailTabId = request.tabId;
        removeStoredToken();
      }  
      wakeUpProcedure();      
      break;

    case popupMessageType.resetState:
      console.log("Reset State");
      appCurrentState = StateEnum.start;
      console.log(appCurrentState);
      sendResponse({
        appstate: appCurrentState
      })
      break;

    case popupMessageType.init:
      openConnection().postMessage("-h");
      break;
    case popupMessageType.disconnect:
      closeConnection();
      break;

      // starts the download and sign procedure
    case popupMessageType.download_and_sign:
      console.log("data received : ");
      console.log(request.data);
      console.log("Urls received:");
      console.log(request.urls);
      storedForField = [];
      toSign = request.data.length;
      recipient = request.recipient;
      console.log("recipient is -->");
      console.log(recipient);
      subject = request.subject;
      body = request.body;
      sendMode = request.sendMode;    

        for(var i = 0; i< request.data.length; i++){
          console.log(request.data[i].pageNumber);
          if(appCurrentState != StateEnum.error)
            tryHandleProcedure(request.urls[i],request.data[i]);
        }
      break;

    case popupMessageType.sign: //used for directly sign a local file (after signature fields selection)
      
      console.log("Start signing without download");
      console.log(storedForField);
      toSign = storedForField.length;
      recipient = request.recipient;
      console.log("recipient is -->");
      console.log(recipient);
      subject = request.subject;
      body = request.body;
      sendMode = request.sendMode;

      console.log("field list -->" + request.fieldsList.length);
      console.log("stored for field -->" + storedForField.length);
      for(var i = 0; i< request.fieldsList.length; i++){
        
        tryHandleField(request.fieldsList[i],storedForField[i]);
      }
      
      break;

      // gets the info for signature fields
    case popupMessageType.info:      
      fieldsToSearch = request.data.length;
      console.log("Fields to Search -- "); 
      console.log(fieldsToSearch);
      for(var i = 0; i< fieldsToSearch; i++){
        console.log(request.data[i].pageNumber);
        if(appCurrentState != StateEnum.error)
          tryHandleInfo(request.urls[i],request.data[i]);
      }
      break;


    default:
      console.log("Invalid action");
      break;
   }
  sendResponse({
    ack: "success",
    received: request.action,
  });
});


/**
 * log the started download
 */
function onStartedDownload(id) {
  console.log(`Started downloading: ${id}`);
}

/**
 * log the failed download
 */
function onFailed(error) {
  console.log(`Download failed: ${error}`);
}


/**
 * OAuth and Send the mail
 * @param signature_type - signature type , Cades or Pades
 */
function authAndSendMail(signature_type){

  if(signature_type == "cades"){
    var type = "application/pkcs7-mime"
  }
  else{
    var type = "application/pdf"
  }

  // gets the OAuth Token (stored in Chrome or not)
  chrome.identity.getAuthToken({interactive: true}, function(token) {
    console.log(token);

    if (token != undefined){
      tokenStored = token;
      console.log(recipient);
      console.log(body);
      console.log(subject);
        var mail = [
          'Content-Type: multipart/mixed; boundary="foo_bar_baz"\r\n',
          'MIME-Version: 1.0\r\n',
          
          'To:'+ recipient + '\r\n',
          'Subject:'+ subject + '\r\n\r\n',
        
          '--foo_bar_baz\r\n',
          'Content-Type: text/plain; charset="UTF-8"\r\n',
          'MIME-Version: 1.0\r\n',
          'Content-Transfer-Encoding: 7bit\r\n\r\n',
        
          body + '\r\n\r\n'

        ];
        
        for (var i = 0; i< encoded_files.length; i++){
          mail.push('--foo_bar_baz\r\n',
                          'Content-Type:'+ type +'; name="'+ signedNames[i]+'"\r\n',
                          'MIME-Version: 1.0\r\n',
                          'Content-Transfer-Encoding: base64\r\n',
                          'Content-Disposition: attachment; filename="'+ signedNames[i]+'"\r\n\r\n',
                          encoded_files[i], '\r\n\r\n');
          if(i === encoded_files.length-1){
            mail.push('--foo_bar_baz--');
          }                
        }
        console.log(mail);
        var dataToSend = mail.join('');
        // Send the mail!
        $.ajax({
          type: "POST",
          url: "https://www.googleapis.com/upload/gmail/v1/users/me/messages/send?uploadType=multipart",
          contentType: "message/rfc822",
          beforeSend: function(xhr, settings) {
            xhr.setRequestHeader('Authorization','Bearer '+ token );
          },
          data: dataToSend
        }); 
        
        // removes the OAuth if the user updates the current gmail page.
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
          console.log("MODIFICATA-->");
          console.log(tabId);
          console.log("GMAILTAB -->");
          console.log(gmailTabId);
          if(tabId === gmailTabId){
            console.log("RIMUOVO");
            removeStoredToken();
          } 
        });
      
      console.log("ENDED - Sent");  //TOKEN VALID, EMAIL SENT
      console.log(sendMode);
      chrome.runtime.sendMessage({
        state: "end",
        sendMode: sendMode
      }, function (response) {});
      endProcedure();
    }
    else{
      console.log("ENDED - Not sent");   // TOKEN NOT VALID, EMAIL NOT SENT
      sendMode = "";
      chrome.runtime.sendMessage({
        state: "end",
        sendMode: sendMode
      }, function (response) {});
      endProcedure();
    } 
  });
   

}

/**
 * Removes the Authorization stored in Chrome for the actual Google Token
 */
function removeStoredToken(){
  var url = 'https://accounts.google.com/o/oauth2/revoke?token=' + tokenStored;
  window.fetch(url);
  chrome.identity.removeCachedAuthToken({token: tokenStored}, function (){});
}

/**
 * Procedure to do on Popup wake up, clears all data if no file is being signed.
 */
function wakeUpProcedure(){
  if (appCurrentState != StateEnum.signing && appCurrentState != StateEnum.start){
    endProcedure();
  }
}