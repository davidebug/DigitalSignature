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
var toDownload = [];

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
  appCurrentState = StateEnum.ready;
  nativeAppPort.onMessage.addListener(function (msg) {
    console.log("RECEIVED FROM NATIVE APP:");
    console.log(msg);

    if (msg.hasOwnProperty("native_app_message")) {
      if (msg.native_app_message == "end") {
        appCurrentState = StateEnum.complete;
        
       // storedSignatureData.empty();
        // browser.runtime.sendMessage({
        //   state: "end",                        -----  TO DO inviare messaggio di conferma al popup quando finito
        //   localPath: msg.local_path_newFile
        // }, function (response) {});

        
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
    
    nativeAppPort.postMessage(data);
};

function downloadFile(index){
  var url = toDownload[index];
      console.log("Going to download: " + url);
      // var downloading = browser.downloads.download({
      //   url : downloadUrl,
      //   filename: attachments[i],
      //   //conflictAction : 'overwrite'
      // });         
      // downloading.then(onStartedDownload, onFailed);
      var creating = browser.tabs.create({
        url: url,
        active: false
      });
      creating.then(onCreated, onError);

      function onCreated(tab) {
        console.log(`Created new tab: ${tab.id}`)
        getLocalPath(index);
      }
      
      function onError(error) {
        console.log(`Error: ${error}`);
      }

}


function startProcedure(index){
  var toFind = [];
  toFind.push(toSign[index]);
  
  console.log("Da eliminare: " + toSign[index])
  function onRemoved(id) {
    browser.downloads.erase({
      id: id                  // elimino il file in cronologia download
    });
    console.log(`Removed item`);
    downloadFile(index);
  }
  
  function onError() {
    console.log("File non trovato")  //se non lo trova lo scarica
  }

  function remove(downloadItems) {
    console.log("Removing file");
    if (downloadItems.length > 0) {
      var removing = browser.downloads.removeFile(downloadItems[0].id);  //elimino il file dal sistema
      removing.then(onRemoved(downloadItems[0].id), onError);
    }
    else{
      downloadFile(index);
    }
  }

  var searching = browser.downloads.search({
    query: toFind,
  });
  searching.then(remove, onError); 

}

function getLocalPath(index) {

  console.log("GET LOCAL PATH..." + toSign[index]);
  console.log(toDownload[index]);
  var toFind = [];
  toFind.push(toSign[index]);
  browser.downloads.search({
    query: toFind,  //cerco il file attuale tramite regex
    state: "complete",
    exists: true
 }, function (item) {
    console.log(item);
    if (item.length == 0) {
      console.log("Still Downloading....");
      sleep(1500).then(() => { //wait X second
        getLocalPath(index);
      });
    } else {
      console.log(item[0].filename);
      storedSignatureData.signatureData.filename = item[0].filename;
      console.log("File Found, send data for sign...");
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

function tryHandleProcedure(index){
  if(appCurrentState != StateEnum.signing){
    openConnection();
    startProcedure(index);
    appCurrentState = StateEnum.signing;
  }
  else{
    sleep(1500).then(() => { 
      tryHandleProcedure(index);
    });
  }
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
      toDownload = request.toDownload;
      for (var i = 0; i < toSign.length; i++){
         tryHandleProcedure(i);
      }    
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


function onStartedDownload(id) {
  console.log(`Started downloading: ${id}`);
}

function onFailed(error) {
  console.log(`Download failed: ${error}`);
}



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
 

