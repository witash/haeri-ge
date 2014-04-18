$(function(){
	var titleLabel = $('#egg-title-label');
	var coLabel = $('#co-label');
	var no2Label = $('#no2-label');

	var coGrapher = $('#co-grapher');
	var no2Grapher = $('#no2-grapher');

	var hoverDiv = $('#hover-div');

	var size = new OpenLayers.Size(32,32);
	var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);

	var coMax = 25000;
	var noMax = 1000;
	
	function mouseOverEvent(event){
		coLabel.html('CO: '+this.eggData.co.mgm3.toFixed(2) + ' mg/m3');
		no2Label.html('NO2: '+this.eggData.no2.mgm3.toFixed(3) + ' mg/m3');

		titleLabel.html(this.eggData.title);
		hoverDiv.removeClass('hidden');
		hoverDiv.css({
			top:event.clientY+5,
			left:event.clientX
		});

		var graphWidth = (this.eggData.co.ppb / coMax) * 100;
		coGrapher.progressbar({value: graphWidth});
		$("#co-grapher > div").css({ 'background': '#'+this.eggData.graphColor});
		var graphWidth = (this.eggData.no2.ppb / noMax) * 100;
		no2Grapher.progressbar({value: graphWidth});
		$("#no2-grapher > div").css({ 'background': '#'+this.eggData.graphColor});
		
	}

	function addEgg(eggInfo){
		var iconLow = new OpenLayers.Icon('img/green-leaf-cloud.png', size, offset);
		var iconMid = new OpenLayers.Icon('img/yellow-leaf-cloud.png', size, offset);
		var iconHigh = new OpenLayers.Icon('img/red-leaf-cloud.png', size, offset);

		var icon = iconLow;
		if(eggInfo.no2.ppb < 200){
			icon = iconLow;
			eggInfo.graphColor = '55CC55';
		}else if(eggInfo.no2.ppb < 400){
			icon = iconMid;
			eggInfo.graphColor = 'CCCC55';
		}else{
			icon = iconHigh;
			eggInfo.graphColor = 'CC5555';
		}

		var location = new OpenLayers.LonLat(eggInfo.lon, eggInfo.lat);
		location.transform( new OpenLayers.Projection("EPSG:4326") , new OpenLayers.Projection("EPSG:900913") );
		var newMarker=new OpenLayers.Marker(location, icon);

		newMarker.eggData = eggInfo;

		newMarker.events.register('mouseover', newMarker, mouseOverEvent);

		newMarker.events.register('mouseout', newMarker, function(event){
			hoverDiv.addClass('hidden');
		});
		MapContainer.markers.addMarker(newMarker);    	
	}

	function isToday(at){
		var today = new Date();
		return at.getMonth() !== today.getMonth() || at.getDate() !== today.getDate();
	}

	function getEggInfo(rawEggData){
		var eggInfo = {
				title:rawEggData.title,
				lon:rawEggData.location.lon,
				lat:rawEggData.location.lat
			};
		for(var i=0;i<rawEggData.datastreams.length;i++){
			var datastream = rawEggData.datastreams[i]
			var valType=datastream.id.substring(0,5);
			var today = new Date();
			if(valType === 'CO_00'){
				if(!isToday(new Date(datastream.at))){
					continue;
				}
				eggInfo.co = {};
				eggInfo.co.ppb = datastream.current_value;
				eggInfo.co.mgm3 = eggInfo.co.ppb * 28.0 * (1.0/24.0) / 1000.0;
			}else if(valType === 'NO2_0'){
				if(!isToday(new Date(datastream.at))){
					continue;
				}
				eggInfo.no2 = {};
				eggInfo.no2.ppb = datastream.current_value;
				eggInfo.no2.mgm3 =  eggInfo.no2.ppb * 46.0 * (1.0/24.0) / 1000.0;
			}
		}
		return eggInfo;
	}

	function parseData(data){
		var data = JSON.parse(data);
		for(var i=0;i<data.results.length;i++){
			console.log(data.results[i]);

			//Ignore any eggs that don't have data
			if(!data.results[i].datastreams){
				continue;
			}

			var eggInfo = getEggInfo(data.results[i]);
			if(eggInfo.co && eggInfo.no2){
				addEgg(eggInfo);
			}
		}
	}

	$.ajax({
		url:"eggs",
		success:parseData,
		error:function(error){
			console.log(error);
		}
	});

	var MapContainer = {};

	MapContainer.map = new OpenLayers.Map({
		div: 'map',
		allOverlays: true,
		displayProjection: new OpenLayers.Projection("EPSG:900913"),
		projection: new OpenLayers.Projection("EPSG:900913"),
		maxResolution: 156543.0339,
		units: "m",
		numZoomLevels: 20,
		theme: null
	});

	var navigation = new OpenLayers.Control.Navigation({
		'zoomWheelEnabled': false,
		'handleRightClicks': true
	});

	MapContainer.map.addControl(navigation);

	var nc = MapContainer.map.getControlsByClass('OpenLayers.Control.Navigation'),i;

	for( i = 0; i < nc.length; i++ ){
		nc[i].disableZoomWheel();
	}

	var gmap = new OpenLayers.Layer.Google("Google Maps",
			{
		numZoomLevels: 20,
		type: google.maps.MapTypeId.TERRAIN
			}
	); 
	MapContainer.map.addLayer( gmap);
	//MapContainer.osmLayer = new OpenLayers.Layer.OSM();
	//MapContainer.map.addLayer( MapContainer.osmLayer );

	MapContainer.markers = new OpenLayers.Layer.Markers("Markers");
	MapContainer.map.addLayer(MapContainer.markers);

	var thisRef = this;

	var location = new OpenLayers.LonLat(44.812652967284656,41.696116260522786);
	location.transform( new OpenLayers.Projection("EPSG:4326") , new OpenLayers.Projection("EPSG:900913") );
	MapContainer.map.setCenter( location, 14 );
});