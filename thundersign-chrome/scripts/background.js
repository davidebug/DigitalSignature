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
var countEnded = 0;

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
        countEnded += 1;
        
        chrome.runtime.sendMessage({
          state: "file",                        
          localPath: msg.local_path_newFile
        }, function (response) {});

        if(countEnded == toSign){
          console.log("ENDED");
          countEnded = 0;
          storedSignatureData.empty();
          chrome.runtime.sendMessage({
            state: "end"
          }, function (response) {});
        }
      }  else if (msg.native_app_message == "info") {

        // storedSignatureData.infoPDF = {
        //   pageNumber: msg.pageNumber,
        //   pages: msg.pages,
        //   fields: msg.fields
        // }                                    ----- TO DO inviare info field a popup (errore)

        // //forward fields list to popup
        // chrome.runtime.sendMessage({
        //   state: 'info',
        //   pageNumber: msg.pageNumber,
        //   pages: msg.pages,
        //   fields: msg.fields
        // }, function (response) {});

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
    openConnection();
    nativeAppPort.postMessage(data);
};




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
            sendDataForSign(storedSignatureData.signatureData);
            if (callback)
              callback(data)
          }
        });
      }

}

// sleep time expects milliseconds
function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// /**
// * Send data to native app for ask information about pdf like: fields and pages number
// * @param {*} data - data to send to native app
// */
// function requestPDFInfo(data) {
// appCurrentState = StateEnum.info;
// console.log("Send message to native app...")
// // console.log(data);
// data.action = popupMessageType.info;
// nativeAppPort.postMessage(data);
// delete data.action;
// storedSignatureData.signatureData = data;
// updateSignatureDataPopup("filename", storedSignatureData.signatureData.filename);
// };

// /**
// * Send a message to the Popup for update its signature data
// * @param {string} fieldToUpdate : field of signature data to update
// * @param {*} value : new value
// */
// function updateSignatureDataPopup(fieldToUpdate, value) {
// chrome.runtime.sendMessage({
//   state: 'updateSignatureData',
//   fieldToUpdate: fieldToUpdate,
//   value: value
// }, function (response) {});
// }

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
    openConnection();
    downloadFile(url);  
  }
  else{
    sleep(1500).then(() => { 
      tryHandleProcedure(url,data);
    });
  }
}

var toSign = 0;
//listener message Popup -> Background
chrome.runtime.onMessage.addListener(
function (request, sender, sendResponse) {
  switch (request.action) {
    case popupMessageType.wakeup:
      console.log("Background wakeup");
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

    // case popupMessageType.download_and_sign:
    //   downloadFile(request.url, request.data, sendDataForSign);
    //   break;

    case popupMessageType.sign: //used for directly sign a local file
      console.log("data received : ");
      console.log(request.data);
      console.log("Urls received:");
      console.log(request.urls);
      toSign = request.data.length;
      for(var i = 0; i< request.data.length; i++){
        console.log(request.data[i].pageNumber);
        
        tryHandleProcedure(request.urls[i],request.data[i]);
      }
     
      break;

    // case popupMessageType.download_and_getInfo: //used for directly sign a local file
    //   downloadFile(request.url, request.data, requestPDFInfo);
    //   break;
    case popupMessageType.info: //used for local file
      requestPDFInfo(request.data);
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

 

