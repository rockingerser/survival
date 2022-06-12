!function() {
	'use strict';
	function textBox(c, m, oc, oa) {
		if (m)
		    m = m.toString().replaceAll('\n', '<br>');
		else
			m = '';
		if (typeof oc === 'function')
		    oc = '!' + oc.toString().replaceAll('\r\n', '') + '();';
		else
			oc = '';
		if (typeof oa === 'function')
		    oa = '!' + oa.toString().replaceAll('\r\n', '') + '();';
		else
			oa = '';
		var d = document.createElement('alert-box');
		var click = `var m = this.parentElement; m.animate([ { transform: 'scale(1)' }, { transform: 'scale(0)'} ], { duration: 100 }); setTimeout(()=> m.remove(), 100);`;
		if (c)
			c = `<alert-button style="float: right; margin-right: 10px;" onclick="${click} ${oc}">Cancelar</alert-button>`;
		else
			c = '';
		d.classList = 'alert-box';
		d.innerHTML = `<style>alert-title { -webkit-user-select: none; -ms-user-select: none; user-select: none; } alert-title, alert-content { display: block; } alert-title { font-size: 20px; font-weight: bold; } alert-box { box-shadow: 0 0 30px #00000030; border: 1px solid #80808080; border-radius: 10px; position: fixed; z-index: 89348; inset: 0; margin: auto; overflow: hidden; width: 400px; height: 300px; padding: 14px; background: white; color: black; } alert-box alert-button { color: white; padding: 5px; border: none; border-radius: 6px; pointer-events: all; min-width: 25px; background: #4481ED; cursor: pointer; }</style><alert-title style="margin: 0px;">${(window.location.host) ? window.location.host : 'Esta página'} dice</alert-title><alert-content style="height: 230px; margin: 10px 0; overflow: auto;">${m}</alert-content><alert-button style="float: right;" onclick="${click} ${oa}">Aceptar</alert-button>${c}`;
		d.animate([
		    { transform: 'scale(0.3)' },
		    { transform: 'scale(1)'}
		], {
			duration: 100
		});
		document.body.appendChild(d);
	}
	window.alert = function(m, c) {
		textBox(false, m, '', c);
    };
    window.confirm = function(m, c, a) {
		textBox(true, m, a, c);
    };
}();