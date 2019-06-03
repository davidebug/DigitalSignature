# ThunderSign - Digital Signature 
<p align="left"> <img src="thundersign-chrome\images\icon-32.png"> </p>
### Installation

**Prerequisites:**
- Chrome Browser
- Java 8 JRE u212
- Token PKCS #11

**:one: :  INSTALL THE CHROME EXTENSION**
	
- Open Chrome and enter `chrome://extensions/` into your address bar.
- Click on the “developer mode” toggle in the upper-right corner.
- Click no "**Load Unpacked**" and select the "**app**" folder (thundersign-chrome if you are using Chrome).
At this point in the extension list will appear the loaded extension.
- Copy the extension-id of the new extension, it's required later.

**:two: : INSTALL NATIVE APP**

- Go into **hostapp-dist** folder
- open manifest.json file and modify the "allowed_origins" value with your loaded extension ID.

"allowed_origins": [
​    "chrome-extension://YOUR_EXTESION_ID/"
  ]

- After this, run the `install_host.bat` script that will create some registry key that are necessary for using the native application.

**NOW YOU CAN USE THE APPLICATION :smile:** 

> **NOTE:** for **uninstall** the application is enough remove the extension from chrome and run `uninstall_host.bat`


### 4. Usage


----

### 5. Project Structure



####  5.1. Chrome Extension structure

**Extension components (scripts) :**
- **Popup/Page Action**: the UI of the extension, which can be activated only on the tabs that contain a pdf. Allows the user to choose the type of signatures and enter the necessary data such as password, field to sign etc.
  The script is also responsible for downloading the file and injection the content script if necessary.
- **Background Script**: the script that manages communication with the native app and provides storage services to restore the state of the popup and data. (Allows the user to temporarily close the popup and finish the operation later).
- **Content Script**: (used only for PAdES visible signature). The PDF browser viewer does not show names of signature fields, so this script adds the name of the fields "above" the pdf viewer.
- **Native Application**: a Java application that deals with the creation of thesignature and communication with the token. The native application commu-nicates exclusively with the"Background Script"and it responds to two typesof requests:"sign a file"or"analyze a file"to extract information thatcan later be used to execute a signature (visible PAdES).

<p align="center"> <img src="readme-image/ExtensionArchitecture.PNG"> </p>


> For details about Chrome Extension Architecture: https://developer.chrome.com/extensions/overview

-----

#### NOTE:
- Tested on: **Windows 10, 8.1 (Oracle JDK 8u212).**

- **Tested with Bit4id smart card reader and an Italian CNS** (all provided by Aruba): 

    [Link to Aruba page](https://www.pec.it/cns-token.aspx) 
    
    [Link to Bit4id usb token](https://www.bit4id.com/en/lettore-di-smart-card-minilector-s-evo/)

![Token Image](https://www.pec.it/getattachment/20362be8-daa3-44a6-9a91-4d801245baa7/Token)
