var input = document.querySelector('#easter input');
var div = document.querySelector('#easter');
input.addEventListener('keydown', e=> {
	if (e.key === 'Enter')
	    div.querySelector('button').click();
});
function runEaster(v) {
	switch (v.toLowerCase()) {
		case 'tonto':
			case 'tonta':
				var img = new Image();
				img.src = 'https://pm1.narvii.com/6052/6464824ade9216a2e721258a3096b58dbc04bcdd_hq.jpg';
				img.style = 'position: absolute; left: 0; top: 0; width: 100%; height: 100%; z-index: 100; opacity: 0.1; pointer-events: none;';
				document.body.appendChild(img);
				break;
		case 'temblor':
		    window.alert('Empezamos con la locura bbaababababababbababab');
		    function d() {
		    	var canvas = document.querySelector('canvas');
		    	var offset = 10;

		    	canvas.style.position = 'absolute';
		    	canvas.style.left = -offset + Math.random() * (offset * 2) + 'px';
		    	canvas.style.top = -offset + Math.random() * (offset * 2) + 'px';
		    	window.requestAnimationFrame(d);
		    }
		    d();
		    break;
		case 'vueltas':
		    var canvas = document.querySelector('canvas');
		    canvas.animate([
		        { transform: 'rotate(360deg)' }
		    ], {
		    	duration: 1000,
		    	iterations: 5
		    });
		    break;
		case 'consola':
		    window.alert(`Consola:\n<div><textarea spellcheck="false" autocomplete="off">window.alert('¡Hola Mundo!');</textarea><button onclick="try { var t = this.parentElement; Function(t.children[0].value)(); } catch (e) { t.querySelector('#error').textContent = '❌ JavaScript Error: ' + e; }">Ejecutar</button><p id="error" style="color: red; font-family: courier new, courier, monospace; font-size: 12px;"></p></div>`);
		    break;
		default:
		    window.alert('Código inválido');
	}
}