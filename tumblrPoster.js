var tumblr = require('tumblr.js');
var request = require('request');
var fs = require('fs');
var gm = require('gm');


module.exports = {

  process: function (qr, qrTimeData, qrWeatherData) {

    var client = tumblr.createClient({
        consumer_key: 'redacted',
        consumer_secret: 'redacted',
        token: 'redacted',
        token_secret: 'redacted',
    });

    var blogName = 'qrtimegovernor';

    var commaSeparatedTags = 'automated,QR,time,' + qrTimeData + ',' + qrWeatherData;

    var download = function(uri, file, callback){
      request.head(uri, function(err, res, body){

        request(uri).pipe(fs.createWriteStream(file)).on('close', callback);
      });
    };

    download(qr.time, 'time.png', function(){
       download(qr.weather, 'weather.png', function(){
          gm()
              .in('-page', '+150+0')
              .in('time.png')
              .minify()  
              .in('-page', '+0+0')
              .in('weather.png')                    
              .mosaic()
              .write('qr_output.jpg', function (err) {

              var imgToPost = fs.readFileSync('qr_output.jpg');
              var buff = new Buffer(imgToPost).toString('base64');

              var imageOptions = {
                  caption: qrTimeData + ' /// ' + qrWeatherData,
                  data64: buff,                                    
                  tags: commaSeparatedTags
              };

              client.createPhotoPost(blogName, imageOptions, function (err, data) {
                console.log(err);
                console.log(data);
              });

              if (err) console.log(err);
          });
       });
    });

  }
}


