
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

const electron = require('electron');   // 일렉트론 모듈을 읽어들임
const elApp = electron.app; // 일렉트론 애플리케이션 객체에 대한 참조를 저장
const BrowserWindow = electron.BrowserWindow; // BrowserWindow 클래스의 참조 저장

let mainWindow = null;  // 애플리케이션 화면을 저장할 변수 선언

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
app.post('/log', adb.log);
app.post('/logClear', adb.logClear);
app.post('/dev', adb.dev);
app.post('/devOff', adb.devOff);

// 서버 실행
/* http.createServer(app).listen(app.get('port'), function(){
  // console.log("Express server listening on port " + app.get('port'));
  console.log(`Express server listening on http://${ip.address()}:${app.get('port')}`);
});

// macOS를 제외하고, 화면이 모두 종료되면 애플리케이션을 곧바로 종료하게 합니다.
elapp.on('window-all-closed', () => {
  if(process.platform !== 'darwin') elapp.quit();
});

// 애플리케이션이 로드되면 mainWindow 변수에 BrowserWindow 클래스 인스턴스를 할당해서,
// 애플리케이션 화면이 가비지 컬렉션에 의해 회수되지 않게 합니다.
elapp.on('ready', () => {
  mainWindow = new BrowserWindow();
  mainWindow.loadURL(`file://${__dirname}/views/index.ejs`);  // index.ejs를 읽어들입니다.
  mainWindow.on('close', () => { mainWindow = null; }); // 애플리케이션 화면을 닫으면, mainWindow 변수를 null로 비워줍니다.
}); */

elApp.on('ready', function() {
  http.createServer(app).listen(app.get('port'), function(){
    console.log(`Express server listening on http://${ip.address()}:${app.get('port')}`);
    mainWindow = new BrowserWindow({
      width: 1000,
      height: 900,
      autoHideMenuBar: true,
      useContentSize: true,
      resizable: false,
    })
    mainWindow.loadURL(`http://${ip.address()}:${app.get('port')}`);
    mainWindow.focus();
    mainWindow.on('close', () => { mainWindow = null; }); 
  });
});