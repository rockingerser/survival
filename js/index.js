!function() {
    'use strict';

    const canvas = document.querySelector('canvas');
    const c = canvas.getContext('2d', {
        alpha: false
    });
    
    var w;
    var h;
    const keys = {};
    const mouse = {
        x: 0,
        y: 0
    }
    c.fillCircle = (x, y, radius)=> {
        c.beginPath();
        c.arc(x, y, radius, 0, 2 * Math.PI);
        c.fill();
    }
    c.drawLine = (x, y, x2, y2)=> {
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x2, y2);
        c.stroke();
    }
    function canvasResize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    canvasResize();
    window.addEventListener('resize', canvasResize);
    window.onbeforeunload = e=> {
    	return false;
    }
    function loadSound(u) {
        var sound = new Audio();
        sound.src = u;
        return sound;
    }
    const sounds = {
        shoot: loadSound('sounds/shoot.wav'),
        kill: loadSound('sounds/kill.wav'),
        hurt: loadSound('sounds/hurt.wav'),
        hurtEnemy: loadSound('sounds/hurt.enemy.wav')
    };
    canvas.addEventListener('mousemove', e=>{
        const rect = canvas.getBoundingClientRect();
        mouse.x = Math.floor(e.clientX / (rect.width / w));
        mouse.y = Math.floor(e.clientY / (rect.height / h));
    }
    );
    function mousePressed(which) {
        if (which in mouse)
            return mouse[which];
        else {
            mouse[which] = false;
            Function('mouse', `
			document.addEventListener('mousedown', e=> {
			    if (e.button === ${which})
			        mouse[${which}] = true;
			});
			document.addEventListener('mouseup', e=> {
			    if (e.button === ${which})
			        mouse[${which}] = false;
			});
		    `)(mouse);
            return mousePressed(which);
        }
    }
    function keyPressed(kc) {
        if (kc in keys)
            return keys[kc];
        else {
            keys[kc] = false;
            Function('keys', `
			document.addEventListener('keydown', e=> {
			    if (e.keyCode === ${kc})
			        keys[${kc}] = true;
			});
			document.addEventListener('keyup', e=> {
			    if (e.keyCode === ${kc})
			        keys[${kc}] = false;
			});
		    `)(keys);
            return keyPressed(kc);
        }
    }

    function background(co) {
        const f = c.fillStyle;
        c.fillStyle = co;
        c.fillRect(0, 0, w, h);
        c.fillStyle = f;
    }
    var player = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        friction: 0.95,
        maxv: 2,
        r: 13,
        s: 0,
        h: 100,
        speed: 0.5,
        firerate: 10
    };
    player.maxh = player.h;
    var enemies = [];
    function deleteMe(t) {
        delete enemies[enemies.indexOf(t)];
    }
    function colliding(o1, o2) {
    	var dx = o1.x - o2.x,
    	    dy = o1.y - o2.y;
    	var distance = Math.sqrt(dx** 2 + dy** 2);
    	return distance < o1.r + o2.r;
    }
    function collidingEdges(o) {
    	return o.x + o.r > w || o.x - o.r < 0 || o.y + o.r > h || o.y - o.r < 0;
    }
    class Enemy {
        constructor(x, y, r, v, hp) {
            this.c = c;
            this.x = x;
            this.y = y;
            this.r = r;
            this.v = Math.min(player.maxv - 0.1, v);
            this.hp = hp;
            this.mhp = hp;
            this.offsetColor = frames;
        }
        step() {
            var dir = Math.atan2(player.x - this.x, player.y - this.y);
            this.x += Math.sin(dir) * this.v;
            this.y += Math.cos(dir) * this.v;
            if (Math.random() * 500 <= 1) {
                sounds.shoot.play();
                enemies.push(new Bullet(this.c,this.x,this.y,this.r / 3,this.v * 3.3333333333333333,dir,0));
            }
            if (Math.random() * 10 <= 1 && colliding(this, player)) {
                rgf = 15 * 60;
                player.vx += Math.sin(dir) * (this.v** 2 + 1);
                player.vy += Math.cos(dir) * (this.v** 2 + 1);
                sounds.hurt.play();
                player.h -= 2 + Math.random() * 4;
            }

            this.c.textAlign = 'center';
            this.c.fillStyle = 'black';
            this.c.font = '12px courier';
            this.c.fillText('PV:' + Math.ceil(this.hp), this.x, this.y - (this.r * 1.5));
            var color = Math.floor((0xff0000 + this.offsetColor) % 2 ** 24).toString(16);
            this.c.fillStyle = ('#000000').substring(0, 7 - color.length) + color;
            if (this.hp <= 0) {
                score += Math.round(50 + (frames / 200));
                sounds.kill.play();
                ha += 50;
                deleteMe(this);
            }
            this.c.fillCircle(Math.round(this.x), Math.round(this.y), Math.round(this.r));
        }
    }
    class Bullet {
        constructor(c, x, y, r, v, dir, t) {
            this.c = c;
            this.x = x;
            this.y = y;
            this.r = r;
            this.v = v;
            this.dir = dir;
            this.t = t;
        }
        step() {
            var dir = this.dir;
            this.x += Math.sin(dir) * this.v;
            this.y += Math.cos(dir) * this.v;
            if (this.t === 0)
                if (colliding(this, player)) {
                    deleteMe(this);
                        player.s = Math.ceil(this.r / 5.333333333333333 * 60);
                }
                // To avoid some Javascript bugs
                else {}
            else {
                var ens = enemies.filter(enemy=>enemy instanceof Enemy);
                for (let en of ens)
                    if (colliding(this, en)) {
                        deleteMe(this);
                        sounds.hurtEnemy.play();
                        en.hp -= 2 + Math.random() * 6;
                    }
            }
            if (collidingEdges(this))
                deleteMe(this);
            this.c.strokeStyle = 'yellow';
            this.c.lineWidth = this.r * 1.2;
            this.c.drawLine(Math.round(this.x), Math.round(this.y), Math.round(this.x) - (Math.sin(dir) * (this.r * 4)), Math.round(this.y) - (Math.cos(dir) * (this.r * 4)));
        }
    }
    var ft = 0;
    var score = 0;
    player.x = Math.round(w / 2 - (player.r / 2));
    player.y = Math.round(h / 2 - (player.r / 2));
    var frames = -1;
    var rgf = 0;
    const help = ['Usa WASD o las flechas, dispara con el ratón.', 'Elimina a los círculos enemigos.'];
    var ha = 10;
    var haActive = false;
    var last69key;
    var mySt = 0;
    var rqstAnimFrame;
    function spawnEnemy() {
    	enemies.push(new Enemy(Math.random() * w,Math.random() * h, 8 * (frames / 15000 + 1), 0.3 * (frames / 15000 + 1),Math.round(30 * (frames / 6000 + 1))));
    }
    function canMove() {
    	return player.s <= 0 && player.h > 0;
    }
    function draw() {
        frames++;
        if (mySt !== player.s && (player.s > 0 && mySt <= 0) || player.s <= 0 || player.s > mySt)
        	mySt = player.s;
        background('white');
        if (Math.random() * 300 <= 1)
            spawnEnemy();
        
        if (keyPressed(69) && last69key && ha > 0)
            haActive = !haActive;
        if (canMove() && mousePressed(0) && ft <= 0 || (haActive && canMove())) {
            if (haActive) {
                ha--;
                if (ha <= 0)
                    haActive = false;
            }
            ft = player.firerate;
            enemies.push(new Bullet(c,player.x, player.y,player.r / 3,5,Math.atan2(mouse.x - (player.x), mouse.y - (player.y)),1));
        } else
            ft--;
        if (rgf <= 0 && player.h < player.maxh && player.h > 0)
            player.h += 0.03;
        else
            rgf--;
        if (player.h > player.maxh)
            player.h = player.maxh;
        
        player.vx *= player.friction;
        player.vy *= player.friction;

        if (canMove()) {
            player.vx += ((keyPressed(39) || keyPressed(68)) - (keyPressed(37) || keyPressed(65))) * player.speed;
            player.vy += ((keyPressed(40) || keyPressed(83)) - (keyPressed(38) || keyPressed(87))) * player.speed;
        } else
            player.s--;
        if (canMove()) {
        if (player.vx < -player.maxv)
        	player.vx = -player.maxv;
        else if (player.vx > player.maxv)
        	player.vx = player.maxv;
        if (player.vy < -player.maxv)
        	player.vy = -player.maxv;
        else if (player.vy > player.maxv)
        	player.vy = player.maxv;
        }
            player.x += player.vx;
        
            if (collidingEdges(player)) {
            	player.x -= player.vx;
            	player.vx = -player.vx;
            }
            player.y += player.vy;
            if (collidingEdges(player)) {
            	player.y -= player.vy;
            	player.vy = -player.vy;
            }
        
        for (var en of enemies)
            en.step();
        (canMove()) ? c.fillStyle = '#17DF1F' : c.fillStyle = 'black';
        c.fillCircle(Math.round(player.x), Math.round(player.y), Math.round(player.r));
        enemies = enemies.filter(Boolean);
        last69key = !keyPressed(69);
        c.font = '16px helvetica neue, helvetica, arial, sans-serif';
        c.textAlign = 'left';
        //c.fillText('Salud: ' + Math.ceil(player.h), 10, 20);
        c.fillStyle = 'black';
        var outline = 2
        c.fillRect(10 - outline, 10 - outline, 400 + (outline * 2), 16 + (outline * 2));
        if (mySt > 0) {
        	c.fillRect(10 - outline, 26 + outline, 240 + (outline * 2), 16 + (outline * 2 - 2));
        	c.fillStyle = 'white';
        	c.fillRect(10, 26 + outline, Math.round(240 * (player.s / mySt)), 16);
        
        }
        var numHealth = player.h / player.maxh;
        if (numHealth > 0.6)
            c.fillStyle = 'lime';
        else if (numHealth > 0.3)
            c.fillStyle = 'yellow';
        else if (numHealth > 0.1)
            c.fillStyle = 'orange';
        else
        	c.fillStyle = 'red';
        c.fillRect(10, 10, Math.round(Math.max(0, 400 * (numHealth))), 16);
        c.fillStyle = 'black';
        c.fillText('Metralleta: ' + ha + ' balas (Pulsa E para activar/desactivar)', 7, 50 + ((mySt > 0) * 18));
        if (help[Math.floor(frames / (4 * 60))] !== undefined) {
            c.textAlign = 'center';
            c.fillText(help[Math.floor(frames / (4 * 60))], w / 2, 20);
        }
        c.textAlign = 'right';
        c.fillText('Puntuación: ' + score, w - 10, 20);
        c.fillText('Tiempo: ' + Math.floor(frames / 60), w - 10, 40);

         if (player.s > 0 && mySt !== player.s)
            	canvas.style.cursor = 'not-allowed';
            else if (mySt === 0)
            	canvas.style.cursor = `url('cursors/shoot.png') 16 16, auto`;

        if (player.h <= 0) {
        	c.textAlign = 'center';
        	c.font = '30px helvetica neue, helvetica, arial, sans-serif';
            c.fillText('Perdiste... Pulsa R para volver a intentarlo.', w / 2, h / 2);
            document.addEventListener('keydown', e=>{
                if (e.key === 'r') {
                    window.cancelAnimationFrame(rqstAnimFrame);
                    window.location.reload();
                }
            });
            window.removeEventListener('resize', canvasResize);
            window.onbeforeunload = null;
            canvas.style.cursor = 'default';
        }
        rqstAnimFrame = window.requestAnimationFrame(draw);
    }
    draw();

    for (var i = 0; i < 5; i++)
        spawnEnemy();
}();