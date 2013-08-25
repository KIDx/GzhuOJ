
var $imgform = $("#image_form");
var $image = $('#image');
var $imgload = $('#imgload');
var $imgerr = $('#imgerr');

var $dataform = $('#data_form');

$(document).ready(function(){
	CKEDITOR.replace( 'Description' );
	CKEDITOR.replace( 'Input' );
	CKEDITOR.replace( 'Output' );
	CKEDITOR.replace( 'Hint' );
});

$(document).ready(function(){
	$image.click(function(){
		$imgerr.text('');
	});
	$('#image_upload').click(function(){
		if (!$image.val()) {
			$imgerr.removeClass().addClass('error-text');
			$imgerr.text('请选择文件！');
			return false;
		}
		$imgload.show();
		$imgform.ajaxForm({
			url: '/imgUpload',
			type: 'POST',
			success: function (res, status, xhr, $form) {
				var tp;
				if (res == '0') {
					tp = '上传完成！';
					$imgerr.removeClass().addClass('success-text');
				} else {
					if (!res) tp = '异常错误！';
					else if (res == '1') tp = '图片大小不得超过1m！';
					else if (res == '2') tp = '文件类型必须是图片！';
					else if (res == '3') window.location.reload(true);
					$imgerr.removeClass().addClass('error-text');
				}
				$imgerr.text(tp);
				$imgload.hide();
				$('#myFormId').clearForm();
			},
			error: function (res, status, e) {
				alert(e);
				$imgload.hide();
				$imgform.clearForm();
			}
		});
	});
	if ($dataform.length) {
		var $datain = $('#data_in');
		var $dataout = $('#data_out');
		var $dataerr = $('#dataerr');
		var $dataload = $('#dataload');
		$datain.click(function(){$dataerr.text('');});
		$dataout.click(function(){$dataerr.text('');});
		$('#data_upload').click(function(){
			var pattern = new RegExp('^.*\.in$');
			if (!pattern.test($datain.val())) {
				$dataerr.removeClass().addClass('error-text');
				$dataerr.text('第一个文件类型必须是".in"');
				return false;
			}
			pattern = new RegExp('^.*\.out$');
			if (!pattern.test($dataout.val())) {
				$dataerr.removeClass().addClass('error-text');
				$dataerr.text('第二个文件类型必须是".out"');
				return false;
			}
			$dataload.show();
			$dataform.ajaxForm({
				url: $dataform.attr('action'),
				type: 'POST',
				success: function (res, status, xhr, $form) {
					var tp;
					if (res == '0') {
						tp = '上传完成！可继续增加其他文件数据，同名将会覆盖~';
						$dataerr.removeClass().addClass('success-text');
					} else {
						if (!res) tp = '异常错误！';
						else if (res == '1') tp = '文件名要相同（除了后缀）！';
						else if (res == '2') tp = '文件类型必须是in, out！';
						else if (res == '3') window.location.reload(true);
						else tp = '文件保存出错！';
						$dataerr.removeClass().addClass('error-text');
					}
					$dataerr.text(tp);
					$dataload.hide();
					$dataform.clearForm();
				},
				error: function (res, status, e) {
					alert(e);
					$dataload.hide();
					$dataform.clearForm();
				}
			});
		});
	}
});