

:: Deletes the entry created by install_host.bat
REG DELETE "HKCU\Software\Mozilla\NativeMessagingHosts\com.unical.digitalsignature.signer" /f
REG DELETE "HKLM\Software\Mozilla\NativeMessagingHosts\com.unical.digitalsignature.signer" /f
