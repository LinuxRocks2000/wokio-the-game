const levels = [
    () => {
        game.ground(-30, 5, 140, 20);
        game.brick(10, 0, 5, 1);
        game.brick(15, 3, 5, 1);
        game.capitol(40, 1);
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