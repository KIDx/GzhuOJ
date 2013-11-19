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
	}, {
		name: 'insertcode',
		items: [ 'insertcode' ]
	}];
	config.extraPlugins += (config.extraPlugins ? ',insertcode' : 'insertcode');
};
