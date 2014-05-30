var express = require('express');
var http = require('http');
var https = require('https');

var app = express();
app.use(express.static('public'));

var dirty = false;
var eggData = '';

function setDirty(){
	dirty = true;
}
app.get('/eggs', function(req, res){
	if(!eggData || dirty){
		var tempEggData = '';

		var req = https.request({
			hostname:"api.xively.com",
			path:'/v2/feeds.json?amp;mapped=true&tag=device:type=airqualityegg&per_page=50&lat=41.696116260522786&lon=44.812652967284656&distance=600',
			method:'GET',
			headers:{
				'Content-Type':'application/json',
				'X-ApiKey':'yy7Q62aWBIo9rwHhO4DAG0L5SLD2cms8bUnlJ07xnOpr0jdl'
			}
		}, function(res2){
			if(res2.statusCode !== 200){
				res.send(eggData);
			}else{
				res2.on('data', function(chunk){
					tempEggData+=chunk.toString();
				});
				res2.on('end', function(){
					if(tempEggData){
						eggData = tempEggData;
					}
					console.log(eggData.substring(0, 100));
					res.send(eggData);
				});
			}
		});
		req.end();
		
		dirty = false;
		//cache expires half-hourly
		setTimeout(setDirty, 1000*30);
	}else{
		res.send(eggData);
	}
})

app.get('/eggPage/:page', function(req, res){
	var tempEggData='';
	var req = https.request({
		hostname:"api.xively.com",
		path:'/v2/feeds.json?amp;mapped=true&tag=device:type=airqualityegg&per_page=300&page='+req.params.page,
		method:'GET',
		headers:{
			'Content-Type':'application/json',
			'X-ApiKey':'yy7Q62aWBIo9rwHhO4DAG0L5SLD2cms8bUnlJ07xnOpr0jdl'
		}
	}, function(res2){
		res2.on('data', function(chunk){
			tempEggData+=chunk.toString();
		});
		res2.on('end', function(){
			if(tempEggData){
				eggData = tempEggData;
			}
			res.send(tempEggData);
		});
	});
	req.end();
});

console.log('Listening on port 3020');

http.createServer(app).listen(3020);