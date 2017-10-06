var admin = require("firebase-admin");
var winston = require('winston');
global.GAZETA = {
      domain: "localhost", 
      port: "3000",
      indexed: false,
      updateD:4800000,
      force:false,
      index:true,
      start:false,
      si:false
};
 //separator: /[' ፡፥«»፣።\.,\W”\(\)“]]+/,
global.consola = new (winston.Logger)({
    transports: [
      /*new (winston.transports.File)({
        name: 'info-file',
        filename: 'filelog-info.log',
        level: 'info'
      }),
      new (winston.transports.File)({
        name: 'error-file',
        filename: 'filelog-error.log',
        level: 'error'
      }),new (winston.transports.File)({
        name: 'd-file',
        filename: 'debug.log',
        level: 'debug'
      })
      ,*/new (winston.transports.Console)()
    ]
  }); 
consola.cli();
global.getFileName = function (str){
    var simplif = str.replace(/https?:\/\/(www.)?/g,'');
    return simplif.substring(0,simplif.indexOf('/'));
}

global.getCats = function (hash){
   var cats = [];
   for(var l = 0; l < CATEGORIES.length; l++){
     try{
      var en = firebaseCache.get("catIndex").get(CATEGORIES[l]+'_en');
      if(!en) continue;
      for(var y=0; y<en.length; y++){
        try{
         if(en[y].o.hash==hash && !cats.includes(CATEGORIES[l])+'_en') {cats.push(CATEGORIES[l]+'_en');
         break;}
       }catch(e){console.log(e);}
      }
      var amh = firebaseCache.get("catIndex").get(CATEGORIES[l]+'_am');

      if(!amh) continue;
      for(var m=0; m<amh.length; m++){
         if(amh[m].o.hash==hash && !cats.includes(CATEGORIES[l])+'_am') {cats.push(CATEGORIES[l]+'_am');
         break;}
      }
     }catch(e){console.log(e);} 
   }
   return cats;
}

global.dtot = function (hash,sp){
  var m,d,y,t1=hash.length>25,t2=hash.startsWith('ቀን') || hash.startsWith('Date'),t3 = hash.includes('/'); 
  if(t1)hash = hash.slice(hash.indexOf(",")+2);
  else if(t2)hash = hash.slice(2);
  else if(t3) hash = hash.slice(0,-2) +'20'+ hash.slice(-2) ; 
  var shash = hash.split(/[ /፤,.]+/);  
  //var eb = hash.split('/') ;
  //if(sp && eb.length===3){
    //var tem = shash[0];
    //shash[0] = shash[1];
    //shash[1] = temp;
  //}
  consola.info('KK'+hash);

  if(isNumeric(hash.slice(0,1)) || t1 || t2 || t3)return approximate([shash[0],shash[1],shash[2]]);
  else if(hash.charCodeAt(3)==44) return approximate([shash[2],shash[1],shash[3]]); else return approximate([shash[1],shash[0],shash[2]]); 
}
var m_n  = {
    sep:9,
    oct:10, nov:11, dec:12, jan:1, feb:2, mar:3, apr:4
    ,may:5, jun:6, jul:7, aug:8,'መስከ':9,'ነሃሴ':8 ,'ጥቅም':10,'ህዳር':11,'ታህሳ':12, 'ሰኔ':6,'ሐምሌ':7,'ግንቦት':5,'ሚያዝያ':4,'መጋቢት':3,'የካቲት':2,'ጥር':1
}
function isNumeric(value){
  return !isNaN(value - parseFloat(value));
}

var approximate = function (ret){
   consola.info(ret);
   if(parseInt(ret[1]) >= 13){
    return new Date(0,0,0).getTime();
   }
   if(ret[3]){
     var dadd = 9;
     consola.info(ret[1]);
     switch(ret[1]){
      case 'ጥር': ret[1] = 1; dadd=8; break;
      case 'የካቲት': ret[1] = 2; dadd = 7; break;
      case 'መጋቢት': ret[1] = 3; dadd = 9; break; 
      case 'ሚያዝያ ': ret[1] = 4; dadd = 8; break;  
      case 'ግንቦት': ret[1] = 5; dadd = 8; break; 
       case 'ሐምሌ': ret[1] = 7; dadd = 7; break; 
       case 'ሰኔ': ret[1] = 6; dadd = 8; break; 
       case 'ነሃሴ': ret[1] = 8; dadd = 6; break; 
       case 'መስከረም': ret[1] = 9; dadd = 10; break;
       case 'ጳጉሜ': ret[1] = 9; dadd = 5; break;
       case 'ጥቅምት': ret[1] =10 ; dadd = 10; break;
       case 'ታህሳስ': ret[1] = 12; dadd = 9; break;
       case 'ህዳር': ret[1] = 11; dadd = 9; break;
     }
     ret[2] = parseInt(ret[2]) + (ret[1]>9 ? 7: 8);
     ret[0] = parseInt(ret[0]) + dadd;
   }else if(ret[1] && ret[1].length>2) {
      var sw = ret[1].slice(0,3).toLowerCase();
      ret[1] = m_n[sw];
   } 
   consola.info('klll',ret);
   
   return new Date(ret[2], typeof ret[1] === 'string' ? parseInt(ret[1])-1: ret[1]-1 , parseInt(ret[0])+1).getTime();
}
global.CATEGORIES = ['Headlines', 'Entertainment', 'Social', 'World','Politics','Business', 'Art and Culture','Technology','Sport','Health','Audio','Video'];

var cache = require('memory-cache');
var key = require("./gazeta-1ca8d-firebase-adminsdk-ov8ih-6e7ef6e759.json");
admin.initializeApp({
  credential: admin.credential.cert(key),  
  databaseURL: "https://gazeta-bb838.firebaseio.com",
  storageBucket: "gs://gazeta-bb838.appspot.com"
});
global.db = admin.database();
global.firebaseCache = new cache.Cache();
global.gcs = require('@google-cloud/storage')({
    projectId: 'gazeta-bb838',
    keyFilename: './gazeta-1ca8d-firebase-adminsdk-ov8ih-6e7ef6e759.json',
});
global.bucket = gcs.bucket('gazeta-bb838.appspot.com');
global.sharp = require('sharp');
global.request = require('cloudscraper');

global.banlist = [];
db.ref('/ethiopia/bannedlink/').once('value').then (function(snapshot){
  banlist = Object.values(snapshot.val());
});
global.ban = function(link){
  banlist.push(link.trim());

  db.ref('/ethiopia/bannedlink/'+link.trim().hashCode()).set(link);
 }
