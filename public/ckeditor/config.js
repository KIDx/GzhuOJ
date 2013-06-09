/*
Copyright (c) 2003-2012, CKSource - Frederico Knabben. All rights reserved.
For licensing, see LICENSE.html or http://ckeditor.com/license
*/

CKEDITOR.editorConfig = function( config )
{
	// Define changes to default configuration here. For example:
	// config.language = 'fr';
	// config.uiColor = '#AADC6E';
	config.toolbar = 'Full';
	config.toolbar_Full = [{
		name: 'document',
		items : ['Source','-','Templates' ]
	}, {
		name: 'clipboard',
		items : [ 'Cut','Copy','Paste','PasteText','PasteFromWord','-','Undo','Redo' ]
	}, {
		name: 'editing',
		items : [ 'Find','Replace','SelectAll','-']
	}, {
		name: 'insert',
		items: [ 'Image','Table','HorizontalRule','SpecialChar' ]
	}, '/', {
		name: 'basicstyles',
		items : [ 'Bold', 'Italic','Underline','Strike','Subscript','Superscript','-','RemoveFormat' ]
	}, {
		name: 'paragraph',
		items : [ 'NumberedList','BulletedList','-','Outdent','Indent','-','Blockquote','CreateDiv', '-','JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock','-','BidiLtr','BidiRtl']
	}, '/', {
		name: 'styles',
		items : [ 'Format','FontSize' ]
	}, {
		name:'colors',
		items : [ 'TextColor','-']
	}, {
		name: 'links',
		items : [ 'Link','Unlink', ]
	}];
	config.toolbar_Basic = [ ['Bold', 'Italic', '-','NumberedList', 'BulletedList', '-', 'Link', 'Unlink','-','About'] ];
};
