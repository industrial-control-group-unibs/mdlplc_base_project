; SETUP MDPLC CATALOG

#include "VersionFile.txt"

[Setup]
AppName=GF_eXpress {#DriveVerAppVer}
AppVerName=Gefran {#DriveVerAppVer}
AppPublisher=Gefran spa
AppPublisherURL=http://www.gefran.com
AppSupportURL=http://www.gefran.com
AppUpdatesURL=http://www.gefran.com
DefaultDirName={pf}\Gefran
DefaultGroupName=Gefran
;OutputBaseFilename={#DriveVerAppVer}

Compression=lzma
SolidCompression=yes
UninstallDisplayIcon={app}\GF_eXpress\GF_eXpress.exe

[Languages]
Name: english; MessagesFile: compiler:Default.isl

[Tasks]

[Files]
; tutti i files sotto "Gefran"
Source: Catalog\Drives\Inverter\ADV200\{#DriveVer}\*;  DestDir: {app}\Catalog\Drives\Inverter\ADV200\{#DriveVer}; Flags: ignoreversion recursesubdirs createallsubdirs overwritereadonly
Source: Catalog\Custom\Gft\*;                          DestDir: {app}\Catalog\Custom\Gft; Flags: ignoreversion recursesubdirs createallsubdirs overwritereadonly

[InstallDelete]
; rimozione cache catalogo
Name: {app}\Catalog\GFCatalog.xml; Type: files
Name: {code:GetVirtualPath|{app}\Catalog\GFCatalog.xml}; Type: files

[UninstallDelete]
; rimozione cache catalogo
Name: {app}\Catalog\GFCatalog.xml; Type: files
Name: {code:GetVirtualPath|{app}\Catalog\GFCatalog.xml}; Type: files

[Code]
function GetVirtualPath(path: String): String;
begin
	Delete(path, 1, 2);
	Result := ExpandConstant('{userappdata}') + '\..\Local\VirtualStore' + path;
end;
