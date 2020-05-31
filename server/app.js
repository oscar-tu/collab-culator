var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const port = 1234;
const webSocketServer = require('websocket').server;
const http = require('http');
const server = http.createServer();

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use(express.static(path.join(__dirname, 'build')));

// Start server and listen on port
server.listen(port);

// Initialize webSocket server
const wsServer = new webSocketServer({
	httpServer: server
});

// Unique userId generation for debugging
const getUniqueID = () => {
	const id = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	return id() + id() + '-' + id();
}


// Active clients/clients
const clients = {};
const users = {};

// Messenger function to broadcast to all connected clients
const sendMessageToAllClients = (json) => {
	Object.keys(clients).map((user) => {
		clients[user].sendUTF(json);
	});
}

// Server startup handler
wsServer.on('request', function(req) {
	let userID = getUniqueID();
	// console.log('received new connection from ' + req.origin);
	const connection = req.accept(null, req.origin);
	clients[userID] = connection;
	// console.log('connected: ' + userID + '. Total connected: ' + Object.getOwnPropertyNames(clients));

	// Handle message receipt with proper formatting
	connection.on('message', function(message) {
		if (message.type === 'utf8') {
			const data = JSON.parse(message.utf8Data);
			if (data.type === 'clickEvent') {
				let stateMessage = data.data
				sendMessageToAllClients(JSON.stringify(stateMessage));
			} else if (data.type === 'userEvent') {
				console.log('received new user from client');
				users[userID] = true;
				sendMessageToAllClients(JSON.stringify({data: Object.keys(users).length, type: 'userEvent'}));
			}
		}
	});

	// If a connection closes we still send a message
	// so we can maintain connected user count on client side
	connection.on('close', function(connection) {
		delete clients[userID];
		delete users[userID];
		sendMessageToAllClients(JSON.stringify({data: Object.keys(users).length, type: 'userEvent'}));
	});

});

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
