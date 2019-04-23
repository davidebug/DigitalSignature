

window.addEventListener("DOMContentLoaded", function(e) { 
	check(); 
}, false);


function check() {
	var button = document.getElementById("my-button");

	if(document.getElementById("attachmentView").collapsed == true){
		button.style.display = "none";
		return;
	}
	button.style.display = "inline";
	scanAttachments();
	
	
}



function scanAttachments(){
	var attachmentsList = document.getElementById("attachmentList");
	var myAttachments = document.getElementById("my-attachments");
	while (myAttachments.firstChild) {
		myAttachments.removeChild(myAttachments.firstChild);
	}
	
	 for(var i = 0; i<attachmentsList.length ; i++){    // <-------- NON FUNZIA
		var checkbox = document.createElement("checkbox");
		checkbox.setAttribute("id", "attachments[i].value()");
		checkbox.setAttribute("label", "attachments[i].value()");
		myAttachments.appendChild(checkbox);
	// 	var checkbox = document.createElement("checkbox");
	// 	checkbox.setAttribute("id", attachments[i].value());
	// 	checkbox.setAttribute("label", attachments[i].value());
	// 	checkbox.setAttribute("checked", "false");
	// 	panel.appendChild(checkbox);
	// }
	 }
}
