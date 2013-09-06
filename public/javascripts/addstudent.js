
var $file = $('#file')
,	$upload = $('#upload')
,	$ui = $('#upload-info')
,	$err = $('#err')
,	$table = $('#table')
,	$tbody = $table.find('#tbody')
,	$del, $tr
,	$submit = $('#submit')
,	pattern = new RegExp("^[a-zA-Z0-9_]{2,15}$");

$(document).ready(function(){
	$upload.click(function(){
		if (!$file.val()) {
			errAnimate($err, '请选择文件！');
			return false;
		}
	});
	$file.fileupload({
		dataType: 'json',
		add: function(e, data) {
			var f = data.files[0];
			$ui.text(f.name);
			$upload.unbind('click');
			$upload.click(function(){
				var pattern = new RegExp('^.*\.csv$');
				if (!pattern.test(f.name)) {
					errAnimate($err, '不支持的格式！');
					return false;
				}
				if (f.size && f.size > 2*1024*1024) {
					errAnimate($err, '文件大小不得超过2m！');
					return false;
				}
				$err.text('');
				data.submit();
			});
		},
		progress: function(e, data) {
			var p = parseInt(data.loaded/data.total*100, 10);
			$ui.text(p+'%');
		},
		done: function(e, data) {
			var json = data.response().result;
			if (json) {
				$tbody.text('');
				$.each(json, function(i, p){
					var html = '<tr class="';
					if (i % 2 == 0) html += 'odd';
					else html += 'even';
					html += '"><td><a class="user user-gray" href="/user/'+p[0]+'">'+p[0]+'</a></td><td>'+p[1]+'</td><td>'+p[2]+'</td>';
					html += '<td><a class="del" href="javascript:;">删除</a></td><td><span class="user-gray">未开始</span></td>'
					$tbody.append(html);
				});
				if ($del && $del.length) {
					$del.unbind('click');
				}
				$tr = $tbody.find('tr');
				$del = $('a.del');
				$.each($del, function(i, p){
					$(p).click(function(){
						$(this).parent().parent().remove();
						$tr = $tbody.find('tr');
						$.each($tr, function(i, p){
							$(p).removeClass();
							if (i % 2 == 0) {
								$(p).addClass('odd');
							} else {
								$(p).addClass('even');
							}
						});
					});
				});
				$table.fadeIn(200);
			}
		}
	});
	var postTimeout;
	$submit.click(function(){
		clearTimeout(postTimeout);
		if (!$tr.length) {
			errAnimate($err, '不存在可注册的项！');
			return false;
		}
		$.each($tr, function(i, p){
			var $td = $(p).find('td')
			,	$error = $td.eq(4).children('span')
			,	name = $td.eq(0).text()
			,	realname = $td.eq(1).text()
			,	sex = $td.eq(2).text();
			if (!name) {
				$error.text('用户名不能为空！');
				$error.removeClass().addClass('error-text');
				return ;
			}
			if (!realname) {
				$error.text('姓名不能为空！');
				$error.removeClass().addClass('error-text');
				return ;
			}
			if (!pattern.test(name)) {
				$error.text('用户名格式错误！');
				$error.removeClass().addClass('error-text');
				return ;
			}
			if (sex != '男' && sex != '女') {
				$error.text('性别只能是男或女！');
				$error.removeClass().addClass('error-text');
				return ;
			}
			$error.removeClass().addClass('user-gray');
			$error.text('等待中...');
			postTimeout = setTimeout(function(){
				$.post('/reg', {
					name: name,
					realname: realname,
					sex: (sex == '男' ? 0 : 1),
					college: $('#college').val(),
					gde: $('#grade').val()+$('#class').val()
				}, function(res){
					$error.removeClass().addClass('success-text');
					if (res == '1') {
						$error.text('注册成功！');
						return ;
					} else if (res == '2') {
						$error.text('更新完成！')
						return ;
					}
					$error.removeClass().addClass('error-text');
					if (res == '3') {
						$error.text('系统错误！');
					} else if (res == '4') {
						$error.text('注册失败！');
					}
				});
			}, 200);
		});
	});
});