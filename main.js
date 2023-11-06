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
}


class Game { // a single play. A new one of these is created every level.
    constructor(inputs) {
        inputs.subscribe({
            keyUp(key) {
                
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
    }

    loop(delta) {
        this.render(delta);
        var xImpulse = (this.player.touchingBottom ? 2000 : 200) * delta;
        if (this.inputs.keysDown["ArrowRight"]) {
            this.player.xv += xImpulse;
            this.player.reversed = false;
        }
        if (this.inputs.keysDown["ArrowLeft"]) {
            this.player.xv -= xImpulse;
            this.player.reversed = true;
        }
        if (this.inputs.keysDown["ArrowUp"]) {
            if (this.player.touchingBottom || this.player.jumpCycle < 0.3) {
                this.player.yv = -400; // immediate impulse does NOT multiply by delta.
                this.player.jumpCycle += delta;
            }
        }
        else if (this.player.touchingBottom) {
            this.player.jumpCycle = 0;
        }
        else {
            this.player.jumpCycle = Infinity;
        }
        this.objects.forEach(item => {
            item.loop(delta);
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
        var tX = window.innerWidth/2 - this.player.width/2 - this.player.x;
        var tY = window.innerHeight/2 - this.player.height/2 - this.player.y;
        if (this.minX != undefined) {
            if (tX + this.minX > 0) {
                tX = -this.minX;
            }
        }
        if (this.maxY != undefined) {
            if (tY + this.maxY < window.innerHeight) {
                tY = window.innerHeight - this.maxY;
            }
        }
        if (this.maxX != undefined) {
            if (tX + this.maxX < window.innerWidth) {
                tX = window.innerWidth - this.maxX;
            }
        }
        this.ctx.translate(tX, tY);
        this.objects.forEach(item => {
            item.draw(delta);
        });
        this.ctx.translate(-tX, -tY);
    }

    create(x, y, w, h, type) {
        console.log(type);
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
    document.getElementById("game").style.display = "";
    document.getElementById("entry").style.display = "none";
    game = new Game(inputs);
    levels[number]();
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