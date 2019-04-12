window.addEventListener("load", function(e) { 
	startup(); 
}, false);

window.setInterval(
	function() {
		startup(); 
	}, 60000); //update date every minute

function startup() {
	var myPanel = document.getElementById("my-panel");
	var date = new Date();
	var day = date.getDay();
	var dateString = date.getFullYear() + "." + (date.getMonth()+1) + "." + date.getDate();
	myPanel.label = "Date: " + dateString;
}

// var enumerator = gFolderDisplay.selectedMessages;
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

//         }
//     } catch (err) {
//         alert(err);
//     }
// }, true, { examineEncryptedParts: true, });
//}