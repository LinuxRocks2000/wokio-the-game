class GameObject extends PhysicsObject { // superclass
    constructor(game, x, y, width, height, type) {
        super(game, x, y, width, height, type);
        this.needsArtRefresh = true;
        this.prerendered = true;
        this.maxHealth = 0;
        this.cSpeech = "";
        this.speechTimeLeft = 0;
    }

    say(thing, duration) {
        if (duration == undefined) {
            duration = 2;
        }
        this.cSpeech = thing;
        this.speechTimeLeft = duration;
    }

    harm(amount) {
        this.health -= amount;
    }

    heal(amount) {
        this.health += amount;
    }

    onDeath() {

    }

    draw(delta) { // low-level function: do not override
        if (this.x + this.game.tX + this.width < 0 || this.x + this.game.tX > window.innerWidth || this.y + this.game.tY + this.height < 0 || this.y + this.game.tY > window.innerHeight) {
            return;
        }
        if (this.health == undefined) {
            this.health = this.maxHealth;
        }
        if (!this.isStatic && this.x + this.width < this.game.minX || this.x > this.game.maxX || this.y + this.height < this.game.minY || this.y > this.game.maxY) {
            this.health = -1;
        }
        if (this.speechTimeLeft > 0) {
            this.game.ctx.fillStyle = "white";
            this.game.ctx.font = "16px Pixelify";
            this.game.ctx.fillText(this.cSpeech, this.x + this.width, this.y);
            this.game.ctx.fillRect(this.x + this.width, this.y, 100 * this.speechTimeLeft, 5);
            this.speechTimeLeft -= delta;
        }
        if (this.prerendered) {
            var prer = getPrerender(this.constructor.name, this.width, this.height);
            if (this.needsArtRefresh) {
                this.prerender(prer.ctx);
                this.needsArtRefresh = false;
            }
            this.game.ctx.drawImage(prer.canvas, this.x, this.y);
        }
        else {
            this.game.ctx.translate(this.x, this.y);
            this.animate(this.game.ctx, delta);
            this.game.ctx.translate(-this.x, -this.y);
        }
    }

    animate() {

    }

    prerender() {

    }
}


class TilingWorker {
    constructor (ctx, type, x, y, game) {
        this.ctx = ctx;
        this.surroundings = game.objects;
        this.tilesize = game.blockSize;
        this.cursorX = 0;
        this.cursorY = 0;
        this.type = type;
        this.w = 0; // used for guessing
        this.h = 0;
        this.x = x;
        this.y = y;
        this.game = game;
    }

    setCursor(x, y) {
        this.cursorX = x;
        this.cursorY = y;
    }

    flatColor(color, x, y) {
        this.ctx.fillStyle = color;
        if (x == undefined) {
            x = this.cursorX;
            y = this.cursorY;
        }
        this.ctx.fillRect(x * this.tilesize, y * this.tilesize, this.tilesize, this.tilesize);
    }

    image(image, x, y) {
        if (x == undefined) {
            x = this.cursorX;
            y = this.cursorY;
        }
        this.ctx.drawImage(image, x * this.tilesize, y * this.tilesize);
    }

    pDist(x, y) {
        if (x == undefined) {
            x = this.cursorX;
            y = this.cursorY;
        }
        var realX = this.x + x * this.tilesize;
        var realY = this.y + y * this.tilesize;
        var dX = realX - this.game.player.x;
        var dY = realY - this.game.player.y;
        dX *= dX;
        dY *= dY;
        return Math.sqrt(dX + dY)/this.tilesize;
    }

    iterative(rootX, rootY, wcount, hcount, f) {
        this.w = wcount;
        this.h = hcount;
        for (var x = 0; x < wcount; x ++) {
            for (var y = 0; y < hcount; y ++) {
                this.setCursor(rootX + x, rootY + y);
                f(x, y);
            }
        }
    }

    fillMe(thing, f) {
        this.iterative(0, 0, thing.width/this.tilesize, thing.height/this.tilesize, f);
    }

    squareIsUs(x, y) {
        if (x >= 0 && x < this.w && y >= 0 && y < this.h) {
            return true;
        }
        for (var i = 0; i < this.surroundings.length; i ++) {
            var item = this.surroundings[i];
            if (item.constructor.name == this.type) {
                var relX = item.x - this.x;
                var relY = item.y - this.y;
                relX /= this.tilesize;
                relY /= this.tilesize;
                var relW = item.width/this.tilesize;
                var relH = item.height/this.tilesize;
                if (x >= relX && x < relX + relW && y >= relY && y < relY + relH) {
                    return true;
                }
            }
        }
    }

    shell(size, x, y) {
        if (x == undefined) {
            x = this.cursorX;
            y = this.cursorY;
        }
        var rootX = x - size - 1;
        var rootY = y - size - 1;
        var ret = 0;
        var sideLength = (size + 1) * 2;
        for (var i = 0; i < sideLength; i ++) {
            if (!this.squareIsUs(rootX + i, rootY)) {
                ret ++;
            }
            if (!this.squareIsUs(rootX + sideLength, rootY + i)){
                ret ++;
            }
            if (!this.squareIsUs(rootX + sideLength - i, rootY + sideLength)) {
                ret ++;
            }
            if (!this.squareIsUs(rootX, rootY + sideLength - i)) {
                ret ++;
            }
        }
        return ret;
    }

    internalTendency(max, x, y) { // find the shortest distance within max to a square NOT occupied by this type.
        if (x == undefined) {
            x = this.cursorX;
            y = this.cursorY;
        }
        for (var i = 0; i < max; i ++) {
            if (this.shell(i, x, y) > 0) {
                return i;
            }
        }
        return max;
    }
}