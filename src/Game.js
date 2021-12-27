import React, { createRef, Component } from 'react';
import { getRandomInt, getRandomBMInt, proximityIndex, neighbors } from './Utils.js';
import './Game.css';
import ReactDOM from 'react-dom';
import update from 'react-addons-update';

class Game extends Component
{
    width = 1400;
    height = 650;
    canvas = createRef();
    tileWidth = 10;
    clusterStarterPercentage = .1;
    maxClusterSize = 10;
    clusterDensity = 1;
    gameSpeed = 10;
    state = {
        board: [],
        context: null,
        paused: true,
        btnText: 'Play',
        notRestarted: true
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
        context.lineWidth = 0.1;
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
                context.strokeRect(j * this.tileWidth, i * this.tileWidth, this.tileWidth, this.tileWidth);
            }
        }
        this.setState({ context: context });
    }

    live = () =>
    {
        let height = this.state.board.length;
        let width = this.state.board[0].length;
        let oldBoard = [];// .slice() et [...this.state.board] n'ont pas l'air de marcher pour du bi-dimensionnel, obligé de faire ça : ...
        let board = [];
        for (let i = 0; i < this.state.board.length; i++)
        {
            let oldRow = this.state.board[i].slice();
            let row = this.state.board[i].slice();
            oldBoard.push(oldRow);
            board.push(row);
        }
        for (let i = 0; i < height; i++)
        {
            for (let j = 0; j < width; j++)
            {
                let n = neighbors(i, j, oldBoard);
                switch (n)
                {
                    case 2:
                        break;
                    case 3:
                        board[i][j] = 1;
                        break;
                    default:
                        board[i][j] = 0;
                }
            }
        }
        this.setState({ board: board }, this.draw);
    }

    update = () =>
    {
        this.draw();
        if (this.state.notRestarted)
        {
            setInterval(() =>
            {
                this.setState({ notRestarted: true });
                if (!this.state.paused)
                {
                    this.live();
                }
            }, 1000 / (this.gameSpeed));
        }
    }


    getCell = (i, j) =>
    {
        let x = Math.max(0, Math.min(this.state.board.length - 1, Math.floor(j / this.tileWidth)));
        let y = Math.max(0, Math.min(this.state.board[0].length - 1, Math.floor(i / this.tileWidth)));
        return [x, y];
    }

    pause = () =>
    {
        console.log(this.state);
        if (this.state.paused)
        {
            this.setState({ btnText: 'Pause' });
            this.setState({ paused: false });
        }
        else
        {
            this.setState({ btnText: 'Play' });
            this.setState({ paused: true });
        }

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
        this.setState({ board: board }, this.update);
    }

    onClick(e)
    {
        var rect = ReactDOM.findDOMNode(this).getBoundingClientRect();
        let i = e.pageX - rect.left;
        let j = e.pageY - rect.top;
        const [x, y] = this.getCell(i, j);
        if ((this.state.board !== undefined) && x < this.state.board.length && y < this.state.board[0].length)
        {//de temps en temps le clic est détecté en dehors de la zone
            if (this.state.board[x][y] === 1)
            {
                this.setState({ board: update(this.state.board, { [x]: { [y]: { $set: 0 } } }) }, this.draw);
            }
            else
            {
                this.setState({ board: update(this.state.board, { [x]: { [y]: { $set: 1 } } }) }, this.draw);
            }
        }
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
                <canvas onClick={this.onClick.bind(this)} ref={this.canvas} width={this.width} height={this.height} />
                <div className="UIWrapper">
                    <button className="genericBtn pausePlay" onMouseDown={this.pause}>{this.state.btnText}</button>
                    <button className="genericBtn clusterizeBtn" onMouseDown={this.seedBoard.bind(this)}>Clusterize</button>
                    <button className="genericBtn restartBtn" onMouseDown={this.initBoard}>Restart</button>
                </div>
            </div>
        )
    }
}

export default Game;