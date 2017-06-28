var http = require('http'),
    fs = require('fs'),
    express = require('express'),
    request = require('request'),
    app = express(),
    port = 3000,
    server = http.createServer(app).listen(port),
    io = require('socket.io')(server)

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res, next) {
    res.sendFile(__dirname + '/index.html');
});

function weatherCond() {

    var lat = ((Math.random() * 181) - 90).toFixed(3)
    var lng = ((Math.random() * 361) - 180).toFixed(3)
    var weatherData = null
    var locData = null
    var weatherkey = 'YOUR OPENWEATHER KEY'
    var locationkey = 'YOUR GEONAMES KEY OR USERNAME'
    var wuri = 'http://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lng + '&' + weatherkey
    var luri = 'http://api.geonames.org/findNearbyPlaceNameJSON?lat=' + lat + '&lng=' + lng + '&username=' + locationkey

    request(luri, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            locData = JSON.parse(body)
            if (typeof locData['geonames'] !== 'undefined' && locData['geonames'].length > 0) {
                var datalist = locData['geonames'][0]
                var town = datalist['name']
                var country = datalist['countryName']
                request(wuri, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        weatherData = JSON.parse(body)
                        var w = weatherData['weather'][0]['main']
                        switch (w) {
                        case ('Rain'):
                            wr = 'raining';
                            break;
                        case ('Sun'):
                            wr = 'sunny';
                            break
                        case ('Clouds'):
                            wr = 'cloudy';
                            break
                        case ('Drizzle'):
                            wr = 'drizzling';
                            break
                        case ('Snow'):
                            wr = 'snowing';
                            break
                        case ('Thunderstorm'):
                            wr = 'stormy';
                            break
                        default:
                            wr = 'clear'
                        }
                        var temp = weatherData['main']['temp'] - 273.15
                        var tempstring = Math.floor(temp).toString()
                        io.emit('weather', {
                            geotag: {
                                lat: lat,
                                lng: lng
                            },
                            listeners: io.engine.clientsCount,
                            weather: weatherData,
                            location: locData['geonames'][0],
                            string: 'The weather at latitude ' + lat + ' longitude ' + lng + ', ' + town + ' in ' + country + ' is currently ' + wr + '. The temperature is ' + tempstring + ' degrees celcius.'
                        })
                    } else {
                        weatherCond()
                    }
                })
            } else {
                weatherCond()
            }
        }
    })
}

weatherCond()
setInterval(weatherCond, 20000)

// Emit welcome message on connection
io.on('connection', function (socket) {
    socket.emit('listeners', {
        listeners: io.engine.clientsCount
    });
})

io.on('disconnect', function () {
    socket.emit('listeners', {
        listeners: io.engine.clientsCount
    });
});

server.listen(port);