var express = require('express');
var http = require('http');
var https = require('https');

var app = express();
app.use(express.static('public'));

app.get('/eggs', function(req, res){
//	http.request({
//		host:"localhost",
//		port:3010,
//		path:"/login.html",
//		method:'GET'
//	}, function(res, err){
//		console.log(res);
//		console.log(err);
//	});
	var body = '';
	var req = https.request({
		hostname:"api.xively.com",
		path:"/v2/feeds.json?amp;mapped=true&tag=device:type=airqualityegg&per_page=50&lat=41.696116260522786&lon=44.812652967284656&distance=200",
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

http.createServer(app).listen(3020);