import React, { createRef, Component } from 'react';
import { getRandomInt, getRandomBMInt, proximityIndex, neighbors } from './Utils.js';

class Game extends Component
{
    width = 1000;
    height = 600;
    canvas = createRef();
    tileWidth = 5;
    clusterStarterPercentage = .01;
    maxClusterSize = 6;
    clusterDensity = 1;
    gameSpeed = 10;
    state = {
        board: []
    }

    printLog = (arg) =>//literally just a console.log callback
    {
        console.log('arg:', arg);
    }

    draw = () =>
    {
        let board = this.state.board;
        let context = this.state.context;
        context.beginPath();
        context.fillStyle = "white";
        context.fillRect(0, 0, this.width, this.height);
        context.lineWidth = 2;
        context.fillStyle = "red";
        let height = board.length;
        let width = board[0].length;
        for (let i = 0; i < height; i++)
        {
            for (let j = 0; j < width; j++)
            {
                if (board[i][j] === 1)
                {
                    context.fillRect(j * this.tileWidth, i * this.tileWidth, this.tileWidth, this.tileWidth);
                }
                //context.strokeRect(j * this.tileWidth, i * this.tileWidth, this.tileWidth, this.tileWidth);
            }
        }
        this.setState({ context: context });
    }

    live = () =>
    {
        let height = this.state.board.length;
        let width = this.state.board[0].length;
        let board = [...this.state.board];
        for (let i = 0; i < height; i++)
        {
            for (let j = 0; j < width; j++)
            {
                let n = neighbors(i, j, board);
                switch (n)
                {
                    case 2:
                        break;
                    case 3:
                        board[i][j] = 1;
                        break;
                    default:
                        board[i][j] = 0;
                        break;
                }
            }
        }
        this.setState({ board: board }, this.draw);
    }

    update = () =>
    {
        this.draw();
        setInterval(() =>
        {
            this.live();
        }, 1000 / (this.gameSpeed));
    }



    seedClusters = (board, listSeeds) =>
    {
        let newBoard = [...board];
        for (let i = 0; i < newBoard.length; i++)
        {
            for (let j = 0; j < newBoard[0].length; j++)
            {
                listSeeds.forEach(e =>
                {
                    let clusterSize = getRandomBMInt(this.maxClusterSize);
                    let pIndex = proximityIndex(e, [i, j], clusterSize, this.clusterDensity);
                    if (pIndex > 0)//vérifie que la case en cours de lecture est dans le rayon clusterSize d'une case donnée et renvoie une probabilitée (de 0 à 1) de remplir la case
                    {
                        let r = Math.random();
                        if (r <= pIndex || e.toString() === [i, j])//random va donner un float < 1, pIndex aussi
                        {
                            newBoard[i][j] = 1;
                        }
                    }
                    board[e[0]][e[1]] = 1;
                });
            }
        }

        //la taille de chaque 'cluster' sera de 10% de la dimension la plus courte du tableau, arrondi à l'entier supérieur

        return newBoard;
    }

    seedBoard()
    {
        let board = [...this.state.board];
        let height = board.length;
        let width = board[0].length;
        let liveCells = (this.clusterStarterPercentage / 100) * (width * height);
        let listSeeds = [];
        while (liveCells > 0)
        {
            let x = getRandomInt(height);
            let y = getRandomInt(width);
            if (board[x][y] !== 1)
            {
                board[x][y] = 1;
                listSeeds.push([x, y]);
                liveCells--;
            }
        }
        board = this.seedClusters(board, listSeeds);

        this.setState({ board: board }, this.update);
    }

    initBoard = () =>
    {
        let board = [];
        let height = this.height / this.tileWidth;
        let width = this.width / this.tileWidth;
        for (let i = 0; i < height; i++)
        {
            let row = [];
            for (let j = 0; j < width; j++)
            {
                row.push(0);
            }
            board.push([...row]);
        }
        this.setState({ board: board }, this.seedBoard);
    }

    componentDidMount()
    {
        const context = this.canvas.current.getContext("2d");
        this.setState({ context: context }, this.initBoard());
    }

    componentDidUpdate()//not really sure what I'll put there yet
    {
    };

    render()
    {
        return (
            <div>
                <canvas ref={this.canvas} width={this.width} height={this.height} />
            </div>
        )
    }
}

export default Game;