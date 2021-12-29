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
import { Checkbox, FormControlLabel, Grid, TextField } from "@mui/material/";

const { Handle } = Slider;

class Game extends Component {
    constructor(props) {
        super(props);
        this.canvas = createRef();
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
        this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
    }
    state = {
        board: [],
        width: 0,
        height: 0,
        context: null,
        paused: true,
        btnText: 'Play',
        notRestarted: true,
        gameSpeed: 1,
        gridLines: true,
        darkMode: true,
        tileSize: 10
    }


    printLog = (arg) =>//literally just a console.log callback
    {
        console.log('arg:', arg);
    }

    goLive = () => {
        this.timeoutID = setTimeout(
            () => this.live(),
            this.ticks
        );
    }

    draw = () => {
        let board = this.state.board;
        let context = this.state.context;
        let gridLines = this.state.gridLines;
        context.beginPath();
        if (this.state.darkMode) {
            context.fillStyle = "black";
            context.strokeStyle = 'white';
        }
        else {
            context.fillStyle = "white";
            context.strokeStyle = 'black';
        }
        context.fillRect(0, 0, this.state.width, this.state.height);
        context.lineWidth = 0.1;
        if (this.state.darkMode) {
            context.fillStyle = "lightblue";
        }
        else {
            context.fillStyle = "red";
        }
        let height = board.length;
        let width = board[0].length;
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                if (board[i][j] === 1) {
                    context.fillRect(j * this.state.tileSize, i * this.state.tileSize, this.state.tileSize, this.state.tileSize);
                }
                if (gridLines) {
                    context.strokeRect(j * this.state.tileSize, i * this.state.tileSize, this.state.tileSize, this.state.tileSize);
                }
            }
        }
        this.setState({ context: context });
    }

    live = () => {
        if (!this.state.paused) {
            let height = this.state.board.length;
            let width = this.state.board[0].length;
            let oldBoard = [];// .slice() and [...this.state.board] don't seem to be working for two-dimensional arrays, so I had to resort to this : ...
            let board = [];
            for (let i = 0; i < this.state.board.length; i++) {
                let oldRow = this.state.board[i].slice();
                let row = this.state.board[i].slice();
                oldBoard.push(oldRow);
                board.push(row);
            }
            for (let i = 0; i < height; i++) {
                for (let j = 0; j < width; j++) {
                    let n = neighbors(i, j, oldBoard);
                    switch (n) {
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
            this.goLive();
        }
    }

    update = () => {
        if (this.state.notRestarted) {
            this.draw();
            this.goLive();
        }
    }


    getCell = (i, j) => {
        let x = Math.max(0, Math.min(this.state.board.length - 1, Math.floor(j / this.state.tileSize)));
        let y = Math.max(0, Math.min(this.state.board[0].length - 1, Math.floor(i / this.state.tileSize)));
        return [x, y];
    }

    pause = () => {
        if (this.state.paused) {
            this.setState({ btnText: 'Pause' });
            this.setState({ paused: false }, this.update);
        }
        else {
            this.setState({ btnText: 'Play' });
            this.setState({ paused: true });
        }

    }

    seedClusters = (board, listSeeds) => {
        let newBoard = [...board];
        for (let i = 0; i < newBoard.length; i++) {
            for (let j = 0; j < newBoard[0].length; j++) {
                listSeeds.forEach(e => {
                    let clusterSize = getRandomBMInt(this.maxClusterSize);
                    let pIndex = proximityIndex(e, [i, j], clusterSize, this.clusterDensity);
                    if (pIndex > 0)
                    {
                        let r = Math.random();
                        if (r <= pIndex || e.toString() === [i, j])//random will give a float < 1, same thing for pIndex
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

    seedBoard() {
        let board = [...this.state.board];
        let height = board.length;
        let width = board[0].length;
        let liveCells = (this.clusterStarterPercentage / 100) * (width * height);
        let listSeeds = [];
        while (liveCells > 0) {
            let x = getRandomInt(height);
            let y = getRandomInt(width);
            if (board[x][y] !== 1) {
                board[x][y] = 1;
                listSeeds.push([x, y]);
                liveCells--;
            }
        }
        board = this.seedClusters(board, listSeeds);

        this.setState({ board: board }, this.draw);
    }

    initBoard = () => {
        let board = [];
        let height = Math.floor(this.state.height / this.state.tileSize);
        let width = Math.floor(this.state.width / this.state.tileSize);

        for (let i = 0; i < height; i++) {
            let row = [];
            for (let j = 0; j < width; j++) {
                row.push(0);
            }
            board.push([...row]);
        }
        this.setState({ board: board }, this.update);
    }

    onClick(e) {
        var rect = ReactDOM.findDOMNode(this).getBoundingClientRect();
        let i = e.pageX - rect.left;
        let j = e.pageY - rect.top;
        const [x, y] = this.getCell(i, j);
        if ((this.state.board !== undefined) && x < this.state.board.length && y < this.state.board[0].length) {//somehow a click event will randomly be detected outside of bounds
            if (this.state.board[x][y] === 1) {
                this.setState({ board: update(this.state.board, { [x]: { [y]: { $set: 0 } } }) }, this.draw);
            }
            else {
                this.setState({ board: update(this.state.board, { [x]: { [y]: { $set: 1 } } }) }, this.draw);
            }
        }
    }

    componentDidMount() {
        this.updateWindowDimensions();
        window.addEventListener('resize', this.updateWindowDimensions);
    }


    componentWillUnmount() {
        window.removeEventListener('resize', this.updateWindowDimensions);
        clearTimeout(this.timeoutID);
    }

    updateWindowDimensions() {
        const context = this.canvas.current.getContext("2d");
        clearTimeout(this.timeoutID);
        this.setState({ width: window.innerWidth, height: window.innerHeight, context: context }, this.initBoard);
    }

    setSpeed = () => {
        this.ticks = 1000 / (this.state.gameSpeed);
        clearTimeout(this.timeoutID);
        this.timeoutID = setTimeout(
            () => this.live(),
            this.ticks
        );
    }

    updateSpeed = (e) => {
        this.setState({ gameSpeed: this.sliderRanges[e] }, this.setSpeed);
    }

    updateGridLines = (e) => {
        this.setState({ gridLines: !this.state.gridLines }, this.draw);
    }

    updateMode = (e) => {
        if (this.state.darkMode) {
            document.body.style.backgroundColor = "white";
        }
        else {
            document.body.style.backgroundColor = "black";
        }
        this.setState({ darkMode: !this.state.darkMode }, this.draw);
    }

    handle(props) {
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
    updateTileSize = (e) => {
        this.setState({ tileSize: e.target.value }, this.initBoard);
        this.draw();
    }

    render() {
        return (
            <div>
                <canvas onClick={this.onClick.bind(this)} ref={this.canvas} width={this.state.width * .98} height={this.state.height * .98} />
                <Draggable cancel=".rc-slider">{/* cancel permet de spécifier que l'on ne peut pas déplacer le paneau lorsqu'on touche au slider */}
                    <div className="UIWrapper">
                        <Grid container spacing={2}>
                            <Grid item xs={3}>
                                <button className="genericBtn pausePlay" onMouseDown={this.pause}>{this.state.btnText}</button>
                            </Grid>
                            <Grid item xs={3}>
                                <button className="genericBtn clusterizeBtn" onMouseDown={this.seedBoard.bind(this)}>Clusterize</button>
                            </Grid>
                            <Grid item xs={3}>
                                <button className="genericBtn restartBtn" onMouseDown={this.initBoard}>Restart</button>
                            </Grid>
                            <Grid item xs={3}>
                                <FormControlLabel control={<Checkbox defaultChecked />} label="Show Grid" onChange={this.updateGridLines.bind(this)} />
                            </Grid>
                            <Grid item xs={9}>
                                <TextField
                                    type="number"
                                    InputProps={{
                                        inputProps: {
                                            max: Math.floor(this.state.width / 10), min: 1
                                        }
                                    }}
                                    value={this.state.tileSize}
                                    onChange={this.updateTileSize.bind(this)}
                                    label="Tile Size"
                                />
                            </Grid>
                            <Grid item xs={3}>
                                <FormControlLabel control={<Checkbox defaultChecked />} label="DarkMode" onChange={this.updateMode.bind(this)} />
                            </Grid>
                            <Grid item xs={12}>
                                <Slider id='iAmSpeed' min={0} max={9} marks={this.sliderRanges} defaultValue={3} step={null} onChange={this.updateSpeed.bind(this)} handle={this.handle.bind(this)} />
                            </Grid>
                        </Grid>
                    </div>
                </Draggable>
            </div>
        )
    }
}

export default Game;