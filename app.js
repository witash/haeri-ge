var express = require('express');
var http = require('http');
var https = require('https');

var app = express();
var hitCount=0;
app.use(express.static('public'));

app.get('/eggs', function(req, res){
	hitCount++;
	console.log(hitCount);
	
	var body = '';
	var req = https.request({
		hostname:"api.xively.com",
		path:"/v2/feeds.json?amp;mapped=true&tag=device:type=airqualityegg&per_page=150&lat=41.696116260522786&lon=44.812652967284656&distance=600",
		method:'GET',
		auth: 'witash:Fftw899h'
	}, function(res2){
		res2.on('data', function(chunk){
			body+=chunk.toString();
		});
		res2.on('end', function(){
			res.send(body);
		});
	});//("https://api.xively.com/v2/feeds.json?amp;mapped=true&tag=device:type=airqualityegg&per_page=5")
	req.end();
})

console.log('Listening on port 3020');

http.createServer(app).listen(3020);