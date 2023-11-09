class GroundObject extends GameObject {
    constructor(game, x, y, width, height) {
        super(game, x, y, width, height, "solid");
        this.isStatic = true;
        this.frictionY = 0.3;
        this.americanSoil = 0;
    }

    prerender(ctx) {
        var tiler = new TilingWorker(ctx, this.constructor.name, this.x, this.y, this.game);
        tiler.iterative(0, 0, this.width/this.game.blockSize, this.height/this.game.blockSize, (x, y) => {
            if (flatten(tiler.pDist()/10) < this.game.americanSoil) {
                tiler.image((x + y) % 2 == 0 ? document.getElementById("american_soil") : document.getElementById("confederate_soil"));
            }
            else {
                tiler.flatColor("rgb(" + (122 * (1 - (tiler.internalTendency(3)/3))) + ", 0, 0)");
            }
        });
    }

    update() {
        if (this.game.americanSoil != this.americanSoil) {
            this.americanSoil = this.game.americanSoil;
            this.needsArtRefresh = true;
        }
    }
}


class BrickObject extends GameObject {
    constructor(game, x, y, width, height) {
        super(game, x, y, width, height, "solid");
        this.isStatic = true;
    }

    prerender(ctx) {
        var tiler = new TilingWorker(ctx, this.constructor.name, this.x, this.y, this.game);
        tiler.fillMe(this, () => {
            tiler.flatColor("brown");
        });
    }
}


class CapitolObject extends GameObject {
    constructor(game, x, y, w, h) {
        super(game, x, y, w, h, "capitol");
    }

    prerender(ctx) {
        ctx.drawImage(document.getElementById("capitol"), 0, 0);
    }
}


class AlGorembaEnemy extends GameObject {
    constructor (game, x, y, w, h) {
        super(game, x, y, w, h, "enemy");
        this.specialCollisions.push("player");
        this.maxHealth = 1;
        this.prerendered = false;
        this.isStatic = false;
        this.collisions.push("player");
        this.direction = true;
    }

    animate(ctx, delta) {
        if (this.xv < 0) {
            ctx.translate(this.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(document.getElementById(window.performance.now() % 300 > 150 ? "algoremba1" : "algoremba0"), 0, 0);
        if (this.xv < 0) {
            ctx.scale(-1, 1);
            ctx.translate(-this.width, 0);
        }
    }

    topCollision(thing) {
        if (thing.type == "player") {
            this.health = -1;
            thing.yv = -700;
            this.game.player.heal(1);
        }
    }

    rightCollision(thing) {
        if (thing.type == "player") {
            thing.harm(2);
            this.say("It's an inconvenient truth!");
        }
        this.direction = false;
    }

    leftCollision(thing) {
        if (thing.type == "player") {
            thing.harm(2);
            this.say("It's an inconvenient truth!");
        }
        this.direction = true;
    }

    update(delta) {
        if (this.direction) {
            this.xv = 100;
        }
        else {
            this.xv = -100;
        }
    }
}