

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
}
