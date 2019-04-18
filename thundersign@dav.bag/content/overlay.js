
window.addEventListener("DOMContentLoaded", function(e) { 
	check(); 
}, false);


function check() {
	var myPanel = document.getElementById("my-panel");
	if(document.getElementById("attachmentView").collapsed == true){
		myPanel.style.display = "none";
		return;
	}
	myPanel.style.display = "inline";

	
}
