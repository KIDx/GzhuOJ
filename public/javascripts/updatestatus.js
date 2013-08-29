
//update status in per 250ms
var $status = $('#statustable')
,	$verdict = $status.find('a.unknow');

function getStatus() {
}

$(document).ready(function(){
	if ($verdict.length) {
		setInterval(getStatus, 250);
	}
});