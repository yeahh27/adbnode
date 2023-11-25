$(document).ready(function () {
	var adbData = null;
	var get_list = function () {
		$.ajax('/list', {
			'success': function (list) {
				var trs = '';
				adbData = JSON.parse(list);
				console.log(adbData)
				var ips = adbData.ips;
				if(ips) {
					for(var i = 0; i < ips.length; i++) {	// 테이블 내용 만들기
						// var isConn = adbData.devices.filter(v => v.ip == ips[i].ip);
						var isConn = adbData.devices.filter(v => {
							if(v.ip == ips[i].ip) {
								v.id = ips[i].id;
								return v;
							}
						});
						// console.log("isConn", isConn);
						trs += `<tr id="${ips[i].id}">` + 
									'<td>' + (i + 1) + '</td>' + 
									`<td class="ip">` + ips[i].ip + '</td>' +
									(isConn[0] ? 
										`<td>${isConn[0].port + ' ' + isConn[0].model}</td>` + 
										`<td><button type="button" class="btn btn-success screenshot">캡</button></td>` + 
										`<td><button type="button" class="btn btn-warning log">록</button></td>` + 
										`<td><button type="button" class="btn btn-secondary disconn">끊기</button></td>` 
									:
										`<td>-</td><td>-</td><td>-</td>` + 
										`<td><button type="button" class="btn btn-info conn">연결</button></td>`
									) +
									`<td><button type="button" class="btn btn-danger delIp">삭제</button></td>` + 
								'</tr>';
					}
	
					$('tbody').html(trs);
					if(adbData.dir) {
						$('#dir').val(adbData.dir);
						$('#dir').removeClass('none');
					} else { 
						$('#dir').addClass('none');
					}
				}
			}
		});
	};
	
	get_list();
	
	$('.form-inline #connect').click(function () {
		var regexr =  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/g;
		if(!regexr.test($('#ip').val())) return;
		
		$.ajax('/connect', {
			'method': 'POST',
			'dataType': 'JSON',
			'data': {
				"ip": $('#ip').val()
			},
			'success': function() {
				// $('#ip').val('');
				get_list();
			}
		});
	});

	$('.form-inline #disconnect').click(function () {
		let regexr = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/g;
		if(!regexr.test($('#ip').val())) return;
		
		$.ajax('/disconnect', {
			'method': 'POST',
			'dataType': 'JSON',
			'data': {
				"ip": $('#ip').val()
			},
			'success': function() {
				$('#ip').val('');
				get_list();
			}
		});
	});

	$('.form-inline #disconnectAll').click(function () {
		$.ajax('/disconnect', {
			'method': 'POST',
			'dataType': 'JSON',
			'data': {
				"ip": ""
			},
			'success': function() {
				get_list();
			}
		});
	});

	
	$('tbody').on('click', '.conn', function () {
		$.ajax('/connect', {
			'method': 'POST',
			'dataType': 'JSON',
			'data': {
				"ip": adbData.ips.find(v => v.id == $(this).closest('tr').attr('id')).ip
			},
			'success': function() {
				get_list();
			}
		});
	});

	$('tbody').on('click', '.disconn', function () {
		$.ajax('/disconnect', {
			'method': 'POST',
			'dataType': 'JSON',
			'data': {
				"ip": adbData.ips.find(v => v.id == $(this).closest('tr').attr('id')).ip
			},
			'success': function() {
				get_list();
			}
		});
	});

	$('tbody').on('click', '.delIp', function () {
		$.ajax('/del', {
			'method': 'POST',
			'data': {
				'id': $(this).closest('tr').attr('id')
			},
			'success': function() {
				get_list();
			}
		});
	});

	$('tbody').on('click', '.screenshot', function () {
		if(!adbData.dir) {
			alert('파일저장 위치 설정해주세요 !!');
			$('#dir').focus();
			return;
		} 
		let _ = $(this);
		_.attr("disabled", true);
		$.ajax('/screen', {
			'method': 'POST',
			'data': {
				'ip': adbData.ips.find(v => v.id == $(this).closest('tr').attr('id')).ip
			},
			'success': function(fileName) {
				alert(`${fileName}.png 캡쳐 완료.`);
				_.attr("disabled", false);
			}
		});
	});

	$('tbody').on('click', '.log', function () {
		if(!adbData.dir) {
			alert('파일저장 위치 설정해주세요 !!');
			$('#dir').focus();
			return;
		} 
		let _ = $(this);
		_.attr("disabled", true);
		$.ajax('/log', {
			'method': 'POST',
			'data': {
				// 'ip': $(this).data('sc'),
				'dir': adbData.dir
			},
			'success': function() {
				_.attr("disabled", false);
			}
		});
	});

	$('#dirSave').click(function () {
		var dir = $('#dir').val();
		if(dir) {
			$.ajax('/dir', {
				'method': 'POST',
				'data': {
					'dir': dir
				},
				'success': function() {
					alert(`저장 완료.`);
					get_list();
				}
			});
		}
	});
});