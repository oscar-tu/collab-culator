const port = 1234;
const webSocketServer = require('websocket').server;
const http = require('http');
const express = require("express");
const server = http.createServer();


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