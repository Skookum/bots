var net = require('net');

var HOST = '127.0.0.1';
var PORT = 1337;

var socket = new net.Socket();

socket.connect(PORT, HOST, function() {
  socket.write('ready');
});

socket.on('data', function(data) {
  console.log('RECEIVED DATA: ' + data.slice(0,-1));
  socket.destroy();
});

socket.on('close', function() {
  console.log('Connection closed');
});