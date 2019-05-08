

window.addEventListener("DOMContentLoaded", function(e) { 
	check(); 
	
	document.getElementById("signAndReply").addEventListener("click", function(e) {
		console.log("SUBMITTED");
		downloadAttachment();
	}, false);
}, false);



function check() {
	var button = document.getElementById("my-button");

	if(document.getElementById("attachmentView").collapsed == true){
		button.style.display = "none";
		return;
	}
	button.style.display = "inline";
	scanAttachments();
	
	
	browser.runtime.sendMessage({action: 'getAttachments'}, function(response)
		{});
	console.log("checked");

}



function scanAttachments(){
	var attachmentList = document.getElementById("attachmentList");
	var myAttachments = document.getElementById("my-attachments");
	while (myAttachments.firstChild) {
		myAttachments.removeChild(myAttachments.firstChild);
	}
	
	  for(var i = 0; i<attachmentList.children.length ; i++){    
		var checkbox = document.createElement("checkbox");
		checkbox.setAttribute("id", attachmentList.children[i].getAttribute("name"));
		checkbox.setAttribute("label", attachmentList.children[i].getAttribute("name"));
		myAttachments.appendChild(checkbox);
	 }
	 console.log("attachmentsScanned");
}



// function downloadAttachment(){
// 	console.log("start-download");
// 	var enumerator = gFolderDisplay.selectedMessages;
//         for each (var msgHdr in fixIterator(enumerator, Components.interfaces.nsIMsgDBHdr)) {
//         msgHdr.setStringProperty("docuHive","dhivelabel");

//             MsgHdrToMimeMessage(msgHdr, null, function (aMsgHdr, aMimeMsg) {
//               try {
//              var attachments = aMimeMsg.allUserAttachments || aMimeMsg.allAttachments;
//                    for (var [index, att] in Iterator(attachments))
//         {
//             var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);  
//             var neckoURL = null;  
//             neckoURL = ioService.newURI(att.url, null, null);  
//             neckoURL.QueryInterface(Components.interfaces.nsIMsgMessageUrl);  
//             var uri = neckoURL.uri;  
//             var attInfo = new AttachmentInfo(att.contentType, att.url, att.name, uri, att.isExternal); 
//             // getting the chrome directory
//             var file = Components.classes["@mozilla.org/file/directory_service;1"].
//            getService(Components.interfaces.nsIProperties).
//            get("AChrom", Components.interfaces.nsIFile);

//            var msguri = msgHdr.folder.getUriForMsg(msgHdr);

//     messenger = Components.classes["@mozilla.org/messenger;1"]
//                        .createInstance(Components.interfaces.nsIMessenger);
//                        alert(messenger);
//         messenger.saveAttachmentToFolder(att.contentType,att.url,"attachmentname.extension",msguri,file);

// 		}
// 		console.log("completed-download");
//     } catch (err) {
//         alert(err);
//     }
// }, true, { examineEncryptedParts: true, });
// }
// }
