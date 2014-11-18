var app = require('http').createServer(handler), 
io = require('socket.io').listen(app), 
fs = require('fs'),
unirest = require('unirest'),
ArduinoFirmata = require('arduino-firmata'),
arduino = new ArduinoFirmata();    

arduino.connect('/dev/ttyACM0');


function getTemp(){
    var ref_voltage = 1.08 ; //actually measured AREF Voltage
    var volt2temp  = 100 ;
    var average_count  = 5000;
    //var prop_constant = ref_voltage * volt2temp / 1024 / average_count;
    var prop_constant = 5 * 100 / 1024 / average_count; 
    var sensorValue = 0;

    // read the sensor multiple times and sum up the readings
    for (i = 0; i < average_count; i++){
      sensorValue += arduino.analogRead(0);   
    }

    var temp = sensorValue * prop_constant;

    return temp;

  }

  app.listen(8080);
  console.log("Listening on http://raspberrypi:8080...");

// directs page requests to html files
function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }

      res.writeHead(200);
      res.end(data);
    });
}

// this handles socket.io comm from html files

io.sockets.on('connection', function (socket) {
  var temps = setInterval(function () {
    temp = getTemp();
    socket.volatile.emit('temp', Math.round(temp));
    
  }, 500);

  socket.on('disconnect', function () {
    clearInterval(temps);
  });
});

var temps = setInterval(function () {
//var d = new Date();
//fs.appendFile('temp.tsv', d.toISOString() + ' ' + Math.round(getTemp()) + '\n', function (err) {

//});
}, 100);

var dweet = setInterval(function () {

unirest.post('https://dweet.io:443/dweet/for/bett-a3ac11b9-d0d6-498c-86f0-e0caefc9a514')
  .headers({ 'Accept': 'application/json' })
  .send({ "temp": Math.round(getTemp()) })
  .end(function (response) {
    // console.log(response.body);
});

}, 1000 * 10 );
