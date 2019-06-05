
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

$('#inputGroupFile02').on('change',function(){
  var fullPath = $(this).val();
  var fileName = fullPath.replace(/^.*[\\\/]/, '');
  $(this).next('.custom-file-label').html(fileName);
})

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

 const background = chrome.extension.getBackgroundPage();
 console.log(background.appCurrentState);
 const popupMessageType = background.popupMessageType; //types of message from the popup that background script can handle
 const appStateEnum = background.StateEnum;
 let appCurrentState = background.appCurrentState;

  var urls = [];
  var attachments = [];
  var newFilesPath = [];



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




var url = "";

function getData(i){
  
    if(document.getElementById(attachments[i]).checked){
      url = urls[i];
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
    signatureData.useField = document.getElementById("signature-field").checked;
    if(signatureData.useField === false){
      signatureData.verticalPosition= document.querySelector('input[name="vertical-pos'+ attachments[i] +'"]:checked').value;
      signatureData.horizontalPosition= document.querySelector('input[name="horizontal-pos'+ attachments[i] +'"]:checked').value;
      signatureData.pageNumber = document.getElementById("page"+ attachments[i]).value;
      
    }
    else{
      signatureData.signatureField = ""; //--- TODO set signature-field
    }

  }
  signatureData.password = document.getElementById("password").value;


}


$("#signAndReply").click(function(){
      for(var i = 0; i<attachments.length; i++){
        handleProcedure(i);
    }      
        console.log("started " + signatureData.type + " sign and Reply")
  
});

$("#signAndSend").click(function(){
      for(var i = 0; i<attachments.length; i++){
        handleProcedure(i);
    }      
        console.log("started " + signatureData.type + " sign and Send")
   
});

$("#signAndSave").click(function(){
  for(var i = 0; i<attachments.length; i++){
        handleProcedure(i);
  }      
        console.log("started " + signatureData.type + " sign and Save")
  
});

function handleProcedure(i){
  
  
    console.log("Going to get index -- "+ i);
    console.log(appCurrentState);
    if(appCurrentState != appStateEnum.signing){
      appCurrentState = appStateEnum.signing;
      getData(i);
      if(signatureData.type != "" && signatureData.password != ""){
        sendDataToSign();
        console.log("started " + signatureData.type + " sign and Save")
      }  
      // else dai errore
    }
    else if(appCurrentState == appStateEnum.signing){
      sleep(1500).then(() => { 
        handleProcedure(i);
      });
    }
}

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function sendDataToSign(){

    chrome.runtime.sendMessage({
      action: popupMessageType.init,
  }, function (response) {
      console.log("opening connection to native app");
  });
  

    chrome.runtime.sendMessage({
      action: popupMessageType.sign,
      data: signatureData,
      url: url
  }, function (response) {
      console.log("Successfully sent");
      console.log(response.ack);    // restituisce "success" quando la procedura di background è conclusa.
  });
      clearData();
}

function clearData(){
  signatureData.type= "";
  signatureData.filename= "";
  signatureData.password= "";
  signatureData.visible= false;
  signatureData.useField= false;
  signatureData.verticalPosition= "Top";
  signatureData.horizontalPosition= "Left";
  signatureData.pageNumber= 1;
  signatureData.signatureField= "";
  signatureData.tabUrl= "";

}

//  function checkCurrenState() {
//             // console.log("App Current State:" + appCurrentState);
//             if (appCurrentState == undefined) {
//                 clearData();
//             }
//             if (appCurrentState == appStateEnum.signing || appCurrentState == appStateEnum.downloadFile || appCurrentState == appStateEnum.info) {
//                 console.log("LOADING");
//                 // sections.changeSection(sections.section.loadingSection);
//                 showLoading(MessageType[appCurrentState]);
//             } else if (appCurrentState == appStateEnum.complete || appCurrentState == appStateEnum.error) {
//                 clearData();
//             }
//             //check if exist stored data in background
//             else if (appCurrentState == appStateEnum.running) {
//                 console.log(backgroundStoredSignatureData);
//                 if (backgroundStoredSignatureData.isEmpty() == false) {
//                     console.log("NEED TO RESTORE DATA");
//                     chrome.tabs.query({
//                         active: true,
//                         currentWindow: true
//                     }, function (tab) {
//                         if (tab[0].url == backgroundStoredSignatureData.signatureData.tabUrl) {
//                             signatureData.copy(backgroundStoredSignatureData.signatureData);
//                             updateSignatureFieldList(backgroundStoredSignatureData.infoPDF);
//                         } else {
//                             console.log("Stored data in background belong to a different document. Clear stored data.")
//                             clearData();
//                         }
//                     });
//                 }
//             }
//         };


chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
      console.log("<<< received:")
      console.log(request);

      if (request.hasOwnProperty("state")) {
          switch (request.state) {
              case "end":
                  console.log("ENDED");
                  appCurrentState = appStateEnum.ready;
                  newFilesPath.push(request.localPath);
                  // sections.changeSection(sections.section.endSection);
                  // endSectionUIUpdate(request.localPath);
                  break;
              case "info":
                  // updateSignatureFieldList(request);
                  break;
              case "error":
                  // showError(request.error);
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
     