
var $cname = $('#cname')
,	$err = $('#err')
,	$err2 = $('#err2')
,	cid = $('#addcourse').attr('cid')
,	$a = $('#a')
,	$b = $('#b')
,	$del = $('span.del');

function check($p) {
	var tp = parseInt($p.val(), 10);
	if (!tp) tp = '';
	$p.val(tp);
}

$(document).ready(function(){
	$a.change(function(){
		check($a);
	});
	$b.change(function(){
		check($b);
	});
	$.each($del, function(i, p){
		$(p).click(function(){
			$.post('/delCourseProb', {pid: $(this).attr('id'), cid: cid}, function(err){
				window.location.reload(true);
			});
		});
	});
	$('#submit').click(function(){
		if (!$cname.val()) {
			errAnimate($err, '课程名称不能为空！');
			window.location.href = '#';
			return false;
		}
		check($a); check($b);
		var a = parseInt($a.val(), 10), b = parseInt($b.val(), 10);
		if (!a && b || a && !b) {
			errAnimate($err2, '添加题目不能为空！');
			window.location.href = '#';
			return false;
		}
		var Q = {title:$cname.val(), cid:cid};
		if (a && b) {
			if (a > b) {
				var tp = a; a = b; b = tp;
			}
			if (b - a + 1 > 100) {
				errAnimate($err2, '一次添加不得超过100道题！');
				return false;
			}
			Q.a = a; Q.b = b;
		}
		$.post('/addcourse', Q, function(res){
			if (!res) {
				window.location.reload(true);
			} else {
				window.location.href = '/addcourse?id='+res;
			}
		});
	});
});