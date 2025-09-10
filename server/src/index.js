const http = require("http");
const url = require("url");

const server = http.createServer((req, res) => {
  const url = req.url;
  const method = req.method;

  const setResponse = (statusCode, payload) => {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.write(JSON.stringify(payload));
    res.end();
  };

  if (url === "/" && method === "GET") {
    setResponse(200, { msg: "GET request" });
  } else if (url === "/" && method === "POST") {
    setResponse(200, { msg: "POST requsest" });
  } else if (url.match(/^\/[0-9]+$/) && method === "PUT") {
    const id = url.slice(1);
    setResponse(200, { id: id, msg: "PUT request" });
  } else if (url.match(/^\/[0-9]+$/) && method === "DELETE") {
    const id = url.slice(1);
    setResponse(200, { id: id, msg: "DELETE request" });
  } else {
    setResponse(404, { msg: "Not Found" });
  }
});

server.listen(3000, () => {
  console.log("Server saarted on port 3000");
});
