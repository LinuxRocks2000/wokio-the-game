const levels = [
    () => {
        game.ground(-30, 5, 140, 20);
        game.brick(5, 0, 5, 1);
        game.minX = -25 * game.blockSize;
        game.maxY = 20 * game.blockSize;
        game.maxX = 100 * game.blockSize;
    }
];