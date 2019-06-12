
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
};

const background = chrome.extension.getBackgroundPage();
 console.log(background.appCurrentState);
 const popupMessageType = background.popupMessageType; //types of message from the popup that background script can handle
 const appStateEnum = background.StateEnum;
 let appCurrentState = background.appCurrentState;

var urls = [];
var attachments = [];
var newFilesPath = [];
var fieldsList = [];

chrome.runtime.sendMessage({
  action: popupMessageType.wakeup,
}, function (response) {
  console.log("background wakeup");
});

$('#inputGroupFile02').on('change',function(){
  var fullPath = $(this).val();
  var fileName = fullPath.replace(/^.*[\\\/]/, '');
  $(this).next('.custom-file-label').html(fileName);
})

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

    const img_input = document.getElementById("inputGroupFile02");
    const reader = new FileReader();
        img_input.addEventListener('change', (e) => {
            img_input.parentNode.parentNode.classList.remove("is-success");
            img_input.disabled = true;
            console.log(img_input.files);

            if (img_input.files.length > 0) {
                // document.getElementById('filename').textContent = img_input.files[0].name;
                var file = event.target.files[0];
                // console.log(event.target.files[0]);

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

 

  
function addAttachments(attachments){

 

  document.getElementById("my-attachments").innerHtml="";
  for(var i=0; i<attachments.length; i++){
    var attach = '<input type="checkbox" id="'+ attachments[i] +'" name="checkbox" value="value" >&nbsp;&nbsp;' + attachments[i] + '<br>';
    $("#my-attachments").append(attach);
    if(!attachments[i].endsWith('pdf')){
      document.getElementById("pades-wrapper").style.display = "none";
    }

    //aggiungo posizioni manuali


    var toAppend = '     <div style="font-size:14px;" class="container" id="set-position" >'
                      +'         <div class="input-group" style="width:100px;margin-top:10px;">Page:&nbsp; &nbsp;'                  
                      +'                  <input type="text" class="form-control" id="page'+ attachments[i] +'" style="height:20px;" >'
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
  if(attachments.length === 0){
    $("#my-attachments").append("No attachments found");
  }
}




var toDownload = [];
var toSend = [];
var toSign = [];


function getData(i){
  
    clearData();
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
    if(document.getElementById(attachments[i]).checked){
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
          send.pageNumber = document.getElementById("page"+ attachments[i]).value;
        
        }

      }
      
      toDownload.push(urls[i]);
      toSend.push(send);
      console.log(toSend[i].pageNumber);
  }
}


$("#signAndReply").click(function(){

  signatureData.password = document.getElementById("password").value;

  if(signatureData.password != ""){
    for(var i = 0; i<attachments.length; i++){
      getData(i);
    } 
    if(toSend[0].useField == false)     
      sendDataToSign();
    else{
      requestInfo();
    }  
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
      getData(i);
    }      
    if(toSend[0].useField == false)     
    sendDataToSign();
  else{
    requestInfo();
  }  
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
      getData(i);
    }      
    if(toSend[0].useField == false)     
    sendDataToSign();
  else{
    requestInfo();
  }  
      console.log("started " + signatureData.type + " sign and Save")
  }
  else{
    showError("Password needed");
  }  
  
  
});

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
}, function (response) {
    console.log("Loading background app");
    showLoading("Signing on selected fields..");
    console.log(response.ack);    // restituisce "success" quando la procedura di background è conclusa.
});
    clearData();
    $("#fields").html("");
    toSend = [];
    fieldsList = [];
    
  
});




function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}


function requestInfo(){
  showLoading("Requesting signature fields..");
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
      showLoading("Requesting signature fields..");
      console.log(response.ack);    // restituisce "success" quando la procedura di background è conclusa.
  });
      clearData();
      $("#fields").html("");
      toSend = [];
      fieldsList = [];
}



function sendDataToSign(){
    showLoading("Downloading and signing");
    hideError();
    chrome.runtime.sendMessage({
      action: popupMessageType.init,
  }, function (response) {
      console.log("opening connection to native app");
  });
  
    console.log(toSend[0].pageNumber);
    chrome.runtime.sendMessage({
      action: popupMessageType.download_and_sign,
      data: toSend,
      urls: toDownload
  }, function (response) {
      console.log("Loading background app");
      showLoading("Downloading and signing");
      console.log(response.ack);    // restituisce "success" quando la procedura di background è conclusa.
  });
      clearData();
      $("#fields").html("");
      toSend = [];
      fieldsList = [];
      
}

function clearData(){
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

 function checkCurrenState() {
            // console.log("App Current State:" + appCurrentState);
            if (appCurrentState == undefined) {
                clearData();
            }
            if (appCurrentState == appStateEnum.signing || appCurrentState == appStateEnum.downloadFile || appCurrentState == appStateEnum.info) {
                console.log("LOADING");
                showLoading("Downloading and signing");
            } else if (appCurrentState == appStateEnum.complete || appCurrentState == appStateEnum.error) {
                clearData();
            }
            //check if exist stored data in background
            // else if (appCurrentState == appStateEnum.running) {
            //     console.log(backgroundStoredSignatureData);
            //     if (backgroundStoredSignatureData.isEmpty() == false) {
            //         console.log("NEED TO RESTORE DATA");
            //         chrome.tabs.query({
            //             active: true,
            //             currentWindow: true
            //         }, function (tab) {
            //             if (tab[0].url == backgroundStoredSignatureData.signatureData.tabUrl) {
            //                 signatureData.copy(backgroundStoredSignatureData.signatureData);
            //                 updateSignatureFieldList(backgroundStoredSignatureData.infoPDF);
            //             } else {
            //                 console.log("Stored data in background belong to a different document. Clear stored data.")
            //                 clearData();
            //             }
            //         });
            //     }
            // }
        };

const loadingMsg = document.getElementById("loading-info");
const errorMsg = document.getElementById("error-info");
const submitButtons = document.getElementById("submit-buttons");

function showError(errorMessage) {
  errorMsg.textContent = errorMessage;
  document.getElementById("error-section").style.display = "inline";
  
}

function hideError() {
  errorMsg.textContent = "";
  document.getElementById("error-section").style.display = "none";
}

function showLoading(message) {
  submitButtons.style.display = "none";
  loadingMsg.textContent = message;
  document.getElementById("loading").style.display = "inline";
  
}

function hideLoading() {
  submitButtons.style.display = "inline";
  loadingMsg.textContent = "";
  document.getElementById("loading").style.display = "none";
  
}

function showfields(){
  hideLoading();
  submitButtons.style.display = "none";
}



function updateSignatureFieldList() {
 showfields();
  var manual = '<div><p> - ' + toSign[infoCount] +"</p>";
  $("#fields").append(manual);

  if(fieldsList.length != 0)
  {
    console.log(infoCount);
    for(var i = 0; i<fieldsList.length; i++){    
      var toAppend = "<input id='"+ toSign[infoCount]+i+"field' type='radio' name='"+toSign[infoCount]+"fields' style='margin-left:30px' value ='"+ fieldsList[i].name+ "'>" + fieldsList[i].name;    
      
      $("#fields").append(toAppend);
      $("#fields").append("<br>");
      
    }
  }
  else{
            var toAppend = '     <div style="font-size:14px;" class="container" id="set-position" >'
            +'         <div class="input-group" style="width:100px;margin-top:10px;">Page:&nbsp; &nbsp;'                  
            +'                  <input type="text" class="form-control" id="page'+ toSign[infoCount] +'" style="height:20px;" >'
            +'          </div>'      
            +'        <div id="vertical-pos'+ toSign[infoCount] +'fielded" class="input-group" style="font-size: 14px;"> Vertical Position:&nbsp; &nbsp;'
            +'            <input id="top '+ toSign[infoCount] +'fielded" type="radio" name="vertical-pos'+ toSign[infoCount] +'" value="top" checked>&nbsp;&nbsp;Top&nbsp;&nbsp;'
            +'            <input id="middle'+ toSign[infoCount] +'fielded" type="radio" name="vertical-pos'+ toSign[infoCount] +'" value="middle">&nbsp;Middle&nbsp;&nbsp;'
            +'            <input id="bottom'+ toSign[infoCount] +'fielded" type="radio" name="vertical-pos'+ toSign[infoCount] +'" value="bottom">&nbsp;Bottom&nbsp;'
            +'        </div>'
            +'        <div id="horizontal-pos'+ toSign[infoCount] +'fielded" class="input-group" style="font-size:14px"> Horizontal Position:&nbsp; &nbsp;'
            +'                <input id="left'+ toSign[infoCount] +'fielded" type="radio" name="horizontal-pos'+ toSign[infoCount] +'" value="left" checked>&nbsp;Left&nbsp;&nbsp;'
            +'                <input id="center'+ toSign[infoCount] +'fielded" type="radio" name="horizontal-pos'+ toSign[infoCount] +'" value="center">&nbsp;Center&nbsp;&nbsp;'
            +'                <input id="right'+ toSign[infoCount] +'fielded" type="radio" name="horizontal-pos'+ toSign[infoCount] +'" value="right">&nbsp;Right&nbsp;'
            +'        </div>'
            +'    </div>'
            +'  </div>    '
            
            +'<br>';

            $("#fields").append(toAppend);    
            $("#fields").append("<br>");
        
  }
  $("#fields").append("</div>");
  $("#fields-container").css("display","inline");
  infoCount +=1;
}

var infoCount = 0;
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
      console.log("<<< received:")
      console.log(request);

      if (request.hasOwnProperty("state")) {
          switch (request.state) {
              case "file":
                  newFilesPath.push(request.localPath);
                  break;
              case "end":
                  console.log("ENDED");
                  appCurrentState = appStateEnum.ready;
                  hideLoading();
                  // endSectionUIUpdate(request.localPath);
                  break;
              case "info":
                  fieldsList = request.fields;
                  updateSignatureFieldList();
                  break;
              case "error":
                   showError(request.error);
                   hideLoading();
                  break;
              case "updateSignatureData":
                  // updateSignatureData(request.fieldToUpdate, request.value);
              default:
                  break;
          }
      }
      else if(request.hasOwnProperty("popupContent") ){
        console.log(request.popupContent);
        attachments = request.popupContent;
          addAttachments(attachments);
        urls = request.urls;
        
      }

      // sendResponse({
      //     ack: "success"
      // });
  });        
