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
        w = canvas.width = window.innerWidth * window.devicePixelRatio;
        h = canvas.height = window.innerHeight * window.devicePixelRatio;
    }
    canvasResize();
    window.addEventListener('resize', canvasResize);
    window.onbeforeunload = e=>{
        return false;
    }
    function loadSound(u) {
        var sound = new Audio();
        sound.src = u;
        sound.playme = function() {
            this.currentTime = 0;
            this.play();
        }
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
        baseSt: 0,
        baseStam: null,
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
    function stun(o, v) {
        if (v >= o.baseSt)
            o.s = v;
    }
    function damage(o, v) {
        if (o instanceof Enemy)
            sounds.hurtEnemy.playme();
        else {

            rgf = 15 * 60;
            sounds.hurt.playme();
        }
        o.h -= v;
    }
    function showHealth(o) {
        var r = o.r * 1.5
          , x = o.x - r
          , y = o.y - r
          , w = o.r * 3
          , h = o.r / 4;
        var outline = 1;
        var another = ()=>y -= h + (r / 4);
        c.drawBar(x, y, w, h, `hsl(${o.h / o.mh * 100}, 100%, 50%)`, Math.max(0, o.h / o.mh), outline, 'rgba(128, 128, 128, 0.5)');
        if (o.baseSt > 0) {
            another();
            c.drawBar(x, y, w, h, 'white', o.s / o.baseSt, outline, 'rgba(128, 128, 128, 0.5)');
        }
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

            this.offsetColor = enemyFr;
            this.type = Math.random();
            if (this.type > 0.4)
                this.type = 0;
            else if (this.type > 0.2)
                this.type = 1;
            else if (this.type > 0.05)
                this.type = 2;
            else {
                this.type = 3;
                this.active = false;
                this.shootData = {
                    x: Math.random() * w,
                    y: Math.random * h
                };
            }
            this.colchan = 0;
            this.s = 0;
            this.baseSt = 0;
            if (this.type === 1)
                this.h *= 2;
            else if (this.type === 2) {
                this.v *= 0.5;
                this.h *= 3;
            } else if (this.type === 3) {
                this.v *= 0.2;
                this.h *= 0.5;
            }
            this.lh = this.h;
            this.mh = this.h;
            this.dir = Math.random() * 360;
        }
        step() {
            if (this.baseSt !== this.s && (this.s > 0 && this.baseSt <= 0) || this.s <= 0 || this.s > this.baseSt)
                this.baseSt = this.s;
            var dir = Math.atan2(player.x - this.x, player.y - this.y);
            this.dir = dir;
            var typeShot = Number(Math.random() < 0.5);
            var shoot = (o,r,sp,dir,pres,type,dmg,stun)=>enemies.push(new Bullet(o.c,o.x,o.y,r,sp,dir,0,type,o.c.fillStyle,pres,dmg,stun));

            var push = function(v) {
                player.vx += Math.sin(dir) * v;
                player.vy += Math.cos(dir) * v;
            }

            var color = Math.floor((0x00ff29 + this.offsetColor) % 2 ** 24).toString(16);
            this.c.fillStyle = (canMove(this)) ? c.fillStyle = ('#000000').substring(0, 7 - color.length) + color : c.fillStyle = 'gray';
            if (this.lh !== this.h && this.lh > this.h) {
                enemies.push(new Damage(this.c,this.x,this.y,decimal(this.h - this.lh, 1)));
                this.colchan = colchanTime;
            }
            if (canMove(this)) {
                this.x += Math.sin(this.dir) * this.v;
                this.y += Math.cos(this.dir) * this.v;

                if (this.type === 3) {
                    this.c.strokeStyle = (this.active) ? 'rgba(255, 0, 0, 0.25)' : 'rgb(255, 0, 0)';
                    var lastStroke = this.c.lineWidth;
                    this.c.lineWidth = this.r / 5;
                    this.c.drawLine(this.x, this.y, this.shootData.x, this.shootData.y);
                    this.c.lineWidth = lastStroke;
                    if (Math.random() < 0.02) {
                        this.active = true;
                        this.shootData.x = player.x;
                        this.shootData.y = player.y;
                    }
                }

                if (this.type !== 2 && Math.random() <= 0.004 && this.type !== 3 || (this.active && Math.random() < 0.006)) {
                    sounds.shoot.playme();
                    if (this.type === 1) {
                        var nshots = 10;
                        for (var i = 0; i < nshots; i++) {
                            shoot(this, this.r / 3, this.v * 6, this.dir, 0.1, typeShot, 2 + Math.random() * 4, 1);
                        }
                    } else if (this.type === 2)
                        shoot(this, this.r / 3, this.v * 10, this.dir, 0.04, typeShot, 2 + Math.random() * 4, 2);
                    else if (this.type === 3) {
                        this.active = false;
                        shoot(this, this.r / 1.5, this.v * 150, Math.atan2(this.shootData.x - this.x, this.shootData.y - this.y), 0.01, typeShot, 40, 1.5);
                    }
                }

                if (colliding(this, player))
                    if (this.type === 2) {
                        if (Math.random() <= 0.2) {
                            push((this.v + 1) * 4);

                            stun(player, 3 * 60);
                            damage(player, 20);
                        }

                    } else if (Math.random() <= 0.01) {
                        push((this.v + 1) ** 2);

                        damage(player, 0.5 + Math.random() * 2);
                    }
            }

            if (this.h <= 0) {
                score += Math.round(50 + (frames / 200));
                sounds.kill.playme();
                ha += 50;
                if (Math.random() < 0.3)
                    sb += 1;
                deleteMe(this);
            }
            this.c.fillCircle(Math.round(this.x), Math.round(this.y), Math.round(this.r));
            if (this.type >= 1) {
                if (canMove(this))
                    this.c.fillStyle = (this.type === 1) ? 'yellow' : (this.type === 2) ? 'orange' : 'red';
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
        constructor(ce, x, y, r, v, dir, t, val, color, pres, dmg, stun) {
            this.c = ce;
            this.x = x;
            this.y = y;
            this.r = r;
            this.v = v;
            this.dir = dir + (-pres + Math.random() * (pres * 2));
            this.t = t;
            this.val = val;
            this.color = color;
            this.dmg = dmg;
            this.stun = Math.round(stun * 60);
            this.destroy = false;
        }
        step() {
            var dir = this.dir;
            this.x += Math.sin(dir) * this.v;
            this.y += Math.cos(dir) * this.v;
            if (this.t === 0) {
                if (colliding(this, player)) {
                    player.vx += Math.sin(dir) * (this.v);
                    player.vy += Math.cos(dir) * (this.v);

                    if (this.val === 0) {
                        damage(player, this.dmg);

                    } else
                        stun(player, this.stun);
                    this.destroy = true;
                }
            } else {
                var ens = enemies.filter(enemy=>enemy instanceof Enemy);
                for (let en of ens)
                    if (colliding(this, en)) {
                        if (this.val === 0)
                            damage(en, this.dmg);
                        else
                            stun(en, this.stun);
                        this.destroy = true;
                    }
            }
            if (collidingEdges(this) || this.destroy)
                deleteMe(this);
            this.c.strokeStyle = this.c.fillStyle = this.color;
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
    var enemyFr = frames;
    var rgf = 0;
    const help = ['Usa WASD o las flechas, dispara con el ratón,', 'presiona SHIFT para correr.', 'Elimina a los círculos enemigos.', 'El juego se va complicando a medida que vas avanzando.'];
    var ha = 10;
    var sb = 5;
    var haActive = false;
    var last69key, last32key, last48key, last49key;
    var rqstAnimFrame;
    var lose = false;
    player.baseStam = player.stam;
    var sprinting;
    var move = {
        left: null,
        right: null,
        up: null,
        down: null,
        moving: null
    }
    function spawnEnemy() {
        enemies.push(new Enemy(Math.random() * w,Math.random() * h,8 * (enemyFr / 15000 + 1),0.3 * (enemyFr / 15000 + 1),Math.round(5 * enemyFr / 6000 + 1)));
    }
    player.lh = player.h;
    player.colchan = 0;
    var recording = false;
    var recordData = [];
    var watchRec = false;
    var recFrames = 0;
    c.imageSmoothingEnabled = false;
    function draw() {
        background('#040404');
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
            enemyFr++;
            var shoot = function(o, type) {
                enemies.push(new Bullet(c,o.x,o.y,o.r / 3,5,Math.atan2(mouse.x - (o.x), mouse.y - (o.y)),1,type,c.fillStyle,0.04,2 + Math.random() * 4,5));
            }
            move.right = keyCode(39) || keyCode(68);
            move.left = keyCode(37) || keyCode(65);
            move.down = keyCode(40) || keyCode(83);
            move.up = keyCode(38) || keyCode(87);
            move.moving = move.right || move.left || move.down || move.up;
            sprinting = keyCode(16) && player.stam && canMove(player) && move.moving;
            if (player.stam < player.baseStam && (!keyCode(16) && canMove(player)))
                player.stam++;
            if (player.baseSt !== player.s && (player.s > 0 && player.baseSt <= 0) || player.s <= 0 || player.s > player.baseSt)
                player.baseSt = player.s;
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
            (canMove(player)) ? c.fillStyle = '#17DF1F' : c.fillStyle = 'gray';
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
            c.drawBar(10, 10, 400, 16, color, Math.max(0, player.h / player.mh), outline, 'rgba(128, 128, 128, 0.5)');
            if (sprinting)
                color = '#FF9510';
            else
                color = 'cyan';
            c.drawBar(10, 10 + ((16 + outline) * 1), 300, 16, color, Math.max(0, player.stam / player.baseStam), outline, 'rgba(128, 128, 128, 0.5)');
            if (player.baseSt > 0)
                c.drawBar(10, 10 + ((16 + outline) * 2), 200, 16, 'white', player.s / player.baseSt, outline, 'rgba(128, 128, 128, 0.5)');
            c.fillStyle = 'white';
            var line = 66 + (player.baseSt > 0) * (16 + outline);
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

            if (player.s > 0 && player.baseSt !== player.s)
                canvas.style.cursor = "url('cursors/not-allowed.png') 16 16, auto";
            else if (player.baseSt === 0)
                canvas.style.cursor = "url('cursors/shoot.png') 16 16, auto";

            if (player.h <= 0) {
                c.textAlign = 'center';
                c.font = '30px helvetica neue, helvetica, arial, sans-serif';
                c.fillText('Perdiste... Pulsa R para volver a intentarlo.', w / 2, h / 2);
                if (!lose) {
                    sounds.kill.playme();
                    document.addEventListener('keydown', e=>{
                        if (e.key === 'r')
                            window.location.reload();
                    }
                    );
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

    for (var i = 0; i < 10; i++) {
        enemyFr++;
        spawnEnemy();
    }
}();