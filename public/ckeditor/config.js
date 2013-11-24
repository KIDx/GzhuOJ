/*
Copyright (c) 2003-2012, CKSource - Frederico Knabben. All rights reserved.
For licensing, see LICENSE.html or http://ckeditor.com/license
*/

CKEDITOR.editorConfig = function( config )
{
	// Define changes to default configuration here. For example:
	// config.language = 'fr';
	// config.uiColor = '#AADC6E';
	config.language = 'zh-cn';
	config.forcePasteAsPlainText = true;
	config.toolbar = 'Full';
	config.toolbar_Full = [{
		name: 'document',
		items : ['Source','-','Templates' ]
	}, {
		name: 'paragraph',
		items : [ 'NumberedList','BulletedList','-','Outdent','Indent','Blockquote','-','JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock']
	}, {
		name: 'insert',
		items: [ 'Image','Table','HorizontalRule' ]
	}, '/', {
		name: 'basicstyles',
		items : [ 'Bold', 'Italic','Underline','Strike','Subscript','Superscript' ]
	}, {
		name: 'styles',
		items : [ 'Format','FontSize' ]
	}, {
		name:'colors',
		items : [ 'TextColor' ]
	}, {
		name: 'links',
		items : [ 'Link','Unlink' ]
	}, '/', {
		name: 'insertcode',
		items: [ 'insertcode' ]
	}, {
		names: 'smiley',
		items: [ 'Smiley' ]
	}];
	config.extraPlugins += (config.extraPlugins ? ',insertcode' : 'insertcode');
	//去掉左下角的body和p标签  
	config.removePlugins = 'elementspath';
	//表情显示每行个数
	config.smiley_columns =10;
	//表情自定义
	config.smiley_descriptions = [];
	var imgs = new Array();
	for (var i = 1; i <= 67; i++) {
		imgs.push(i+'.gif');
	}
	config.smiley_images = imgs;
};
