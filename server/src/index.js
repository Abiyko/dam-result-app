const http = require('http');
const server = http.createServer((req,res) =>{
    if(req.url === '/'&& req.method === 'GET'){
        res.writeHead(200, {"Content-Type": "text/html"});
        res.write('Hello World!');
        res.end()
    }else{
        res.writeHead(404,{"Content-Type": "text/html"});
        res.write('404 Not Found');
        res.end();
    }
});

server.listen(3000, ()=>{
    console.log('Server saarted on port 3000')
});