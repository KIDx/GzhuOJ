
var content;

$(document).ready(function(){
	content = CKEDITOR.replace( 'content' );
});

var $submit = $('#submit')
,	$err = $('#err')
,	$title = $('#Title')
,	$vcode = $('#vcode')
,	$vcimg = $('#vcimg')
,	tid = parseInt($('#addtopic').attr('tid'), 10);

function getVcode() {
	$.post('/createVerifycode', function(res){
		$vcimg.html(res);
	});
}

$(document).ready(function(){
	$vcimg.click(function(){
		getVcode();
	});
});

$(document).ready(function(){
	$submit.click(function(){
		var title = JudgeString($title.val());
		if (!title) {
			errAnimate($err, '标题不能为空！');
			return false;
		}
		if (!JudgeString(content.document.getBody().getText())) {
			errAnimate($err, '内容不能为空！');
			return false;
		}
		var vcode = $vcode.val();
		if (!vcode) {
			errAnimate($err, '验证码不能为空！');
			return false;
		}
		if ($submit.hasClass('disabled')) {
			return false;
		}
		$submit.addClass('disabled');
		var data = {title:title, content:content.getData(), vcode:vcode};
		if (tid) {
			data.tid = tid;
		}
		$.post('/addtopic', data, function(res){
			if (res == '1') {
				errAnimate($err, '验证码错误！');
			} else if (res == '2') {
				errAnimate($err, '系统错误！');
			} else {
				window.location.href = '/topic/'+res;
			}
			$submit.removeClass('disabled');
		});
	});
	simulateClick($vcode, $submit);
	simulateClick($title, $submit);
});