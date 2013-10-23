
var $image = $('#image')
,	$imgerr = $('#imgerr')
,   $si = $('#submit-info')
,	submitTimeout;

var $data = $('#data')
,	$dataerr = $('#dataerr')
,	$ui = $('#upload-info')
,	$datadel;

var $datadiv = $('#datadiv')
,	$datacbs = $datadiv.find('div.cb')
,	$datanum = $('#datanum')
,	datahas = {}
,	datanum = parseInt($datanum.text(), 10);

var $imgdiv = $('#imgdiv')
,	$imgcbs = $imgdiv.find('div.cb')
,	$imgnum = $('#imgnum')
,	$imgdel
,	imghas = {}
,	imgnum = parseInt($imgnum.text(), 10);

var pid = parseInt($('#addproblem').attr('pid'), 10);

$(document).ready(function(){
	CKEDITOR.replace( 'Description' );
	CKEDITOR.replace( 'Input' );
	CKEDITOR.replace( 'Output' );
	CKEDITOR.replace( 'Hint' );
});

function bindDel () {
	if ($datadel && $datadel.length) {
		$datadel.unbind('click');
	}
	$datadel = $('a.del');
	$.each($datadel, function(i, p){
		$(p).click(function(){
			$.post('/delData', {
				pid 	: pid,
				fname 	: $(p).parent().prev().text()
			}, function(res){
				if (res) {
					window.location.reload(true);
					return ;
				}
				var $d = $(p).parent().parent();
				$d.unbind('click');
				datahas[$d.attr('fname')] = false;
				$d.remove();
				--datanum;
				$datanum.text(datanum);
				ShowMessage('删除成功！');
			});
		});
	});
}

function bindImgDel () {
	if ($imgdel && $imgdel.length) {
		$imgdel.unbind('click');
	}
	$imgdel = $('a.imgdel');
	$.each($imgdel, function(i, p){
		$(p).click(function(){
			$.post('/delImg', {
				pid 	: pid,
				fname 	: $(p).parent().prev().text()
			}, function(res){
				if (res) {
					window.location.reload(true);
					return ;
				}
				var $d = $(p).parent().parent();
				$d.unbind('click');
				imghas[$d.attr('fname')] = false;
				$d.remove();
				--imgnum;
				$imgnum.text(imgnum);
				ShowMessage('删除成功！');
			});
		});
	});
}

$(document).ready(function(){
	$image.fileupload({
		dataType: 'text',
		add: function(e, data) {
			var f = data.files[0];
			$si.text(f.name);
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
		},
		progress: function(e, data) {
			var p = parseInt(data.loaded/data.total*100, 10);
			$si.text(p+'%');
		},
		done: function(e, data) {
			var res = data.response().result, tp;
			if (!res) {
				$.each(data.files, function(i, p){
					imghas[p.name] = true;
				});
				var F = new Array();
				for (var i in imghas) {
					if (imghas[i]) {
						F.push(i.toString());
					}
				}
				F.sort(function(a, b){
					return a > b;
				});
				$imgcbs.remove();
				var html = '';
				$.each(F, function(i, p){
					html += '<div class="cb" fname="'+p+'">';
					html += '<div class="ibox">'+p+'</div>';
					html += '<div class="ibox"><a class="imgdel" href="javascript:;">删除</a></div></div>';
				});
				$imgdiv.append(html);
				bindImgDel();
				$imgcbs = $imgdiv.find('div.cb')
				$imgnum.text(imgnum = F.length);
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
				$.each(data.files, function(i, p){
					datahas[p.name] = true;
				});
				var F = new Array();
				for (var i in datahas) {
					if (datahas[i]) {
						F.push(i.toString());
					}
				}
				F.sort(function(a, b){
					return a > b;
				});
				$datacbs.remove();
				var html = '';
				$.each(F, function(i, p){
					html += '<div class="cb" fname="'+p+'">';
					html += '<div class="ibox">'+p+'</div>';
					html += '<div class="ibox"><a class="del" href="javascript:;">删除</a></div></div>';
				});
				$datadiv.append(html);
				bindDel();
				$datacbs = $datadiv.find('div.cb')
				$datanum.text(datanum = F.length);
				ShowMessage('数据上传完成！');
				return ;
			}
			if (res == '3') tp = '异常错误！';
			if (tp) {
				errAnimate($dataerr, tp);
			}
		}
	});
	$.each($datacbs, function(i, p){
		datahas[$(p).attr('fname')] = true;
	});
	$.each($imgcbs, function(i, p){
		imghas[$(p).attr('fname')] = true;
	});
});

$(document).ready(function(){
	bindDel();
	bindImgDel();
});