window.addEventListener("click", function(e) { 
	check(); 
}, false);


function check() {
	var myPanel = document.getElementById("my-panel");
	if(document.getElementById("attachmentView").collapsed == true){
		myPanel.style.visibility = "hidden";
		return;
	}
	myPanel.style.visibility = "visible";
	myPanel.label = "Allegato Disponibile";
	
}
