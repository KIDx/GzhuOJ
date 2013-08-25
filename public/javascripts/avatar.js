var $imgform = $("#image_form");
var $imgload = $('#imgload');
var $imgerr = $('#imgerr');
var $choosebox = $('#choosebox');
var $file = $('#file');

function error_animate (){
	$imgerr.stop().stop().animate({
		'margin-left':'50px'
	}).animate({
		'margin-left':'10px'
	});
}

$(document).ready(function(){
	$choosebox.click(function(){
		$file.click();
	});
	$file.change(function(){
		$choosebox.text($file.val());
	});

	$('#upload').click(function(){
		if (!$file.val()) {
			$imgerr.removeClass().addClass('text-error');
			$imgerr.text('请选择文件！');
			error_animate();
			return false;
		}
		$imgerr.text('');
		$imgload.show();
		$imgform.ajaxForm({
			url: $imgform.attr('action'),
			type: 'POST',
			success: function (res, status, xhr, $form) {
				var tp;
				if (!res) tp = '服务器异常错误！';
				else if (res == '1') tp = '图片大小不得超过2m！';
				else if (res == '2') tp = '文件类型必须是图片！';
				else if (res == '3') window.location.reload(true);
				$imgerr.removeClass().addClass('text-error');
				error_animate();
				$imgerr.text(tp);
				$imgload.hide();
				$choosebox.text('点击选择图片');
				$imgform.clearForm();
			},
			error: function (res, status, e) {
				alert(e);
				$imgload.hide();
				$imgform.clearForm();
			}
		});
	});
});