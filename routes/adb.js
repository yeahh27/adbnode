
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
    
	adbExec('adb devices -l', (rs) => {
		if(rs.resCode == 'stdout') {
			var devices = rs.resMsg.split('\r\n').filter(v => regexr1.test(v));
			if(fs.existsSync('./adb_data.json')) {
				fs.readFile('./adb_data.json', {
					'encoding': 'utf8'
				}, function (err, list) {	// adb_data.json 파일 읽기
					let regexr2 = /^(.*?)(?=:)|:(\d{4})|(?<=model:)(.*?)(?=\s)/g;
					let diff = [];
					list = JSON.parse(list).ips.map((v, i) => {
						devices.map(v2 => {
							let d = v2.match(regexr2);
							if(v.ip == d[0]) {
								diff.push(i);
								Object.assign(v, {port: d[1], model: d[2]})
							}
						})
						return v;
					});
					if(diff.length == 0) {
						list = `${list.slice(0,-1)}, "devices": ${JSON.stringify(devList)}}`;
						res.json(list);
					} else {
						list = JSON.parse(list);
						for(var i=0; i<diff.length; i++) {
							list.ips.push({
								"id" : list.ips.length + 1,
								"ip" : diff[i]
							});
						}
						/* fs.writeFile('./adb_data.json', JSON.stringify(list), function (err) {	// adb_data.json 파일 쓰기
							list.devices = devList;
							res.json(JSON.stringify(list));
						}); */
					}
				});
			} else {
				var ips = [];
				for(var i=0; i<devices.length; i++) {
					ips.push({
						"id" : i,
						"ip" : devices[i].split(":")[0]
					});
				}
				var list = { 'ips': ips, 'dir': '' };
				fs.writeFile('./adb_data.json', JSON.stringify(list), function (err) {	// adb_data.json 파일 쓰기
					list.devices = devices;
					res.json(JSON.stringify(list));
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
	var fileName = moment().format('YYYYMMDDHHmmSSss');
	adbExec(`adb -s ${req.body.ip} shell screencap -p /sdcard/${fileName}.png`, (rs) => {
		if(rs.resCode == 'stdout') {
			adbExec(`adb -s ${req.body.ip} pull /sdcard/${fileName}.png C:/Users/User/Desktop`, (rs) => {
				if(rs.resCode == 'stdout') {
					adbExec(`adb -s ${req.body.ip} shell rm /sdcard/${fileName}.png`, (rs) => {
						res.json(fileName);
					});
				}
			});
		}		
	});
};

exports.log = function(req, res) {
	console.log("123", req.body.ip, req.body.dir)
	/* var fileName = moment().format('YYYYMMDDHHmmSSss');
	adbExec(`adb -s ${req.body.ip} shell screencap -p /sdcard/${fileName}.png`, (rs) => {
		if(rs.resCode == 'stdout') {
			adbExec(`adb -s ${req.body.ip} pull /sdcard/${fileName}.png C:/Users/User/Desktop`, (rs) => {
				if(rs.resCode == 'stdout') {
					adbExec(`adb -s ${req.body.ip} shell rm /sdcard/${fileName}.png`, (rs) => {
						res.json(fileName);
					});
				}
			});
		}		
	}); */
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