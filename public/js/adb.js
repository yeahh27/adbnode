$(document).ready(function () {
	var adbData = null;
	var get_list = function () {
		$.ajax('/list', {
			'success': function (list) {
				var trs = '';
				adbData = list;
				var ips = adbData.ips;
				if(ips) {
					for(var i = 0; i < ips.length; i++) {	// 테이블 내용 만들기
						trs += `<tr id="${ips[i].id}">` + 
									(ips[i].port ? 
										`<td><input type="radio" name="ip" value="${ips[i].ip}${ips[i].port}" checked></td>` + 
										`<td class="ip">` + ips[i].ip + '</td>' +
										`<td>${ips[i].port + ' ' + ips[i].model}</td>` + 
										`<td><button type="button" class="btn btn-secondary disconn">끊기</button></td>` 
									:
										'<td><input type="radio" name="radio" disabled></td>' + 
										`<td class="ip">` + ips[i].ip + '</td>' +
										`<td>-</td>` + 
										`<td><button type="button" class="btn btn-info conn">연결</button></td>`
									) +
									`<td><button type="button" class="btn btn-danger delIp">삭제</button></td>` + 
								'</tr>';
					}

					$('tbody').html(trs);
				} 

				var isConn = !ips.find(v => v.port);
				$('#screenshot').attr('disabled', isConn);
				$('#log').attr('disabled', isConn);
				$('#logC').attr('disabled', isConn);
				$('#dev').attr('disabled', isConn);
				$('#devOff').attr('disabled', isConn);

				if(adbData.dir) {
					$('#dir').val(adbData.dir);
					$('#dir').attr('disabled', true);
					$('#dirSave').text('E');
				} else { 
					$('#dir').attr('disabled', false);
					$('#dirSave').text('S');
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

	$('#screenshot').click(function () {
		if(!adbData.dir) {
			alert('파일저장 위치 설정해주세요 !!');
			$('#dir').focus();
			return;
		} else if(!$(":input:radio[name=ip]:checked").val()) {
			alert('연결된 단말 없음.');
			return;
		}
		let _ = $(this);
		_.attr("disabled", true);
		$.ajax('/screen', {
			'method': 'POST',
			'data': {
				'ip': $(":input:radio[name=ip]:checked").val(),
				'dir': adbData.dir
			},
			'success': function(fileName) {
				if(fileName) {
					alert(`${fileName}.png 캡쳐 완료.`);
					// 캡쳐 미리보기
				} else {
					alert(`Screenshot Failed.`);
				}
				_.attr("disabled", false);
			}
		});
	});

	$('#log').click(function () {
		if(!adbData.dir) {
			alert('파일저장 위치 설정해주세요 !!');
			$('#dir').focus();
			return;
		} else if(!$(":input:radio[name=ip]:checked").val()) {
			alert('연결된 단말 없음.');
			return;
		}
		let _ = $(this);
		_.attr("disabled", true);
		$.ajax('/log', {
			'method': 'POST',
			'data': {
				'ip': $(":input:radio[name=ip]:checked").val(),
				'dir': adbData.dir
			},
			'success': function(fileName) {
				_.attr("disabled", false);
				alert(`${fileName}.log 파일 생성 완료.`);
				// 파일 열기
			}
		});
	});

	$('#logC').click(function () {
		if(!$(":input:radio[name=ip]:checked").val()) {
			alert('연결된 단말 없음.');
			return;
		}
		let _ = $(this);
		_.attr("disabled", true);
		$("#log").attr("disabled", true);
		$.ajax('/logClear', {
			'method': 'POST',
			'data': {
				'ip': $(":input:radio[name=ip]:checked").val()
			},
			'success': function(fileName) {
				_.attr("disabled", false);
				$("#log").attr("disabled", false);
			}
		});
	});

	$('#dirSave').click(function () {
		// 값 체크 필요.
		var dir = $('#dir').val().replace(/\\/g, '\/');
		if($('#dir').attr('disabled')) {
			$('#dir').attr('disabled', false);
			$('#dirSave').text('S');
			$('#dir').focus();
		} else {
			if(adbData.dir == dir) {
				$('#dir').attr('disabled', true);
				$('#dirSave').text('E');
				return;
			}
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
		}
	});

	var inputW = function() {
		if($('#word').val() != '' && $(":input:radio[name=ip]:checked").val()) {
			$.ajax('/word', {
				'method': 'POST',
				'data': {
					'word': $('#word').val().replace(/\s/g, ""),
					'ip': $(":input:radio[name=ip]:checked").val()
				},
				'success': function(str) {
					console.log(str);
				}
			});
		}
	};

	$('#word').keydown(function(e) {
		if(e.keyCode == 13) {
			inputW();
		}
	});

	$('#wordBtn').click(function () {
		inputW();
	});
	
	var inputT = function() {
		$.ajax('/typing', {
			'method': 'POST',
			'data': {
				'typing': $('#typing').val().replace(/\s/g, "%s"),
				'ip': $(":input:radio[name=ip]:checked").val()
			},
			'success': function(str) {
			}
		});
	};
	
	$('#typing').keydown(function(e) {
		if(e.keyCode == 13) {
			inputT();
		}
	});

	$('#typeBtn').click(function() {
		inputT();
	});

	var keyEvent = function(code) {
		$.ajax('/keyEvent', {
			'method': 'POST',
			'data': {
				'code': code,
				'ip': $(":input:radio[name=ip]:checked").val()
			},
			'success': function(str) {
			}
		});
	};

	$('#typeCBtn').click(function() {
		keyEvent('20 19 67');		// 아래 > 위 > 삭제
	});

	$('#dev').click(function () {
		if(!$(":input:radio[name=ip]:checked").val()) {
			alert('연결된 단말 없음.');
			return;
		}
		let _ = $(this);
		_.attr("disabled", true);
		$.ajax('/dev', {
			'method': 'POST',
			'data': {
				'ip': $(":input:radio[name=ip]:checked").val()
			},
			'success': function() {
				_.attr("disabled", false);
			}
		});
	});
	
	$('#devOff').click(function () {
		if(!$(":input:radio[name=ip]:checked").val()) {
			alert('연결된 단말 없음.');
			return;
		}
		let _ = $(this);
		_.attr("disabled", true);
		$.ajax('/devOff', {
			'method': 'POST',
			'data': {
				'ip': $(":input:radio[name=ip]:checked").val()
			},
			'success': function() {
				_.attr("disabled", false);
			}
		});
	});

	$('#remote').on('click', 'button', function (e) {
		if(e.target.value) keyEvent(e.target.value);
	});
});