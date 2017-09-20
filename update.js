const _ = require('./constants.js');
const { JSDOM } = require("jsdom");
const utf8 = require("utf8");
global.stemplates = new Map();
global.fetchsource = [];
global.ignores = [];
global.sseeds = new Map(); 
db.ref('/templates/').once('value').then(function(snapshot) {     
  var tms = snapshot.val();   
  for(var tmt in tms){
     db.ref('/templates/'+tmt).once('value').then(function(snapshot) { 
      var t = snapshot.val()
        //if(fetchsourse.includes(t['_name']))
        console.log(snapshot.key);
      stemplates.set(snapshot.key,t); 
     }); 
  }   
});
db.ref('/seeds/').once('value').then(function(snapshot) {     
  var tms = snapshot.val();   
  for(var tmt in tms){
    sseeds.set(tmt,tms[tmt]); 
  }   
});
 
module.exports.seeds = function(source, callback){
  consola.info('getting seeds from '+source);
  var all = source === 'all'; 
  //seeds must be cached!!!
  db.ref('/seeds/'+(all ? '':source)).once('value').then(function(argument) {
              var resp =  '';
              var list = argument.val();
              
              var seeds = {}
              var address = list.address;
              for(var c in list){
                 consola.info(c);
                 if((fetchsource.length>0 && !fetchsource.includes(c)) || (ignores.length>0 && ignores.includes(c))) continue;
                  var categ = list[c];
                  address = categ.address;
                  if(c!=='address'){
                    //resp += '<h3>'+ c +'</h3><br><br>';  
                    for(cat in categ){
                     if(all){
                      if(cat!=='address' && !cat.startsWith('_') && !cat.startsWith('__')){
                          var cate = categ[cat];
                          //resp += '<h4>'+ cat +'</h4><br><br>';
                          for(ca in cate){
                              if(seeds[cate[ca]]===undefined) {
                                seeds[cate[ca]] = {};
                                seeds[cate[ca]].address = categ['_'+cat] ? categ['_'+cat]: address;
                                if(!categ['_'+cat]){
                                  if(categ['__am']  && cat.slice(cat.indexOf('_')+1)=='am'){
                                      // seeds[cate[ca]].address = ? categ['__am']: address;
                                  }
                                  else if(categ['__en']  && cat.slice(cat.indexOf('_')+1)=='en'){
                                      // seeds[cate[ca]].address = categ['__en'] ? categ['__en']: address;
                                  }
                                }
                                seeds[cate[ca]].cat = [];
                              }
                              if(!seeds[cate[ca]].cat.includes(cat)) seeds[cate[ca]].cat.push(cat);
                              //resp += cate[ca] + '<br>';
                          }
                        } 
                     } 
                     else {   
                      if(seeds[categ[cat]]===undefined){ 
                        seeds[categ[cat]] = {};
                        seeds[categ[cat]].cat = [];
                      }
                      if(!seeds[categ[cat]].cat.includes(c))seeds[categ[cat]].cat.push(c);
                      //resp += categ[cat] + '<br>';
                      }
                    }

                  } else if(!c.startsWith('_')) seeds.address = categ;
              }
              callback(seeds);
          })
}

function walkBody(node, func) {
  func(node);
  node = node.firstChild;
  while(node){
      walkBody(node, func);
      node = node.nextSibling;
  }
}

function getHtml(json){
    var htm = '';
    for(var item in json){
        htm += '<h2>' + item + '</h2><br><br>';
        htm += json[item];
    }
    return htm;
}

function getContent(container, type){
  var link;
  try{
  if(type==="video"){
     var video = container.querySelector("video");
     if(video===null) link = container.querySelector('[value$="mp4"]').getAttribute('value');
     else link = video.src;
     return link;
  } else if(type==="text"){
    return container.textContent;
  } else if(type=="image"){
     var link;
     var image = container.querySelector("img");
     if(!image || image.src.length < 5){  link = container.querySelector('[value$="jpg"]').getAttribute('value');}
     else link = image.src;

     if(!link || link.length < 5) link = container.querySelector('[value$="png"]').getAttribute('value');
     return link;
  }else if(type==="audio"){
     var audio = container.querySelector("audio");
     if(audio===null) link = container.querySelector('[value$="mp3"]').getAttribute('value');
     else link = audio.src;
     return link;
  }
 }catch(e){return "";}
}

function covet_webp(dat, response){
  if(!dat.hash) {
    dat.hash = dat.val.replace(/\.|\//g,'').hashCode();
  }
  var Hash = dat.news.link.replace(/\.|\//g,'').hashCode();
  var not_converted;
   consola.info("converting to webp");
   const converter = sharp().webp().on('error', function(err) {
                                                      not_converted = true;
                                                      response(dat.news, dat.cat);
                                              });

  var stream = bucket.file(dat.cover_image+dat.hash+'.webp').createWriteStream();

  stream.on('finish', function () {
          if(!not_converted){ 
             const thumbnlner = sharp().resize(400, 300)
                                  .on('error', function(err) {
                                                   response(dat.news, dat.cat);
                                                   consola.error("failed to make thumbnail", dat.news[dat.cover_image]);  
                                              });

              var stream1 = bucket.file(dat.cover_image+dat.hash+'thumb.webp').createWriteStream(); 
              stream1.on('error', function (err){
                consola.error("failed to write thumn to db.");
                response(dat.news, dat.cat);
              });   
              stream1.on('finish', function () { 
                   dat.news.thumbnail =  "https://www.googleapis.com/storage/v1/b/gazeta-1ca8d.appspot.com/o/"+dat.cover_image+dat.hash+'thumb.webp?alt=media';
                   var file = bucket.file(dat.cover_image+dat.hash+'thumb.webp');
                   var options = {
                      entity: 'allUsers',
                      role: gcs.acl.READER_ROLE
                    };
                    file.acl.add(options, function(err, aclObject) {
                        
                    });
                   //pArt(dat.news, dat.cat); 
                   db.ref('/ethiopia/newsL/'+Hash).set(dat.news);
                   consola.info("converted and saved thumb.",dat.news.thumbnail);
                   response(dat.news, dat.cat);
              });
              var readwebp = bucket.file(dat.cover_image+dat.hash+'.webp').createReadStream();
              readwebp.on('error',function (e){
                 consola.log("could not read original image",dat.news[dat.cover_image]);
                 response(dat.news,dat.cat);
              });

              dat.news[dat.cover_image] = "https://www.googleapis.com/storage/v1/b/gazeta-1ca8d.appspot.com/o/"+dat.cover_image+dat.hash+'.webp?alt=media';
              var fil = bucket.file(dat.cover_image+dat.hash+'.webp');
              var options = {
                entity: 'allUsers',
                role: gcs.acl.READER_ROLE
              };
              fil.acl.add(options, function(err, aclObject) {});
              readwebp.pipe(thumbnlner).pipe(stream1);
              pArt(dat.news,dat.cat)
              consola.info("converted and saved cover_image",dat.news[dat.cover_image]);                                     
          } 
    });

    stream.on('error', function (err){
       bot.sendMessage(381956489,'4 '+dat.news.link); 
      consola.error("failed to stream image",err);
      response(dat.news, dat.cat);
    });
   // 

   request.request({method: 'GET',url:dat.val,encoding: null},function(err, respons, body) {
      //consola.info("downloaded image. Converting to webp", val); 
      if(!err){
       sharp(body).webp().on('error',function(err) {
                              consola.info('Error converting to webp',dat.val);
                              bot.sendMessage(381956489,'3 '+dat.news.link);  
                              not_converted = true;
                              response(dat.news,dat.cat);
                            }).pipe(stream);
      }
     else {
      //PERSIST THESE FAILS AND RETRY ON NEXT SCHEDULE
      consola.info("could not retrieve image retrying",err.message); 
      request.get(dat.val,function(err, respons, body) {

        if(!err){
        consola.info("downloaded image. Converting to webp", dat.val); 
         sharp(body).webp().on('error',function(err) {
                                consola.info('Error converting to webp',dat.val);
                                 bot.sendMessage(381956489,'2 '+dat.news.link);  
                                not_converted = true;
                                response(dat.news,dat.cat);
                              }).pipe(stream);
        }
       else {consola.info("could not retrieve image ",err.message); bot.sendMessage(381956489,'1 '+dat.news.link); response(dat.news, dat.cat);}
     });
    }
   });
}
//var links = ["http://dw.com/am/%E1%89%A5%E1%88%AD%E1%88%83%E1%8A%94-%E1%8A%95%E1%8C%89%E1%88%A4-%E1%8A%A5%E1%8A%93-%E1%8B%A8%E1%88%98%E1%8B%9D%E1%8A%93%E1%8A%9B-%E1%8C%8B%E1%8B%9C%E1%8C%A0%E1%8A%9D%E1%8A%90%E1%89%B5-%E1%8C%89%E1%8B%9E%E1%8B%8D/av-40345614"]
function fetch(template, link,source,response, body, cat,covet_web){

  //if(!links.includes(link)) return;
  var hasIm;
  var hash = link.replace(/\.|\//g,'').hashCode();
  const dom = new JSDOM(body);//{ runScripts: "dangerously" }
  //consola.info(dom.window.document.body.innerHTML);
          try{
            var news = {link:link,"timestamp":Date.now(),read:0,failcount:0};
            var html = '';  
            console.log(template);
           for(var item in template){
                try{

                    if(item.startsWith('_')) continue;
                    var items = [];
                    try{
                     
                    if(template[item].includes('---')){
                      items = template[item].split('---');
                    } else items[0] = template[item];  
                    }catch(e){consola.info(e);}

                    var xxx = items[0].split('xxx');
                    var vvv = xxx[1].split('vvv');
                    var clN = vvv[0];
                    var which =parseInt(vvv[1]);
                  
                    var container = dom.window.document.body.getElementsByClassName(clN)[which];
                    if(!container && items.length > 1){
                       xxx = items[1].split('xxx') 
                       vvv = xxx[1].split('vvv');
                       clN = vvv[0];
                       which = parseInt(vvv[1]);
                       consola.info("TRYING ENG");
                       container = dom.window.document.body.getElementsByClassName(clN)[which];
                    }
                    var xxxsub = xxx[0].split(' ');
                    var index = parseInt(xxxsub[0]);
                  
                    consola.info("starting '"+item+"' extraction using ",template[item]);
                    
                    if(container===undefined) {
                      consola.info("failed to parse container element");
                      consola.info(items);
                      if(item==='title'){
                        val = dom.window.document.getElementsByTagName('title')[0].textContent;
                        console.log(val);
                      }else
                      continue;
                    }
                    //console.log(container.innerHTML);
                    if(which===-1) which = 0; 
                    var val ;
                    if(item.startsWith('cover')){
                      var type1 = item.slice(item.indexOf('_')+1);
                       
                       if(type1==='image'){ 

                        try{
                        
                         val = container.getElementsByTagName('img')[0].getAttribute('src');
                         if(val.startsWith('//')) val = 'http://'+ val.replace(/\/\//,'');
                         else if(val.startsWith('/')) val = 'http://'+getFileName(link) + val;
                         
                         consola.info("found cover_image.",val);
                         if(val!==undefined)news[item]  = val;
                         else continue;
                           news.original_image = val; 
                          if(covet_web){hasIm = true; 
                           covet_webp({val:val, news:news,hash:hash,cat:cat,cover_image:item},response);
                          }
                        }catch(d){
                          consola.error("error processing image",d); 
                          val = undefined;
                          hasIm = false;
                          consola.info(item); 
                        }           

                       }

                       if(type1==='audio'){
                          val = getContent(container,"audio");
                          if(val){
                          var  AprevImage,preview_cln,preview = template['_cover_audio_preview'];
        
                          if(preview)preview_cln =  preview.slice(preview.indexOf('xxx')+3,preview.indexOf('vvv'));
                          if(preview_cln){
                           var apreviews = container.getElementsByClassName(preview_cln);
                           
                           AprevImage = getContent(apreviews[0], "image");

                           consola.info('Preview Image', AprevImage);
                           var AudPValid = AprevImage && AprevImage.trim().length>0;
                           if(AudPValid && AprevImage.startsWith('/'))AprevImage = 'http://'+getFileName(link)+AprevImage;
                           if(AudPValid){
                             news.o_cover_a_prev = AprevImage;
                             if(covet_web)
                             try{
                                hasIm = true; 
                                covet_webp({val:AprevImage, news:news,cat:cat, cover_image:'cover_a_prev'},response);
                             }catch(e){consola.error("webp",e);hasIm = false;}
                           }
                          }
                        }
                         
                         //COVER PREVIEWS
                       } 
                       if(type1==='video') {
                         val = getContent(container, "video");                
                                }             
                    }
                    else   
                      if(item==='title' || item==='author'){
                      try{  
                      console.log(item); 
                      var ch = container.childNodes[index];

                      val = ch && ch.textContent.trim().length!==0 ? ch.textContent.trim() : container.textContent.trim();
                      
                      if(!val || (val && (val.length>175 || val.includes('||'))) ){
                        try{
                        consola.error("NODETYPE",xxxsub[1]);
                        if(ch)
                        val = container.getElementsByTagName(xxxsub[1])[0].textContent;
                        }catch(e){consola.error(e);}
                      }

                      val = val.replace(/[\n\t]+/g,'').trim();
                    }catch(e){console.log(e);}
                    } 
                    else if(item==='date' || item==='synop'){
                       var tem = container.childNodes[index];
                      if(!tem) tem = container;

                       val = tem.textContent.replace(/[\n\t]+/g,'').trim();
                     if(item==='date')try{
                       var cnt = dtot(val);
                       if(!isNaN(cnt))
                       news['timestamp'] = cnt;
                       else {
                        consola.info('NEWDATE?',val);
                        news.failcount = news.failcount ++;
                       }
                     }catch(e){consola.error(e);}
                    }
             
                    else if(item==='body'){
                      consola.log("parsing body...");
                      val = container;
                      try{
                        var remove = template['__remove'];
                        if(remove){

                           var rcln = remove.slice(remove.indexOf('xxx')+3,remove.indexOf('vvv'));
                           var rlist = container.getElementsByClassName(rcln); 
                     
                           for(var i=0; i<rlist.length; i++){
                              var tbr = rlist[i];
                              if(!tbr)container.removeChild(tbr);        
                              else tbr.parentNode.removeChild(tbr);    
                           }
                           
                        }
                        var video = template['__video'];
                        var photo = template['__photo'];
                        var audio = template['__audio'];
                        var ret = []
                        if(!video && !photo && !audio ){
                          var childs = container.childNodes;

                          for(var l=0; l<childs.length; l++){
                             if(childs[l].nodeType===3) {
                              var text = childs[l].data.trim();
                              if (text.length > 0) {
                                ret.push(text);
                              }
                            }
                             else if(childs[l].nodeType===1){
                              try{
                                
                                if(childs[l].querySelector("img")
                                  || childs[l].querySelector("em")
                                    || childs[l].querySelector("a")
                                    || childs[l].querySelector("strong")){
                                   walkBody(childs[l], function (node) {
                                      //console.log(node);
                                      if (node.nodeType === 3 ) {
                                      
                                          var text = node.data.replace(/[\n\u00A0]+/g,'').trim();
                                          if (text.length > 0) {
                                            ret.push(text);
                                          }
                                      }else if(node.nodeType === 1){
                                        if(node.nodeName==="IMG"){
                                         var src  = node.src;
                                         if(src && src.startsWith('/')) src = 'http://'+getFileName(link)+src;
                                         ret.push("***"+src);
                                       }else if(node.nodeName==="em"){
                                         ret.push("<<<"+node.innerText);   
                                       }else if(node.nodeName==='a'){

                                       }else if(node.nodeName==='strong'){
                                          
                                      }
                                      }
                                  });  
                                }
                                else {
                                  var cleanse = childs[l].querySelector('script');
                                  var cleanse1 = childs[l].querySelector('style');

                                  if(cleanse1) cleanse1.parentNode.removeChild(cleanse1);
                                  if(cleanse){
                                      cleanse.parentNode.removeChild(cleanse);
                                  }  
                                  var text = childs[l].textContent;
                                   
                                  if(text) text = text.replace(/[\n\u00A0]+/g,'').trim();
                                  if(text.length>0) ret.push(text);
                                } 

                              }catch(e){consola.info('e',e);} 
                             
                          
                             
                           }
                         console.log('SS'+ret); 
                         val = ret; 
                           }
                        }
                        else {
                          //console.log(container);
                          var vpreview_cln,vcaption_cln,apreview_cln, acaption_cln, pcaption_cln;
                          var audio_cln, photo_cln, video_cln;  
                          var vpreview  = template['_Vpreview'];
                          var vcaption = template['_Vcaption'];
                          var acaption = template['_Acaption'];
                          var apreview = template['_Apreview'];
                          var pcaption = template['_Pcaption'];

                          if(vpreview)vpreview_cln =  vpreview.slice(vpreview.indexOf('xxx')+3,vpreview.indexOf('vvv'));
                          if(vcaption)vcaption_cln =  vcaption.slice(vcaption.indexOf('xxx')+3,vcaption.indexOf('vvv'));
                          if(acaption)acaption_cln =  acaption.slice(acaption.indexOf('xxx')+3,acaption.indexOf('vvv'));
                          if(apreview)apreview_cln =  apreview.slice(apreview.indexOf('xxx')+3,apreview.indexOf('vvv'));
                          if(pcaption)pcaption_cln =  acaption.slice(acaption.indexOf('xxx')+3,acaption.indexOf('vvv'));

                          if(photo)photo_cln = photo.slice(photo.indexOf('xxx')+3,photo.indexOf('vvv'));
                          if(video)video_cln = video.slice(video.indexOf('xxx')+3,video.indexOf('vvv'));
                          if(audio)audio_cln = audio.slice(audio.indexOf('xxx')+3,audio.indexOf('vvv'));
                         // console.log(photo_cln+":"+audio_cln+":"+video_cln);
                          var photos = container.getElementsByClassName(photo_cln);
                          var videos = container.getElementsByClassName(video_cln);
                          var audios = container.getElementsByClassName(audio_cln);
                         
                          var childs = container.childNodes;

                          // console.log(photos.length + ":"+videos.length+":"+audios.length+":"+childs.length);
                       
                          var i = 0, p = 0, a =0;
                          for(var l=0; l<childs.length; l++){ 
                           if(childs[l].nodeType===1){
                              if(template['__boundary']===childs[l].className) break;
                              var hasVideo = childs[l].querySelector('[class="'+video_cln+'"]') || childs[l].className===video_cln;
                              var hasAudio = childs[l].querySelector('[class="'+audio_cln+'"]');
                              var hasPhoto = childs[l].querySelector('[class="'+photo_cln+'"]');
                              
                              //if p do sth
                              //node is sugar container
                               
                              if(videos && hasVideo){
                                 var videoLink = getContent(videos[i],'video');
                                 var VidValid = videoLink && videoLink.length > 0; 
                                 if(VidValid){
                                   var VprevImage, VcaptionText, VidCValid, VidPValid;
                                   if(vpreview_cln){
                                     var vpreviews = childs[l].getElementsByClassName(vpreview_cln);
                                      VprevImage = getContent(vpreviews[0], 'image');
                                   }
                                   if(vcaption_cln){
                                     var vcaptions = childs[l].getElementsByClassName(vcaption_cln);
                                     VcaptionText = getContent(vcaptions[0], "text");
                                    }
                                  
                                   VidCValid = VcaptionText && VcaptionText.trim().length>0;
                                   VidPValid = VprevImage && VprevImage.trim().length>0;

                                   if(VidPValid && VprevImage.startsWith('/'))VprevImage = 'http://'+getFileName(link)+VprevImage;
                                   if(videoLink.startsWith('/'))videoLink = 'http://'+getFileName(link)+videoLink;
                                   ret.push("___"+videoLink.trim()+","+(VidCValid?VcaptionText.trim()+",":"")
                                            +(VidPValid?VprevImage.trim()+",":"")); 
                                         i++;                                                       
                                  }  
                              }
                              if(photos && hasPhoto){
                                var photoLink = getContent(photos[p], 'image');
                                //console.log(photoLink);
                                var PhoValid = photoLink && photoLink.length > 0;

                                if(PhoValid){
                                   var PcaptionText, PhoCValid;
                                   
                                   if(pcaption_cln){
                                     var pcaptions = childs[l].getElementsByClassName(pcaption_cln);
                                     PcaptionText = getContent(pcaptions[0], "text");
                                   }
                                  
                                   PhoCValid = PcaptionText && PcaptionText.trim().length>0;
                                   if(photoLink.startsWith('/'))photoLink = 'http://'+getFileName(link)+photoLink;
                                
                                   ret.push("***"+photoLink+","+(PhoCValid?PcaptionText:"")); 
                                   p++;                                           
                                  
                                } 
                              }
                              if(audio && hasAudio){
                                var audioLink = getContent(audios[a], "audio");

                                var AudValid = audioLink && audioLink.length > 0;

                                if(AudValid){
                                  var AcaptionText, AudCValid, AudPValid, AprevImage;
                                  if(acaption_cln){
                                    var acaptions = childs[l].getElementsByClassName(acaption_cln);
                                    AcaptionText = getContent(acaptions[0], "text");
                                  }   
                                   if(apreview_cln){
                                     var apreviews = childs[l].getElementsByClassName(apreview_cln);
                                     AprevImage = getContent(apreviews[0], "image");
                                    }
                                   
                                    AudCValid = AcaptionText && AcaptionText.trim().length > 0;
                                    AudPValid = AprevImage && AprevImage.trim().length>0;
                                    if(audioLink.startsWith('/')) audioLink = 'http://'+getFileName(link)+audioLink;
                                    if(AudPValid && AprevImage.startsWith('/'))AprevImage = 'http://'+getFileName(link)+AprevImage;
                                    //if(AudCValid && AcaptionText.startsWith('/'))AcaptionText = 'http://'+getFileName(link)+AcaptionText;  

                                  
                                  ret.push("+++"+audioLink+","+AprevImage+","+AcaptionText);
                                  a++;
                                }
                              }
                              if(!hasVideo && !hasAudio && !hasPhoto && childs[l].textContent.trim().length>0){

                                if(childs[l].querySelector("img") 
                                    || childs[l].querySelector("em")
                                    || childs[l].querySelector("a")
                                    || childs[l].querySelector("strong")){
                                   walkBody(childs[l], function (node) {
                                      if (node.nodeType === 3) {
                                          var text = node.data.trim();
                                          if (text.length > 0) {
                                            ret.push(text);
                                          }
                                      }else if(node.nodeType === 1){
                                        if(node.nodeName==="IMG"){
                                         ret.push("***"+node.src);
                                        }else if(node.nodeName==="em"){
                                         ret.push("<<<"+node.innerText);   
                                        }else if(node.nodeName==='a'){

                                        }else if(node.nodeName==='strong'){
                                          
                                        }
                                      } 
                                  });  
                                }
                                else {
                                  ret.push(childs[l].textContent.replace(/[\n]+/g,''));
                                }
                              }

                            }
                          
                          }
                           
                          val = ret;

                        }

                      
                      }catch(e){
                        consola.error('body '+e);
                      }
                        
                  }
                      
                   
                     if(val!==undefined && val.length > 0)news[item] = val;
                    //html += '<h2>'+item+'</h2>' +news[item] + '<br><br>';

                }catch(e){consola.info("error occured while processing item",link,val);}
             
             }
             //post processing
             

             //if(view){
               // response.status(200).send(getHtml(news));
             //} 
             //return news;
             //clear redundancies
            

            try{
                if(!hasIm && news.body[0].startsWith('***')){
                  news.original_image =  news.body[0].slice(3);
                  news.body.splice(0,1);
                  if(covet_web){
                     hasIm = true; 
                     covet_webp({val:news.original_image, news:news,hash:hash,cat:cat,cover_image:'cover_image'},response);
                  }
                }  
                //redundncies
                  
                 
             }catch(e){consola.info('er',e);}

             
            
            if(!hasIm) response(news, cat);
       }catch(e){consola.error("ERROR",e);  }
}


module.exports.postArt = function(news, categories){

  pArt(news,categories); 
}
function pArt(news, categories){
  if(news.body)
    try{
      var din = news.body.indexOf(news.date);
      if(din > -1)news.body.splice(din,1);
      din = news.body.indexOf(news.title);
      if(din > -1)news.body.splice(din,1);   
      for(var x = 0; x < news.body.length; x++){
       if((!news.synop || news.synop.length <= 50 || news.synop.startsWith('***')) 
            && !news.body[x].startsWith('***')){ 
          var text = news.body[x].length > 200 ? news.body[x].substring(0, 200): news.body[x];
          news.synop = text.replace(/[\n]+/g,'');
          break;
       }  
      }   
    }catch(e){consola.error("csynop",e); }
  //db.ref('/ethiopia/').set({}); return;
  if(Object.keys(news).length<=4 || !news.title) {return; bot.sendMessage(381956489,news.title+news.link); }try{delete news.failcount;}catch(e){}
   try{
      //var article = '<b>'+news.title+'</b>\n'+ (news.synop?'<pre>'+news.synop+'</pre>':  (news.body && news.body.length > 0  ? news.body[0]:''));
        //         article += '\n<a href="'+ news.link +'">Open in Browser</a>\nposted a new article!'; 
          //       bot.sendMessage(381956489,article,{parseMode:'HTML'});   
     consola.info('TIMESTAMP',news.timestamp);
     //if(news.timestamp === NaN) news.timestamp = Date.now();
     var link = news.link;
     news.source = getFileName(link).replace(/\.|\//g,'');
   var source = news.source; 
   var cats = [];
   var hash = link.replace(/\.|\//g,'').hashCode();
   for(var k=0; k<categories.length; k++){ 
        consola.info(categories[k]);
        var cat = categories[k];
        var mid = cat.indexOf('_');
        var lang = cat.substring(mid+1);
        //if(lang==='en'){
          //both += 'm';  
        //}
        var cate = cat.substring(0,mid);
        //cats.push(cate);
        db.ref('/ethiopia/'+lang+'/'+cate+'/'+hash).set(news.timestamp);
    }
    //news.categories = cats;
    //news.lang =  'am';
    db.ref('/ethiopia/links/'+hash).set(link);
    db.ref('/ethiopia/newsL/'+hash).set(news);

    if(GAZETA.si || !GAZETA.force){
      var tbi = news;
     if(tbi.body){
        tbi.body = news.body.toString().replace(/[,]+/g,' ').replace( /\r?\n|\r/g, '' ); 
        tbi.hash = hash;
      }
      console.log('added to search'+hash);
      store.push(news);  
    }
    //+link.replace(/\.|\//g,'').hashCode(
    //db.ref('/ethiopia/newsL/')).push(news); 
    db.ref('/ethiopia/source/'+source+'/'+hash).set(news.timestamp);
    consola.info("SAVED",hash,news);
    //firebaseCache.get('__-articles-__').push(link);
   }catch(e){consola.error("error saving to db",e);}
   //batch indexing is faster, on hold
   //consola.info("updating cache and index");
}

function fetchArt(template, link, source, response, categories,post){
    //consola.info(/^[\000-\177]*$/.test(link)+link);
    if(!/^[\000-\177]*$/.test(link))
    link = encodeURI(link);
    
   
   var options = {
      method: 'GET',
      url:link,
      headers:{
        'User-Agent':'Mozilla/5.0 (Linux; Android 4.4; Nexus 5 Build/_BuildID_) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/30.0.0.0 Mobile Safari/537.36'
      }
   };
   request.get(link, function (error, respons, body) {
      if(error===null){ 
         fetch(template, link,source, response, body, categories,post);
      } 
      else {
        consola.error('error while getting contents of '+link,error);
        response();
      }
   }); 
}

function getNewLinks(linko, template,response, body,force){
      const dom = new JSDOM(body);//{ runScripts: "dangerously" }
      try{
           //var secure = linko.startsWith("https");
           consola.info("checkin sseeds from",linko);
           var cln = template.split('sXs')[0];
           var index = firebaseCache.get('__-articles-__');

           var nlinks = [];
           var type2 = cln.startsWith('-');
           var clist = dom.window.document.body.querySelectorAll("[class^='"+cln+"']");
           if(type2){     
              clist = dom.window.document.body.getElementsByClassName(cln.substring(1))[0].getElementsByTagName("A");
           }//else if(cln.startsWith('*')){
              //dom.window.document.body.getElementsByClassName(cln.substring(1))[0];
           //}
           for(var v=0; v<clist.length; v++){
            try{
           
              var l = clist[v];
              if(!type2){
                 l = l.getElementsByTagName('a')[0]; 
              }   
              var link = l.getAttribute('href');
              if(link.startsWith('//')) {
                consola.debug("whatwhat", link);
                 link = 'http://'+ getFileName(linko)+link.replace(/\/\//,''); 
               } 
              else if(link.startsWith('/')) link = 'http://'+getFileName(linko)+link;

               if(!/^[\000-\177]*$/.test(link))
              link = encodeURI(link);
              //console.log((index && !index.includes(link)) || GAZETA.force || force && !nlinks.includes(link));
              if((index && !index.includes(link)) || GAZETA.force || force && !nlinks.includes(link)){
                 consola.info("newfoundlink", link);

                 if(!force){ 
                  nlinks.push(link);
                  index.push(link);

                 } else nlinks.push({link:link, title: l.textContent.trim().length>0 
                        ? l.textContent.replace(/^[(\\n)\s]+|[(\\n)\s]+$|[^\w][\n]+[^\w]/g,''):
                        clist[v].getElementsByTagName('a')[1].textContent.replace(/^[(\\n)\s]+|[(\\n)\s]+$|[^\w][\n]+[^\w]/g,'')});

               }
             } catch(e){
              consola.error("error while getting article ",e,body);
              
              //response();
              continue;
             } 
        
           }
          //if()
          response(nlinks);

      }catch(e){consola.error(e); consola.info(linko); }
}

module.exports.getNewArticle = function(article, response){  
    try{
      var link = article.link;
      var hash = link.replace(/\.|\//g,'').hashCode(); 
      var source = getFileName(link).replace(/\.|\//g,'').trim(); 
      console.log(source);
      if("enagovet"===source){
        link = link.replace(/https?:\/\//,'http://www.');
      }
  
      fetchArt(stemplates.get(source), link, source,response, article.cat,article.covet_webp);
    }catch(e){
      consola.info("template for source not active ",source);
      consola.error("article fetch error",e);
      response();
    }

}
//var seedList = ["http://www.fanabc.com/index.php/fana-radio.html"];
module.exports.newSubseeds = function(seed, response){
   var link = seed.link;
   //consola.info("GETTin",link);

    //if(!seedList.includes(link)){return;response();}
    if(!/^[\000-\177]*$/.test(link))
    link = encodeURI(link);
   var address = seed.address; 
   var options = {
      url:link,
      headers:{
        'User-Agent':'Mozilla/5.0 (Linux; Android 4.4; Nexus 5 Build/_BuildID_) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/30.0.0.0 Mobile Safari/537.36'
      }
   };
     request.get(link, function (error, respons, body) {
        //consola.info(body);
        if(error===null)
            getNewLinks(link, address,response, body, seed.force);
        else {consola.error("error when getting subseeds ",error); response();}

    });
}


//object.keys
var getKeys = function (arr) {
    var keys = [];
    for (key in arr) {
        if (arr.hasOwnProperty(key)) {
            keys.push(key);
        }
    }
    return keys;
};

