
var $fil = $('#fil')
,	$search = $('#search')
,	$list = $('#list').find('a')
,	type = $('#regform').attr('type')
,	cid = parseInt(type, 10);

var $reglog = $('div#regcolog')
,	$number = $reglog.find('#number')
,	$realname = $reglog.find('#realname')
,	$regc_submit = $reglog.find('#regc_submit')
,	$regerr = $reglog.find('#regc_error');

var $checkbox = $(':checkbox')
,	$submit = $('#submit');

function Bind() {
	var cbox = new Array();
	$.each($checkbox, function(i, p){
		cbox.push(p);
	});
	$('#accept').click(function(){
		$.each($checkbox, function(i, p){
			if (i % 2 == 0) p.checked = true;
			else p.checked = false;
		});
	});
	$('#reject').click(function(){
		$.each($checkbox, function(i, p){
			if (i % 2 == 1) p.checked = true;
			else p.checked = false;
		});
	});
	cbox.forEach(function(p, i){
		$(p).change(function(){
			if (p.checked) {
				if (i % 2 == 0) cbox[i+1].checked = false;
				else cbox[i-1].checked = false
			}
		});
	});
	$submit.click(function(){
		var names = new Array(), flg = false;
		for (var i = 0; i < $checkbox.length; i++) {
			var $p = $checkbox.eq(i);
			if ($p.is(':checked')) {
				flg = true;
				var Q = {rid: $p.attr('rid')};
				if (i % 2 == 0) {
					Q.status = '2';
				} else {
					Q.status = '1';
				}
				$.post('/regUpdate', Q);
			}
		}
		if (flg) {
			if (cid && names.length > 0) {
				$.post('/regContest', {names:names,cid:cid}, function(){
					setTimeout(function(){
						window.location.reload(true);
					}, 200);
				});
			} else {
				setTimeout(function(){
					window.location.reload(true);
				}, 200);
			}
		} else {
			ShowMessage('无用的操作');
		}
	});
}

function go(page){
	var F = new Array(), G = new Array()
	,	search = JudgeString($search.val());

	if (page) F.push('page'), G.push(page);
	if (search) F.push('search'), G.push(search);
	var url = '/regform/'+type, flg = true;
	for (var i = 0; i < F.length; i++) {
		if (flg) {
			url += '?';
			flg = false;
		} else {
			url += '&';
		}
		url += F[i] + '=' + G[i];
	}

	window.location.href = url;
}

$(document).ready(function(){
	$fil.click(function(){
		go(null);
	});
	$.each($list, function(i, p){
		$(p).click(function(){
			var $li = $(this).parent();
			if ($li.hasClass('active') || $li.hasClass('disabled')) {
				return false;
			}
			go($(this).attr('id'));
		});
	});
	simulateClick($search, $fil);
	$('#reset').click(function(){
		window.location.href = '/contest/'+type;
	});

	//bind checkbox
	if ($checkbox.length) {
		Bind();
	}

	//register dialog
	if ($reglog.length > 0) {
		$reglog.jqm({
			overlay: 30,
			trigger: false,
			modal: true,
			closeClass: 'regc_close',
			onShow: function(h){
				h.o.fadeIn(200);
				h.w.fadeIn(200);
			},
			onHide: function(h){
				h.w.fadeOut(200);
				h.o.fadeOut(200);
			}
		}).jqDrag('.jqDrag').jqResize('.jqResize');

		$('#signup').click(function(){
			if ($logindialog.length > 0) {
				nextURL = '';
				$logindialog.jqmShow();
				return false;
			}
			$reglog.jqmShow();
			$number.val($number.val());
			$regc_submit.unbind('click');
			$regc_submit.click(function(){
				var num = $number.val();
				if (!num) {
					errAnimate($regerr, '学号不能为空!');
					return false;
				}
				var name = $realname.val();
				if (!name) {
					errAnimate($regerr, '姓名不能为空!');
					return false;
				}
				$.post('/doRegCon', {
					cid: type,
				    number: num,
				    realname: name,
				    sex: $reglog.find('#sex').val(),
				    college: $reglog.find('#college').val(),
				    grade: $('#grade').val()+$('#class').val()
				}, function(){
					window.location.reload(true);
				});
			});
		});
		simulateClick($number, $regc_submit);
		simulateClick($realname, $regc_submit);
	}
});

//change grade
var $ch_div = $('div#change-grade');
var $ch_input = $ch_div.find('input');
var $ch_submit = $ch_div.find('#change');

$(document).ready(function(){
	$ch_submit.click(function(){
		var user = $ch_input.eq(0).val();
		if (!user) {
			ShowMessage('The user cannot be empty.');
			return false;
		}
		var grade = $ch_input.eq(1).val();
		if (!grade) {
			ShowMessage('The grade cannot be empty.');
			return false;
		}
		$.post('/changeGrade', {cid:cid, name:user, grade:grade}, function(){
			window.location.reload(true);
		});
	});
});

//leftTime
var $left = $('#leftTime')
,	passTime = 0
,	interval;

function Timer() {
	var tp = $left.attr('left') - passTime;
	if (tp <= 0) {
		clearInterval(interval);
		$left.parent().html('<span class="success-text">报名已结束</span>');
	} else {
		if ($left.text() != deal(tp))
			$left.text(deal(tp));
	}
	++passTime;
}

$(document).ready(function(){
	Timer();
	interval = setInterval(Timer, 1000);
});