
/*
 * GET adb
 */

var fs = require('fs');	// 파일 시스템 모듈
var cp = require('child_process');
var moment = require('moment');

var adbExec = function (command, callback) {
	cp.exec(command, (error, stdout, stderr) => {
		var result = {};
		if (error) {
			console.log(`error: ${error.message}`);
			result = {
				resCode: 'error',
				resMsg: error.message
			};
		} else if (stderr) {
			console.log(`stderr: ${stderr}`);
			result = {
				resCode: 'stderr',
				resMsg: stderr
			};
		} else {
			// console.log(`stdout: ${stdout}`);
			result = {
				resCode: 'stdout',
				resMsg: stdout
			};
		}
		callback(result);
	});
}

exports.list = function(req, res){
	var regexr1 = /^(([1-9]?\d|1\d{2}|2([0-4]\d)|25[0-5])\.){3}([1-9]?\d|1\d{2}|2([0-4]\d)|25[0-5])/;
	// var regexr =  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/;
    var regexr2 = /^(.*?)(?=:)|:(\d{4})|(?<=model:)(.*?)(?=\s)/g;

	adbExec('adb devices -l', (rs) => {
		if(rs.resCode == 'stdout') {
			var devices = rs.resMsg.split('\n').filter(v => regexr1.test(v));
			if(fs.existsSync('./adb_data.json')) {
				fs.readFile('./adb_data.json', {
					'encoding': 'utf8'
				}, function (err, list) {	// adb_data.json 파일 읽기
					list = JSON.parse(list);

					let diff = devices.map(v => v.split(":")[0]).filter(v => !list.ips.map(v2 => v2.ip).includes(v))
					if(diff.length > 0) {
						for(var i=0; i<diff.length; i++) {
							list.ips.push({
								id : list.ips.length + 1,
								ip : diff[i]
							});
						}
						fs.writeFile('./adb_data.json', JSON.stringify(list), function (err) {	// adb_data.json 파일 쓰기
						});
					} 
					list.ips = list.ips.map(v => {
						devices.map(v2 => {
							let d = v2.match(regexr2);
							if(v.ip == d[0]) {
								Object.assign(v, {port: d[1], model: d[2]})
							}
						})
						return v;
					});
					res.json(list);
				});
			} else {
				var ips = [];
				var ipsInfo = [];
				devices.map((v, i) => {
					let d = v.match(regexr2);
					ips.push({
						id : i,
						ip : d[0]
					});
					ipsInfo.push({
						port : d[1],
						model : d[2]
					});
				})
				var list = { 'ips': ips, 'dir': '' };
				fs.writeFile('./adb_data.json', JSON.stringify(list), function (err) {	// adb_data.json 파일 쓰기
					list.ips.map((v, i) => {
						Object.assign(v, ipsInfo[i]);
					})
					res.json(list);
				});
			}
		}
	});
};

exports.connect = function(req, res){
	adbExec(`adb connect ${req.body.ip}`, (rs) => {
		if(rs.resCode == 'stdout') {
			fs.readFile('./adb_data.json', {
				'encoding': 'utf8'
			}, function (err, data) {
				data = JSON.parse(data);
				if(data.ips.find(v => v.ip == req.body.ip)) {
					res.json(true);
					return;
				}
				data.ips.push({
					"id" : data.ips.slice(-1)[0] ? data.ips.slice(-1)[0].id + 1 : 0,
					"ip" : req.body.ip
				});
				fs.writeFile('./adb_data.json', JSON.stringify(data), function (err) {
					res.json(true);
				});
			});
		}
	});
};

exports.disconnect = function(req, res){
	adbExec(`adb disconnect ${req.body.ip}`, (rs) => {
		if(rs.resCode == 'stdout') {
			// console.log("adb disconnect result : ", rs);
			res.json(true);
		}
	});
};

exports.del = function(req, res){
	fs.readFile('./adb_data.json', {
		'encoding': 'utf8'
	}, function (err, data) {
		data = JSON.parse(data);
		data.ips = data.ips.filter(v => v.id != req.body.id);

		fs.writeFile('./adb_data.json', JSON.stringify(data), function (err) {
			res.json(true);
		});
	});
};

exports.screen = function(req, res) {
	var fileName = moment().format('YYYYMMDD_HHmmSSss');
	adbExec(`adb -s ${req.body.ip} shell screencap -p /sdcard/${fileName}.png`, (rs) => {
		if(rs.resCode == 'stdout') {
			adbExec(`adb -s ${req.body.ip} pull /sdcard/${fileName}.png ${req.body.dir}`, (rs) => {
				if(rs.resCode == 'stdout') {
					adbExec(`adb -s ${req.body.ip} shell rm /sdcard/${fileName}.png`, (rs) => {
						res.json(fileName);
					});
				}
			});
		} else {
			res.json(null);
		}
	});
	
};

exports.log = function(req, res) {
	var fileName = moment().format('YYYYMMDD_HHmmSSss');
	adbExec(`adb -s ${req.body.ip} logcat -d -v time > ${req.body.dir}/${fileName}.log`, (rs) => {
		if(rs.resCode == 'stdout') {
			res.json(fileName);
		}
	});
};

exports.logClear = function(req, res) {
	adbExec(`adb -s ${req.body.ip} logcat -c`, (rs) => {
		if(rs.resCode == 'stdout') {
			res.json(true);
		}
	});
};

exports.dir = function(req, res){
	fs.readFile('./adb_data.json', {
		'encoding': 'utf8'
	}, function (err, data) {
		data = JSON.parse(data);
		data.dir = req.body.dir;
		fs.writeFile('./adb_data.json', JSON.stringify(data), function (err) {
			res.json(true);
		});
	});
};

exports.word = function(req, res) {
	adbExec(`adb -s ${req.body.ip} shell am broadcast -a "kt.action.voicecommand.asr" --es "kwsText" "${req.body.word}"`, (rs) => {
		if(rs.resCode == 'stdout') {
			res.json(`INPUT(${req.body.ip}) ${req.body.word}`);
		} else {
			res.json("INPUT FAILED.");
		}
	});
};

exports.typing = function(req, res) {
	adbExec(`adb -s ${req.body.ip} shell input text '${req.body.typing}'`, (rs) => {
		res.json(true);
	});
};

exports.keyEvent = function(req, res) {
	adbExec(`adb -s ${req.body.ip} shell input keyevent ${req.body.code}`, (rs) => {
		res.json(true);
	});
};

exports.dev = function(req, res) {
	adbExec(`adb -s ${req.body.ip} shell am broadcast -a "kt.action.container.devmode.req" --ei "devmodeState" 1 --ei "pwrState" 0 --es "userKey" "UNKNOWN" --es "uword" "개발자모드"`, (rs) => {
		res.json(true);
	});
};

exports.devOff = function(req, res) {
	adbExec(`adb -s ${req.body.ip} shell am broadcast -a "kt.action.container.devmode.req" --ei "devmodeState" 0 --ei "pwrState" 0 --es "userKey" "UNKNOWN" --es "uword" "개발자모드해제"`, (rs) => {
		res.json(true);
	});
};