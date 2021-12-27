export function sigmoid(z, k = 2)
{
    return 1 / (1 + Math.exp(-z / k));
}

export function getRandomInt(max)
{
    return Math.floor(Math.random() * max);

}

export function random_box_muller()
{//courbe de distribution normale de 0 à 1, centrée autour de .5
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) return random_box_muller() // resample between 0 and 1
    return num
}

export function getRandomBMInt(max)
{//renvoie un entier de 0 à max, distribué normalement autour de max/2
    return Math.floor(random_box_muller() * max);
}

export function proximityIndex(currentCell, targetCell, clusterSize, density = 1)//cherche si currentCell est dans un rayon de clusterSize autour de targetCell. Renvoie un index de proximité (de 0 à 1). 0 si la case est plus loin que clusterSize, 1 si elle est sur la case elle-même
{
    let distance = Math.sqrt(Math.pow(currentCell[0] - targetCell[0], 2) + Math.pow(currentCell[1] - targetCell[1], 2));
    return (Math.max(0, (Math.abs(1-density) + clusterSize - distance) / distance));//wow c'est hardcore en fait
}

export function neighbors(x, y, board)
{
    let height = board.length - 1;
    let width = board[0].length - 1;
    let neighborsTotal = 0;
    for (let i = Math.max(0, x - 1); i <= Math.min(x + 1, height); i++)
    {
        for (let j = Math.max(0, y - 1); j <= Math.min(y + 1, width); j++)
        {
            if ((i !== x || j !== y) && board[i][j] === 1)
            {
                neighborsTotal++;
            }
        }
    }
    return neighborsTotal;
}