const levels = [
    () => {
        game.ground(-30, 5, 140, 20);
        game.brick(10, 0, 5, 1);
        game.brick(15, 3, 5, 1);
        game.capitol(25, 0);
        game.minX = -25 * game.blockSize;
        game.maxY = 20 * game.blockSize;
        game.maxX = 100 * game.blockSize;
    }
];