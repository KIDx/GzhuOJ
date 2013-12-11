
CKEDITOR.dialog.add('insertcode', function(editor){
    var escape = function(value){
        return value;
    };
    return {
        title: editor.lang.insertcode,
        resizable: CKEDITOR.DIALOG_RESIZE_BOTH,
        minWidth: 600,
        minHeight: 550,
        contents: [{
            id: 'cb',
            name: 'cb',
            label: 'cb',
            title: 'cb',
            elements: [{
                type: 'select',
                label: 'Language',
                id: 'lang',
                required: true,
                'default': 'cpp',
                items: [['C++', 'cpp'], ['Java', 'java']]
            }, {
                type: 'textarea',
                style: 'width:580px;height:420px;',
                label: 'Code',
                id: 'code',
                rows: 31,
                'default': ''
            }]
        }],
        onOk: function(){
            code = this.getValueOf('cb', 'code');
            lang = this.getValueOf('cb', 'lang');
            html = code.toString()
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
            editor.insertHtml('<pre class=\"brush:' + lang + ';\">' + html + '</pre>');
        },
        onLoad: function(){
        }
    };
});