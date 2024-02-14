
/**
 * Module dependencies.
 */
'use strict';

// 모듈 가져오기
var express = require('express')
// var routes = require('./routes')
var adb = require('./routes/adb')
var http = require('http')
var path = require('path'); 
var bodyParser = require('body-parser');
var ip = require('ip');

var app = express();	// 어플리케이션 생성
var port = 8090;		// 어플리케이션 포트

// 어플리케이션 설정
// app.configure(function(){
  app.set('port', port);					// 웹 서버 포트
  app.set('views', path.join(__dirname, 'views'));	// 템플릿
  app.set('view engine', 'ejs');			// 템플릿 엔진
  // app.use(express.favicon());				// 파비콘
//   app.use(express.logger('dev'));			// 로그 기록
//   app.use(express.methodOverride());		// 구식 브라우저 메소드 지원
//   app.use(app.router);						// 라우팅
 app.use(express.json());
 app.use(bodyParser.json());
 app.use(bodyParser.urlencoded({ extended: true }));
	
  // 정적 리소스 처리
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
// });

/* app.configure('development', function(){	// 개발 버전
  app.use(express.errorHandler());			// 에러 메세지
}); */

// 라우팅
app.get('/', function(req, res){
  res.render('index', { title: 'ADB' });
});
app.get('/list', adb.list);
app.post('/connect', adb.connect);
app.post('/disconnect', adb.disconnect);
app.post('/del', adb.del);
app.post('/screen', adb.screen);
app.post('/dir', adb.dir);
app.post('/word', adb.word);
app.post('/typing', adb.typing);
app.post('/keyEvent', adb.keyEvent);
app.post('/log', adb.log);
app.post('/logClear', adb.logClear);
app.post('/dev', adb.dev);
app.post('/devOff', adb.devOff);

// 서버 실행
http.createServer(app).listen(app.get('port'), function(){
  // console.log("Express server listening on port " + app.get('port'));
  console.log(`Express server listening on http://${ip.address()}:${app.get('port')}`);
});