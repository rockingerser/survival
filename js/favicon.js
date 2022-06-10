!function() {
    const canvas = document.createElement('canvas');
    const c = canvas.getContext('2d');
    canvas.width = canvas.height = 16;

    const fav = document.createElement('link');
    fav.rel = 'shorcut icon';
    function render() {
        c.clearRect(0, 0, canvas.width, canvas.height);
        var color = Math.floor(Math.random() * 2 ** 24).toString(16);
        c.fillStyle = ('#000000').substring(0, 7 - color.length) + color;
        c.beginPath();
        c.arc(canvas.width / 2, canvas.height / 2, 8, 0, 2 * Math.PI);
        c.fill();
        fav.href = canvas.toDataURL();
    }
    render();
    setInterval(render, 2000);

    document.head.appendChild(fav);
}();