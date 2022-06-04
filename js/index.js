//!function() {
	'use strict';

	const canvas = document.querySelector('canvas');
	const c = canvas.getContext('2d');
	const w = canvas.width = 854;
	const h = canvas.height = 460;
	const keys = {};
	const mouse = {
		x: 0,
		y: 0
	}

	canvas.addEventListener('mousemove', e=> {
		const rect = canvas.getBoundingClientRect();
		mouse.x = Math.floor(e.clientX / (rect.width / w));
		mouse.y = Math.floor(e.clientY / (rect.height / h));
	});
	function mousePressed(which) {
		if (which in mouse)
			return mouse[which];
		else {
			mouse[which] = false;
		    Function('keys', `
			document.addEventListener('mousedown', e=> {
			    if (e.button === ${which})
			        mouse[${which}] = true;
			});
			document.addEventListener('mouseup', e=> {
			    if (e.button === ${which})
			        mouse[${which}] = false;
			});
		    `)(keys);
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
	    r: 25,
	    s: 0,
	    h: 100,
	    speed: 1.5,
	    firerate: 10
	};
	var enemies = [];
	class Enemy {
		constructor(x, y, r, v, hp) {
			this.c = c;
			this.x = x;
			this.y = y;
			this.r = r;
			this.v = v;
			this.hp = hp;
			this.mhp = hp;
			this.offsetColor = frames;
		}
		step() {
			var dir = Math.atan2(player.x + (player.r / 2) - (this.x + (this.r / 2)), player.y + (player.r / 2) - (this.y + (this.r / 2)));
			this.x += Math.sin(dir) * this.v;
			this.y += Math.cos(dir) * this.v;
			if (Math.random() * 500 <= 1)
			    enemies.push(new Bullet(this.c, this.x + (this.r / 2), this.y + (this.r / 2), this.r / 3, this.v * 3.3333333333333333, dir, 0));

			if (Math.random() * 30 <= 1 && this.x + this.r > player.x && this.x < player.x + player.r && this.y + this.r > player.y && this.y < player.y + player.r) {
				rgf = 15 * 60;
				player.h -= 2 + Math.random() * 6;
			}
			
			this.c.textAlign = 'center';
			this.c.fillStyle = 'black';
			this.c.font = '12px courier';
			this.c.fillText('HP:' + this.hp, this.x, this.y - this.r + 9);
			this.c.fillStyle = '#' + Math.round(16711680 + this.offsetColor % 2** 24).toString(16);
			if (this.hp <= 0) {
				score += Math.round(50 + (frames / 200));
				delete enemies[enemies.indexOf(this)];
			}
			this.c.fillRect(Math.round(this.x), Math.round(this.y), Math.round(this.r), Math.round(this.r));
		}
	}
	class Bullet {
		constructor(c, x, y, r, v, dir, t) {
			//super();
			this.c = c;
			this.x = x - (r / 2);
			this.y = y - (r / 2);
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
                if (this.x + this.r > player.x && this.x < player.x + player.r && this.y + this.r > player.y && this.y < player.y + player.r)
				    player.s = 60;
				else {}
			else {
					var ens = enemies.filter(enemy => enemy instanceof Enemy);
					for (let en of ens)
						if (this.x + this.r > en.x && this.x < en.x + en.r && this.y + this.r > en.y && this.y < en.y + en.r)
					        en.hp--;
				}
			if (this.x > w || this.x < 0 || this.y > h || this.y < 0)
				delete enemies[enemies.indexOf(this)];
			this.c.fillStyle = 'yellow';
			this.c.fillRect(Math.round(this.x), Math.round(this.y), Math.round(this.r), Math.round(this.r));
		}
	}
	var ft = 0;
	var score = 0;
	player.x = Math.round(w / 2 - (player.r / 2));
	player.y = Math.round(h / 2 - (player.r / 2));
	var frames = -1;
	var rgf = 0;
	function draw() {
		frames++;
		background('white');
		if (Math.random() * 100 <= 1)
			enemies.push(new Enemy(Math.random() * w, Math.random() * h, 15 * (frames / 15000 + 1), 0.3 * (frames / 6000 + 1), Math.round(30 * (frames / 6000 + 1))));
		(player.s <= 0)?
		    c.fillStyle = '#17DF1F'
		:
		    c.fillStyle = 'black';
		if (player.s <= 0 && mousePressed(0) && ft <= 0) {
			ft = player.firerate;
			enemies.push(new Bullet(c, player.x + (player.r / 2), player.y + (player.r / 2), player.r / 3, 5, Math.atan2(mouse.x - (player.x + (player.r / 2)), mouse.y - (player.y + (player.r / 2))), 1));
		} else
		    ft--;
		if (rgf <= 0 && player.h < 100)
			player.h += 0.03;
		else
			rgf--;
		if (player.h > 100)
			player.h = 100;
		c.fillRect(player.x, player.y, player.r, player.r);
		c.fillStyle = 'black';
		c.font = '16px courier';
		c.textAlign = 'left';
		c.fillText('Health: ' + Math.round(player.h), 10, 15);
		c.textAlign = 'right';
		c.fillText('Score: ' + score, w - 10, 15);
		if (player.s <= 0) {
		    player.x += ((keyPressed(39) || keyPressed(68)) - (keyPressed(37) || keyPressed(65))) * player.speed;
		    player.y += ((keyPressed(40) || keyPressed(83)) - (keyPressed(38) || keyPressed(87))) * player.speed;
        } else
            player.s--;
		for (var en of enemies)
			en.step();
		enemies = enemies.filter(Boolean);
		if (player.h <= 0) {
			window.alert('you lose... Press R to try again.');
			document.addEventListener('keydown', e=> {
				if (e.key === 'r')
					window.location.reload();
			});
		} else
		    window.requestAnimationFrame(draw);
	}
	draw();
//}();