
//update status in per A ms
var $statustable = $('#statustable')
,	$verdict
,	updateInterval, A = 250;

function getStatus() {
	$verdict = $statustable.find('td.unknow');
	if ($verdict.length) {
		$.each($verdict, function(i, p){
			$p = $(p);
			$.ajax({
				type 	 : 'POST',
				url 	 : '/updateStatus',
				dataType : 'json',
				data 	 : {
					runid : $p.attr('rid')
				}
			})
			.done(function(sol){
				if (sol) {
					$next = $p.next();
					if (sol.result == 1) {
						if ($p.text() != 'Running...') {
							$p.text('Running...');
							$next.html('<img src="/img/running.gif" style="width:16px;height:16px;" />');
						}
					} else {
						if (sol.result == 8 && (sol.userName == current_user || current_user == 'admin')) {
							$p.html('<a href="javascript:;" title="more information" rid="'+$p.attr('rid')+'" class="CE special-text">Compilation Error</a>');
							BindCE();
						} else {
							$p.text(Res(sol.result));
						}
						$p.removeClass().addClass('bold').addClass(Col(sol.result));
						$next.text(sol.time+' MS');
						$next.next().text(sol.memory+' KB');
					}
				}
			});
		});
	} else {
		clearInterval(updateInterval);
	}
}

$(document).ready(function(){
	updateInterval = setInterval(getStatus, A);
});