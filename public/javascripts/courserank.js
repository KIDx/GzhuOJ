
var $query = $('#query')
,	cid = parseInt($query.attr('cid'));

$(document).ready(function(){
	$query.click(function(){
		$.post('/courseRankSession', {g: $('#grade').val(), c: $('#class').val()}, function(){
			window.location.href = '/ranklist/'+cid;
		});
	});
});