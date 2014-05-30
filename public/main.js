$(function(){
	var titleLabel = $('#egg-title-label');
	var coLabel = $('#co-label');
	var no2Label = $('#no2-label');
	var coGrapher = $('#co-grapher');
	var no2Grapher = $('#no2-grapher');
	var hoverDiv = $('#hover-div');
	var eggTable = $('#egg-table');

	var features = [];
	var size = new OpenLayers.Size(32,32);
	var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
	
	var colorMap = {
			poor:'#EE5555',
			fair:'#EEEE55',
			good:'#55EE55'
	}

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
				mgm3:0.04
			},
			geo:{
				mgm3:0.04
			},
			graph:{
				ppb:1000,
				mgm3:1.0
			}
		}
	};
	
	var coSnippet = 'Carbon monoxide prevents oxygen from being delivered to vital organs';

	var no2Snippet = 'Nitrogen dioxide causes respiratory irritation and exacerbates asthma attacks';
	
	var curUnits = 'mgm3';
	
	$('#units-mgm3').on('click', function(){
		curUnits = 'mgm3';
	});
	
	$('#units-ppb').on('click', function(){
		curUnits = 'ppb';
	});
	
	function addGraphClass(eggInfo){
		eggInfo.graphClassNO2 = 'low';
		if(eggInfo.no2.mgm3 < maxima.no2.eu.mgm3 * .75){
			eggInfo.graphClassNO2 = 'low';
			eggInfo.graphColorNO2 = '#55CC55';
		}else if(eggInfo.no2.mgm3 < maxima.no2.eu.mgm3){
			eggInfo.graphClassNO2 = 'mid';
			eggInfo.graphColorNO2 = '#CCCC55';
		}else{
			eggInfo.graphClassNO2 = 'high';
			eggInfo.graphColorNO2 = '#CC5555';
		}
		
		if(eggInfo.co.mgm3 < maxima.co.eu.mgm3 * .75){
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
			eggInfo.overallClass = 'poor';
		}else if(eggInfo.graphClassCO === 'mid' || eggInfo.graphClassNO2 === 'mid'){
			eggInfo.overallClass = 'fair';
		}else{
			eggInfo.overallClass = 'good';
		}
	}

	function addEgg(eggInfo){
		addGraphClass(eggInfo);

		var location = new OpenLayers.LonLat(eggInfo.lon, eggInfo.lat);
		location.transform( new OpenLayers.Projection("EPSG:4326") , new OpenLayers.Projection("EPSG:900913") );
		var newMarker = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(location.lon, location.lat));//new OpenLayers.Marker(location, icon);

		newMarker.attributes = eggInfo;

		features.push(newMarker);
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
//		if(!isToday(new Date(rawEggData.updated))){
//			return {};
//		}
		for(var i=0;i<rawEggData.datastreams.length;i++){
			var datastream = rawEggData.datastreams[i]
			var valType=datastream.id.substring(0,5);
			var today = new Date();
			if(valType === 'CO_00'){
				var test = new Number(datastream.current_value);
				if(test >= 0){
					eggInfo.co = {};
					eggInfo.co.ppb = test;
					eggInfo.co.mgm3 = eggInfo.co.ppb * 28.0 * (1.0/24.0) / 1000.0;
				}
			}else if(valType === 'NO2_0'){
				var test = new Number(datastream.current_value);
				if(test >= 0){
					eggInfo.no2 = {};
					eggInfo.no2.ppb = test;
					eggInfo.no2.mgm3 =  eggInfo.no2.ppb * 46.0 * (1.0/24.0) / 1000.0;
				}
			}else if(valType === 'Tempe'){
				var test = new Number(datastream.current_value);
				if(test >= 0){
					eggInfo.temperature = test;
				}
			}
		}
		
		if(eggInfo.temperature){
			var volume = (0.08206 * (273.15 + eggInfo.temperature));
			if(eggInfo.no2){
				eggInfo.no2.mgm3 = eggInfo.no2.ppb * 46.0 * (1.0/volume) / 1000.0
			}
			if(eggInfo.co){
				eggInfo.co.mgm3 = eggInfo.co.ppb * 28.0 * (1.0/volume) / 1000.0;
			}
		}

		return eggInfo;
	}

	function parseData(data){
		var data = JSON.parse(data);
		for(var i=0;i<data.results.length;i++){

			//Ignore any eggs that don't have data
			if(!data.results[i].datastreams){
				continue;
			}

			var eggInfo = getEggInfo(data.results[i]);
			if(eggInfo.co && eggInfo.no2){
				addEgg(eggInfo);
			}
		}

		redraw();
		MapContainer.markers.addFeatures(features);
		redraw();
		
		
		$('#geo-key').css({'background-color':'#3476AA'});
		$('#eu-key').css({'background-color':'#96ACEE'});
		
		var label1Left = (maxima.no2.geo.mgm3 / maxima.no2.graph.mgm3) * 315;
		$('#no2-label-geo').css({
			left:label1Left+'px',
			'background-color':'#3476AA'
		});
		var label2Left = (maxima.no2.eu.mgm3 / maxima.no2.graph.mgm3) * 315;
		$('#no2-label-eu').css({
			left:label2Left+2+'px',
			'background-color':'#96ACEE'
		});
		
		var label1Left = (maxima.co.geo.mgm3 / maxima.co.graph.mgm3) * 315;
		$('#co-label-geo').css({
			left:label1Left+'px',
			'background-color':'#3476AA'
		});
		var label2Left = (maxima.co.eu.mgm3 / maxima.co.graph.mgm3) * 315;
		$('#co-label-eu').css({
			left:label2Left+'px',
			'background-color':'#96ACEE'
		});
	}
	
	function redraw(){
		for(var i=0;i<MapContainer.markers.features.length;i++){
			var totals = {co:{ppb:0,mgm3:0}, no2:{ppb:0,mgm3:0}};
			
			var currentFeature = MapContainer.markers.features[i];
			var num = currentFeature.cluster.length;
			for(var j=0;j<num;j++){
				totals.co.ppb += currentFeature.cluster[j].attributes.co.ppb;
				totals.co.mgm3 += currentFeature.cluster[j].attributes.co.mgm3;
				totals.no2.ppb += currentFeature.cluster[j].attributes.no2.ppb;
				totals.no2.mgm3 += currentFeature.cluster[j].attributes.no2.mgm3;
			}
			currentFeature.attributes.co = {};
			currentFeature.attributes.co.mgm3 = totals.co.mgm3 / num;
			currentFeature.attributes.co.ppb = totals.co.ppb / num;
			currentFeature.attributes.no2 = {};
			currentFeature.attributes.no2.mgm3 = totals.no2.mgm3 / num;
			currentFeature.attributes.no2.ppb = totals.no2.ppb / num;
			
			if(num === 1){
				currentFeature.attributes.title = currentFeature.cluster[0].attributes.title;
			}else{
				currentFeature.attributes.title =  currentFeature.cluster.length + ' sensors';
			}
			
			addGraphClass(currentFeature.attributes);
			MapContainer.markers.drawFeature(currentFeature);
		}		
	}

	$.ajax({
		url:"eggs",
		success:parseData,
		error:function(error){
			console.log(error);
		}
	});
	
	var page = 0;
	function nextPage(lastData){
		if(lastData){
			parseData(lastData);
			var lastData = JSON.parse(lastData);
			var totalResults = parseInt(lastData.totalResults);
			var startIndex = parseInt(lastData.startIndex);
			var itemsPerPage = parseInt(lastData.itemsPerPage);
			console.log(totalResults, startIndex, itemsPerPage);
			redraw();
		}
		

		if(!lastData || totalResults > startIndex + itemsPerPage){
			page++;
			$.ajax({
				url:"eggPage/"+page,
				success:nextPage,
				error:function(error){
					console.log(error);
				}
			});
		}
	}
//	nextPage();

	var MapContainer = {};
	
	var strategy = new OpenLayers.Strategy.Cluster({
	    distance: 20 // <-- removed clustering flag
	});
	
	MapContainer.map = new OpenLayers.Map({
		div: 'map',
		allOverlays: true,
		displayProjection: new OpenLayers.Projection("EPSG:900913"),
		projection: new OpenLayers.Projection("EPSG:900913"),
		units: "m",
		theme: null,
		eventListeners:{
			zoomend:function(e){
				redraw();
			},
			featureover:function(e){
				coLabel.html(e.feature.attributes.co[curUnits].toFixed(2) + ' ' +'mg/m3');
				no2Label.html(e.feature.attributes.no2[curUnits].toFixed(3) + ' '+'mg/m3');

				$('#egg-title-label').html(e.feature.attributes.title);
				$('#summary').removeClass('invisible');
				$('#hover-content-div').removeClass('invisible');
				$('#landing-div').addClass('hidden');
				$('#quality').html(e.feature.attributes.overallClass);
				$('#quality').css({
					color:colorMap[e.feature.attributes.overallClass]
				});

				var graphWidth = (e.feature.attributes.co.mgm3 / maxima.co.graph.mgm3) * 315;
				graphWidth = graphWidth >= 315 ? 315 : graphWidth;
				coGrapher.css({
					width:graphWidth+'px',
					'background-color':e.feature.attributes.graphColorCO
				});
				
				var graphWidth = (e.feature.attributes.no2.mgm3 / maxima.no2.graph.mgm3) * 315;
				graphWidth = graphWidth >= 315 ? 315 : graphWidth;
				no2Grapher.css({
					width:graphWidth+'px',
					'background-color':e.feature.attributes.graphColorNO2
				});
				
				$('#co-snippet').html(coSnippet);
				$('#no2-snippet').html(no2Snippet);
			},
			featureclick:function(e){
				if(e.feature.cluster && e.feature.cluster.length > 1){
					MapContainer.map.zoomIn();
					MapContainer.map.setCenter(new OpenLayers.LonLat(e.feature.geometry.x, e.feature.geometry.y));
				}
			}
		}
	});

	var navigation = new OpenLayers.Control.Navigation({
		'zoomWheelEnabled': false,
		'handleRightClicks': true
	});
	
	MapContainer.map.addControl(navigation);

	var gmap = new OpenLayers.Layer.Google("Google Maps",
		{
			numZoomLevels: 16,
			type: google.maps.MapTypeId.TERRAIN
		}
	);
	
	MapContainer.map.addLayer( gmap);

	var context = {
			getColor: function(feature){
				return colorMap[feature.attributes.overallClass];
			},
			getLabel: function(feature){
				if(feature.cluster && feature.cluster.length > 1){
					return feature.cluster.length;
				}else{
					return '';
				}
			},
			getStroke: function(feature){
				if(feature.cluster && feature.cluster.length > 1){
					return 7;
				}else{
					return 0;
				}			
			}
	};
	
	var strategy = new OpenLayers.Strategy.Cluster({
	    distance: 20 // <-- removed clustering flag
	});
	this.markersLayer = new OpenLayers.Layer.Vector("Clustered markers", {
		strategies: [strategy],
		styleMap:new OpenLayers.StyleMap(style)
	});
	
	var style = new OpenLayers.Style({
		pointRadius: 7,
		fillColor:'${getColor}',
		strokeColor:'${getColor}',
		strokeWidth:'${getStroke}',
		strokeOpacity:0.5,
		label:'${getLabel}'
	},{context:context}); 
	
	MapContainer.markers = new OpenLayers.Layer.Vector("Markers", {
		strategies: [strategy],
		styleMap:style
	});
	
	MapContainer.map.addLayer(MapContainer.markers);

	var thisRef = this;

	var location = new OpenLayers.LonLat(42.80652967284656,42.302116260522786);
	location.transform( new OpenLayers.Projection("EPSG:4326") , new OpenLayers.Projection("EPSG:900913") );
	MapContainer.map.setCenter( location, 8 );
});