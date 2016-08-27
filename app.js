var gplay = require('google-play-scraper');
var async = require('async');
var converter = require('json-2-csv');
var http = require('http');
var csvWriter = require('csv-write-stream')
var writer = csvWriter()
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser')

var express = require('express');
var app = express();

var fs = require('fs')
var gplay = require('google-play-scraper');


// app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use(express.static('public'));
app.get('/download', function(req, res){

})

app.get('/getStatus', function(req, res){
  res.send(arrAppIds)
})

arrAppIds = [];
app.post('/getreview', function (req, res) {
  for (var i = 0; i < req.body.appid.length; i++) {
    arrAppIds.push({
      appId: req.body.appid[i],
      pageNo: 0,
      status: 'Pending'
    })
  }

  var _arrAppIds = [];
  for (var i = 0; i < arrAppIds.length; i++) {
    if (arrAppIds[i].status == 'Pending'){
      _arrAppIds.push(arrAppIds[i])
    }
  }

  async.eachSeries(_arrAppIds, function iteratee(objApp, callback) {
    objApp.status = 'Retrieving...';
    console.log('AppId:' + objApp);
    fs.writeFileSync(path.join(__dirname, '/public/download/') + objApp.appId +".csv", '');
    gplay.app({appId: objApp.appId })
    .then(function(app){
      var count = Math.ceil(app.reviews/40);
      array = [];
      for (var i = 0; i < count; i++) {
        array.push(i);
      }

      async.eachSeries(array, function iteratee(pageNo, callback) {
        getreviewdata(objApp.appId, pageNo, req.body.sort,function(result,error) {
          console.log(result.length + "- "+ pageNo);
          if (error)
          {
            res.send(error);
          }
          else
          {
            if (result.length > 0)
            {
              converter.json2csv(result, function(err, csv,response) {
                fs.appendFileSync(path.join(__dirname, '/public/download/') + app.appId +".csv", csv);
                objApp.pageNo = pageNo;
                if (pageNo == 110){
                  objApp.status = "Complete";
                }
                csv = null;
                callback();
              }, {delimiter :{wrap : '"', eol: '\r\n'}, prependHeader: (pageNo == 0? true:false)});
            }
            else{
              objApp.pageNo = pageNo;
              if (pageNo == 110){
                objApp.status = "Complete"
              }
              callback();
            }
          }
        });

      }, function done() {
        objApp.status = 'Complete';
        callback();
      });
    })
    .catch(function(e){
      res.send('There was an error fetching the application!')
    });
  }, function done(){
    // arrAppIds = [];
  })

  function getreviewdata(appid, pageno, sort,callback)
  {
    console.log(sort);
    gplay.reviews({
      appId: appid,
      page: pageno,
      reviewSortOrder: sort
    }).then(function(apps){
      callback(apps, undefined);

    }).catch(function(e){
      callback(undefined, e);
      res.send('There was an error fetching the reviews!');
    });
  }
  res.send('Success');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
