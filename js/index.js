!function() {
    'use strict';

    const canvas = document.querySelector('canvas');
    const c = canvas.getContext('2d', {
        alpha: true
    });

    var w;
    var h;
    const keys = {};
    const mouse = {
        x: 0,
        y: 0
    };
    const colchanTime = 40;
    c.fillCircle = (x,y,radius)=>{
        c.beginPath();
        c.arc(x, y, radius, 0, 2 * Math.PI);
        c.fill();
    }
    c.drawLine = (x,y,x2,y2)=>{
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
    window.onbeforeunload = e=>{
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
    function keyCode(kc) {
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
            return keyCode(kc);
        }
    }

    function background(co) {
        const f = c.fillStyle;
        c.fillStyle = co;
        c.fillRect(0, 0, w, h);
        c.fillStyle = f;
    }
    function decimal(n, l) {
        return Number.parseFloat(n).toFixed(l);
    }
    var player = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        friction: 0.95,
        maxv: 5,
        r: 13,
        s: 0,
        h: 100,
        speed: 0.5,
        firerate: 10,
        stam: 2000
    };
    player.mh = player.h;
    var enemies = [];
    function deleteMe(t) {
        delete enemies[enemies.indexOf(t)];
    }
    function colliding(o1, o2) {
        var dx = o1.x - o2.x
          , dy = o1.y - o2.y;
        var distance = Math.sqrt(dx ** 2 + dy ** 2);
        return distance < o1.r + o2.r;
    }
    c.drawBar = (x,y,w,h,co,v,o,oco)=>{
        var lastFillStyle = c.fillStyle;
        if (o !== 0) {
            c.fillStyle = oco;
            c.fillRect(Math.round(x - o), Math.round(y - o), Math.round(w + (o * 2)), Math.round(h + (o * 2)));
        }
        c.fillStyle = co;
        c.fillRect(Math.round(x), Math.round(y), Math.round(w * v), Math.round(h));
        c.fillStyle = lastFillStyle;
    }

    function collidingEdges(o) {
        return o.x + o.r > w || o.x - o.r < 0 || o.y + o.r > h || o.y - o.r < 0;
    }

    function canMove(o) {
        return o.s <= 0 && o.h > 0;
    }
    function stun(o, t) {
        o.s = t;
    }
    function showHealth(o) {
        c.drawBar(o.x - (o.r * 1.5), o.y - (o.r * 1.5), o.r * 3, o.r / 4, `hsl(${o.h / o.mh * 100}, 100%, 50%)`, Math.max(0, o.h / o.mh), 1, 'black');
    }
    class Damage {
        constructor(ct, x, y, h) {
            this.c = ct;
            this.x = x;
            this.y = y;
            this.h = h;
            if (this.h > 0)
                this.h = '+' + this.o.h;
            this.vanishTime = 1000;
            this.size = 8 + Math.abs(this.h);
            this.vanish = this.vanishTime / 2;
        }
        step() {
            var color = (this.h > 0) ? 'rgba(0, 255, 0, ' : 'rgba(255, 0, 0, ';
            color += this.vanish / this.vanishTime + ')';
            this.c.fillStyle = this.c.strokeStyle = color;
            this.c.lineWidth = 2;
            this.size += 0.2;
            this.c.font = `${this.size}px helvetica neue, helvetica, arial, sans-serif`;
            this.c.textAlign = 'center';
            this.c.fillText(this.h, this.x, this.y);
            this.c.strokeText(this.h, this.x, this.y);
            this.vanish -= this.vanishTime / 120;
            if (this.vanish <= 0)
                deleteMe(this);
        }
    }
    class Enemy {
        constructor(x, y, r, v, h) {
            this.c = c;
            this.x = x;
            this.y = y;
            this.r = r;
            this.v = Math.min(player.maxv - 0.1, v);
            this.h = h;

            this.offsetColor = frames;
            this.type = Number(Math.random() > 0.75);
            this.colchan = 0;
            this.s = 0;
            if (this.type === 1)
                this.h *= 2;
            this.lh = this.h;
            this.mh = this.h;
            this.dir = Math.random() * 360;
            this.stunThenShoot = false;
        }
        step() {
            var dir = Math.atan2(player.x - this.x, player.y - this.y);
            this.dir = dir;
            var typeShot = Number(Math.random() < 0.5);
            var shoot = function(o, sp, pres, type) {
                enemies.push(new Bullet(o.c,o.x,o.y,o.r / 3,sp,o.dir,0,type,o.c.fillStyle,pres));
            }

            var color = Math.floor((0x00ff29 + this.offsetColor) % 2 ** 24).toString(16);
            this.c.fillStyle = (canMove(this)) ? c.fillStyle = ('#000000').substring(0, 7 - color.length) + color : c.fillStyle = 'black';
            if (this.lh !== this.h && this.lh > this.h) {
                enemies.push(new Damage(this.c,this.x,this.y,decimal(this.h - this.lh, 1)));
                this.colchan = colchanTime;
            }
            if (canMove(this)) {
                this.x += Math.sin(this.dir) * this.v;
                this.y += Math.cos(this.dir) * this.v;
                if (Math.random() <= 0.004 || (this.stunThenShoot && player.s > 0)) {
                    var type = (this.stunThenShoot) ? 0 : typeShot;
                    sounds.shoot.play();
                    this.stunThenShoot = false;
                    if (Math.random() < 0.3 && !this.stunThenShoot) {
                        shoot(this, this.v * 10.3333333333333333, 0.01, 1);
                        this.stunThenShoot = true;
                    } else if (this.type === 1) {
                        var nshots = 10;
                        for (var i = 0; i < nshots; i++) {
                            shoot(this, this.v * 6.3333333333333333, 0.1, type);
                        }
                    } else
                        shoot(this, this.v * 10.3333333333333333, 0.01, type);
                }

                if (Math.random() <= -0.1 && colliding(this, player)) {

                    player.vx += Math.sin(dir) * (this.v ** 2 + 1);
                    player.vy += Math.cos(dir) * (this.v ** 2 + 1);
                    rgf = 15 * 60;
                    sounds.hurt.play();
                    player.h -= 0.5 + Math.random() * 2;
                }
            }

            if (this.h <= 0) {
                score += Math.round(50 + (frames / 200));
                sounds.kill.play();
                ha += 50;
                if (Math.random() < 0.3)
                    sb += 10;
                deleteMe(this);
            }
            this.c.fillCircle(Math.round(this.x), Math.round(this.y), Math.round(this.r));
            if (this.type === 1) {
                if (canMove(this))
                    this.c.fillStyle = 'yellow';
                this.c.fillCircle(Math.round(this.x), Math.round(this.y), Math.round(this.r / 2));
            }
            if (this.colchan > 0) {
                this.c.fillStyle = `rgba(255, 0, 0, ${this.colchan / colchanTime})`;
                this.c.fillCircle(Math.round(this.x), Math.round(this.y), Math.round(this.r));
            }
            showHealth(this)
            this.colchan--;
            this.lh = this.h;
            if (!canMove(this))
                this.s--;
        }
    }
    class Bullet {
        constructor(ce, x, y, r, v, dir, t, val, color, pres) {
            this.c = ce;
            this.x = x;
            this.y = y;
            this.r = r;
            this.v = v;
            this.dir = dir + (-pres + Math.random() * (pres * 2));
            this.t = t;
            this.val = val;
            this.color = color;
            this.destroy = false;
        }
        step() {
            var dir = this.dir;
            this.x += Math.sin(dir) * this.v;
            this.y += Math.cos(dir) * this.v;
            if (this.t === 0)
                if (colliding(this, player)) {

                    if (this.val === 0) {
                        rgf = 15 * 60;
                        sounds.hurt.play();
                        player.h -= 2 + Math.random() * 4;
                        player.vx += Math.sin(dir) * (this.v);
                        player.vy += Math.cos(dir) * (this.v);
                    } else
                        stun(player, 1 * 60);
                    this.destroy = true;
                }// To avoid some Javascript bugs
                else {}
            else {
                var ens = enemies.filter(enemy=>enemy instanceof Enemy);
                for (let en of ens)
                    if (colliding(this, en)) {
                        if (this.val === 0) {

                            sounds.hurtEnemy.play();
                            en.h -= 2 + Math.random() * 4;
                        } else
                            stun(en, 1 * 60);
                        this.destroy = true;
                    }
            }
            if (collidingEdges(this) || this.destroy)
                deleteMe(this);
            this.c.strokeStyle = this.c.fillStyle = this.color;
            //'tomato';
            this.c.lineWidth = this.r * 1.2;
            if (this.val === 0)
                this.c.fillCircle(Math.round(this.x), Math.round(this.y), Math.round(this.r));
            else
                this.c.drawLine(Math.round(this.x), Math.round(this.y), Math.round(this.x) - (Math.sin(dir) * (this.r * 4)), Math.round(this.y) - (Math.cos(dir) * (this.r * 4)));
        }
    }
    var ft = 0;
    var score = 0;
    player.x = Math.round(w / 2 - (player.r / 2));
    player.y = Math.round(h / 2 - (player.r / 2));
    var frames = -1;
    var rgf = 0;
    const help = ['Usa WASD o las flechas, dispara con el ratón,', 'presiona SHIFT para correr.', 'Elimina a los círculos enemigos.'];
    var ha = 10;
    var sb = 10;
    var haActive = false;
    var last69key, last32key, last48key, last49key;
    var mySt = 0;
    var rqstAnimFrame;
    var lose = false;
    var myStam = player.stam;
    var sprinting;
    var move = {
        left: null,
        right: null,
        up: null,
        down: null,
        moving: null
    }
    function spawnEnemy() {
        enemies.push(new Enemy(Math.random() * w,Math.random() * h,8 * (frames / 15000 + 1),0.3 * (frames / 15000 + 1),Math.round(30 * (frames / 6000 + 1))));
    }
    player.lh = player.h;
    player.colchan = 0;
    var recording = false;
    var recordData = [];
    var watchRec = false;
    var recFrames = 0;
    c.imageSmoothingEnabled = false;
    function draw() {
        background('white');
        if (keyCode(48) && last48key)
            recording = !recording;
        if (keyCode(49) && last49key) {
            watchRec = !watchRec;
            if (watchRec)
                recFrames = 0;
        }
        if (watchRec) {
            c.drawImage(recordData[recFrames % recordData.length], 0, 0, w, h);
            recFrames++;
        } else {
            frames++;
            var shoot = function(o, type) {
                enemies.push(new Bullet(c,o.x,o.y,o.r / 3,5,Math.atan2(mouse.x - (o.x), mouse.y - (o.y)),1,type,c.fillStyle,0.03));
            }
            move.right = keyCode(39) || keyCode(68);
            move.left = keyCode(37) || keyCode(65);
            move.down = keyCode(40) || keyCode(83);
            move.up = keyCode(38) || keyCode(87);
            move.moving = move.right || move.left || move.down || move.up;
            sprinting = keyCode(16) && player.stam && canMove(player) && move.moving;
            if (player.stam < myStam && (!keyCode(16) && canMove(player)))
                player.stam++;
            if (mySt !== player.s && (player.s > 0 && mySt <= 0) || player.s <= 0 || player.s > mySt)
                mySt = player.s;
            if (Math.random() * 300 <= 1)
                spawnEnemy();

            if (rgf <= 0 && player.h < player.mh && player.h > 0)
                player.h += 0.03;
            else
                rgf--;
            if (player.h > player.mh)
                player.h = player.mh;

            player.vx *= (canMove(player)) ? player.friction : 0.983;
            player.vy *= (canMove(player)) ? player.friction : 0.983;
            if (sprinting && player.stam > 0) {
                player.stam -= 3;
                if (player.stam < 0)
                    player.stam = 0;
            }
            if (canMove(player)) {
                player.vx += (move.right - move.left) * player.speed;
                player.vy += (move.down - move.up) * player.speed;

                var maxv = (player.maxv * ((sprinting * 3) + 1)) / 5;
                if (Math.abs(player.vx) > maxv)
                    player.vx += ((maxv * Math.sign(player.vx)) - player.vx) / 8;
                if (Math.abs(player.vy) > maxv)
                    player.vy += ((maxv * Math.sign(player.vy)) - player.vy) / 8;

                if (keyCode(69) && last69key && ha > 0)
                    haActive = !haActive;
            } else
                player.s--;
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
            showHealth(player);
            (canMove(player)) ? c.fillStyle = '#17DF1F' : c.fillStyle = 'black';
            if (player.lh !== player.h && player.lh > player.h) {
                enemies.push(new Damage(c,player.x,player.y,decimal(player.h - player.lh, 1)));
                player.colchan = colchanTime;
            }

            if (keyCode(32) && last32key && sb > 0 && canMove(player)) {
                sb--;
                shoot(player, 1);
            }
            if (canMove(player) && mousePressed(0) && ft <= 0 || (haActive && canMove(player))) {
                if (haActive) {
                    ha--;
                    if (ha <= 0)
                        haActive = false;
                }
                ft = player.firerate;
                shoot(player, 0);
            } else
                ft--;
            c.fillCircle(Math.round(player.x), Math.round(player.y), Math.round(player.r));
            if (player.colchan > 0) {
                c.fillStyle = `rgba(255, 0, 0, ${player.colchan / colchanTime})`;
                c.fillCircle(Math.round(player.x), Math.round(player.y), Math.round(player.r));
            }
            enemies = enemies.filter(enemy=>enemy !== undefined);
            last69key = !keyCode(69);
            last32key = !keyCode(32);
            c.font = '16px helvetica neue, helvetica, arial, sans-serif';
            c.textAlign = 'left';
            var outline = 2

            var numHealth = player.h / player.mh;
            var color;
            color = `hsl(${player.h / player.mh * 100}, 100%, 50%)`;
            c.drawBar(10, 10, 400, 16, color, Math.max(0, player.h / player.mh), outline, 'black');
            if (sprinting)
                color = '#FF9510';
            else
                color = 'cyan';
            c.drawBar(10, 10 + ((16 + outline) * 1), 300, 16, color, Math.max(0, player.stam / myStam), outline, 'black');
            if (mySt > 0)
                c.drawBar(10, 10 + ((16 + outline) * 2), 200, 16, 'white', player.s / mySt, outline, 'black');
            c.fillStyle = 'black';
            var line = 66 + (mySt > 0) * (16 + outline);
            c.fillText('Metralleta: ' + ha + ' balas (Pulsa E para activar/desactivar)', 7, line);
            line += 18;
            c.fillText('Balas aturdidoras: ' + sb + ' balas (Pulsa ESPACIO para disparar una)', 7, line)
            c.textAlign = 'center';
            if (help[Math.floor(frames / (4 * 60))] !== undefined) {
                c.fillText(help[Math.floor(frames / (4 * 60))], w / 2, 20);
            }
            c.fillText('Créditos a Scratch (https://scratch.mit.edu/) por los sonidos: Wub Beatbox, Crunch, Small Cowbell.', w / 2, h - 6);
            c.textAlign = 'right';
            c.fillText('Puntuación: ' + score, w - 10, 20);
            c.fillText('Tiempo: ' + Math.floor(frames / 60), w - 10, 40);

            if (player.s > 0 && mySt !== player.s)
                canvas.style.cursor = "url('cursors/not-allowed.png') 16 16, auto";
            else if (mySt === 0)
                canvas.style.cursor = "url('cursors/shoot.png') 16 16, auto";

            if (player.h <= 0) {
                c.textAlign = 'center';
                c.font = '30px helvetica neue, helvetica, arial, sans-serif';
                c.fillText('Perdiste... Pulsa R para volver a intentarlo.', w / 2, h / 2);
                if (!lose) {
                    sounds.kill.play();
                    document.addEventListener('keydown', e=>{
                        if (e.key === 'r')
                            window.location.reload();
                    }
                    );
                    //window.removeEventListener('resize', canvasResize);
                    window.onbeforeunload = null;
                    lose = true;
                }
                canvas.style.cursor = "url('cursors/default.png'), auto";
            }
            player.colchan--;
            player.lh = player.h;
        }
        if (recording) {
            var image = new Image();
            image.src = canvas.toDataURL('image/jpeg', 0);
            recordData.push(image);
        }
        last48key = !keyCode(48);
        last49key = !keyCode(49);
        rqstAnimFrame = window.requestAnimationFrame(draw);
    }
    draw();

    for (var i = 0; i < 10; i++)
        spawnEnemy();
}();