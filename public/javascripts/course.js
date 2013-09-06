
var $fil = $('#fil')
,	$search = $('#search')
,	$list = $('#list').find('a')
,	$del = $('a.del');

function go(page){
	var F = new Array(), G = new Array()
	,	search = JudgeString($search.val());

	if (page) F.push('page'), G.push(page);
	if (search) F.push('search'), G.push(search);
	var url = '/course', flg = true;
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
		window.location.href = '/course';
	});
	$.each($del, function(i, p){
		$(p).click(function(){
			if (!window.confirm('确定删除此课程？')) {
				return false;
			}
			$.post('/courseDelete', {cid: $(p).attr('id')}, function(){
				window.location.href = '/course';
			});
		});
	});
});

var $cid = $('a.cid');

$(document).ready(function(){
	if ($cid.length) {
		$.each($cid, function(i, p){
			$(p).click(function(){
				if ($logindialog.length > 0) {
					nextURL = '/onecourse/'+$(this).attr('id');
					$logindialog.jqmShow();
				}
			});
		});
	}
});