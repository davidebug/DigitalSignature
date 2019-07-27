console.log("Start background");


var nativeAppPort = null;

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

//state of the app
var appCurrentState = StateEnum.start;


var storedSignatureData = {
  signatureData: "",
  infoPDF: "",
  localpath: "",

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

var sessionDataHtml = "";

const app = 'com.unical.digitalsignature.mailsigner';
var encoded_files = [];
var signedNames = [];
var recipient = "";
var subject = "";
var body = "";
/**
 * Open connection with native app and set message listeners.
 */
function openConnection() {
  
  
  nativeAppPort = chrome.runtime.connectNative(app);

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

        if(signedNames.length == toSign){
          console.log(recipient);
          if(recipient != "")
            authAndSendMail(encoded_files, signedNames, msg.signature_type)
          else{
            console.log("recipient null");
            console.log("ENDED");      
            storedSignatureData.empty();
            closeConnection();
            chrome.runtime.sendMessage({
              state: "end"
            }, function (response) {});
            encoded_files = [];
            signedNames = [];

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
          error: msg.error
        }, function (response) {});
      }
    
    }

  });

  nativeAppPort.onDisconnect.addListener(function () {
    console.log("Disconnected");
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
  nativeAppPort.postMessage(data);
  delete data.action;
  storedSignatureData.signatureData = data;
  updateSignatureDataPopup("filename", storedSignatureData.signatureData.filename);
};

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
            if(appCurrentState == StateEnum.signing)
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

// Aggiungo il file attuale ad un array da conservare in caso di requestInfo
var storedForField = [];
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

// sleep time expects milliseconds
function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

/**
* Send data to native app for ask information about pdf like: fields and pages number
* @param {*} data - data to send to native app
*/
function requestPDFInfo(data) {
appCurrentState = StateEnum.info;
console.log("Send message to native app...")
// console.log(data);
data.action = popupMessageType.info;
openConnection();
nativeAppPort.postMessage(data);
delete data.action;
// storedSignatureData.signatureData = data;
// updateSignatureDataPopup("filename", storedSignatureData.signatureData.filename);
};

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

function tryHandleProcedure(url,data){
	
  if(appCurrentState != StateEnum.signing){
    appCurrentState = StateEnum.signing;
	storedSignatureData.signatureData = data;
    
    downloadFile(url);  
  }
  else{
    sleep(1500).then(() => { 
      tryHandleProcedure(url,data);
    });
  }
}

function tryHandleInfo(url,data){
	
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

var gmailTabId = 0;
var toSign = 0;
//listener message Popup -> Background
chrome.runtime.onMessage.addListener(
function (request, sender, sendResponse) {
  switch (request.action) {
    case popupMessageType.wakeup:
      console.log("Background wakeup");
      encoded_files = [];
      signedNames = [];
      storedForField = [];
      recipient = "";
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
      openConnection();
      break;
    case popupMessageType.disconnect:
      closeConnection();
      break;

    case popupMessageType.download_and_sign:
      console.log("data received : ");
      console.log(request.data);
      console.log("Urls received:");
      console.log(request.urls);
      storedForField = [];
      toSign = request.data.length;
      recipient = request.recipient;
      console.log("recipient is -->"+recipient);
      subject = request.subject;
      body = request.body;
      gmailTabId = request.tabId;

      for(var i = 0; i< request.data.length; i++){
        console.log(request.data[i].pageNumber);
        
        tryHandleProcedure(request.urls[i],request.data[i]);
      }
      break;

    case popupMessageType.sign: //used for directly sign a local file
      
      console.log("Start signing without download");
      console.log(storedForField);
      toSign = storedForField.length;
      recipient = request.recipient;
      console.log("recipient is -->"+recipient);
      subject = request.subject;
      body = request.body;
      gmailTabId = request.tabId;
      console.log("field list -->" + request.fieldsList.length);
      console.log("stored for field -->" + storedForField.length);
      for(var i = 0; i< request.fieldsList.length; i++){
        
        tryHandleField(request.fieldsList[i],storedForField[i]);
      }
      
      break;

    // case popupMessageType.download_and_getInfo: //used for directly sign a local file
    //   downloadFile(request.url, request.data, requestPDFInfo);
    //   break;
    case popupMessageType.info: //used for local file
    for(var i = 0; i< request.data.length; i++){
      console.log(request.data[i].pageNumber);
      
      tryHandleInfo(request.urls[i],request.data[i]);
    }
      break;

    // case popupMessageType.zoom:
    //   createZoomListener(request.tabid);
    //   break;

    default:
      console.log("Invalid action");
      break;
   }
  sendResponse({
    ack: "success",
    received: request.action,
  });
});


function onStartedDownload(id) {
  console.log(`Started downloading: ${id}`);
}

function onFailed(error) {
  console.log(`Download failed: ${error}`);
}

 
function authAndSendMail(signature_type){

  if(signature_type == "cades"){
    var type = "application/pkcs7-mime"
  }
  else{
    var type = "application/pdf"
  }

  chrome.identity.getAuthToken({interactive: true}, function(token) {
    console.log(token);
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
      
      chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        if(tabId === gmailTabId){
          var url = 'https://accounts.google.com/o/oauth2/revoke?token=' + token;
          window.fetch(url);
          chrome.identity.removeCachedAuthToken({token: token}, function (){});
        } 
      });
      

      console.log("ENDED");
      
      storedSignatureData.empty();
      closeConnection();
      chrome.runtime.sendMessage({
        state: "end"
      }, function (response) {});

      encoded_files = [];
      signedNames = [];
    });

}