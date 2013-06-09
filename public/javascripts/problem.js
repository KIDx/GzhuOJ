var $sidebar = $('#sidebar');
var $form = $sidebar.find('#form');
var $file = $form.find('input');
var $error = $form.next();
var $submit = $error.next();
var $add_tag = $('#add-tag');
var $del_tag = $('span.del');
var $tag_box = $sidebar.find('div.tag-box');

var pid = $sidebar.attr('pid');
var has = {};

$(document).ready(function() {
	$submit.click(function() {
		if (!$file.attr('value')) {
			$error.text('Choose file!');
			return false;
		}
		$form.submit();
	});
});

function Bind() {
	if ($add_tag.length == 0) return ;
	$add_tag.click(function(){
		var $prediv = $(this).parent();
		$(this).remove();
		$prediv.css({'text-align':'left'});
		html = 'Add tag: <select class="side-input">';
		html += '<option value="" selected></option>';
		for (i = 1; i < Tag.length; i++) {
			if (has[i]) continue;
			html += '<option value="'+i+'">'+Tag[i]+'</option>';
		}
		html += '</select>';
		$prediv.html(html);
		$prediv.find('select').change(function(res){
			$.post('/editTag', {tag:$(this).val(), pid:pid, add:true}, function(){
				window.location.reload(true);
			});
		});
	});
	$del_tag.click(function(){
		$.post('/editTag', {tag:$(this).attr('tag'), pid:pid}, function(){
			window.location.reload(true);
		});
	});
}

$(document).ready(function(){
	$tag_box.each(function(i, p){
		var $tp = $(p);
		var tid = $tp.attr('id');
		$tp.prepend(Tag[tid]);
		$tp.attr('title', ProTil[tid]);
	});
	$tag_box.show();
	Bind();
});

var $rejudge = $('#rejudge');

$(document).ready(function(){
	if ($rejudge.length > 0) {
		$rejudge.click(function(){
			$.post('/rejudge', {pid:pid}, function(){
				window.location.href = '/status?pID='+pid;
			})
		});
	}
});