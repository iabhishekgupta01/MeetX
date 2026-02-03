const { Server } = require("socket.io");



let connections = {}; //storing socket.id of each user
let messages = {};
let timeOnline = {};



module.exports = (server) => {
   const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});



    io.on("connection", (socket) => {
        console.log("User connected with socket.id= ", socket.id);
        
        

        socket.on("join-call", (room) => {

            if (connections[room] == undefined) {
                connections[room] = [];
            }
            connections[room].push(socket.id);

            timeOnline[socket.id] = new Date();

            connections[room].forEach((userId) => { //  here userId is SocketIds already stored
                io.to(userId).emit("user-joined", socket.id,connections[room]);
            });


            if (messages[room] != undefined) {

                messages[room].forEach((msg) => {
                    io.to(socket.id).emit("chat-message", msg['data'], msg['sender'], msg['socket-id-sender']);
                });
            }

        });

        socket.on("signal", (toId, msg) => {
            io.to(toId).emit("signal", socket.id, msg);
        });

        socket.on("chat-message", (data, sender) => {

            const [matchingRoom, found]=Object.entries(connections)
            .reduce(([room , isFound],[roomKey,roomValue])=>{
                if(!isFound && roomValue.includes(socket.id)){
                    return [roomKey,true];
                }
                return [room, isFound];

            },['',false]);

            if(found==true){

                if(messages[matchingRoom]==undefined){
                    messages[matchingRoom]=[];
                }
                messages[matchingRoom].push({"sender":sender, "data":data, "socket-id-sender":socket.id});

                console.log("message :",data,sender,socket.id);

                connections[matchingRoom].forEach((userId)=>{
                    io.to(userId).emit("chat-message",data,sender,socket.id);
                });
            }

        });

        socket.on("disconnect", () => {

            let diffTime=Math.abs(new Date()-timeOnline[socket.id]);

            let key;

            for( const [room,users] of JSON.parse(JSON.stringify(Object.entries(connections)))){

                for(let a=0; a<users.length;a++){

                    if(users[a]==socket.id){
                        key=room;

                        for(let b=0;b<connections[key].length;b++){
                            io.to(connections[key][b]).emit("user-left",socket.id);
                        }

                        let index=connections[key].indexOf(socket.id);
                        connections[key].splice(index,1);

                        if(connections[key].length==0){
                            delete connections[key];
                        }

                    }
                }


            }



        });
    })




    return io;
}

