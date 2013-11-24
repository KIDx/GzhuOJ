
var content;

$(document).ready(function(){
	content = CKEDITOR.replace( 'content' );
});

var $submit = $('#submit')
,	$err = $('#err')
,	$title = $('#Title')
,	tid = parseInt($('#addtopic').attr('tid'), 10);

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
		if ($submit.hasClass('disabled')) {
			return false;
		}
		$submit.addClass('disabled');
		var data = {title:title, content:content.getData()};
		if (tid) {
			data.tid = tid;
		}
		$.post('/addtopic', data, function(tid){
			window.location.href = '/topic/'+tid;
		});
	});
});