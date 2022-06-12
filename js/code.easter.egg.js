var input = document.querySelector('#easter input');
var div = document.querySelector('#easter');
input.addEventListener('keydown', e=> {
	if (e.key === 'Enter')
	    div.querySelector('button').click();
});
function runEaster(v) {
	switch (v.toLowerCase()) {
		case 'sus':
		    case 'sussy baka':
		        case 'amogus':
		            window.alert('Un meme muy malo... 0/10\n<img src="images/no.sus.jpg" style="width:100%;">');
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
		default:
		    window.alert('Código inválido');
	}
}