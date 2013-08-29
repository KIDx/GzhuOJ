
var $fil = $('#fil')
,	$search = $('#search')
,	$list = $('#list').find('a')
,	type = $('#contest').attr('type');

function go(page){
	var F = new Array(), G = new Array()
	,	search = JudgeString($search.val());

	if (page) F.push('page'), G.push(page);
	if (search) F.push('search'), G.push(search);
	var url = '/contest/'+type, flg = true;
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
});

var $register = $('a.register')
,	passTime = 0, timer
,	interval;

function Timer() {
	$.each($register, function(){
		var cid = $(this).attr('id');
		var tp = $(this).attr('left') - passTime;
		if (tp <= 0) {
			clearInterval(interval);
			$(this).parent().html('<span class="user-gray">Register Closed</span>');
		} else {
			var $pre = $(this).prev();
			if ($pre.text() != deal(tp))
				$pre.text(deal(tp));
		}
	});
	++passTime;
}

$(document).ready(function(){
	if ($register.length) {
		Timer();
		interval = setInterval(Timer, 1000);
		$.each($register, function(){
			$(this).click(function(){
				if ($(this).hasClass('public')) {
					if ($logindialog.length > 0) {
						nextURL = '';
						$logindialog.jqmShow();
						return false;
					}
					var $clickreg = $(this);
					var cid = parseInt($clickreg.attr('id'));
					$.post('/contestReg', {cid:cid}, function(res){
						if (res) {
							window.location.reload(true);
							return ;
						}
						$clickreg.parent().html('<span class="user user-green">Registeration Complete</span>');
						ShowMessage('Your Registeration has been submited successfully!');
					});
				}
			});
		});
	}
});

var $logcolog = $('div#logcolog')
,	$psw = $logcolog.find('#contest_password')
,	$submit = $logcolog.find('#contest_submit')
,	$err = $logcolog.find('#contest_error')
,	$cid = $('a.cid');

$(document).ready(function(){
	if ($cid.length) {
		$.each($cid, function(){
			$(this).click(function(){
				var cid = $(this).attr('id');
				$logcolog.jqmShow();
				$submit.unbind();
				$psw.unbind();
				$submit.click(function(){
					if (!$psw.val()) {
						errAnimate($err, 'the password can not be empty!');
						return false;
					}
					$.post('/loginContest', {
						cid: cid,
						psw: $psw.val()
					}, function(res){
						if (res) {
							window.location.href = '/onecontest/'+cid;
							return ;
						}
						errAnimate($err, 'the password is not correct!');
					});
				});
				simulateClick($psw, $submit);
			});
		});
	}
});

$(document).ready(function(){
	if ($logcolog.length > 0) {
		$logcolog.jqm({
			overlay: 30,
			trigger: false,
			modal: true,
			closeClass: 'contestclose',
			onShow: function(h){
				h.o.fadeIn(200);
				h.w.fadeIn(200);
			},
			onHide: function(h){
				h.w.fadeOut(200);
				h.o.fadeOut(200);
			}
		}).jqDrag('.jqDrag').jqResize('.jqResize');
	}
});

$(document).ready(function(){
	if ($logindialog.length) {
		$.each($('a.check'), function(){
			$(this).click(function(){
				nextURL = '/onecontest/'+$(this).attr('id');
				$logindialog.jqmShow();
			});
		})
	}
});