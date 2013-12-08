
var $cname = $('#cname')
,	old_title = $cname.val()
,	$err = $('#err')
,	cid = $('#addcourse').attr('cid')
,	$create = $('#create')
,	$edit = $('#edit');

$(document).ready(function(){
	if ($create.length) {
		$create.click(function(){
			var title = JudgeString($cname.val());
			if (!title) {
				errAnimate($err, '课程名称不能为空！');
				return false;
			}
			$.post('/addcourse', {title: title}, function(res){
				if (!res) {
					window.location.reload(true);
				} else {
					window.location.href = '/addcourse?id='+res;
				}
			});
		});
	} else {
		var init = function() {
			$cname.attr('disabled', true);
			$edit.show();
			$cname.unbind();
		},	edit = function() {
			var title = JudgeString($cname.val());
			if (!title || title == old_title) {
				$cname.val(old_title);
				init();
			} else {
				$.post('/changeCourseTitle', {cid: cid, title: title}, function(res){
					if (res == '1') {
						ShowMessage('系统错误！');
					} else if (res == '2') {
						window.location.href = '/course';
					} else {
						old_title = title;
						ShowMessage('修改成功！');
					}
					init();
				});
			}
		};
		$edit.click(function(){
			$cname.attr('disabled', false);
			$cname.focus();
			$edit.hide();
			$cname.blur(function(){
				edit();
			});
			$cname.keyup(function(e){
				if (e.keyCode == 13) {
					edit();
				}
			});
		});
	}
});

var $ginput = $('input.groupname')
,	$gedit = $('a.gedit')
,	$newgroup = $('#newgroup')
,	$add = $('a.add')
,	$dele = $('a.delete')
,	$del = $('span.del')
,	old_name = {}
,	$dialog = $('#dialog')
,	$add_submit = $('#add_submit')
,	$add_content = $('#add_content')
,	$add_err = $('#add_err')
,	$cur_group
,	cur_probs
,	cur_num;

function toggleIcon(i) {
	$gedit.eq(i).toggle();
	$add.eq(i).toggle();
}

function ginit(i) {
	$ginput.eq(i).attr('disabled', true);
	toggleIcon(i);
	$ginput.eq(i).unbind();
}

function gedit(i) {
	var name = JudgeString($ginput.eq(i).val());
	if (!name || name == old_name[i]) {
		$ginput.eq(i).val(old_name[i]);
		ginit(i);
	} else {
		$.post('/changeGroupName', {
			gid 	: $gedit.eq(i).parent().parent().attr('gid'),
			name 	: name
		}, function(res){
			if (res == '1') {
				ShowMessage('系统错误！');
			} else if (res == '2') {
				window.location.href = '/course';
			} else {
				$ginput.eq(i).val(old_name[i] = name);
				ShowMessage('修改成功！');
			}
			ginit(i);
		});
	}
}

function clearBindAndInit() {
	$gedit.unbind();
	$ginput.unbind();
	$dele.unbind();
	$add.unbind();
	$gedit = $('a.gedit');
	$ginput = $('input.groupname');
	$dele = $('a.delete');
	$add = $('a.add');
}

function bind() {
	$.each($gedit, function(i, p){
		old_name[i] = $ginput.eq(i).val();
		$(p).click(function(){
			toggleIcon(i);
			$tmp = $ginput.eq(i);
			$tmp.attr('disabled', false);
			$tmp.focus();
			$tmp.blur(function(){
				gedit(i);
			});
			$tmp.keyup(function(e){
				if (e.keyCode == 13) {
					gedit(i);
				}
			});
		});
	});
	$.each($dele, function(i, p){
		$(p).click(function(){
			if (!window.confirm('确定删除此分组？')) {
				return false;
			}
			$.post('/delGroup', {
				gid: $(this).parent().parent().attr('gid'),
				cid: cid
			}, function(res){
				if (res == '1') {
					ShowMessage('系统错误！');
				} else if (res == '2') {
					window.location.href = '/course';
				} else if (res == '3') {
					ShowMessage('抱歉，不允许删除最后一个分组！');
				} else {
					$dele.eq(i).parent().parent().remove();
					ShowMessage('删除成功！');
				}
			});
		});
	});
	if ($dialog.length) {
		$.each($add, function(i, p){
			$(p).click(function(){
				$cur_group = $(this).parent().next();
				cur_probs = {};
				cur_num = 0;
				$.each($cur_group.find('span.del'), function(i, p){
					var pid = $(p).attr('id');
					if (!cur_probs[pid]) {
						cur_probs[pid] = true;
						++cur_num;
					}
				});
				$dialog.attr('gid', $(this).parent().parent().attr('gid'));
				$add_content.val('');
				$add_err.html('&nbsp;');
				$dialog.jqmShow();
			});
		});
	}
}

$(document).ready(function(){
	bind();
	$newgroup.click(function(){
		if ($(this).hasClass('disabled')) {
			return false;
		}
		$(this).addClass('disabled');
		$.post('/addGroup', {cid: cid}, function(res){
			if (res == '1') {
				ShowMessage('系统错误！');
			} else if (res == '2') {
				window.location.href = '/course';
			} else if (res == '3') {
				ShowMessage('抱歉，一个课程最多只能容下15个分组！');
			} else {
				var html = '<div class="topic_box" gid="'+res+'">';
				html += '<div class="header">';
				html += '<a href="javascript:;" title="删除" class="fr delete"></a>';
				html += '<input class="groupname" style="margin:0;padding:2px;" type="text" value="新的分组" disabled/>';
				html += ' <a href="javascript:;" title="修改组名" class="gedit edit help-inline"></a>';
				html += ' <a href="javascript:;" title="添加题目" class="add help-inline"></a>';
				html += '</div><div class="inner_topic">';
				html += '<span class="error-text">该分组还没有题目。</span>';
				html += '</div></div>';
				$newgroup.before(html);
				clearBindAndInit();
				bind();
			}
			$newgroup.removeClass('disabled');
		});
	});
});

function bindDel() {
	if ($del.length) {
		$.each($del, function(i, p){
			$(p).click(function(){
				$.post('/delProbInGroup', {
					pid: $(this).attr('id'),
					gid: $(this).parent().parent().parent().attr('gid')
				}, function(res){
					if (res == '1') {
						ShowMessage('系统错误！');
					} else if (res == '2') {
						window.location.href = '/course';
					} else {
						$del.eq(i).unbind();
						var $tmp = $del.eq(i).parent().parent();
						$del.eq(i).parent().remove();
						if (!$tmp.find('span.del').length) {
							$tmp.html('<span class="error-text">该分组还没有题目。</span>');
						}
						ShowMessage('删除成功！');
					}
				});
			});
		});
	}
}

$(document).ready(function(){
	bindDel();
	if ($dialog.length) {
		$dialog.jqm({
			overlay: 30,
			trigger: false,
			modal: true,
			closeClass: 'addclose',
			onShow: function(h) {
				h.o.fadeIn(200);
				h.w.fadeIn(200);
			},
			onHide: function(h) {
				h.w.fadeOut(200);
				h.o.fadeOut(200);
			}
		}).jqDrag('.jqDrag').jqResize('.jqResize');
		$add_submit.click(function(){
			var str = JudgeString($add_content.val());
			if (!str) {
				errAnimate($add_err, '内容不能为空！');
				return false;
			}
			if ($(this).hasClass('disabled')) {
				return false;
			}
			$(this).addClass('disabled');
			$.ajax({
				type: 'POST',
				url: '/addProbToGroup',
				dataType: 'json',
				data: {gid: $dialog.attr('gid'), str: str},
				timeout: 5000
			}).done(function(json){
				if (!json) return ;
				if (json == '1') {
					ShowMessage('系统错误！');
				} else if (json == '2') {
					window.location.href = '/course';
				} else if (json == '3') {
					ShowMessage('对不起，每个分组最多只能容下10题！');
				} else {
					var num = 0;
					if (!cur_num) {
						$cur_group.empty();
					}
					$.each(json, function(i, t){
						if (cur_probs[i]) {
							return true;
						}
						var html = '<div class="tag-box">';
						html += '<a target="_blank" href="/problem?pid='+i+'">'+i+'</a> '+t;
						html += ' <span id="'+i+'" class="del" title="删除此题">×</span></div>';
						$cur_group.append(html);
						++num;
					});
					$del.unbind();
					$del = $('span.del');
					bindDel();
					ShowMessage('已成功添加'+num+'题！');
				}
				$add_submit.removeClass('disabled');
				$dialog.jqmHide();
			});
		});
		simulateClick($add_content, $add_submit);
	}
});