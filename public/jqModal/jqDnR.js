/*
 * jqDnR - Minimalistic Drag'n'Resize for jQuery.
 *
 * Copyright (c) 2007 Brice Burgess <bhb@iceburg.net>, http://www.iceburg.net
 * Licensed under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * $Version: 2007.08.19 +r2 (fixed by KIDx at 2012.12.22, 2012.12.26, 2013.02.13)
 */


(function($){
	$.fn.jqDrag = function(h) {
		return i(this, h, 'd');
	};
	$.fn.jqResize = function(h) {
		return i(this, h, 'r');
	};
	$.jqDnR = {
		dnr: {},
		e: 0,
		drag: function(v){
			if(M.k == 'd') {
				//overflow fixed, 2012.12.22
				var x = M.X + v.pageX - M.pX;
				var y = M.Y + v.pageY - M.pY;
				var tx = document.documentElement.clientWidth-M.W;
				var ty = document.documentElement.clientHeight-M.H+parseFloat(E.css('height'))-40;
				E.css({
					left: x < 0 ? 0 : (x < tx ? x : tx),
					top: y < 0 ? 0 : (y < ty ? y : ty)
				});
			} else {
				var wi = Math.max(v.pageX-M.pX+M.W, 250);
				var he = Math.max(v.pageY-M.pY+M.H, 200);
				if (wi > 700) wi = 700;
				if (he > 700) he = 700;
				var tw = parseFloat(E.css('width'));
				var th = parseFloat(E.css('height'));
				var dw = wi - tw;
				var dh = he - th;
				E.css({ width: wi, height: he });
				//improved at 2012.12.26
				var $jqtop = E.find('div.jqtop');
				var $jqcontent = E.find('div.jqcontent');
				var $jqtext = E.find('textarea.jqtext, input.jqtext');

				$jqtop.css({ width: dw+parseFloat($jqtop.css('width')) });
				$jqcontent.css({
					width: dw+parseFloat($jqcontent.css('width')),
					height: dh+parseFloat($jqcontent.css('height'))
				});
				$jqtext.css({ width: dw+parseFloat($jqtext.css('width')) });
			}
			return false;
		},
		stop:function() {
			E.css('opacity', M.o);
			$(document).unbind('mousemove', J.drag).unbind('mouseup', J.stop);
		}
	};
	var J = $.jqDnR, M = J.dnr, E = J.e,
	i = function(e, h, k) {
		return e.each(function() {
			h = (h) ? $(h, e) : e;
			h.bind('mousedown', { e:e, k:k }, function(v) {
				if (v.which != 1) return false;	//improved at 2013.02.13
				var d = v.data, p = {};
				E=d.e;
				// attempt utilization of dimensions plugin to fix IE issues
				if (E.css('position') != 'relative') {
					p = E.position();
					if (!($.browser.msie && ($.browser.version == "6.0")) && (E.css('position') == 'fixed')) {
						p.top -= $(window).scrollTop();
						p.left -= $(window).scrollLeft();
					}
				}
				M = {
					X: p.left || f('left') || 0,
					Y: p.top || f('top') || 0,
					W: f('width') || E[0].scrollWidth || 0,
					H: f('height') || E[0].scrollHeight || 0,
					pX: v.pageX,
					pY: v.pageY,
					k: d.k,
					o: E.css('opacity')
				};
				E.css({ opacity: 0.8 });
				$(document).mousemove($.jqDnR.drag).mouseup($.jqDnR.stop);
				return false;
			});
		});
	},
	f = function(k) {
		return parseInt(E.css(k))||false;
	};
})(jQuery);