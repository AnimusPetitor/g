//require('dotenv').config()
const scrapper = require('./update.js');
const sth = require('./constants.js');
var express = require("express");
var app = express();
process.argv.forEach(function (val, index, array) {
  if(index>1){

    if(val.startsWith('-')){
      if(val.includes('f'))GAZETA.force = true;
      if(val.includes('i'))GAZETA.index = true;
      if(val.includes('e'))GAZETA.start = true;
      if(val.includes('s'))GAZETA.si = true;
      if(val.includes('r'))GAZETA.re = true;
      consola.info(GAZETA);
    }
    else if(val.startsWith('.')){
    	if(val.slice(1).length==0) GAZETA.start = false;
    	else ignores.push(val.slice(1));
    }
    else fetchsource.push(val);
  }
});

const sources = new Map();
var sss = []
var sourcesret = '';
db.ref('/source/').once('value').then(function(snapshot) {     
  var tms = snapshot.val();
  var i = 1;   
  for(var tmt in tms){
    sourcesret +=i+ '<a href="'+tms[tmt].link+'">' + tms[tmt].name + '</a>\n'; 
    i++;
    sss.push(tmt);
    sources.set(tmt,tms[tmt]); 
  }   
});

var sourcArr ;
const bot_users = new Map();
const TeleBot = require('telebot');
global.bot = new TeleBot('475582028:AAFljGnXcFBuyDCQop-mf8qqDVA9JtWA0NY');
//409679078:AAGHzBfXrW8AEFnVe03MWXCPbyM7Q_1RhkU


function scrapAndSend(link,bot,msg,put){
  var v = put == 2; 
  console.log(link);
 scrapArticle(link, function reply(a){
    try{
       if(!v && bot){
        console.log(v);

        var article = '<b>'+a.title+'</b>\n'+ (a.synop?'<pre>'+a.synop+'</pre>':  (a.body && a.body.length > 0  ? a.body[0]:''));
        article += '\n<a href="'+ a.link +'">Open in Browser</a>'+(put==0?'<i>Successfully scrapped!</i>':'<i>Successfully updated!</i>') ; 
         bot.sendMessage(msg.chat.id,article,{parseMode:'HTML'});   
       }else{
        console.log('here');
        bot_users.set(msg.from.id+'a', a); 
        for(var x in a){
          if(x!=='body' && x!=='link')bot.sendMessage(msg.chat.id,x+':'+a[x],{parseMode:'HTML'});  
        }
        for(var l=0; l<a.body.length; l++){
          bot.sendMessage(msg.chat.id,'<pre>'+a.body[l].replace(/"/,'&quot')+'</pre>',{parseMode:'HTML'});  
        } 
       }

      scrapper.postArt(a,getCats(a.link));
   }catch(e){consola.info(e);}    
  },v);
}
bot.on('start', (msg) => {
    bot.sendMessage(msg.from.id,'Welcome!\nAvailable commands\n/sources - available news sources\n/s - list subseeds from category link\n/v - view\n/p - add article\n/a - add article',{parseMode:'HTML'}); 
    
});
bot.on('inlineQuery',(msg) => {
   
});
bot.on('text', (msg) => {

  bot.sendMessage(381956489,msg.from.id + ": "+msg.text,{parseMode:'HTML'});  
  var capital = msg.text.slice(0,1).toLowerCase() !== msg.text.slice(0,1);
  //msg.text = msg.text.toLowerCase();
    var seed = false;
    /*if(msg.text.startsWith('http')){
      console.log(msg.text.replace(/\.|\/|www\./g,''));
      var plinks = Object.values(sseeds.get(getFileName(msg.text.trim()).replace(/\.|\//g,'')));
      for(var m=0;m<plinks.length; m++){
        if(msg.text===plinks[m]){
          seed = true;
          msg.text = '/s ' + msg.text;
          break;
        }
      }
    }*/
    if(msg.text.startsWith('/gut ')){
        var hash = msg.text.slice(5).trim().replace(/\.|\//g,'').hashCode(); 
        postRelated(hash);
      //scrapArticle(' https://www.gutenberg.org/ebooks/search/?query='+msg.text.slice(5), function reply(a){
      //try{
        //console.log(a);
      //}catch(e){consola.info(e);}    
     //});
    }
    else if(msg.text.trim()==='/help'){
       bot.sendMessage(msg.chat.id,'/sources - available news sources\n/s - list subseeds from category link\n/v - view\n/p - add article\n/a - add article',{parseMode:'HTML'}); 
    }
    else if(msg.text.trim()==='/sources'){
      bot.sendMessage(msg.chat.id,sourcesret,{parseMode:'HTML'});
    }
    else if(msg.text.startsWith('/s ') || seed){
       var link = msg.text;
        if(!link.startsWith('http://') || link.replace(/ +/,' ').trim().length <= 6) {
           link = msg.text.slice(3);
           if(isNumeric(link)){
            link = bot_users.get(msg.from.id+'c')[parseInt(link)-1];
           }
        }
       sseed(link, function res(news){
            var seeds = '';
            var orders = [];
            for(var i=0; i<news.length; i++){
               orders.push(news[i].link); 
               seeds += i+1+'<a href="'+news[i].link+'">' + news[i].title + '</a>\n';  
            }
            bot.sendMessage(msg.chat.id,seeds,{parseMode:'HTML'}); 
            bot_users.set(msg.from.id, orders);          
       });
    }else if(msg.text.startsWith('/g ')){
          var a =  bot_users.get(msg.from.id+'a');
          bot.sendMessage(msg.chat.id,a[msg.text.slice(3)],{parseMode:'HTML'});     
       }else if(msg.text.startsWith('/a ') || msg.text.startsWith('http://') || msg.text.startsWith('/p') || msg.text.startsWith('/v ')){
        var link = msg.text;
        var s = msg.text.startsWith('/p');
        var v = msg.text.startsWith('/v');
        if(!link.startsWith('http://') || link.replace(/ +/,' ').trim().length <= 6) {
           link = msg.text.slice(3);
           if(isNumeric(link)){
            link = bot_users.get(msg.from.id)[parseInt(link)-1];
           }
        }
        if(s) scrapAndSend(link, bot, msg, 2);
        else getArticle(link, function reply(a){
          try{
             if(a){     
               bot_users.set(msg.from.id+'a', a);    
               console.log('exists'+v); 
              if(!v){
                var article = '<b>'+a.title+'</b>\n'+ (a.synop?'<pre>'+a.synop+'</pre>':  (a.body && a.body.length > 0  ? a.body[0]:''));
                article += '\n<a href="'+ a.link +'">Open in Browser</a>'; 
                 bot.sendMessage(msg.chat.id,article,{parseMode:'HTML'});   
               }else{
                for(var x in a){
                  if(x!=='body' && x!=='link')bot.sendMessage(msg.chat.id,x+':'+a[x],{parseMode:'HTML'});  
                }
                for(var l=0; l<a.body.length; l++){
                  bot.sendMessage(msg.chat.id,'<pre>'+a.body[l].replace(/"/,'&quot')+'</pre>',{parseMode:'HTML'});  
                } 
               }
             }else {
               console.log('doesnt exist');
               scrapAndSend(link, bot, msg, s ? 2: (v ? 1: 0));
             }
          }catch(e){consola.info(e);}    ;
        });
    }else {
    	if(msg.text.startsWith('/ban ')){
    		if(msg.text.length > 10) ban(msg.text.slice(5));		
    	}
    	else if(msg.text.startsWith('/gdel ')){
    	    del(msg.text.slice(6));		
    	}else if(msg.text.startsWith('/zup ')){
    	   updateZombie(msg.text.slice(5));
    	}
        else if(msg.text.startsWith('/gupdate')){
          console.log(msg.text.trim().length);	
          //update links
          if(msg.text.trim().length==8){
           updateLinks(true,[]);
          }else{
          	var sourcess = msg.text.slice(8).split(/ +/);
          	
          	updateLinks(true,sourcess,sourcess[sourcess.length-1].length==2);
          	console.log(msg.text.slice(9).split(/ +/) );
          }
        }
        else if(msg.text.startsWith('/c ')){

          if(!sourcArr){
            sourcArr = sss;
          }
          var add = sseeds.get( sourcArr[parseInt(msg.text.slice(3)) - 1]  );
          var ret = '';
          var c = 0;
          var ordersc = [];
          for(var cat in add){
            if(cat==='address' || cat.startsWith('_'))continue;
            else {
               c++;
               var vals = Object.values(add[cat]); 
               ret += '<b>'+cat+'</b>\n';  
               for(var i=0; i<vals.length; i++){
                  ret += c + i + vals[i];   
                  ordersc.push(vals[i]);
               }  
               ret += '\n';
            }
          }
          console.log(ret);
          bot_users.set(msg.from.id+'c', ordersc); 
          bot.sendMessage(msg.chat.id,ret,{parseMode:'HTML'});   
       }else if(msg.text.toLowerCase().startsWith('/f ')){
          searchDb(msg.text.slice(3),function result(list){
              //console.log(list);
              bot.sendMessage(msg.chat.id,list.toString()); 
          })


       } 
       else if(msg.text.toLowerCase().startsWith('q ')){
           var leng = 0;
           console.log(msg.text);
           var sym = msg.text.indexOf('▶');
           if(sym!==-1){
            msg.text = msg.text.slice(sym+ msg.text.slice(sym).indexOf('\n'));
            console.log('sss'+msg.text);
           }
           if(msg.text.indexOf('[')!==-1) msg.text = msg.text.slice(0, msg.text.indexOf('['))
           var hi = msg.text.indexOf('Hint: ');
           if(hi===-1) hi = msg.text.length;
           var lentil = msg.text.slice(hi+7).replace(' ','').trim();
           for(var s=0; s<lentil.length; s++){
             console.log(lentil.charAt(s));
             if(lentil.charCodeAt(s)!=32) leng++;
           }
           var lower = msg.text.toLowerCase() + 'sep oct world people point peak view new answer question capital special general  trivia  share region  population  city ';
           request.get('https://www.google.ca/search?q='+encodeURIComponent(msg.text.slice(2, hi)), function (error, respons, body) {
              if(error===null){ 
                const dom = new JSDOM(body);
                var words = [];
                //console.log(dom.window.document.body.innerHTML);
                var freq = new Map();
                var heads =  dom.window.document.body.getElementsByClassName('st');
                var c = 0;
                for(var i=0; i<heads.length; i++){
                  //var arr = heads[i].textContent.replace(/[\W]+/,' ').split(' ');

                  pos.getNouns(heads[i].textContent.replace(/[ ,.'\n]+/,' '), function result(arr){
                   // console.log(arr);
                    for(var l=0; l<arr.length; l++){
                      var word = arr[l].toLowerCase();
                      if(sws.includes(word) || word.length > 20) continue; 
                      if(Array.from(freq.keys()).includes(word)){
                        freq.set(word, freq.get(word)+1)
                      }else freq.set(word, 1);
                    } 

                    if(c==heads.length-1){
                      var keys = Array.from(freq.keys());
                      var big;
                      var others = '';
                      var total = 0;
                      var bigs = '';
                      for(var x=0; x<keys.length; x++){
                        if(!lower.includes(keys[x]))total += freq.get(keys[x]);
                      }
                      var median = Math.floor(total/keys.length);   

                      for(var x=0; x<keys.length; x++){
                        var freq1 = freq.get(keys[x]);
                       
                        if(!lower.includes(keys[x]) && (keys[x].length === leng || hi===msg.text.length)){
                          total += freq.get(keys[x]);
                          var exc = freq.get(big) < freq1;
                          if(big===undefined || exc){  
                            big = keys[x];
                            bigs = big;
                            //console.log(keys[x] + ': ' + freq.get(keys[x]));
                          } 
                          else if(freq.get(big) == freq1){
                            bigs += ' ' + keys[x]; 
                          }
                          if(!exc && capital){
                            others +=  ( freq1!==1 && freq1 >= median ? '<b>'+keys[x]+'='+freq1+'</b>': keys[x] ) + '  ';
                          }
                        
                        }
                      } 
                      bot.sendMessage(msg.chat.id,bigs);   
                
                      bot.sendMessage(msg.chat.id, others, {parseMode:'HTML'});
                      

                    }
                    c++;
                    //console.log(freq);
                  })
                }
               
              } 
              else {
                consola.error('error while getting contents of '+link,error);
                response();
              }
           }); 
       }
    }
});
bot.start()
var puss = require('wordpos');
var pos = new puss();
var sws = require('stopword').en;

var hbac = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> <html xmlns="http://www.w3.org/1999/xhtml" lang="en"> <!-- ---- Clean html template by http://WpFreeware.com ---- This is the main file (index.html). ---- You are allowed to change anything you like. Find out more Awesome Templates @ wpfreeware.com --> <head> <title></title> <meta http-equiv="Content-Type" content="text/html; charset=utf-8" /> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <!-- Font Awesome --> <link rel="stylesheet" href="css/font-awesome.min.css"> <link rel="stylesheet" href="font/font.css"> <link href="css/style.css" rel="stylesheet" media="screen"> <link href="css/responsive.css" rel="stylesheet" media="screen"><script async type="text/javascript" src="js/webpjs-0.0.2.min.js"></script></head> <body><div class="fix header_area"> <div class="fix wrap header"> <div class="logo floatleft"> <img src="images/logo.png"/> </div> <div class="manu floatright"> <img id src="images/play.png"/> <!--<ul id="nav-top"> <li><a href="index.html">Home</a></li> <li><a href="single.html">single</a></li> <li><a href="about.html">about</a></li> <li><a href="contact.html">contact</a></li> </ul>--> </div> </div> </div> <!--Clean template by WpFreeware.com--> <div class="fix content_area"> <div class="fix top_add_bar"> <div class="addbar_leaderborard"><img src="https://placehold.it/728x90"/></div> </div> <div class="manu_area"> <div class="mainmenu menu-wrap wrap"> <ul id="nav-bottom"> <li><a href="Headlines">Headlines</a></li> <li><a href="Entertainment">Entertainment</a></li><li><a href="Technology">Technology</a></li> <li><a href="Social">Society</a></li> <li><a href="Sport">Sport</a></li> <li><a href="Politics">Politics</a></li> <li><a href="Art and Culture">Art and Culture</a></li> <li><a href="Business">Business</a></li> <li><a href="World">World</a></li> <li><a href="Health">Health</a></li> <li><a href="Video">Video</a></li> <li><a href="Audio">Audio</a></li> </ul> </div> </div> <div class="fix wrap content_wrapper"> <div class="fix content"> <div class="fix main_content floatleft"> <div class="fix single_content_wrapper"> </div> <div class="pagination fix"> </div></div> <div class="fix sidebar floatright"> <div class="fix single_sidebar"> <h2>Search</h2> <form action="/search" method="get"><input name="q" class="search" type="text"  placeholder="Search ZGazeta"/></form></div> <div class="fix single_sidebar"> <div class="popular_post fix"> <h2>Popular</h2> </div> </div> <div class="fix single_sidebar"> <h2>Categories</h2> <a href="/c1">photography(5)</a> <a href="/c2">food(9)</a> <a href="/c3">Salads(4)</a> <a href="/c4">spicy(3)</a> <a href="/c5">Wine(5)</a> </div> </div> </div> </div> <div class="fix bottom_add_bar"> <div class="addbar_leaderborard"><img src="https://placehold.it/728x90"/></div> </div> </div> <!--Clean template by WpFreeware.com--> <div class="fix footer_area"> <div class="fix wrap footer"> <div class="fix copyright_text floatleft"></p> </div> <div class="fix social_area floatright"> <ul> <li><a href="" class="feed"></a></li> <li><a href="" class="facebook"></a></li> <li><a href="" class="twitter"></a></li> <li><a href="" class="drible"></a></li> <li><a href="" class="flickr"></a></li> <li><a href="" class="pin"></a></li> <li><a href="" class="tumblr"></a></li> </ul> </div> </div> </div> <script type="text/javascript" src="js/selectnav.min.js"></script> <script type="text/javascript"> selectnav("nav", { label: "-Navigation-", nested: true, indent: "-" }); </script> <script src="http://code.jquery.com/jquery.js"></script> <!-- This Template is designed by WpFreeware.com Team, You are allowed to change anything you like. Find out More Awesome template at http://www.WpFreeware.com. --> </body> </html>';
var hometemplate = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> <html xmlns="http://www.w3.org/1999/xhtml" lang="en"> <!-- ---- Clean html template by http://WpFreeware.com ---- This is the main file (index.html). ---- You are allowed to change anything you like. Find out more Awesome Templates @ wpfreeware.com --> <head> <title></title> <meta http-equiv="Content-Type" content="text/html; charset=utf-8" /> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <!-- Font Awesome --> <link rel="stylesheet" href="css/font-awesome.min.css"> <link rel="stylesheet" href="font/font.css"> <link href="css/style.css" rel="stylesheet" media="screen"> <link href="css/responsive.css" rel="stylesheet" media="screen"> <script async type="text/javascript" src="js/webpjs-0.0.2.min.js"></script> </head> <body> <div class="fix header_area"> <div class="fix wrap header"> <div class="logo floatleft"> <img src="images/logo.png" /> </div> <div class="floatright langc"><a href="am">Amharic</a>&nbsp;&nbsp;<a href="en">English</a></div> <div class="manu floatright"> <img id src="images/play.png" /> <!--<ul id="nav-top"> <li><a href="index.html">Home</a></li> <li><a href="single.html">single</a></li> <li><a href="about.html">about</a></li> <li><a href="contact.html">contact</a></li> </ul>--> </div> </div> </div> <!--Clean template by WpFreeware.com--> <div class="fix content_area"> <div class="fix top_add_bar"> <div class="addbar_leaderborard"><img src="https://placehold.it/728x90" /></div> </div> <div class="manu_area"> <div class="mainmenu menu-wrap wrap"> <ul id="nav-bottom"> <li><a href="Headlines">Headlines</a></li> <li><a href="Entertainment">Entertainment</a></li> <li><a href="Technology">Technology</a></li> <li><a href="Social">Society</a></li> <li><a href="Sport">Sport</a></li> <li><a href="Politics">Politics</a></li> <li><a href="Art and Culture">Art and Culture</a></li> <li><a href="Business">Business</a></li> <li><a href="World">World</a></li> <li><a href="Health">Health</a></li> <li><a href="Video">Video</a></li> <li><a href="Audio">Audio</a></li> </ul> </div> </div> <div class="fix wrap content_wrapper"> <div class="fix content"> <div class="fix main_content floatleft"> <div class="fix single_content_wrapper"> </div> <div class="pagination fix"> </div> </div> <div class="fix sidebar floatright"> <div class="fix single_sidebar"> <h2>Search</h2> <form action="/search" method="get"><input name="q" class="search" type="text" placeholder="Search ZGazeta" /></form> </div> <div class="fix single_sidebar"> <div class="popular_post fix"> <h2>Popular</h2> </div> </div> <div class="fix single_sidebar"> <h2>Categories</h2> <a href="/c1">photography(5)</a> <a href="/c2">food(9)</a> <a href="/c3">Salads(4)</a> <a href="/c4">spicy(3)</a> <a href="/c5">Wine(5)</a> </div> </div> </div> </div> <div class="fix bottom_add_bar"> <div class="addbar_leaderborard"><img src="https://placehold.it/728x90" /></div> </div> </div> <!--Clean template by WpFreeware.com--> <div class="fix footer_area"> <div class="fix wrap footer"> <div class="fix copyright_text floatleft"> </p> </div> <div class="fix social_area floatright"> /*<ul> <li><a href="" class="feed"></a></li> <li><a href="" class="facebook"></a></li> <li><a href="" class="twitter"></a></li> <li><a href="" class="drible"></a></li> <li><a href="" class="flickr"></a></li> <li><a href="" class="pin"></a></li> <li><a href="" class="tumblr"></a></li> </ul>*/ </div> </div> </div> <script type="text/javascript" src="js/selectnav.min.js"></script> <script type="text/javascript"> selectnav("nav", { label: "-Navigation-", nested: true, indent: "-" }); </script> </body> </html>';
var articletemplate = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> <html xmlns="http://www.w3.org/1999/xhtml" lang="en"> <!-- ---- Clean html template by http://WpFreeware.com ---- This is the main file (index.html). ---- You are allowed to change anything you like. Find out more Awesome Templates @ wpfreeware.com --> <head> <title>Welcome to my site</title> <meta http-equiv="Content-Type" content="text/html; charset=utf-8" /> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <!-- Font Awesome --> <link rel="stylesheet" href="css/font-awesome.min.css"> <link rel="stylesheet" href="font/font.css"> <link href="css/style.css" rel="stylesheet" media="screen"> <link href="css/responsive.css" rel="stylesheet" media="screen"> </head> <body> <div class="fix header_area"> <div class="fix wrap header"> <div class="logo floatleft"> <img src="images/logo.png"/> </div> <div class="manu floatright"> <img id src="images/play.png"/> <!--<ul id="nav-top"> <li><a href="index.html">Home</a></li> <li><a href="single.html">single</a></li> <li><a href="about.html">about</a></li> <li><a href="contact.html">contact</a></li> </ul>--> </div> </div> </div> <div class="fix content_area"> <div class="fix top_add_bar"> <div style="width:700px;margin:0 auto;"><img src="https://placehold.it/700x90"/></div> </div> <div class="manu_area"> <div class="mainmenu wrap"> <ul id="nav-bottom"> <li><a href="Headlines">Headlines</a></li> <li><a href="Entertainment">Entertainment</a></li> <li><a href="Technology">Technology</a></li> <li><a href="Society">Society</a></li> <li><a href="Sport">Sport</a></li> <li><a href="Politics">Politics</a></li> <li><a href="Art and Culture">Art and Culture</a></li> <li><a href="Business">Business</a></li> <li><a href="World">World</a></li> <li><a href="Health">Health</a></li> <li><a href="Video">Video</a></li> <li><a href="Audio">Audio</a></li> </ul> </div> </div> <div class="fix wrap content_wrapper"> <div class="fix content"> <div class="fix main_content floatleft"> <div class="single_page_content fix"> <div class="related_post fix"> <h2>Related Post</h2> <div class="fix related_post_container"> <div class="fix single_related_post floatleft"> <img src="images/related_feature_img.png"/> <h2>Dapibus Elit Amet Parturient</h2> <p>28 Sep, 2012 | 14 Comments</p> </div> <div class="fix single_related_post floatleft"> <img src="images/related_feature_img.png"/> <h2>Dapibus Elit Amet Parturient</h2> <p>28 Sep, 2012 | 14 Comments</p> </div> <div class="fix single_related_post floatleft"> <img src="images/related_feature_img.png"/> <h2>Dapibus Elit Amet Parturient</h2> <p>28 Sep, 2012 | 14 Comments</p> </div> </div> </div> </div> </div> <div class="fix sidebar floatright"> <div class="fix single_sidebar"><div class="fix single_sidebar"> <h2>Search</h2><form action="/search" method="get"><input name="q" class="search" type="text"  placeholder="Search ZGazeta"/></form></div><div class="popular_post fix"> <h2>Popular</h2> <div class="fix single_popular"> <img src="images/popular.png" class="floatleft"/> <h2>Vestibum Malesuada Etiam Magna</h2> <p>12 Nov, 2012</p> </div> <div class="fix single_popular"> <img src="images/popular.png" class="floatleft"/> <h2>Vestibum Malesuada Etiam Magna</h2> <p>12 Nov, 2012</p> </div> <div class="fix single_popular"> <img src="images/popular.png" class="floatleft"/> <h2>Vestibum Malesuada Etiam Magna</h2> <p>12 Nov, 2012</p> </div> </div> </div><div class="fix single_sidebar"> <h2>Categories</h2> <a href="">photography(5)</a> <a href="">food(9)</a> <a href="">Salads(4)</a> <a href="">spicy(3)</a> <a href="">Wine(5)</a> </div> </div> </div> <div class="fix bottom_add_bar"> <div style="width:700px;margin:0 auto;"><img src="http://placehold.it/700x90"/></div> </div> </div> </div> <div class="fix footer_area"> <div class="fix wrap footer"> <div class="fix copyright_text floatleft"> <p>Designed By <a href="http://www.wpfreeware.com" rel="nofollow">WpFreeware</a></p> </div> <div class="fix social_area floatright"> <ul> <li><a href="" class="feed"></a></li> <li><a href="" class="facebook"></a></li> <li><a href="" class="twitter"></a></li> <li><a href="" class="drible"></a></li> <li><a href="" class="flickr"></a></li> <li><a href="" class="pin"></a></li> <li><a href="" class="tumblr"></a></li> </ul> </div> </div> </div> <script type="text/javascript" src="js/selectnav.min.js"></script> <script type="text/javascript"> selectnav("nav", { label: "-Navigation-", nested: true, indent: "-" }); </script> <script src="http://code.jquery.com/jquery.js"></script> <!-- This Template is designed by WpFreeware.com Team, You are allowed to change anything you like. Find out More Awesome template at http://www.WpFreeware.com. --> </body> </html>';
var fs = require('fs');
var sw = require('stopword');
var searchoptions = {
    batchSize: 1000,
    fieldedSearch: true,
    fieldOptions: {},
    appendOnly: true,
    preserveCase: false,
    storeable: true,
    searchable: true,
    indexPath: 'news',
    logLevel: 'error',
    nGramLength: 1,
    nGramSeparator: ' ',
    separator: /[' ፥«»፣።.,|(\n)]+/,
    stopwords:sw.en,
};



//firebaseCache.put('all',[]);
app.use(express.static(__dirname + "/public"));
const { JSDOM } = require("jsdom");
fs.stat('news', function(err, stat) {
    if(err === null) {
       GAZETA.indexed = true;
    } else if(err.code == 'ENOENT') {
      
    } 
});
var Searchindex ;

var SearchIndex = require('search-index');
SearchIndex(searchoptions, function(err, inde) {
    Searchindex = inde; 
    //console.log(inde.getOptions());
    //ll.tellMeAboutMySearchIndex(function (err, info) {
  //console.log(info)
//})
});

String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};


const Readable = require('stream').PassThrough;
global.store = new Readable( {objectMode: true} );

//____________----------------------_____________________-------------------------______________________---------------------________-

function getFromIndex(se){
   var offset = se.page*12;
   console.log(se.categ+'_'+(se.lang=='both'?'am':se.lang));
   console.log(se.categ+'_'+se.lang);
   console.log(firebaseCache.get("catIndex").get(se.categ+'_'+'am'));
   var l = firebaseCache.get("catIndex").get(se.categ+'_'+(se.lang=='both'?'am':se.lang));
   console.log(l.length);
   console.log(l.slice(24, 48));
   console.log(se.page);
   if(se.lang==='both'){
      var l1 =  firebaseCache.get("catIndex").get(se.categ+'_en');
      var am =  offset+6 <= l.length ? l.slice(offset, offset+6) : l.slice(offset);
      var en = offset+12-am.length <= l1.length ? l1.slice(offset, offset+12-am.length) : l1.slice(offset);
      Array.prototype.push.apply(en, am);
      en.sort(compare)
      return en;
   }
  return offset+12 <= l.length ? l.slice(offset, offset+12) : l.slice(offset);
}


function getByCategory(op){
  const dom = new JSDOM(hometemplate).window.document;
  var viewWrapper = dom.body.getElementsByClassName('single_content_wrapper')[0];  
  //db.ref('/ethiopia/'+lang+'/'+(categ===undefined?'News':categ)).orderByChild('timeStamp').limitToFirst(offset==undefined || offset===0? 12: offset).once('value').then(function(snapshot){
    try{   
        var n = getFromIndex({lang:op.lang, categ:op.categ, page:op.page});
        var size = n.length;

      for(var x = 0; x < n.length; x++){ 
         db.ref('/ethiopia/newsL/'+n[x].o.hash).once('value').then(function(snap){
              size--;
              var article = snap.val();
             var itemContainer = dom.createElement("div");
              itemContainer.className = 'fix single_content floatleft';
              if(article.cover_image){
              var cover = dom.createElement("img");  
              cover.src = article.cover_image;
              cover.alt = '';
              var ac = dom.createElement("a");
              ac.href = snap.key;//ref.path.pieces_[2]; 
              ac.appendChild(cover);
              itemContainer.appendChild(ac);          
              }else if(article.cover_audio){
              var cover = dom.createElement("audio");  
              var source = dom.createElement("source");
              source.src =  article.cover_audio;
              cover.appendChild(source);
              cover.setAttribute('controls', ''); 
              cover.alt = article.title;    
              var ac = dom.createElement("a");

              itemContainer.appendChild(cover);
              }else{
              var synop = dom.createElement("p");
              synop.textContent = article.synop;
              itemContainer.appendChild(synop);                       
              }
              var textContainer = dom.createElement("div");
              textContainer.className = 'fix single_content_info';
              var anc = dom.createElement("a");
              var title = dom.createElement('H2');
              title.textContent = article.title;
              anc.appendChild(title);
              anc.href =  snap.key;
              itemContainer.appendChild(anc);

              var author = dom.createElement("p");
              author.className = "author";
              author.textContainer = article.author;
              itemContainer.appendChild(author);
              var meta = dom.createElement("div");
              meta.className = 'fix post-meta';

              var dateAndElapsed = dom.createElement('P');
              dateAndElapsed.textContent = article.date  + '  |  ' + article.read +' reads';
              meta.appendChild(dateAndElapsed);
              itemContainer.appendChild(meta);
              viewWrapper.appendChild(itemContainer);
            // }
             if(size===0){
             var pages = dom.getElementsByClassName('pagination')[0];
             pages.innerHTML = '';
             for(var p = 1; p <= op.psize; p++){
                  console.log(p);
                  var anchor = dom.createElement("a");
                  anchor.href = '?page='+p;
                  anchor.textContent = p;
                  pages.appendChild(anchor);                                                    
              } 
            op.resp.status(200).send(dom.documentElement.innerHTML);
           } 
        }); 
      }
    }catch(e){
      consola.error('WTF',e)
      op.resp.status(404).send('<h1>WEBSITE UNDER MAINTENANCE<h1>');
    }
}


/*function searchDb(inp,c,e,x,h){
  try{
  var  qu = sw.removeStopwords(inp.trim().toLowerCase().split(/ +/));
  console.log(qu);
  if(qu.length==0){c([]); return;}
  var q =  {
    query: [{AND: {'title': qu},boost:10}, {AND:{'body':qu}}]
  }
  //consola.info(q);
  var list  = [] 
  Searchindex.search(q) 
    .on('data', function(doc) {
     if(doc.document.hash){

      //bot.sendMessage(381956489,doc.document.link);
      //bot.sendMessage(392957340, doc.document.link);
      list.push(x?doc.document: doc.document.hash);
    }
  }).on('finish',function(){
    c(list);
  }).on('err', function(e){
    console.log(e);
    e(e);
  })
 }catch(e){console.log(e);}
}*/
function searchDb(inp,c,e){
  try{
  var  qu = inp.toLowerCase().split(/ +/);

  for(var i=0; i < qu.length; i++){
     if(searchoptions.stopwords.includes(qu[i])){
      qu.splice(i,1);
     }
  }
  if(qu.length===0) c(null);
  var q =  {
    query: [{AND: {'title': qu}}, {AND:{'body':qu}}]
  }
  consola.info(q);
  var list  = [] 
  Searchindex.search(q) 
    .on('data', function(doc) {
     if(doc.document.hash){
      //bot.sendMessage(381956489,doc.document.link);
      if(!list.includes(doc.document.hash))list.push(doc.document.hash);
    }
  }).on('finish',function(){
    c(list);
  }).on('err', function(e){
    console.log(e);
    e(e);
  })
 }catch(e){console.log(e);}
}
app.get('/search', (req, res)=>{
   searchDb(req.query.q, function result(list){
      res.send(list);
   });
});

app.get('/related', (req, res)=>{
   postRelated(req.query.q, function result(list){
      res.send(list);
   });
});


//app.use('/', (request, response, next) => { 
app.get('/', (request, response) => { 
 if(!firebaseCache.get("catIndex"))response.send('not indexed yet');
 try{   
  
  getByCategory({lang:'both', resp:response,categ:'Headlines', psize:Math.floor(request.query.size/12), page:request.query.page===undefined ? 0: request.query.page});
 }catch(e){console.log(e);response.send('indexing');}
})
app.get('/en', (request, response) => { 
 if(!firebaseCache.get("catIndex"))response.send('not indexed yet');
 try{   
  getByCategory({lang:'en', resp:response,categ:'Headlines', psize:Math.floor(request.query.size/12), page:request.query.page===undefined ? 0: request.query.page});
 }catch(e){console.log(e);response.send('indexing');}
})
app.get('/am', (request, response) => { 
 if(!firebaseCache.get("catIndex"))response.send('not indexed yet');
 try{   
  getByCategory({lang:'am', resp:response,categ:'Headlines', psize:Math.floor(request.query.size/12), page:request.query.page===undefined ? 0: request.query.page});
 }catch(e){console.log(e);response.send('indexing');}
})

function isNumeric(value){
  return !isNaN(value - parseFloat(value));
}
//var sources;


function getArticle(link, response){
  var source = getFileName(link.trim()).replace(/\.|\//g,'');
  if(source!=='waltainfocom'){
    link = link.replace('http://www.','http://');
  }
  if(!/^[\000-\177]*$/.test(link))
          link = encodeURI(link);

  var hash = link.replace(/\.|\//g,'').hashCode()
  db.ref('/ethiopia/newsL/'+hash).once('value').then(function(sh){
       //consola.info(sh);
       response(sh.val());          
  });  
}

var format = require('json-beautify');
app.get('/article',(req, response)=>{
    try{ 
       var link = req.query.q;
       getArticle(link, function callback(sh){
          response.send(format(sh,null, 2, 100));
       });
       
    }catch(e){
  consola.info(e);
  response.status(404).send("Error Occured");} 
});


function sseed(link,callback){
   var source = getFileName(link).replace(/\.|\//g,'');  
      scrapper.newSubseeds({link:link, address:sseeds.get(source).address, force:true},function (news){
        callback(news);
   }); 
}
app.get('/sseeds',(req, response)=>{
   try{ 
       var link = req.query.q;
       sseed(link, function res(news){
             response.send(news);            
       });
   }catch(e){
     consola.info(e);
     response.status(404).send("Error Occured");
   } 
});
function scrapArticle(link, response,webp){
   var source = getFileName(link).replace(/\.|\//g,'');  
   scrapper.getNewArticle({link:link,covet_webp:webp},function (news){
      response(news);
   }); 
}

app.get('/scrap',(req, response)=>{
   try{ 
       var link = req.query.q;
       scrapArticle(link, function result(news){
          response.send( news );
       });
   }catch(e){
     consola.info(e);
     response.status(404).send("Error Occured");
   } 
});

app.get('/dtot',(req, response)=>{
    try{ 
     response.send(new Date(dtot(req.query.q)));
    }catch(e){
  consola.info(e);
  response.status(404).send("Error Occured");}
   
});

app.get('/:hash',(req, response)=>{
    console.log(req.params.hash);    
    if(isNumeric(req.params.hash))
    db.ref('/ethiopia/newsL/'+req.params.hash).once('value').then(function(sh){
        try{

        var adom = new JSDOM(articletemplate).window.document;
        var articleWrapper = adom.body.getElementsByClassName('single_page_content')[0];
        var related = adom.body.getElementsByClassName('related_post')[0];
        var art = sh.val();
        var title = adom.createElement("h1");
        title.innerHTML = art.title + '<h4>' +art.author+'</h4';
        console.log(art);
        adom.getElementsByTagName('title')[0].textContent = art.title + ' - ' + art.source;
        articleWrapper.insertBefore(title, related);
        var meta = adom.createElement("div");
        meta.className = "single_page_content fix";
        //timestamp if(no date)
        meta.textContent = art.date + "   |   " + "[categories]" + "   |   " + art.read + ' reads';
        articleWrapper.insertBefore(meta, related);
        var cover ;
        if(art.cover_image){
            cover = adom.createElement("img");
            cover.className = 'single_feature_img';  
            cover.src = art.cover_image;
        } else if(art.cover_audio){
            cover = adom.createElement("audio");
            cover.setAttribute('controls', '');
            cover.className = 'single_feature_img';
            var sour = adom.createElement('source');
            sour.src = art.cover_audio;
            cover.appendChild(sour);
        } else if(art.cover_video){
            cover = adom.createElement("video");
            cover.setAttribute('controls', '');
            cover.className = 'single_feature_img';
            var sour = adom.createElement('source');
            sour.src = art.cover_video;
            cover.appendChild(sour);
        }
        if(cover)articleWrapper.insertBefore(cover, related);
        var bodylist = art.body;
        if(bodylist!==undefined) 
        for(var i=0; i < bodylist.length; i++){
            if(bodylist[i].startsWith('+++')){
            var  cover = adom.createElement("img");
            cover.className = 'single_feature_img';  
            cover.src = bodylist[i].substring(3, bodylist.indexOf(',')+1);
            articleWrapper.insertBefore(cover, related);
            }
            else{
            var p = adom.createElement("p");
            p.textContent = bodylist[i] ;
            articleWrapper.insertBefore(adom.createElement('br'),related);
            articleWrapper.insertBefore(p, related);
          }
        }
        art.read = art.read + 1;
        console.log(art);
        db.ref('/ethiopia/newsL/'+sh.key).update(art);
        response.send(adom.documentElement.innerHTML);
        }catch(e){console.log(e); response.send('error');}
                  
    });
    else if(req.params.hash!=='favicon.ico') {     
      //db.ref('/ethiopia/'+'am'+'/'+req.params.hash).once('value').then(function(snapshot) {   
       
       
       if(!firebaseCache.get("catIndex"))response.send('not indexed yet');
         try{   
         		//next();
             //req.query.size = firebaseCache.get("catIndex").get("Headlines_am").length + firebaseCache.get("catIndex").get("Headlines_en").length ;     
             //getByCategory({lang:'both', resp:response,categ:req.params.hash, psize:Math.floor(req.query.size/12), page:req.query.page===undefined ? 0: req.query.page});
         }catch(e){console.log(e);response.send('indexing'); }
      //});
    }
});
function compare(a,b) {
  if (a.o.timestamp < b.o.timestamp)
    return -1;
  if (a.o.timestamp > b.o.timestamp)
    return 1;
  return 0;
}
function rcompare(a,b){
	if(a[1] < b[1]) return 1;
	if(a[1]>b[1]) return -1;
	return 0;
}
app.get('/s/getNews', (request, response) => { 
   var link = request.query.q;
      if(!link) response.status(404).end();  
      db.ref('/ethiopia/newsL/'+link).once('value').then(function(snapshot) {
       	response.send(snapshot.val());
      });
})
var total = 0;
var links = '';
var langcount = 0;
function indexByLangCateg(i,lang){
  (function (i){
         db.ref('/ethiopia/'+lang+'/'+CATEGORIES[i]).once('value').then (function(snapshot){ 
         var list = snapshot.val();  
         if(!list) {console.log(i+':'+lang);  if(snapshot.key==='Video' && lang==='en') //buildRelated();
          return;}
         try{

           var catList = Object.keys(list); 
           if(catList){
            total += catList.length;
               catIndex.set(CATEGORIES[i]+'_'+lang,catList); 
               
           }
           //use scrapper's list  
           //firebaseCache.get("all").push(catList); 
          }catch(e){console.log(e);}   
          //if(i===CATEGORIES.length-1){
           // db.ref('/ethiopia/newsL').once('value').then (function(snapshot){
                try{
             //   var all = snapshot.val();
                for(var hash in list){
                   //links += all[hash].link + '\n';
                    //for(var l = 0; l < CATEGORIES.length; l++){
                        var catList = firebaseCache.get('catIndex').get(snapshot.key+'_'+lang);
                        var index = catList.indexOf(hash);
                        if(index!==-1){
                           catList[index] = {o:{timestamp: list[hash], hash:hash}};  
                           
                        }
                   // }                
                }
                //for(var l = 0; l < CATEGORIES.length; l++){

                    var catList = firebaseCache.get('catIndex').get(snapshot.key+'_'+lang);
                    //if(!catList) return;
                    console.log(snapshot.key+'_'+lang+':'+catList.length);
                    catList.sort(compare);
                    console.log("done."+total);   
                //}    
                 //fs.writeFile("test.txt", links, function(err) {
                   // console.log("The file was saved!");
                  //});  
                //if(true || !GAZETA.indexed){
                  //if(langcount==1){
           
                    if(snapshot.key==='Video'){
                      consola.info("FINISHED "+lang+" INDEX");
                      //if(lang==='en')buildRelated();
                    }
                    
                
                  //}else langcount++;
                //}

              }catch(e){}
            //});                              
          // }     
        
        }); 
      })(i);   
}

firebaseCache.put('catIndex',new Map());
   var catIndex = firebaseCache.get("catIndex");
var startIndex = function(){
	total = 0;
    for(var i = 0; i < CATEGORIES.length; i++){
      indexByLangCateg(i, 'am',catIndex);
    } 
    for(var i = 0; i < CATEGORIES.length; i++){
      indexByLangCateg(i, 'en',catIndex); 
    }     
};

function update(sss,force,categs){
  store = new Readable( {objectMode: true} );
  store.on('error',function (e){
  	console.log(e);
  })
  scrapper.seeds("all",function(seeds){
  consola.info('seeds',seeds);
  var nacount = 0;
 
  var linksize = Object.keys(seeds).length;
  for(var link in seeds){  
  try{
  if(categs && !categs.includes(seeds[link].cat))continue;	
   var sauce = getFileName(link.trim()).replace(/\.|\//g,''); 
   //console.log(sss+":"+link);
   if((link.length>0 && !sss) || (link.length>0 && sss && (sss.length==0 || sss.includes(sauce)) ) ){
       (function(meta, link,sss){
       	var opts = {link:link,address:meta.address};
       	if(sss){
       		if(force) opts.force = true;
       		//opts.force = true;
       		opts.new = true;
       	}
        scrapper.newSubseeds(opts, function(resp){
          consola.info("SubSEEDs",meta,link,resp);
          if(!resp || resp.length===0){
            linksize--;
            if(linksize==0){
              consola.info("NOTHING NEW FOUND. Waiting for next schedule.");
              //buildSearchI();
              //setTimeout(update, GAZETA.updateD);//7200000
            }
            return;
          }
          nacount+=resp.length;
          for(var i = 0; i < resp.length;  i++){
             //consola.info(firebaseCache.get('__-articles-__').length);
             //if(!firebaseCache.get('__-articles-__').includes(resp[i]))
             scrapper.getNewArticle({link:resp[i], covet_webp:true,cat:meta.cat}, function(res,cat){
               if(!res ||  !cat) {}
               else {
                 scrapper.postArt(res,cat);
              }
               nacount--;
               consola.info(nacount);
               bot.sendMessage(381956489,'Remaining news: '+nacount); 
               bot.sendMessage(392957340,'Remaining news:' +nacount);
               if(nacount===0){
                  setTimeout(update, 2700000);
                  setTimeout(function (){
                  	 try{
                  	  store.push(null);  
    				  store.pipe(Searchindex.defaultPipeline()).pipe(Searchindex.add()); 
                  	  consola.info("UPDATE DONE!");
                  	  //startIndex();
                  	 }catch(e){console.log(e);}
                     }, 10000);
                  //setTimeout(
                  //startIndex();//,180000);
                  //buildSearchI();
                  //setTimeout(update, GAZETA.updateD);//1800000

               }
             });
             //else nacount--;
          }
       });
       })(seeds[link], link,sss); 
     }


    
    }catch(e){console.log(e);}
  }
 });
}
for(var l in stemplates.keys()){
  consola.info('updating ',l);
}

consola.info("START SCHEDULE");

function updateLinks(update,list,size){
(function(update){
  db.ref('/ethiopia/links/').once('value').then(function(snap){
	  try{
	  var links = Object.values(snap.val());
	  console.log(snap.val()['-1425970700']);
	  for(var l = 0; l < links.length; l++){
	    if(getFileName(links[l]).replace(/\.|\//g,'')==='enagovet' && /http:\/\/www\./.test(links[l].slice(0,14))){ 
	    	links[l] = links[l].replace(/http:\/\/www\./,'http://');
	     
	   }
	   if(getFileName(links[l]).replace(/\.|\//g,'').startsWith('cap')){
	   		consola.info(links[l]+" :"+links[l].length);
	   }

	  }
	  console.log("TOTS LINKS"+links.length);
	  firebaseCache.put('__-articles-__',links);
	 }catch(e){
	 	 firebaseCache.put('__-articles-__',[]); 
	     consola.error('empty',e);
	 }
	 if(update){
	 	update(list,size)
	 }
 });
})(update);
}
updateLinks();



function start(){
 db.ref('/ethiopia/links/').once('value').then(function(snap){
	  try{
	  var links = Object.values(snap.val());
	  for(var l = 0; l < links.length; l++){
	    if(getFileName(links[l]).replace(/\.|\//g,'')==='enagovet' && /http:\/\/www\./.test(links[l].slice(0,14))){ 
	    	links[l] = links[l].replace(/http:\/\/www\./,'http://');
	     //consola.info(links[l]);
	   }
	  }
	  firebaseCache.put('__-articles-__',links);
	  consola.info("TOTAL News", links.length);
	  //fs.writeFile('test.txt',links)
	  update();
	 }catch(e){firebaseCache.put('__-articles-__',[]); consola.error('empty',e);update();}
 });
}
//from scratch
global.allh = [];
function buildSearchI(){	
 db.ref('/ethiopia/newsL/').once('value').then (function(snapshot){
  try{
    var list = snapshot.val();
      var i = 0;
      for(var hash in list){
       allh.push(hash); 
       if(GAZETA.force ){//&& 'enagovet'===list[hash].source){
        var tbi = list[hash];
        
        if(tbi.body){
          tbi.body = tbi.body.toString().replace(/[,]+/g,' ').replace( /\r?\n|\r/g, '' ); 
          tbi.hash = hash;
        }
        //console.log(++i+':'+hash);
        store.push(tbi); 
       }
      }
    if(GAZETA.force){
     console.log('finised building search!!');
     store.push(null);  
     store.pipe(Searchindex.defaultPipeline()).pipe(Searchindex.add());
    }   

    console.log("SIZZLE"+allh.length);
    //startIndex();
   }catch(e){
    console.log(e);
   }
  });                              
}
function buildTags(){

}

function searchbyid(inp,c,e){
  try{
  var q =  {
    query: {AND: {'hash': [inp]}}
  }
  var doc ;
  Searchindex.search(q) 
    .on('data', function(docs) {
    //console.log(docs.document);  
    doc = docs.document;
  }).on('finish',function(){
    c(doc);
  }).on('err', function(e){
    e(e);
  })
 }catch(e){console.log(e);}
}


/*function buildQuery(n){
  var  qu = n.title.toLowerCase().split(/ +/);
  for(var i=0; i < qu.length; i++){
     if(searchoptions.stopwords.includes(qu[i])){
      qu.splice(i,1);
     }
  }
  //build body 
  var q =  {
    query: [{AND: {'title': qu}}, {AND:{'body':qu}}]
  }
  return q;
}*/

function postRelated(a, retur){
   console.log(a); 	
   searchbyid(a, function result(doc){
     if(doc && doc.title){
     var freq = new Map();
     var arr = sw.removeStopwords(doc.body.split(/[፥፣”: \\.\\(\\)“,።]+/));
     console.log(arr.length);
     for(var l=0; l<arr.length; l++){
        var word = arr[l].toLowerCase();
        if(word.length > 20) continue; 
        if(Array.from(freq.keys()).includes(word)){
          freq.set(word, freq.get(word)+1)
        }else freq.set(word, 1);
      } 

       var keys = Array.from(freq.keys());
        var big;
        var total = 0;
        var bigs = [];
      //tfdif
      for(var x=0; x<keys.length; x++){
        total += freq.get(keys[x]);
      }
      var median = Math.floor(total/keys.length);   
      console.log("MED"+median);
      for(var x=0; x<keys.length; x++){
        if(amblist.includes(keys[x])) continue;
        var freq1 = freq.get(keys[x]);
          total += freq.get(keys[x]);
          var exc = freq.get(big) < freq1;
          if(big===undefined || exc){  
            big = keys[x];
            bigs = [big];
            //console.log(keys[x] + ': ' + freq.get(keys[x]));
          } 
          else if(freq1>1 && freq1 >= median){

            bigs.push( keys[x]); 
          }
       }  
       var cats = getCats(doc.hash);
       var count = 0;
       freq = new Map();

       for(var v=0; v<bigs.length; v++){
       	   if(bigs[v].trim().length===0) {count++;continue;}
           searchDb(bigs[v],function result(list,key){
            count++;

             try{
              if(count===bigs.length - 1){
                
                  keys = Array.from(freq.keys());
                  for(var c=0; c<keys.length; c++){
                    if(freq.get(keys[c])<2) freq.delete(keys[c]);
                  }
                  var titkeys = doc.title.split(/ +/);
                  var cc = 0;keys =  Array.from(freq.keys());
                  keys =  Array.from(freq.keys());
                  for(var mm = 0; mm<titkeys.length; mm++){
                  	//console.log(titkeys[mm]);
                  	  //if(titkeys[mm].length===0){c++; continue;}
                      if(!amblist.includes(titkeys[mm]))searchDb(titkeys[mm],function result(list){
                        for(var i=0; i<keys.length; i++){
                          if(list && list.includes(keys[i])){
                            freq.set(keys[i],freq.get(keys[i])+1);

                          }
                          else freq.set(keys[i],freq.get(keys[i])-1);
                        }  
                        cc++;
                      
                        if(cc===titkeys.length - 1){
                          keys = Array.from(freq.keys());
		                  for(var c=0; c<keys.length; c++){
		                    if(freq.get(keys[c])<0) freq.delete(keys[c]);
		                  }	 
		                  freq.delete(doc.hash);
                          var list = Array.from(freq).sort(rcompare);
                          var ret =[];
                          for(var r = 0; r < list.length; r++){
                          	ret.push(list[r][0]);
                          }
                          if(retur)retur(ret.slice(0,10));
                          console.log(ret);  
                          //try{
                           //var o = {}
                            //if(cats || list){
                              // if(cats) o.cats = cats;
                               //if(list) o.list = list;
                               //bot.sendMessage(381956489,freq.toString());
                              //db.ref('/ethiopia/related/'+doc.hash).set(o);
                            //}
                          //}catch(e){console.log(e);}
                        }
                      }); else cc++; 
                  }
              }else{
                if(list)
                for(var i=0; i<list.length; i++){
                  if(!freq.get(list[i])){
                    freq.set(list[i], 1);
                   
                  }else{freq.set(list[i], freq.get(list[i])+1);}  
                } 
              }
             }catch(e){console.log(e);}
            },null,null);
            
        } 

    }
   },function error(e){
     console.error(e);
   });
}

var amblist = 'እና ምንም ብቻ ሳይሆን ነው ላይ የሚል  በዚህ ሲሆን ተነግሯል እንደ ያለውን';
function buildRelated(){
  for(var i=0; i<allh.length; i++){
     try{
        postRelated(allh[i]);
     }catch(e){console.log(e);}

  } 
}


function buildShort(){

}

if(GAZETA.si)buildSearchI();
if(GAZETA.index)
  startIndex();
if(GAZETA.start)
	//start();
	update([]);

//db.ref('/ethiopia/').set({});
//update();//, 180000);


//look for new links,index when finish saving all
//var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080
//var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'

//app.listen(3002);
//server.listen(server_port, server_ip_address, function () {
  //console.log( "Listening on " + server_ip_address + ", port " + server_port )
//});
//process.env.PORT || 8080
var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
   console.log("App now running on port", port);
});

//startIndex();





function updateZombie(source){
 db.ref('/ethiopia/source/'+source).once('value').then (function(snapshot){
  try{
    var list = snapshot.val();
      for(var hash in list){
      	(function (hash){
      		db.ref('/ethiopia/links/'+hash).once('value').then (function(snapshot){
      			//console.log(snapshot.val());
      			scrapAndSend(snapshot.val(),null,null, 2);		
            });  
      	})(hash)
      	
      }
   }catch(e){
    console.log(e);
   }
  });                  
}

function del(source){
	console.log(source+":"+source.length);
  db.ref('/ethiopia/newsL/').once('value').then (function(snapshot){
  try{
    var list = snapshot.val();
      var i = 0;
      for(var hash in list){

      	if(list[hash].source === source){
      		 var cats = getCats(hash);
      		 for(var i=0; i<cats.length; i++){
      		 
      		 	var arr = cats[i].split('_');
      		 	var lang = arr[1];
      		 	var cat = arr[0];
      		 	db.ref('ethiopia/'+lang+'/'+cat+'/'+hash).remove(); 
      		 	
      		 } 
      		console.log(hash);
      		db.ref('ethiopia/newsL/'+hash).remove();
      		db.ref('ethiopia/'+source+'/'+hash).remove();
      		db.ref('ethiopia/links/'+hash).remove();
      		
      	}
      }
   }catch(e){
    console.log(e);
   }
  });                   
}

 //scrapper.reconvert_webp();