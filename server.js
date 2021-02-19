var express = require('express');
var app = express();

//setting middleware
app.use(express.static('./public')); //Serves resources from public folder

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/game', function(req, res) {
  res.sendFile(__dirname + '/public/game.html');
});

app.listen(8000);