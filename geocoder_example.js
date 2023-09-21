// MassGIS Geocoding  REST API demo app.
//     Documentation: https://wiki.state.ma.us/display/massgis/ArcGIS+Server+-+Geocoding+-+Census+TIGER+2010
// Author: Ben Krepp


// URL for MassGIS Geocoding REST API endpoint
var massGIS_geocoding_REST_ep = 'https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/CensusTIGER2010/GeocodeServer/findAddressCandidates';

var epsg4326 = 'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]';

var epsg26986 = 'PROJCS["NAD83 / Massachusetts Mainland",GEOGCS["NAD83",DATUM["North_American_Datum_1983",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],AUTHORITY["EPSG","6269"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4269"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["standard_parallel_1",42.68333333333333],PARAMETER["standard_parallel_2",41.71666666666667],PARAMETER["latitude_of_origin",41],PARAMETER["central_meridian",-71.5],PARAMETER["false_easting",200000],PARAMETER["false_northing",750000],AUTHORITY["EPSG","26986"],AXIS["X",EAST],AXIS["Y",NORTH]]';

// OpenLayers 'map' object:
var ol_map = null;

var debugFlag = true;


function process_geocoded_location(data) {
	// Work with first (best) candidate: candidates[0]
	var x_coord = data.candidates[0].location.x,
	    y_coord = data.candidates[0].location.y,
		score   = data.candidates[0].score;
	
	if (debugFlag) {
		console.log('x = ' + x_coord + ', y = ' + y_coord);	
	}
	var coords = [x_coord, y_coord];
	
	// Project from EPSG:26986 to EPSG:4326
	var projected_coords = proj4(epsg26986, epsg4326, coords);
	
	if (debugFlag) {
		console.log('Projected coordinates ' + 'x = ' + projected_coords[0] + ' y = ' + projected_coords[1]);
	}
	
	var center = ol.proj.fromLonLat([projected_coords[0], projected_coords[1]]);
	var zoom = 16; // Arbitrary choice, for now
	var view = new ol.View({center: center, zoom: zoom});
	ol_map.setView(view);
} // process_geocode_response()

function submit_geocode_request(street, city, zip) {
	var request_url = massGIS_geocoding_REST_ep;
	request_url += '?';
	request_url += 'Street=' + street; // Note "+" for whitespace
	request_url += '&City=' + city;
	request_url += '&ZIP=' + zip;
	request_url += '&f=json';
	$.ajax( { url		: request_url,
			 type		: 'GET',
			 dataType	: 'json',
			 success	: 	function (data, textStatus, jqXHR) {	
								var n_candidates = data.candidates.length;
								if (n_candidates ===  0) {
									alert('Geocoding request for address failed to find any candidates.\nTry again.');
									return;
								}
								// Work with first (best) candidate: candidates[0]
								var temp = data.candidates[0];
								var score = temp.score;
								if (score < 75) {
									alert('Warning: Geocoding service returned score of ' + score + '.\nIgnoring results. Try again.')
								} else if (score < 90) {
									alert('Warning: Geocoding score was ' + score + '.\nTake results with grain of salt!');
								}
								process_geocoded_location(data);
								return;
							},
			error       :   function (qXHR, textStatus, errorThrown ) {
								alert('HTTP request to geocode address failed\n' +
								      'Status: ' + textStatus + '\n' +
								      'Error:  ' + errorThrown);
								return;
							} // error handler for Geocode Address AJAX request
		});	
} // submit_geocode_request()

function initialize() {
	$('#output_wrapper').hide();
	var initial_map_center = [-71.057083, 42.3601];
	var initial_zoom_level = 12;
    ol_map = new ol.Map({ layers: [ new ol.layer.Tile({ source: new ol.source.OSM() }) ],
                           target: 'map',
                           view: new ol.View({ projection: 'EPSG:4326', 
						                       center: initial_map_center,
                                               zoom:   initial_zoom_level
                                            })
                         });
	// UI event handlers
	$('#execute').on('click', 
		function(e) {
			var temp = $('#address').val();
			// Replace blanks in address field with '+', per geocoding API
			var address = temp.replaceAll(' ', '+');
			var city = $('#city').val();
			var zip = $('#zip').val();
			// Submit request, and let response handler to the rest...
			submit_geocode_request(address, city, zip);
	});
	$('#reset').on('click',
		function(e) {
			// Clear the textual output area
			$('#output_wrapper').hide();
			// Clear anything that might previously be in the vector layer
		    var vSource = oTazLayer.getSource();
            vSource.clear();
			// Set map to initial extent and zoom level
			var v = ol_map.getView();
			v.setCenter(initial_map_center);
			v.setZoom(initial_zoom_level);
			ol_map.setView(v);
	});
} // initialize()
