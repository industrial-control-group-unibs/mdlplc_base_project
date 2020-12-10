
var NODE_ELEMENT   = 1;
var NODE_ATTRIBUTE = 2;
var NODE_TEXT      = 3;
var NODE_COMMENT   = 8;

var IPA_CTRL_MODE_NON = 6208;
var HOIST_CRANE       = 3;    //codice applicazione Hoist&Crane -> necessita di gestione speciale

var objArgs    = WScript.Arguments;
var XMLVerType = objArgs(0); //nome file ausiliario GFTDrive_ver.type.xml
var XMLDevInfo = objArgs(1); //nome file ausiliario GFTDeviceInfo.xml
var GFTInpName = objArgs(2); //nome file .gft prodotto dal par2gft.exe
var appSTR     = objArgs(3); //nome applicazione + formato VER.x.TYP -> viene inserito nel campo version del .gft
var Device_ID  = objArgs(4); //deviceid da sostituire a quello imposto dal par2gft.exe
var appType    = objArgs(5); //codice applicazione

var gftDocSrc   = new ActiveXObject( "MSXML2.DOMDocument.6.0" );
gftDocSrc.async = false;
if( !gftDocSrc.load( GFTInpName ) )
{
	WScript.Echo( "ERROR loading " + GFTInpName );
	WScript.Quit( 1 );
}

var verType = gftDocSrc.documentElement.selectSingleNode( "/devicetemplate/deviceinfo/@version" ).nodeValue;
var version = verType.split(".")[0];
var type    = verType.split(".")[1];

var xmlDocSrc1   = new ActiveXObject( "MSXML2.DOMDocument.6.0" );
xmlDocSrc1.async = false;
if( !xmlDocSrc1.load(XMLVerType) )
{
	WScript.Echo( "ERROR loading " + XMLVerType );
	WScript.Quit( 1 );
}

xmlDocSrc1.setProperty( "SelectionNamespaces", "xmlns:xs='http://www.w3.org/2001/XMLSchema'" );
SetCANdeviceIDXML( xmlDocSrc1.documentElement, "CANcustom_" + Device_ID );

MergeXML( xmlDocSrc1.documentElement, gftDocSrc.documentElement, 0 );

var xmlDocSrc2   = new ActiveXObject( "MSXML2.DOMDocument.6.0" );
xmlDocSrc2.async = false;
if( !xmlDocSrc2.load(XMLDevInfo) )
{
	WScript.Echo( "ERROR loading " + XMLDevInfo );
	WScript.Quit( 1 );
}

MergeXML( xmlDocSrc2.documentElement, gftDocSrc.documentElement, 1 );

var elem = gftDocSrc.getElementsByTagName( "deviceinfo" );
elem[ 0 ].setAttribute( "version", version + ".x." + type + " " + appSTR );

//GF_Net -> sempre visibile solo per applicazioni Gefran standard
elem[ 0 ].removeAttribute( "alwaysHideGFNet" );
elem[ 0 ].setAttribute( "alwaysShowGFNet", "true" );

if( appType == HOIST_CRANE ) //Hoist&Crane necessita di gestione speciale
{
	elem[ 0 ].setAttribute( "caption", "ADV200S HC" );
	elem[ 0 ].setAttribute( "name" , "ADV200S HC" );
	elem[ 0 ].setAttribute( "description", "ADV200S HC" );
}

var par = gftDocSrc.getElementsByTagName( "par" );
for( var i = 0; i < par.length; i++ )
{
	if( par[i].getAttribute( "ipa" ) == IPA_CTRL_MODE_NON )
	{
		par[ i ].setAttribute( "defval", 2 ); //default "Ramp" al posto di "Torque"
		break;
	}
}

var node = gftDocSrc.childNodes;
if( node[ 1 ].nodeValue.search( "#DEFINE _PREFIX_" ) != -1 )
{
	node[ 1 ].nodeValue = " #DEFINE _PREFIX_ " + Device_ID + " ";
	elem[ 0 ].setAttribute( "deviceid", Device_ID );
}

gftDocSrc.save( GFTInpName );

////////////////////////////////////////////////
function SetCANdeviceIDXML( srcNode, str )
{	
	var t;
	
	// aggiunge su destNode tutti gli attributi di srcNode
	for( var i = 0, t = srcNode.attributes.length; i < t; i++ )
	{
		var attr = srcNode.attributes[ i ];
		var s = attr.text;
		if( s.search( "_CANDEVICEID_" ) != -1 )
		{   
			s = s.replace( "_CANDEVICEID_", str );
			srcNode.setAttribute( attr.nodeName, s );
		}
	}
	
	//scorre tutti i figli di srcNode
	for( var i = 0, t = srcNode.childNodes.length; i < t; i++ )
	{	
		var n1 = srcNode.childNodes[ i ];
		if( n1 && n1.nodeType == NODE_ELEMENT ) 
		{
			SetCANdeviceIDXML( n1, str );
		}
	}
}

function MergeXML( srcNode, destNode, subText )
{
	var t;
	
	//aggiunge su destNode tutti gli attributi di srcNode
	for( var i = 0, t = srcNode.attributes.length; i < t; i++ )
	{
		var attr = srcNode.attributes[i];
		var s = attr.text;
		destNode.setAttribute( attr.nodeName, s );
	}
	
	//sostituisce valore dei nodi testuali
	if( subText == 1 )
	{
		if( srcNode.childNodes[0].nodeValue != null )
		{
			destNode.childNodes[0].nodeValue = srcNode.childNodes[0].nodeValue;
		}
	}
	
	// scorre tutti i figli di srcNode
	for( var i = 0, t = srcNode.childNodes.length; i < t; i++ )
	{
		var n1 = srcNode.childNodes[i];
		if( n1.nodeType == NODE_ELEMENT )
		{
			//cerca se destNode ha già il nodo sorgente n1
			var n2 = destNode.selectSingleNode( GetSearchQuery(n1) );
			if( !n2 )
			{
				destNode.appendChild( n1.cloneNode(true) ); //non trovato, lo aggiunge nella sua interezza
			}
			else
			{
				MergeXML( n1, n2, subText ); //c'è già, effettua il merge ricorsivo
			}	
		}
	}
}

//genera una query di ricerca appropriata per il nodo specificato
function GetSearchQuery( n )
{
	     if( n.nodeName == "par"      && n.parentNode.nodeName == "parameters" ) return "par[@ipa = "       + n.getAttribute("ipa")   + "]"; 
	else if( n.nodeName == "option"   && n.parentNode.nodeName == "par"        ) return "option[@optid = "  + n.getAttribute("optid") + "]"; 
	else if( n.nodeName == "protocol" && n.parentNode.nodeName == "par"        ) return "protocol[@name = " + n.getAttribute("name")  + "]"; 
	else if( n.nodeName == "option"   && n.parentNode.nodeName == "options"    ) return "option[@name = "   + n.getAttribute("name")  + "]"; 
	else if( n.nodeName == "alarm"    && n.parentNode.nodeName == "alarms"     ) return "alarm[@id = "      + n.getAttribute("id")    + "]"; 
	else	                                                                     return n.nodeName;                                          
}