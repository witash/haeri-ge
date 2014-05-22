$(function(){
	var titleLabel = $('#egg-title-label');
	var coLabel = $('#co-label');
	var no2Label = $('#no2-label');
	var coGrapher = $('#co-grapher');
	var no2Grapher = $('#no2-grapher');
	var hoverDiv = $('#hover-div');
	var eggTable = $('#egg-table');

	var size = new OpenLayers.Size(32,32);
	var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);

	var maxima = {
		co:{
			eu:{
				mgm3:10
			},
			geo:{
				mgm3:3
			},
			graph:{
				ppb:25000,
				mgm3:30.0
			}
		},
		no2:{
			eu:{
				mgm3:0.2
			},
			geo:{
				mgm3:0.085
			},
			graph:{
				ppb:1000,
				mgm3:1.0
			}
		}
	};
	
	var coSnippet = {
		high:'CO levels this high lead to {BAD THINGS}',
		mid:'',
		low:''
	}
	
	var no2Snippet = {
			high:'NO2 levels this high lead to {BAD THINGS}',
			mid:'',
			low:''		
	}
	
	var curUnits = 'mgm3';
	
	$('#units-mgm3').on('click', function(){
		curUnits = 'mgm3';
	});
	
	$('#units-ppb').on('click', function(){
		curUnits = 'ppb';
	});
	
	function mouseOverEvent(event){
		coLabel.html('CO: '+this.eggData.co[curUnits].toFixed(2) + ' ' +'mg/m3');
		no2Label.html('NO2: '+this.eggData.no2[curUnits].toFixed(3) + ' '+'mg/m3');

		titleLabel.html(this.eggData.title);
		hoverDiv.removeClass('hidden');
		hoverDiv.css({
			top:154,//event.clientY+5,
			left:54//event.clientX
		});

		coGrapher.tombar({
			max:maxima.co.graph.mgm3,
			value: this.eggData.co.mgm3,
			graphClass:this.eggData.graphClassCO,
			labels:[{
				title:'geo',
				color:'#3476AA',
				value:5.0
			},{
				title:'eu',
				color:'#96ACEE',
				value:10.0
			}]
		});
		$('#co-snippet').html(coSnippet[this.eggData.graphClassCO]);
		
		no2Grapher.tombar({
			max:maxima.no2.graph.mgm3,
			value: this.eggData.no2.mgm3,
			graphClass:this.eggData.graphClassNO2,
			labels:[{
				title:'geo',
				color:'#3476AA',
				value:0.085
			},{
				title:'eu',
				color:'#96ACEE',
				value:0.2
			}]
		});
		$('#no2-snippet').html(no2Snippet[this.eggData.graphClassNO2]);
		
	}

	function addEgg(eggInfo){
		var iconLow = new OpenLayers.Icon('img/leaf.png', size, offset);
		var iconMid = new OpenLayers.Icon('img/leaf.yellow.chunked.png', size, offset);
		var iconHigh = new OpenLayers.Icon('img/leaf.red.chunked.png', size, offset);

		var icon = iconLow;
		if(eggInfo.no2.mgm3 < maxima.no2.geo.mgm3){
			eggInfo.graphClassNO2 = 'low';
			eggInfo.graphColorNO2 = '#55CC55';
		}else if(eggInfo.no2.mgm3 < maxima.no2.eu.mgm3){
			eggInfo.graphClassNO2 = 'mid';
			eggInfo.graphColorNO2 = '#CCCC55';
		}else{
			eggInfo.graphClassNO2 = 'high';
			eggInfo.graphColorNO2 = '#CC5555';
		}
		
		if(eggInfo.co.mgm3 < maxima.co.geo.mgm3){
			eggInfo.graphClassCO = 'low';
			eggInfo.graphColorCO = '#55CC55';
		}else if(eggInfo.co.mgm3 < maxima.co.eu.mgm3){
			eggInfo.graphClassCO = 'mid';
			eggInfo.graphColorCO = '#CCCC55';
		}else{
			eggInfo.graphClassCO = 'high';
			eggInfo.graphColorCO = '#CC5555';
		}
		
		if(eggInfo.graphClassCO === 'high' || eggInfo.graphClassNO2 === 'high'){
			icon = iconHigh;
		}else if(eggInfo.graphClassCO === 'mid' || eggInfo.graphClassNO2 === 'mid'){
			icon = iconMid;
		}else{
			icon = iconLow;
		}

		var location = new OpenLayers.LonLat(eggInfo.lon, eggInfo.lat);
		location.transform( new OpenLayers.Projection("EPSG:4326") , new OpenLayers.Projection("EPSG:900913") );
		var newMarker=new OpenLayers.Marker(location, icon);

		newMarker.eggData = eggInfo;

		newMarker.events.register('mouseover', newMarker, mouseOverEvent);

		newMarker.events.register('mouseout', newMarker, function(event){
			//hoverDiv.addClass('hidden');
		});
		MapContainer.markers.addMarker(newMarker);
		
		addToTable(eggInfo);
	}

	function isToday(at){
		var today = new Date();
		return (at.getMonth() == today.getMonth() && at.getDate() >= today.getDate() - 24);
	}

	function getEggInfo(rawEggData){
		var eggInfo = {
				title:rawEggData.title,
				lon:rawEggData.location.lon,
				lat:rawEggData.location.lat,
				updated:rawEggData.updated
			};
		if(!isToday(new Date(rawEggData.updated))){
			return {};
		}
		for(var i=0;i<rawEggData.datastreams.length;i++){
			var datastream = rawEggData.datastreams[i]
			var valType=datastream.id.substring(0,5);
			var today = new Date();
			if(valType === 'CO_00'){
//				if(!isToday(new Date(datastream.at))){
//					continue;
//				}
				console.log(new Date(datastream.at));
				eggInfo.co = {};
				eggInfo.co.ppb = new Number(datastream.current_value);
				eggInfo.co.mgm3 = eggInfo.co.ppb * 28.0 * (1.0/24.0) / 1000.0;
			}else if(valType === 'NO2_0'){
//				if(!isToday(new Date(datastream.at))){
//					continue;
//				}
				console.log(new Date(datastream.at));
				eggInfo.no2 = {};
				eggInfo.no2.ppb = new Number(datastream.current_value);
				eggInfo.no2.mgm3 =  eggInfo.no2.ppb * 46.0 * (1.0/24.0) / 1000.0;
			}
		}
		return eggInfo;
	}
	
	function addToTable(eggInfo){
		var eggRow = $('<tr></tr>');
		eggRow.append('<td>'+eggInfo.title+'</td>');
		eggRow.append('<td>'+eggInfo.updated+'</td>');
		eggRow.append('<td>'+eggInfo.co.mgm3+'</td>');
		eggRow.append('<td>'+eggInfo.co.ppb+'</td>');
		eggRow.append('<td>'+eggInfo.no2.mgm3+'</td>');
		eggRow.append('<td>'+eggInfo.no2.ppb+'</td>');
		eggTable.append(eggRow);
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
	
	var states={
			adapter:{
				text:'Please be sure that the adapter is plugged in',
				img:'This is an image',
				btn1:{
					text:'l'
				}
			}
	}

	function setState(newState){
		$('#trouble-text').html(newState.text);
		$('#troule-img').attr('src', newState.imgUrl);
		$('#trouble-btn1').html(newState.btn1.text);
		$('#trouble-btn2').on('click', newState.btn1.nextState);
	}
	
	MapContainer.map.addControl(navigation);

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

	var location = new OpenLayers.LonLat(43.32652967284656,42.302116260522786);
	location.transform( new OpenLayers.Projection("EPSG:4326") , new OpenLayers.Projection("EPSG:900913") );
	MapContainer.map.setCenter( location, 8 );
});