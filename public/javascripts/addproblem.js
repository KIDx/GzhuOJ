
var $submit = $('#submit')
,	$image = $('#image')
,	$imgerr = $('#imgerr')
,   $si = $('#submit-info')
,	submitTimeout;

var $data = $('#data')
,	$dataerr = $('#dataerr')
,	$ui = $('#upload-info');

var pid = parseInt($('#addproblem').attr('pid'), 10);

$(document).ready(function(){
	CKEDITOR.replace( 'Description' );
	CKEDITOR.replace( 'Input' );
	CKEDITOR.replace( 'Output' );
	CKEDITOR.replace( 'Hint' );
});

$(document).ready(function(){
	$submit.click(function() {
		if (!$image.val()) {
			errAnimate($imgerr, '请选择文件！');
			return false;
		}
	});
	$image.fileupload({
		dataType: 'text',
		add: function(e, data) {
			var f = data.files[0];
			$si.text(f.name);
			$submit.unbind();
			$submit.click(function(){
				clearTimeout(submitTimeout);
				submitTimeout = setTimeout(function(){
					var pattern = new RegExp('^.*\.(jpg|jpeg|png)$');
					if (!pattern.test(f.name)) {
						errAnimate($imgerr, '不支持的格式！');
						return false;
					}
					if (f.size && f.size > 2*1024*1024) {
						errAnimate($imgerr, '图片大小不得超过2m！');
						return false;
					}
					$imgerr.html('&nbsp;');
					data.submit();
				}, 200);
			});
		},
		progress: function(e, data) {
			var p = parseInt(data.loaded/data.total*100, 10);
			$si.text(p+'%');
		},
		done: function(e, data) {
			var res = data.response().result, tp;
			if (!res) {
				$si.text(data.files[0].name);
				ShowMessage('图片上传成功！');
				return ;
			}
			if (res == '1') tp = '图片大小不得超过2m！';
			else if (res == '2') tp = '不支持的格式！';
			else if (res == '3') tp = '异常错误！';
			if (tp) {
				errAnimate($imgerr, tp);
			}
		}
	});
	

	$data.fileupload({
		dataType: 'text',
		add: function(e, data) {
			var f = data.files[0];
			$ui.text(f.name);
			var pattern = new RegExp('^.*\.(in|out)$');
			if (!pattern.test(f.name)) {
				return ;
			}
			if (f.size && f.size > 50*1024*1024) {
				return ;
			}
			data.submit();
		},
		progress: function(e, data) {
			var p = parseInt(data.loaded/data.total*100, 10);
			$ui.text(p+'%');
		},
		done: function(e, data) {
			var res = data.response().result, tp;
			if (!res) {
				window.location.reload(true);
				return ;
			}
			if (res == '3') tp = '异常错误！';
			if (tp) {
				errAnimate($dataerr, tp);
			}
		}
	});

	$('a.del').click(function(){
		$.post('/delData', {
			pid 	: pid,
			fname 	: $(this).parent().prev().text()
		}, function(){
			window.location.reload(true);
		});
	});
});