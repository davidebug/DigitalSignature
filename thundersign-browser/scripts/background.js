console.log("Start background");


var nativeAppPort = null;

var StateEnum = {
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
var toSign = [];
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

// // browser.runtime.onInstalled.addListener(function () {
// //   browser.declarativeContent.onPageChanged.removeRules(undefined, function () {
// //     browser.declarativeContent.onPageChanged.addRules([{
// //       conditions: [
// //         new browser.declarativeContent.PageStateMatcher({
// //           pageUrl: { urlSuffix: '.pdf'}
// //         }),
// //         new browser.declarativeContent.PageStateMatcher({
// //           pageUrl: { urlSuffix: '.PDF'}
// //         })
// //       ],
// //       actions: [new browser.declarativeContent.ShowPageAction()]
// //     }]);
// //   });
// // });

const app = 'com.unical.digitalsignature.signer';


/**
 * Open connection with native app and set message listeners.
 */
function openConnection() {
  
  nativeAppPort = browser.runtime.connectNative(app);

  console.log(nativeAppPort);

  nativeAppPort.onMessage.addListener(function (msg) {
    console.log("RECEIVED FROM NATIVE APP:");
    console.log(msg);

    if (msg.hasOwnProperty("native_app_message")) {
      if (msg.native_app_message == "end") {

        storedSignatureData.empty();
        browser.runtime.sendMessage({
          state: "end",
          localPath: msg.local_path_newFile
        }, function (response) {});

        appCurrentState = StateEnum.complete;
      } else if (msg.native_app_message == "info") {

        // storedSignatureData.infoPDF = {
        //   pageNumber: msg.pageNumber,
        //   pages: msg.pages,
        //   fields: msg.fields
        // }                                    ----- TO DO inviare info field a popup (errore)

        // //forward fields list to popup
        // browser.runtime.sendMessage({
        //   state: 'info',
        //   pageNumber: msg.pageNumber,
        //   pages: msg.pages,
        //   fields: msg.fields
        // }, function (response) {});

        // appCurrentState = StateEnum.running;

      } else if (msg.native_app_message == "error") {
        console.log("ERROR:" + msg.error);
        appCurrentState = StateEnum.error;
        browser.runtime.sendMessage({
          state: 'error',
          error: msg.error
        }, function (response) {});
      }
    }

  });

  nativeAppPort.onDisconnect.addListener(function () {
    console.log("Disconnected");
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
  
  nativeAppPort.postMessage(data);
};

function getLocalPath(fileIndex) {
  console.log("GET LOCAL PATH...")
  console.log("going to find: " + toSign[fileIndex]);
  browser.downloads.search({
    query: toSign,    
    state: "complete"      
  }, function (item) {
    if (item.length == 0) {
      console.log("Downloading....");
      sleep(1500).then(() => { //wait X second
        getLocalPath(fileIndex);
      });
    } else {
      console.log(item[fileIndex].filename);
      storedSignatureData.signatureData.filename = item[fileIndex].filename;
      console.log("Filename done");
      sendDataForSign(storedSignatureData.signatureData);
    }
  });
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
// browser.runtime.sendMessage({
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

//listener message Popup -> Background
browser.runtime.onMessage.addListener(
function (request, sender, sendResponse) {
  switch (request.action) {
    case popupMessageType.wakeup:
      console.log("Background wakeup");
      break;
    case popupMessageType.resetState:
      appCurrentState = StateEnum.start;
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
      downloadFile(request.url, request.data, sendDataForSign);
      break;
    case popupMessageType.sign: //used for directly sign a local file
      console.log("data received : ");
      console.log(request.data);
      storedSignatureData.signatureData = request.data;
      toSign = request.toSign;
     // for (var i = 0; i < toSign.length; i++)
        getLocalPath(0);
      break;

    case popupMessageType.download_and_getInfo: //used for directly sign a local file
      downloadFile(request.url, request.data, requestPDFInfo);
      break;
    case popupMessageType.info: //used for local file
      requestPDFInfo(request.data);
      break;

    case popupMessageType.zoom:
      createZoomListener(request.tabid);
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

// /**
//  * Dowload the pdf, get local path of downloaded file and call callback.
//  * @param {string} pdfURL - url of the pdf
//  * @param {*} data - signature data
//  * @param {function(data):void} callback - callback
//  */
// function downloadFile(pdfURL, data, callback) {
//   appCurrentState = StateEnum.downloadFile;
//   //1) get tab url
//   downloadPDF(pdfURL)

//   //2) download pdf 
//   function downloadPDF(pdfUrl) {
//     console.log("Start download document...")
//     browser.downloads.download({
//       url: pdfUrl
//     }, function (downloadItemID) {
//       getLocalPath(downloadItemID);
//     });
//   }


  //3) get download file local path
 

