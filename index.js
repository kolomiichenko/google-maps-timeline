var request = require('request');
var xml = require('xmlbuilder');
var fs = require('fs');

var readline = require('readline');
var iface = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

iface.question('Please, type URL ', function(url) {
  iface.question('Please, type a date in format YYYY-mm-dd ', function(date) {
    iface.close();

    var unixTime = Date.parse(date) / 1000;

    request(url, function (error, response, data) {
      if (!error && response.statusCode == 200) {

        if (error) {
          return console.log(error);
        }

        console.log(data);

        data = data.substring(data.indexOf('( ["') + 2);
        data = data.substring(0, data.length - 2);

        var json = JSON.parse(data);


        var locations = [];

        json[1].forEach(function(el) {
          locations.push(el[1][0]);
          locations.push(el[1][1]);
        });

        var timestamps = [];

        for (var sec=0; sec<86400; sec += 86400 / locations.length) {
          timestamps.push(unixTime + sec);
        }

        var gpx = xml.create('gpx', {version: '1.0', encoding: 'UTF-8'}, {'xmlns:xsi': 'qwerty'})
        .att({
          'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          version: 1.0,
          xmlns: 'http://www.topografix.com/GPX/1/0',
          creator: 'Google Maps Timeline Parser',
          'xsi:schemaLocation': 'http://www.topografix.com/GPX/1/0 http://www.topografix.com/GPX/1/0/gpx.xsd'
        })
        .ele({
          time: new Date(unixTime * 1000).toISOString(),
          trk: {
            name: 'Timeline'
          }
        })
        .ele({
          trkseg: {}
        });

        for (var i=0; i<locations.length; i++) {
          var d = new Date(timestamps[i]*1000).toISOString();
          console.log(d);
          var item = gpx.ele('trkpt');
          item.att({
            lat: locations[i][0],
            lon: locations[i][1]
          })
          item.ele({time: d});
        }

        var gpxString = gpx.end({ pretty: true, indent: '  ', newline: '\n' });

        fs.writeFile(__dirname + 'log.gpx', gpxString, function(err) {
            if (err) {
              console.error(err);
            }
            process.exit();
        });



      } else {
        console.error(error);
        process.exit();
      }

    });
  });
});
