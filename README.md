# massgis-geocoding-demo
Sample code to exercise MassGIS Geocoding REST API

## Introduction
Most of the code in this demo is 'boilerplate' code required to harvest user input, 
i.e., the address to be geocoded and display the results of geocoding as a vector
point layer in an OpenLayers map. The sheet quantity of 'boilerplate' code may 
obscure the 'heart' of the matter - the call to the MassGIS geocoding REST API 
and the harvesting of the result - is really quite simple.

## Background
In order to make sense of much of the 'boilerplate' code, it will be very helpful 
to have at least a passing familiarity with the HTML DOM (Document Object Model),
and, ideally, the use of the jQuery JavaScript library. This having been said,
this README file will mostly be devoted to a discussion of the call to the 
MassGIS geocoding API and the harvesting of data from its response.

## MassGIS Geocoding API
The MassGIS Geocoding API is a [REST](https://en.wikipedia.org/wiki/REST) \(Reprsentational State Transfer\) API.
A 'call' to it actually consists of submitting a __request__ to the service, and harvesting a __response__ from it.
This request\/response interaction is _asynchronous_; rather than simply making a function call, we submit a request
to the service and arm an _event handler_ to process the response from the service - whenever it arrives.
In the context of a web application, this is accomplished by an [AJAX] (https://en.wikipedia.org/wiki/Ajax_(programming))'call'.

### Submitting a Request with the API
The general structure of the AJAX 'call' we will make, as implemented by the jQuery $.ajax API is:
```
	$.ajax( { url		: request_url,
			 type		: 'GET',
			 dataType	: 'json',
			 success	: 	function (data, textStatus, jqXHR) {	
								// Code of 'success' event handler for 'Geocode Address' AJAX request
							},
			 error       :   function (qXHR, textStatus, errorThrown ) {
								// Code of 'error' event handler for 'Geocode Address' AJAX request
								alert('HTTP request to geocode address failed\n' +
								      'Status: ' + textStatus + '\n' +
								      'Error:  ' + errorThrown);
								return;
							} 
		});	
```
In the code sinppet above, the _request\_url_ is the URL of the MassGIS Address Geocoding service.
Our call will make an HTTP __GET__ request, and specify that the response data should be in __JSON__ format.

The rest of the code snippet consists of two event handlers: one for processing a request that was successful \(the 
'success' handler\), and one for processing a request that raised an error \(the 'error' handler.\)
In the code snippet above \(and in the code of the demo app\) these functions are implemented 'inline';
they can also be implemented as out-of-line functions, but the inline code makes it simpler to illustrate the signatures
of the two functions. The 'error' handler is straightforward and requires no discussion.

### Harvesting the API's Response
In the case of a successful request, the 'data' object returned is a JavaScript object consisting of an array of _candidate_ pbjects.
Each such object has the following structure:
```
address: text of the address matched by the geocoder 
attribues: a JavaScript object, in our case this object contains no properties of its own
location: {  x : x-coordinate of geocoded location
             y : y-coordinate of geocoded location
		   }
score: geocoding 'score', between 0 and 100
```
In our sample code for the purpose of illustration, we process only the _first_ candidate.

### Reprojecting the Coordinates in the Response
The MassGIS Address Geocoder returns x- and y-coordinates in terms of the [EPSG:26986] (https://spatialreference.org/ref/epsg/26986/) spatial reference system \(SRS\).
The web map in which the response will be displayed uses the [EPSG:4326] (https://spatialreference.org/ref/epsg/4326/) SRS.
In order to be displayed correctly, the coordinates must be projected from EPSG:26986 to EPSG:4326. 
This is accomplished by the use of the [Proj4.js] (http://proj4js.org/) library.

Our call to proj4 has the signature:
```
projected_coordinates = proj4(fromProjection, toProjection, coordinates)
```
where _coordinates_ and projected\_coordinates_ are arrays of \[x, y\] pairs, and _fromProjection_ and _toProjection_ 
are OGC WKT text strings defining the parameters of the two SRS's, taken from the spatialreference.org pages cited above.