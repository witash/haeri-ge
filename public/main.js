$(function(){
	var MapContainer = {};
	
	var titleLabel = $('#egg-title-label');
	var coLabel = $('#co-label');
	var no2Label = $('#no2-label');
	var coGrapher = $('#co-grapher');
	var no2Grapher = $('#no2-grapher');
	var hoverDiv = $('#hover-div');
	var eggTable = $('#egg-table');

	var graphWidth = 315;
	
	var features = [];
	
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
	
	//take an egg object and add quality classes to it (for each of no2, co and overall)
	function addGraphClass(eggInfo){
		var goodFactor = 0.75;
		var fairFactor = 1.0;
		
		if(eggInfo.no2.mgm3 < maxima.no2.eu.mgm3 * goodFactor){
			eggInfo.graphClassNO2 = 'good';
		}else if(eggInfo.no2.mgm3 < maxima.no2.eu.mgm3 * fairFactor){
			eggInfo.graphClassNO2 = 'fair';
		}else{
			eggInfo.graphClassNO2 = 'poor';
		}
		
		if(eggInfo.co.mgm3 < maxima.co.eu.mgm3 * goodFactor){
			eggInfo.graphClassCO = 'good';
		}else if(eggInfo.co.mgm3 < maxima.co.eu.mgm3 * fairFactor){
			eggInfo.graphClassCO = 'fair';
		}else{
			eggInfo.graphClassCO = 'poor';
		}
		
		//overall class is whichever is worse, co or no2
		if(eggInfo.graphClassCO === 'poor' || eggInfo.graphClassNO2 === 'poor'){
			eggInfo.overallClass = 'poor';
		}else if(eggInfo.graphClassCO === 'fair' || eggInfo.graphClassNO2 === 'fair'){
			eggInfo.overallClass = 'fair';
		}else{
			eggInfo.overallClass = 'good';
		}
	}

	//add a feature representing an egg to the map
	//the features attributes has will contain the egg data
	function addEgg(eggInfo){
		addGraphClass(eggInfo);

		var location = new OpenLayers.LonLat(eggInfo.lon, eggInfo.lat);
		location.transform( new OpenLayers.Projection("EPSG:4326") , new OpenLayers.Projection("EPSG:900913") );
		var newMarker = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(location.lon, location.lat));//new OpenLayers.Marker(location, icon);

		newMarker.attributes = eggInfo;

		features.push(newMarker);
	}

	//reformat the raw data from xively into something readable for our system
	//this includes ppb to mg/m3 conversions and throwing out negative values
	function getEggInfo(rawEggData){
		var eggInfo = {
				title:rawEggData.title,
				lon:rawEggData.location.lon,
				lat:rawEggData.location.lat,
				updated:rawEggData.updated
			};
		for(var i=0;i<rawEggData.datastreams.length;i++){
			var datastream = rawEggData.datastreams[i]
			var valType=datastream.id.substring(0,5);
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

		MapContainer.markers.addFeatures(features);
		redraw();
		
		$('#geo-key').css({'background-color':'#3476AA'});
		$('#eu-key').css({'background-color':'#96ACEE'});
		
		var label1Left = (maxima.no2.geo.mgm3 / maxima.no2.graph.mgm3) * graphWidth;
		$('#no2-label-geo').css({
			left:label1Left+'px',
			'background-color':'#3476AA'
		});
		var label2Left = (maxima.no2.eu.mgm3 / maxima.no2.graph.mgm3) * graphWidth;
		$('#no2-label-eu').css({
			left:label2Left+2+'px',
			'background-color':'#96ACEE'
		});
		
		var label1Left = (maxima.co.geo.mgm3 / maxima.co.graph.mgm3) * graphWidth;
		$('#co-label-geo').css({
			left:label1Left+'px',
			'background-color':'#3476AA'
		});
		var label2Left = (maxima.co.eu.mgm3 / maxima.co.graph.mgm3) * graphWidth;
		$('#co-label-eu').css({
			left:label2Left+'px',
			'background-color':'#96ACEE'
		});
	}
	
	//iterate over the egg features, and get the mean values for each cluster
	//then addGraphClass for the cluster with the averaged data and redraw
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

	var page = 0;
	function nextPage(lastData){
		if(lastData){
			parseData(lastData);
			var lastData = JSON.parse(lastData);
			var totalResults = parseInt(lastData.totalResults);
			var startIndex = parseInt(lastData.startIndex);
			var itemsPerPage = parseInt(lastData.itemsPerPage);
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
	
	//redraw graphs and replace labels with values from the given feature
	function updateHoverInfo(e){
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

		var drawWidth = (e.feature.attributes.co.mgm3 / maxima.co.graph.mgm3) * graphWidth;
		drawWidth = drawWidth >= graphWidth ? graphWidth : drawWidth;
		console.log(e.feature.attributes.graphClassCO);
		coGrapher.css({
			width:drawWidth+'px',
			'background-color':colorMap[e.feature.attributes.graphClassCO]
		});
		
		var drawWidth = (e.feature.attributes.no2.mgm3 / maxima.no2.graph.mgm3) * graphWidth;
		drawWidth = drawWidth >= graphWidth ? graphWidth : drawWidth;
		console.log(e.feature.attributes.graphClassNO2);
		no2Grapher.css({
			width:drawWidth+'px',
			'background-color':colorMap[e.feature.attributes.graphClassNO2]
		});
		
		$('#co-snippet').html(coSnippet);
		$('#no2-snippet').html(no2Snippet);
	}

	function setUpMap(){

		
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
					updateHoverInfo(e);
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
	
		var location = new OpenLayers.LonLat(42.80652967284656,42.302116260522786);
		location.transform( new OpenLayers.Projection("EPSG:4326") , new OpenLayers.Projection("EPSG:900913") );
		MapContainer.map.setCenter( location, 8 );
	}
	
	//make sure that the map is initialized BEFORE getting data
	setUpMap();
	//get the data from the server and parse it on success.
	//this query only gets georgian data.
	$.ajax({
		url:"eggs",
		success:parseData,
		error:function(error){
			console.log(error);
		}
	});
});