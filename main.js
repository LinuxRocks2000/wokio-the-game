var prerenderPool = {}; // pool of prerendering canvases.
function getPrerender(type, width, height) {
    var name = type + width + "x" + height
    if (prerenderPool[name]) {
        return prerenderPool[name];
    }
    else {
        var canvas = document.createElement("canvas");
        canvas.style.display = "none";
        canvas.width = width;
        canvas.height = height;
        document.body.appendChild(canvas);
        prerenderPool[name] = {
            ctx: canvas.getContext("2d"),
            canvas: canvas
        };
        return getPrerender(type, width, height);
    }
}

function clamp(min, val, max) {
    if (val < min) {
        val = min;
    }
    if (val > max) {
        val = max;
    }
    return val;
}


function flatten(thing) { // lim[x -> inf] flatten(x) = 1; flatten(0) = 0.
    return 1 - 1/(1 + thing);
}


var curLevel = 0;


class InputManager {
    constructor(element) {
        this.mouseX = 0;
        this.mouseY = 0;
        this.keysDown = {};
        this.toggles = {};
        this.dispatch = { // all subscribers MUST implement this interface.
            keyUp(key) {
                console.log(key + " up");
            },
            keyDown(key) {
                console.log(key + " down");
            },
            keyOn(key) {
                console.log(key + " on");
            },
            keyOff(key) {
                console.log(key + " off");
            },
            mouseUp(x, y) {
                console.log("mouse up");
            },
            mouseDown(x, y) {
                console.log("mouse down");
            },
            mouseMove(x, y) {
                console.log("mouse moved to " + x + ", " + y);
            }
        };
        element.addEventListener("keydown", (event) => {
            this.keysDown[event.key] = true;
            this.dispatch.keyDown(event.key);
        });
        element.addEventListener("keyup", (event) => {
            this.keysDown[event.key] = false;
            this.dispatch.keyUp(event.key);
            if (this.toggles[event.key]) {
                this.toggles[event.key] = false;
                this.dispatch.keyOff(event.key);
            }
            else {
                this.toggles[event.key] = true;
                this.dispatch.keyOn(event.key);
            }
        });
        element.addEventListener("mousedown", (event) => {
            this.dispatch.mouseDown(event.clientX, event.clientY);
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
        });
        element.addEventListener("mouseup", (event) => {
            this.dispatch.mouseUp(event.clientX, event.clientY);
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
        });
        element.addEventListener("mousemove", (event) => {
            this.dispatch.mouseMove(event.clientX, event.clientY);
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
        });
    }

    subscribe(item) {
        this.dispatch = item;
    }
}


class Player extends GameObject {
    constructor(game, x, y, w, h) {
        super(game, x, y, w, h, "player");
        this.isStatic = false;
        this.prerendered = false;
        this.art = {
            stand: document.getElementById("player_stand")
        };
        this.reversed = false;
        this.jumpCycle = 0;
        this.specialCollisions.push("capitol");
        this.collisions.push("enemy");
        this.maxHealth = 20;
    }
    
    specialCollision(type, thing) {
        if (type == "capitol") {
            playLevel(curLevel + 1);
        }
    }

    animate(ctx) {
        if (this.reversed) {
            ctx.translate(this.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(this.art.stand, 0, 0);
        if (this.reversed) {
            ctx.scale(-1, 1);
            ctx.translate(-this.width, 0);
        }
    }

    onDeath() {
        window.location.reload();
    }
}


class Game { // a single play. A new one of these is created every level.
    constructor(inputs) {
        inputs.subscribe({
            keyUp(key) {
                if (key == " ") {
                    game.murica = !game.murica;
                }
            },
            keyDown(key) {
                
            },
            keyOn(key) {
                
            },
            keyOff(key) {
                
            },
            mouseUp(x, y) {
                
            },
            mouseDown(x, y) {
                
            },
            mouseMove(x, y) {
                
            }
        });
        this.inputs = inputs;
        this.blockSize = 32;
        this.player = new Player(this, 0, 0, this.blockSize, this.blockSize);
        this.objects = [this.player];
        this.ctx = document.getElementById("game").getContext("2d");
        this.airFrictionX = 0.99;
        this.airFrictionY = 1;
        this.americanSoil = 0;
        this.tY = 0;
        this.tX = 0;
    }

    loop(delta) {
        this.render(delta);
        if (this.murica) {
            if (this.americanSoil < 1) {
                this.americanSoil += delta/2;
            }
        }
        else {
            if (this.americanSoil > 0) {
                this.americanSoil -= delta/2;
            }
        }
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(window.innerWidth * 0.2 - 4, 6, window.innerWidth * 0.6 + 8, 28);
        this.ctx.fillStyle = "blue";
        this.ctx.fillRect(window.innerWidth * 0.2, 10, window.innerWidth * 0.6, 20);
        this.ctx.fillStyle = "red";
        this.ctx.fillRect(window.innerWidth * 0.2, 10, window.innerWidth * 0.6 * this.player.health/this.player.maxHealth, 20);
        var xImpulse = (this.player.touchingBottom ? 2000 : 200) * delta;
        if (this.inputs.keysDown["ArrowRight"] || this.inputs.keysDown["d"]) {
            this.player.xv += xImpulse;
            this.player.reversed = false;
        }
        if (this.inputs.keysDown["ArrowLeft"] || this.inputs.keysDown["a"]) {
            this.player.xv -= xImpulse;
            this.player.reversed = true;
        }
        if (this.inputs.keysDown["ArrowUp"] || this.inputs.keysDown["w"] || this.inputs.keysDown[" "]) {
            if (this.player.touchingBottom || this.player.jumpCycle < 0.3) {
                this.player.yv = -400; // immediate impulse does NOT multiply by delta.
                this.player.jumpCycle += delta;
                if (this.player.jumpCycle >= 0.3) { // we just completed a full-height jump
                    this.player.say("YEE-HAWW", 0.6);
                }
            }
        }
        else if (this.player.touchingBottom) {
            this.player.jumpCycle = 0;
        }
        else {
            this.player.jumpCycle = Infinity;
        }
        this.objects.forEach((item, i) => {
            item.loop(delta);
            if (item.health < 0) {
                item.onDeath();
                if (item.health < 0) { // objects are allowed to keep themselves alive.
                    this.objects.splice(i, 1);
                }
            }
        });
        for (var y = 0; y < this.objects.length - 1; y ++) {
            for (var x = y + 1; x < this.objects.length; x ++) {
                var one = this.objects[y];
                var two = this.objects[x];
                if (one.intersects(two)) {
                    var yhitsx = one.collides(two);
                    var xhitsy = two.collides(one);
                    if (yhitsx || xhitsy) {
                        var leftDist = Math.abs((one.x + one.width) - two.x);
                        var rightDist = Math.abs((two.x + two.width) - one.x);
                        var topDist = Math.abs((one.y + one.height) - two.y);
                        var bottomDist = Math.abs((two.y + two.height) - one.y);
                        var min = Math.min(leftDist, rightDist, topDist, bottomDist);
                        var oneResponsibility = (leftDist == min || rightDist == min) ? Math.abs(one.xv) : Math.abs(one.yv);
                        var twoResponsibility = (leftDist == min || rightDist == min) ? Math.abs(two.xv) : Math.abs(two.yv);
                        var totalResponsibility = oneResponsibility + twoResponsibility;
                        oneResponsibility /= totalResponsibility;
                        twoResponsibility /= totalResponsibility;
                        if (one.isStatic) {
                            oneResponsibility = 0;
                            twoResponsibility = 1;
                        }
                        else if (two.isStatic) {
                            oneResponsibility = 1;
                            twoResponsibility = 0;
                        }
                        if (leftDist == min) {
                            one._hitRight(two);
                            two._hitLeft(one);
                            one.x -= oneResponsibility * min;
                            two.x += twoResponsibility * min;
                            var friction = (one.frictionY + two.frictionY)/2;
                            one.appliedFrictionY += friction;
                            two.appliedFrictionY += friction;
                        }
                        else if (rightDist == min) {
                            one._hitLeft(two);
                            two._hitRight(one);
                            one.x += oneResponsibility * min;
                            two.x -= twoResponsibility * min;
                            var friction = (one.frictionY + two.frictionY)/2;
                            one.appliedFrictionY += friction;
                            two.appliedFrictionY += friction;
                        }
                        else if (topDist == min) {
                            one._hitBottom(two);
                            two._hitTop(one);
                            one.y -= oneResponsibility * min;
                            two.y += twoResponsibility * min;
                            var friction = (one.frictionX + two.frictionX)/2;
                            one.appliedFrictionX += friction;
                            two.appliedFrictionX += friction;
                        }
                        else if (bottomDist == min) {
                            one._hitTop(two);
                            two._hitBottom(one);
                            one.y += oneResponsibility * min;
                            two.y -= twoResponsibility * min;
                            var friction = (one.frictionX + two.frictionX)/2;
                            one.appliedFrictionX += friction;
                            two.appliedFrictionX += friction;
                        }
                    }
                }
            }
        }
    }

    render(delta) {
        this.ctx.fillStyle = "#9290FF";
        this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        this.tX = window.innerWidth/2 - this.player.width/2 - this.player.x;
        this.tY = window.innerHeight/2 - this.player.height/2 - this.player.y;
        if (this.minX != undefined) {
            if (this.tX + this.minX > 0) {
                this.tX = -this.minX;
            }
        }
        if (this.maxY != undefined) {
            if (this.tY + this.maxY < window.innerHeight) {
                this.tY = window.innerHeight - this.maxY;
            }
        }
        if (this.maxX != undefined) {
            if (this.tX + this.maxX < window.innerWidth) {
                this.tX = window.innerWidth - this.maxX;
            }
        }
        this.ctx.translate(this.tX, this.tY);
        this.objects.forEach(item => {
            item.draw(delta);
        });
        this.ctx.translate(-this.tX, -this.tY);
    }

    create(x, y, w, h, type) {
        var thing = new type(this, x * this.blockSize, y * this.blockSize, w * this.blockSize, h * this.blockSize);
        this.objects.push(thing);
        return thing;
    }

    ground(x, y, w, h) {
        return this.create(x, y, w, h, GroundObject);
    }

    brick(x, y, w, h) {
        return this.create(x, y, w, h, BrickObject);
    }

    capitol(x, y) {
        return this.create(x, y, 4, 4, CapitolObject);
    }

    alGoremba(x, y) {
        return this.create(x, y, 1, 1, AlGorembaEnemy);
    }
}


var inputs = new InputManager(document.body);
var game = undefined;
window.onresize = () => {
    var gamel = document.getElementById("game");
    gamel.width = window.innerWidth;
    gamel.height = window.innerHeight;
};
window.onresize();

function playLevel(number) {
    document.getElementById("game").focus();
    document.getElementById("game").style.display = "";
    document.getElementById("entry").style.display = "none";
    game = new Game(inputs);
    levels[number]();
    curLevel = number;
}

var lastTime = 0;

function moop() {
    requestAnimationFrame(moop);
    if (game && document.hasFocus()) {
        var cTime = window.performance.now();
        var elTime = cTime - lastTime;
        lastTime = cTime;
        game.loop(elTime/1000);
    }
    else {
        lastTime = window.performance.now();
    }
}

moop();

playLevel(0); // when we make a nice welcome screen, delete this so the start button works