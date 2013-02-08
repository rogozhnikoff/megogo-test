// настройка экспресса

var express = require('express')
  , http = require('http')
  , cons = require('consolidate')
  , path = require('path')
  , swig = require('swig')
  , _ = require('underscore')
  , app = express();

app.configure(function () {
  app.set('port', process.env.PORT || 3333);

  swig.init({
    root: __dirname + '/views',
    allowErrors: true // allows errors to be thrown and caught by express
  });
  app.engine('html', cons.swig);
  app.set('view engine', 'html');
  app.set('views', __dirname + '/views');

  app.use(express.logger('dev'));
  app.use(express.bodyParser());


  app.use(express.static(path.join(__dirname, 'public')));

  app.set("flickrApiKey", 'ce648adfa68c9fb6f458f4264ebea258');

  app.get('/flickr/:command/:count', function (req, response) {
    response.writeHead(200, {'content-type': 'application/json'});

    if (req.param('command') === 'getPhotos') {
      var flickrJSON = '';
      http.get({
        host: 'api.flickr.com',
        port: 80,
        path: '/services/rest/' +
          '?format=json' +
          '&method=flickr.photosets.getPhotos' +
          '&extras=url_s' +
          '&api_key=' + app.get('flickrApiKey') +
          '&photoset_id=72157632657359217' +
          '&per_page=' + req.param('count') +
          '&nojsoncallback=1'
      }, function (res) {
        res.on('data',function (part) {
          // заполняем по частям ответ
          flickrJSON += part;
        }).on('end', function () {
            newJSON = JSON.parse(flickrJSON);

            // преобразовуем json, от фликра
            var ret = _(newJSON.photoset.photo).map(function(photo){
              return {
                src: photo.url_s,
                height: photo.height_s,
                width: photo.width_s,
                title: photo.title
              }
            });

            // отвечаем и закрываем соединение
            setTimeout(function(){
              response.write(JSON.stringify(ret));
              response.end();
            }, 2000);
          });
      });
    }
  });

  app.get('*', function (req, res) {
    res.render('')
  })
});

app.configure('development', function () {
  app.use(express.errorHandler())
})

http.createServer(app).listen(app.get('port'), function () {
  console.log("Express server listening on port " + app.get('port'));
});
