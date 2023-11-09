const levels = [
    () => {
        game.ground(-30, 5, 140, 20);
        game.brick(-10, -12, 5, 1);
        game.brick(-5, -9, 5, 1);
        game.brick(0, -6, 5, 1);
        game.brick(5, -3, 5, 1);
        game.brick(10, 0, 5, 1);
        game.brick(15, 3, 5, 1);
        game.brick(19, 4, 1, 1);
        game.capitol(40, 1);
        game.alGoremba(5, 3);
        game.alGoremba(0, 3);
        game.minX = -25 * game.blockSize;
        game.maxY = 20 * game.blockSize;
        game.maxX = 44 * game.blockSize;
    },
    () => {
        game.ground(-30, 5, 140, 20);
        game.ground(-10, -10, 10, 10);
        game.minX = -25 * game.blockSize;
        game.maxY = 20 * game.blockSize;
        game.maxX = 50 * game.blockSize;
    }
];