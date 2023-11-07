class PhysicsObject {
    constructor(game, x, y, width, height, type) {
        this.game = game;
        this.isStatic = true;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.xv = 0;
        this.yv = 0;
        this.gravity = 1000;
        this.frictionX = 0.1;
        this.frictionY = 0;
        this.appliedFrictionX = 0;
        this.appliedFrictionY = 0;
        this.type = type;
        this.collisions = ["solid"];
        this.specialCollisions = [];
        this.touchingBottom = false;
        this.touchingTop = false;
        this.touchingLeft = false;
        this.touchingRight = false;
    }

    loop(delta) {
        if (!this.isStatic) {
            this.yv += this.gravity * delta;
            this.x += this.xv * delta;
            this.y += this.yv * delta;
            this.xv *= this.game.airFrictionX;
            this.xv *= 1 - clamp(0, this.appliedFrictionX, 1);
            this.yv *= this.game.airFrictionY;
            this.yv *= 1 - clamp(0, this.appliedFrictionY, 1);
            this.appliedFrictionX = 0;
            this.appliedFrictionY = 0;

            // reset the contact values; they'll be audited in the physics loop.
            this.touchingBottom = false;
            this.touchingTop = false;
            this.touchingLeft = false;
            this.touchingRight = false;
        }
        this.update();
    }

    update() {
        
    }

    intersects(other) {
        return this.y < other.y + other.height &&
            this.y + this.height > other.y &&
            this.x < other.x + other.width &&
            this.x + this.width > other.x;
    }

    collides(other) {
        if (this.isStatic) {
            return false; // static objects can't collide with anything. other things collide with *them*.
        }
        if (this.specialCollisions.indexOf(other.type) != -1) {
            if (this.specialCollision(other.type)) {
                return true;
            }
        }
        if (this.collisions.indexOf(other.type) != -1) {
            return true;
        }
        return false;
    }

    _hitTop(other) {
        this.topCollision(other);
        this.touchingTop = true;
        if (this.yv < 0) {
            this.yv = 0;
        }
    }

    _hitBottom(other) {
        this.bottomCollision(other);
        this.touchingBottom = true;
        if (this.yv > 0) {
            this.yv = 0;
        }
    }

    _hitLeft(other) {
        this.leftCollision(other);
        this.touchingLeft = true;
        if (this.xv < 0) {
            this.xv = 0;
        }
    }

    _hitRight(other) {
        this.rightCollision(other);
        this.touchingRight = true;
        if (this.xv > 0){
            this.xv = 0;
        }
    }

    topCollision(other) { // override these. they're obvious.

    }

    bottomCollision(other) {

    }

    leftCollision(other) {

    }

    rightCollision(other) {

    }
}