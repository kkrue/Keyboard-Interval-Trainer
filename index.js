const express = require('express');
const https = require('https');
const fs = require('fs');
const app = express();
const PORT = 5000;

app.use(express.static('.'));

https.createServer({
	key: fs.readFileSync('localhost.key'),
	cert: fs.readFileSync('localhost.crt')
  }, app).listen(5000, () => {
	console.log(`Listening on port ${PORT}...`);
})
