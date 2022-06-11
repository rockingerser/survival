document.querySelector('div input').addEventListener('keydown', e=> {
	if (e.key === 'Enter')
	    document.querySelector('div button').click();
});
function runEaster(v) {
	switch (v.toLowerCase()) {
		case 'sus':
		    case 'sussy baka':
		        window.alert('NO SE VALE >:(');
		        break;
		case 'shake':
		    var d = function() {
		    	var canvas = document.querySelector('canvas');
		    	var offset = 10;

		    	canvas.style.position = 'absolute';
		    	canvas.style.left = -offset + Math.random() * (offset * 2) + 'px';
		    	canvas.style.top = -offset + Math.random() * (offset * 2) + 'px';
		    	window.requestAnimationFrame(d);
		    };
		    d();
		    break;
		default:
		    window.alert('Código inválido');
	}
}