const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const config = require('./config.json');
const google = require ('googleapis');
const client = new Discord.Client();

const youtube = new google.youtube_v3.Youtube({
        version: 'v3',
        auth: config.GOOGLE_KEY,
});

const prefixo = config.PREFIX;

const servidores = {
    'server': {
        connection: null,
        dispatcher: null,
        fila:[],
        estouTocando: false

    }
};

client.on('ready', () =>  {
    console.log('Estou online')
});

client.on('message', async(msg) => {
    //filtro
    if(!msg.guild) return;

    if(!msg.content.startsWith(prefixo)) return;

    if(!msg.member.voice.channel){
        msg.channel.send('Voce precisa estar num canal de voz');
        return;
    };

    //comandos
    if(msg.content === prefixo + 'join'){ //!join
        try{
            servidores.server.connection = await msg.member.voice.channel.join();
        }
        catch(err){
            console.log('Error ao entrar no canal de voz');
            console.log(err);
        }
    };

    if(msg.content === prefixo + 'quit'){ //!leave
        msg.member.voice.channel.leave();
        servidores.server.connection = null;
        servidores.server.dispatcher = null;
    };

    if (msg.content.startsWith(prefixo + 'play','p')) { //!play <link>
        let oQueTocar = msg.content.slice(6);

        if (oQueTocar.length === 0){
            msg.channel.send('Eu preciso de jola');
            return;
        };

    if(servidores.server.connection === null){
            try{
            servidores.server.connection = await msg.member.voice.channel.join();
        }
            catch(err){
            console.log('Error ao entrar no canal de voz');
            console.log(err);
        }

    }

    if(ytdl.validateURL(oQueTocar)){
        servidores.server.fila.push(oQueTocar); 
        console.log('Adicionado ' + oQueTocar);
        tocaMusicas();
        }
        else{
             youtube.search.list({
                q: oQueTocar,
                part: 'snippet',
                fields: 'items(id(videoId), snippet(title))',
                type: 'video'
            },
        function(err, resultado) {
            if(err){
                console.log(err)
            }
            if(resultado){
              const id = resultado.data.items[0].id.videoId;
              oQueTocar = 'https://www.youtube.com/watch?v=' + id;
              servidores.server.fila.push(oQueTocar);
              console.log('Adicionado ' + oQueTocar);
              tocaMusicas();
            }
         
        });
     }
    }
    
    if(msg.content === prefixo + 'pause'){ //!pause
        servidores.server.dispatcher.pause(); 
    }
    if(msg.content === prefixo + 'resume'){ //!resume
        servidores.server.dispatcher.resume(); 
    }
    if(msg.content === prefixo + 'skip'){
        servidores.server.dispatcher.end(); //esse comando termina a musica q esta passando
        tocaMusicas(); //Minha função para tocar as musicas
    }
});
const tocaMusicas = () => {
   if(servidores.server.estouTocando === false){

    const tocando = servidores.server.fila[0];

    servidores.server.estouTocando = true ;
    servidores.server.dispatcher = servidores.server.connection.play(ytdl(tocando, config.YTDL));

         servidores.server.dispatcher.on('finish', () => {
            servidores.server.fila.shift();
            servidores.server.estouTocando = false ;
            if(servidores.server.fila.length > 0 ){
                tocaMusicas();
          }
          else{
              servidores.server.dispatcher = null;
          }
        });
    }
   }

client.login(config.TOKEN_DISCORD);
