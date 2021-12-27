import React, { createRef, Component } from 'react';
import { getRandomInt, getRandomBMInt, proximityIndex, neighbors } from './Utils.js';
import './Game.css';
import ReactDOM from 'react-dom';
import update from 'react-addons-update';
import Slider, { SliderTooltip } from 'rc-slider';
import 'rc-slider/assets/index.css';
import Draggable from "react-draggable";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import {Checkbox, FormControlLabel} from "@mui/material/";

const { Handle } = Slider;

class Game extends Component
{
    constructor(props)
    {
        super(props);
        this.width = 1400;
        this.height = 650;
        this.canvas = createRef();
        this.tileWidth = 10;
        this.clusterStarterPercentage = .1;
        this.maxClusterSize = 10;
        this.clusterDensity = 1;
        this.timeoutID = null;
        this.sliderRanges = {
            0: 0.001,
            1: 0.01,
            2: 0.1,
            3: 1,
            4: 2,
            5: 5,
            6: 10,
            7: 25,
            8: 50,
            9: 100
        };
        this.ticks = 1000;
    }
    state = {
        board: [],
        context: null,
        paused: true,
        btnText: 'Play',
        notRestarted: true,
        gameSpeed: 1,
        toggleGridLines: true
    }


    printLog = (arg) =>//literally just a console.log callback
    {
        console.log('arg:', arg);
    }

    goLive = () =>
    {
        this.timeoutID = setTimeout(
            () => this.live(),
            this.ticks
        );
    }

    draw = () =>
    {
        let board = this.state.board;
        let context = this.state.context;
        let gridLines = this.state.toggleGridLines;
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
                if (gridLines)
                {
                    context.strokeRect(j * this.tileWidth, i * this.tileWidth, this.tileWidth, this.tileWidth);
                }
            }
        }
        this.setState({ context: context }, this.goLive);
    }

    live = () =>
    {
        if (!this.state.paused)
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
    }

    update = () =>
    {
        if (this.state.notRestarted)
        {
            this.draw();
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

    setSpeed = () =>
    {
        this.ticks = 1000 / (this.state.gameSpeed);
        clearTimeout(this.timeoutID);
        this.timeoutID = setTimeout(
            () => this.live(),
            this.ticks
        );
    }

    updateSpeed = (e) =>
    {
        //console.log('set speed:', this.sliderRanges[e])
        this.setState({ gameSpeed: this.sliderRanges[e] }, this.setSpeed);
    }

    updateGrid = (e) =>
    {
        //console.log('setting grid as', !this.state.toggleGridLines);
        this.setState({toggleGridLines: !this.state.toggleGridLines}, this.draw);
    }

    handle(props)
    {
        const { value, dragging, index, ...restProps } = props;
        let txtValues = {
            0: 'Ultra Slow',
            1: 'Super Slow',
            2: 'Slow',
            3: 'Normal',
            4: 'Slightly Faster',
            5: 'Faster',
            6: 'Fast',
            7: 'Very Fast',
            8: 'Stupid Fast',
            9: 'Why'
        }
        return (
            <SliderTooltip
                prefixCls="rc-slider-tooltip"
                overlay={txtValues[value]}
                visible={dragging}
                placement="top"
                key={index}
            >
                <Handle value={value} {...restProps} />
            </SliderTooltip>
        );
    }

    render()
    {
        return (
            <div>
                <canvas onClick={this.onClick.bind(this)} ref={this.canvas} width={this.width} height={this.height} />
                <Draggable cancel=".rc-slider">{/* cancel permet de spécifier que l'on ne peut pas déplacer le paneau lorsqu'on touche au slider */}
                    <div className="UIWrapper">
                        <button className="genericBtn pausePlay" onMouseDown={this.pause}>{this.state.btnText}</button>
                        <button className="genericBtn clusterizeBtn" onMouseDown={this.seedBoard.bind(this)}>Clusterize</button>
                        <button className="genericBtn restartBtn" onMouseDown={this.initBoard}>Restart</button>
                        <FormControlLabel control={<Checkbox defaultChecked />} label="Show Grid" onChange={this.updateGrid.bind(this)} />
                        <Slider id='iAmSpeed' min={0} max={9} marks={this.sliderRanges} defaultValue={3} step={null} onChange={this.updateSpeed.bind(this)} handle={this.handle.bind(this)} />
                    </div>
                </Draggable>
            </div>
        )
    }
}

export default Game;