# ThunderSign - Digital Signature 
<p align="left"> <img src="thundersign-chrome\images\icon128.png"> </p>

### Installation

**Prerequisites:**
- Gmail Account
- Google Chrome
- Java 8 JRE u212
- Token PKCS #11 (Bit4id)

**:one: :  INSTALL THE CHROME EXTENSION (If you don't want to use the Chrome Web Store version)** 
	
- Open Chrome and enter `chrome://extensions/` into your address bar.
- Click on the “developer mode” toggle in the upper-right corner.
- Click no "**Load Unpacked**" and select the "**thundersign-chrome**" folder.

**:two: : INSTALL DRIVERS and JAVA APP**

- After this, run the **ThunderSign-JavaAPP** executable, choose a folder and it will create some registry key that are necessary for using the native application.
- Then it will install the Bit4id Drivers

> **NOTE:** for **uninstall** the application is enough remove the extension from chrome and run `uninstall_host.bat`

### Usage
 - **one** Open Gmail on your Chrome browser and open an email with an attachment.
 - **two** Open the extension Popup, select your attachment, select a signature type (Cades, Pades, Visible Pades) and insert your PIN.
 - **three** Select a method between Sign and Reply, Sign and Send (to another recipient) and Sign and Save (to your downloads folder).
 > Compile your email if you chose a reply or send method.
 - **four** Wait for the signature process and login to your Google Account if it's required authorizing Thundersign.
 - **five** Your email attachment has been correctly signed and sent!.

#### Chrome Extension structure

**Extension components (scripts) :**
- **Popup/Page Action**: the UI of the extension, which can be activated only on the tabs that contain a pdf. Allows the user to choose the type of signatures and enter the necessary data such as password, field to sign etc.
  The script is also responsible for downloading the file and injection the content script if necessary.
- **Background Script**: the script that manages communication with the native app and provides storage services to restore the state of the popup and data. (Allows the user to temporarily close the popup and finish the operation later).
- **Content Script**: (used only for PAdES visible signature). The PDF browser viewer does not show names of signature fields, so this script adds the name of the fields "above" the pdf viewer.
- **Native Application**: a Java application that deals with the creation of thesignature and communication with the token. The native application commu-nicates exclusively with the"Background Script"and it responds to two typesof requests:"sign a file"or"analyze a file"to extract information thatcan later be used to execute a signature (visible PAdES).

> For details about Chrome Extension Architecture: https://developer.chrome.com/extensions/overview

-----

#### NOTE: ALL RIGHTS FOR THE FORMAT and JAVA APPLICATION TO --> Alessio Scarfone https://github.com/AlessioScarfone/Java-Digital-Signature

- Tested on: **Windows 10, 8.1 (Oracle JDK 8u212).**

- **Tested with Bit4id smart card reader and an Italian CNS** (all provided by Aruba): 

    [Link to Aruba page](https://www.pec.it/cns-token.aspx) 
    
    [Link to Bit4id usb token](https://www.bit4id.com/en/lettore-di-smart-card-minilector-s-evo/)

![Token Image](https://www.pec.it/getattachment/20362be8-daa3-44a6-9a91-4d801245baa7/Token)

