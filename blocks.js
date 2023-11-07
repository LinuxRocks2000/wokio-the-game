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
                tiler.flatColor("rgb(" + (122 + 122 * (1 - (tiler.internalTendency(4)/4))) + ", 0, 0)");
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