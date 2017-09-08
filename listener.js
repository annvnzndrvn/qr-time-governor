const express = require('express')
const app = express()
var tumblrUploader = require('./tumblrPoster');
var request = require('request');
var moment = require('moment-timezone');

app.get('/', function (req, res) {
  var currentDate = new Date;
  var currentHour = ('0'+currentDate.getHours()).slice(-2);
  var currentMinute = ('0'+currentDate.getMinutes()).slice(-2);

  res.send('- qr time poster server - ' + currentHour + ':' + currentMinute);
})

app.listen(9191, function () {
    console.log('Listening on port 9191');
})

var minute = 60 * 1000;
var tasksScheduledThisMinute = [];

checkingForTaskExecution();

function checkingForTaskExecution() {

    var currentDate = new Date("en-US", {timeZone: "America/Los_Angeles"});
    
    moment.tz.setDefault("America/Los_Angeles");
    moment().tz("America/Los_Angeles");

    var currentMinute = ('0'+moment().minute()).slice(-2);

    var qrTimeData = moment().toLocaleString();

    var openWeatherURL = 'http://api.openweathermap.org/data/2.5/weather?'
    var wQuery = {
        APPID: 'redacted',
        id: '5391959' // San Francisco, CA
    }

    var qrWeatherData = '[ERR:weather-data-unavailable]';

    var qrObj = {
        time: '',
        weather: ''
    }

    var debugging = false;

    if (currentMinute == '00' || debugging) {
        qrTimeData = qrTimeData.replace(/\s+/g, '-');                    
        var timeQuery = 'https://api.qrserver.com/v1/create-qr-code/?data=' + qrTimeData + '&amp;size=25x25'
        qrObj.time = timeQuery;

        request({
            url: openWeatherURL,
            qs: wQuery
            }, function (error, response, body) {
                if (error) {
                    var json = JSON.parse(body);
                    qrWeatherData = json.weather[0].description + ' in ' + json.name + ' ' + json.sys.country;
                    qrWeatherData = qrWeatherData.replace(/\s+/g, '-').toLowerCase();   

                    console.log('error:', error);
                    var weatherQuery = 'https://api.qrserver.com/v1/create-qr-code/?data=' + qrWeatherData + '&amp;size=25x25';
                    qrObj.weather = weatherQuery;

                    console.log('new hour - posting time - ' + qrTimeData + ' // ' + qrWeatherData);

                    tumblrUploader.process(qrObj, qrTimeData, qrWeatherData);   
                } 
                else if (response && body) {
                    console.log('statusCode:', response && response.statusCode);

                    var json = JSON.parse(body);
                    qrWeatherData = json.weather[0].description + ' in ' + json.name + ' ' + json.sys.country;
                    qrWeatherData = qrWeatherData.replace(/\s+/g, '-').toLowerCase();                    

                    var weatherQuery = 'https://api.qrserver.com/v1/create-qr-code/?data=' + qrWeatherData + '&amp;size=25x25';

                    console.log('new hour - posting time - ' + qrTimeData + ' // ' + qrWeatherData);

                    qrObj.weather = weatherQuery;
                    console.log(qrObj);
                    tumblrUploader.process(qrObj, qrTimeData, qrWeatherData);  
                }   
        })                
    }
    else {
        console.log('current time - ' + qrTimeData);
    }
}

function repeatEvery(time, interval) {
    var now = new Date(),
        delay = interval - now % interval;

    function start() {
        time();
        setInterval(time, interval);
    }

    setTimeout(start, delay);
}

repeatEvery(checkingForTaskExecution, minute);

