
var $list = $('#list').find('a')
	cid = $('#onecourse').attr('cid');

function go(page){
	var F = new Array(), G = new Array();

	if (page) F.push('page'), G.push(page);

	var url = '/onecourse/'+cid, flg = true;
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
	$.each($list, function(i, p){
		$(p).click(function(){
			var $li = $(this).parent();
			if ($li.hasClass('active') || $li.hasClass('disabled')) {
				return false;
			}
			go($(this).attr('id'));
		});
	});
});

var $rank = $('#rank')
,	cid = parseInt($rank.attr('cid'), 10);

$(document).ready(function(){
	if ($rank.length) {
		$rank.click(function(){
			$.post('/courseRankSession', function(){
				window.location.href = '/ranklist/'+cid;
			});
		});
	}
});