import React, { createRef, Component } from "react";
import {
    getRandomInt,
    getRandomBMInt,
    proximityIndex,
    neighbors,
} from "./Utils.js";
import "./Game.css";
import { findDOMNode } from "react-dom";
import update from "react-addons-update";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import {
    Checkbox,
    FormControlLabel,
    Grid,
    TextField,
    Collapse,
    Button,
    Box,
    Slider,
    Tooltip,
    Slide,
    Alert,
    AlertTitle,
    Typography,
} from "@mui/material/";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Draggable from "react-draggable";
import ShapeCanvas from "./ShapeCanvas";

class Game extends Component {
    constructor(props) {
        super(props);
        this.canvas = createRef();
        this.divElement = createRef();
        this.clusterStarterPercentage = 0.1;
        this.maxClusterSize = 10;
        this.clusterDensity = 1;
        this.timeoutID = null;
        this.alertTimeOut = undefined;
        this.sliderRanges = [
            {
                value: 0,
                label: "Ultra lent",
            },
            {
                value: 1,
                label: "Super lent",
            },
            {
                value: 2,
                label: "Lent",
            },
            {
                value: 3,
                label: "Normal",
            },
            {
                value: 4,
                label: "Légèrement rapide",
            },
            {
                value: 5,
                label: "Rapide",
            },
            {
                value: 6,
                label: "Plus rapide",
            },
            {
                value: 7,
                label: "Très rapide",
            },
            {
                value: 8,
                label: "Trop rapide",
            },
            {
                value: 9,
                label: "Non",
            },
        ];
        this.ticks = 1000;
    }
    state = {
        board: [],
        width: 0,
        height: 0,
        context: null,
        paused: true,
        btnText: "Jouer",
        notRestarted: true,
        gameSpeed: 25,
        gridLines: false,
        darkMode: true,
        tileSize: 10,
        arrowPoint: 180,
        menuShowText: "Afficher le",
        selectedShapeName: null,
        selectedShape: null,
        displayAlert: false,
        shapes: [
            {
                name: "Simple barre",
                slug: "simpleBar",
                grid: [[1, 1, 1]],
            },
            {
                name: "Les lapins",
                slug: "rabbits",
                grid: [
                    [0, 0, 0, 0, 1, 0, 1, 0],
                    [1, 0, 1, 0, 0, 1, 0, 0],
                    [0, 1, 0, 0, 0, 1, 0, 0],
                    [0, 1, 0, 0, 0, 0, 0, 1],
                ],
            },
            {
                name: "Les glands",
                slug: "acorns",
                grid: [
                    [0, 1, 0, 0, 0, 0, 0],
                    [0, 0, 0, 1, 0, 0, 0],
                    [1, 1, 0, 0, 1, 1, 1],
                ],
            },
            {
                name: "Les grenouilles",
                slug: "frogs",
                grid: [
                    [0, 0, 0, 0],
                    [0, 1, 1, 1],
                    [1, 1, 1, 0],
                    [0, 0, 0, 0],
                ],
            },
            {
                name: "Croix",
                slug: "cross",
                grid: [
                    [0, 0, 0, 0, 1, 0, 0, 0, 0],
                    [0, 0, 0, 0, 1, 0, 0, 0, 0],
                    [0, 0, 0, 0, 1, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [1, 1, 1, 0, 0, 0, 1, 1, 1],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 1, 0, 0, 0, 0],
                    [0, 0, 0, 0, 1, 0, 0, 0, 0],
                    [0, 0, 0, 0, 1, 0, 0, 0, 0],
                ],
            },
            {
                name: "Planeur",
                slug: "glider",
                grid: [
                    [0, 0, 1],
                    [1, 0, 1],
                    [0, 1, 1],
                ],
            },
            {
                name: "Vaisseau léger",
                slug: "lightWeightSpaceShip",
                grid: [
                    [0, 1, 1, 0, 0],
                    [1, 1, 1, 1, 0],
                    [1, 1, 0, 1, 1],
                    [0, 0, 1, 1, 0],
                ],
            },
            {
                name: "Pentonime R",
                slug: "pentonimoR",
                grid: [
                    [0, 1, 0],
                    [0, 1, 1],
                    [1, 1, 0],
                ],
            },
            {
                name: "Pulsar",
                slug: "pulsar",
                grid: [
                    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
                    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
                    [0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1],
                    [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0],
                    [0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0],
                    [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0],
                    [1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0],
                    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
                    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
                ],
            },
            {
                name: "Penta-Decathlon",
                slug: "pentaDecaf",
                grid: [
                    [1, 1, 1],
                    [1, 0, 1],
                    [1, 1, 1],
                    [1, 1, 1],
                    [1, 1, 1],
                    [1, 1, 1],
                    [1, 0, 1],
                    [1, 1, 1],
                ],
            },
            {
                name: "Cannon (petit)",
                slug: "smallCannon",
                grid: [
                    [
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                    [
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                    [
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0,
                        0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
                    ],
                    [
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0,
                        0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
                    ],
                    [
                        1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0,
                        0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                    [
                        1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0,
                        0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                    [
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0,
                        0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                    [
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                    [
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                ],
            },
        ],
    };

    goLive = () => {
        this.timeoutID = setTimeout(() => this.live(), this.ticks);
    };

    draw = () => {
        let board = this.state.board;
        let context = this.state.context;
        let gridLines = this.state.gridLines;
        context.beginPath();
        if (this.state.darkMode) {
            context.fillStyle = "rgb(5, 5, 5)";
            context.strokeStyle = "white";
        } else {
            context.fillStyle = "white";
            context.strokeStyle = "rgb(5, 5, 5)";
        }
        context.fillRect(0, 0, this.state.width, this.state.height);
        context.lineWidth = 0.1;
        if (this.state.darkMode) {
            context.fillStyle = "lightblue";
        } else {
            context.fillStyle = "red";
        }
        let height = board.length;
        let width = board[0].length;
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                if (board[i][j] === 1) {
                    context.fillRect(
                        j * this.state.tileSize,
                        i * this.state.tileSize,
                        this.state.tileSize,
                        this.state.tileSize
                    );
                }
                if (gridLines) {
                    context.strokeRect(
                        j * this.state.tileSize,
                        i * this.state.tileSize,
                        this.state.tileSize,
                        this.state.tileSize
                    );
                }
            }
        }
        this.setState({ context: context });
    };

    live = () => {
        if (!this.state.paused) {
            let height = this.state.board.length;
            let width = this.state.board[0].length;
            let oldBoard = []; // .slice() and [...this.state.board] don't seem to be working for two-dimensional arrays, so I had to resort to this : ...
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
    };

    calculateValue = (value) => {
        switch (value) {
            case 0:
                return 0.01;
            case 1:
                return 0.1;
            case 2:
                return 1;
            case 3:
                return 2;
            case 4:
                return 5;
            case 5:
                return 10;
            case 6:
                return 25;
            case 7:
                return 50;
            case 8:
                return 100;
            case 9:
                return 1000;
            default:
                return 3;
        }
    };

    update = () => {
        if (this.state.notRestarted) {
            this.draw();
            this.goLive();
        }
    };

    getCell = (i, j) => {
        let x = Math.max(
            0,
            Math.min(
                this.state.board.length - 1,
                Math.floor(j / this.state.tileSize)
            )
        );
        let y = Math.max(
            0,
            Math.min(
                this.state.board[0].length - 1,
                Math.floor(i / this.state.tileSize)
            )
        );
        return [x, y];
    };

    pause = () => {
        if (this.state.paused) {
            this.setState({ btnText: "Pause" });
            this.setState({ paused: false }, this.update);
        } else {
            this.setState({ btnText: "Jouer" });
            this.setState({ paused: true });
        }
    };

    hideAlert = () => {
        this.alertTimeOut = setTimeout(() => {
            this.setState({ displayAlert: false });
        }, 3000);
    };

    alertPlaying = () => {
        this.setState({ displayAlert: true }, this.hideAlert);
    };

    seedClusters = (board, listSeeds) => {
        let newBoard = [...board];
        for (let i = 0; i < newBoard.length; i++) {
            for (let j = 0; j < newBoard[0].length; j++) {
                listSeeds.forEach((e) => {
                    let clusterSize = getRandomBMInt(this.maxClusterSize);
                    let pIndex = proximityIndex(
                        e,
                        [i, j],
                        clusterSize,
                        this.clusterDensity
                    );
                    if (pIndex > 0) {
                        let r = Math.random();
                        if (r <= pIndex || e.toString() === [i, j]) {
                            //random will give a float < 1, same thing for pIndex
                            newBoard[i][j] = 1;
                        }
                    }
                    board[e[0]][e[1]] = 1;
                });
            }
        }
        return newBoard;
    };

    seedBoard() {
        if (this.state.paused) {
            let board = [...this.state.board];
            let height = board.length;
            let width = board[0].length;
            let liveCells =
                (this.clusterStarterPercentage / 100) * (width * height);
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
        } else {
            this.alertPlaying();
        }
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
    };

    onCanvasHover(e) {
        if (this.state.paused) {
            let board = this.state.board;
            let height = board.length;
            let width = board[0].length;
            let rect = findDOMNode(this).getBoundingClientRect();
            let x0 = e.pageX - rect.left;
            let y0 = e.pageY - rect.top;
            const [x, y] = this.getCell(x0, y0);

            if (
                this.state.selectedShape !== undefined &&
                this.state.selectedShape !== null
            ) {
                let boardShape = [];
                for (let i = 0; i < height; i++) {
                    boardShape.push(board[i].slice());
                }
                for (let i = 0; i < this.state.selectedShape.length; i++) {
                    for (
                        let j = 0;
                        j < this.state.selectedShape[0].length;
                        j++
                    ) {
                        if (
                            0 <=
                                i +
                                    x -
                                    Math.floor(
                                        this.state.selectedShape.length / 2
                                    ) <=
                                height - 1 &&
                            0 <=
                                j +
                                    y -
                                    Math.floor(
                                        this.state.selectedShape[0].length / 2
                                    ) <=
                                width - 1
                        ) {
                            boardShape[
                                i +
                                    x -
                                    Math.floor(
                                        this.state.selectedShape.length / 2
                                    )
                            ][
                                j +
                                    y -
                                    Math.floor(
                                        this.state.selectedShape[0].length / 2
                                    )
                            ] = this.state.selectedShape[i][j];
                        }
                    }
                }
                this.drawShape(boardShape);
            }
        }
    }

    onCanvasClick(e) {
        if (this.state.paused) {
            let rect = findDOMNode(this).getBoundingClientRect();
            let i = e.pageX - rect.left;
            let j = e.pageY - rect.top;
            let height = this.state.board.length;
            let width = this.state.board[0].length;
            const [x, y] = this.getCell(i, j);
            if (this.state.board !== undefined && x < height && y < width) {
                if (this.state.selectedShape === null) {
                    //somehow a click event will randomly be detected outside of bounds
                    if (this.state.board[x][y] === 1) {
                        this.setState(
                            {
                                board: update(this.state.board, {
                                    [x]: { [y]: { $set: 0 } },
                                }),
                            },
                            this.draw
                        );
                    } else {
                        this.setState(
                            {
                                board: update(this.state.board, {
                                    [x]: { [y]: { $set: 1 } },
                                }),
                            },
                            this.draw
                        );
                    }
                } else {
                    let tBoard = [];
                    for (let i = 0; i < height; i++) {
                        tBoard.push(this.state.board[i]);
                    }

                    for (let i = 0; i < this.state.selectedShape.length; i++) {
                        for (
                            let j = 0;
                            j < this.state.selectedShape[0].length;
                            j++
                        ) {
                            if (
                                0 <=
                                    j +
                                        x -
                                        Math.floor(
                                            this.state.selectedShape.length / 2
                                        ) <=
                                    height - 1 &&
                                0 <=
                                    j +
                                        y -
                                        Math.floor(
                                            this.state.selectedShape[0].length /
                                                2
                                        ) <=
                                    width - 1
                            ) {
                                tBoard[
                                    i +
                                        x -
                                        Math.floor(
                                            this.state.selectedShape.length / 2
                                        )
                                ][
                                    j +
                                        y -
                                        Math.floor(
                                            this.state.selectedShape[0].length /
                                                2
                                        )
                                ] = this.state.selectedShape[i][j];
                            }
                        }
                    }
                    this.setState(
                        {
                            board: tBoard,
                            selectedShape: null,
                            selectedShapeName: null,
                        },
                        this.draw
                    );
                }
            }
        } else {
            this.alertPlaying();
        }
    }

    drawShape(board) {
        this.draw();
        let context = this.state.context;
        let gridLines = this.state.gridLines;
        context.beginPath();
        if (this.state.darkMode) {
            context.fillStyle = "rgb(5, 5, 5)";
            context.strokeStyle = "white";
        } else {
            context.fillStyle = "white";
            context.strokeStyle = "rgb(5, 5, 5)";
        }
        context.fillRect(0, 0, this.state.width, this.state.height);
        context.lineWidth = 0.1;
        if (this.state.darkMode) {
            context.fillStyle = "lightblue";
        } else {
            context.fillStyle = "red";
        }
        let height = board.length;
        let width = board[0].length;
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                if (board[i][j] === 1) {
                    context.fillRect(
                        j * this.state.tileSize,
                        i * this.state.tileSize,
                        this.state.tileSize,
                        this.state.tileSize
                    );
                }
                if (gridLines) {
                    context.strokeRect(
                        j * this.state.tileSize,
                        i * this.state.tileSize,
                        this.state.tileSize,
                        this.state.tileSize
                    );
                }
            }
        }
    }

    componentDidMount() {
        this.updateWindowDimensions();
        //window.addEventListener('resize', this.updateWindowDimensions); //not sure I actually want this
        this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
    }

    componentWillUnmount() {
        //window.removeEventListener('resize', this.updateWindowDimensions); //remove if the listener wasn't added
        clearTimeout(this.timeoutID);
        clearTimeout(this.alertTimeOut);
    }

    updateWindowDimensions() {
        clearTimeout(this.timeoutID);
        this.setState(
            {
                width: this.divElement.clientWidth,
                height: this.divElement.clientHeight - 4, //not quite sure why this is needed, but stuff seems to be otherwise popping up below
                context: this.canvas.current.getContext("2d"),
            },
            this.initBoard
        );
    }

    setSpeed = () => {
        this.ticks = 1000 / this.state.gameSpeed;
        clearTimeout(this.timeoutID);
        this.timeoutID = setTimeout(() => this.live(), this.ticks);
    };

    updateSpeed = (e) => {
        let value = this.calculateValue(e.target.value);
        this.setState({ gameSpeed: value }, this.setSpeed);
    };

    updateGridLines = (e) => {
        this.setState({ gridLines: !this.state.gridLines }, this.draw);
    };

    updateMode = (e) => {
        if (this.state.darkMode) {
            document.body.style.backgroundColor = "white";
            document.body.style.color = "black";
        } else {
            document.body.style.backgroundColor = "rgb(5, 5, 5)";
        }
        this.setState({ darkMode: !this.state.darkMode }, this.draw);
    };

    handleCollapse = (e) => {
        let nval = (this.state.arrowPoint + 180) % 360;
        let menuTextVal;
        if (this.state.menuShowText === "Afficher le") {
            menuTextVal = "Masquer le";
        } else {
            menuTextVal = "Afficher le";
        }
        this.setState({
            menuCollapse: !this.state.menuCollapse,
            arrowPoint: nval,
            menuShowText: menuTextVal,
        });
    };
    pickValue = (index) => {
        return this.sliderRanges[index].label;
    };

    updateTileSize = (e) => {
        if (e.target.value !== undefined) {
            let value = e.target.value;
            if (value > 4 && value < Math.floor(this.state.width / 10)) {
                this.setState({ tileSize: value }, this.initBoard);
                this.draw();
            } else if (value > Math.floor(this.state.width / 10)) {
                this.setState(
                    { tileSize: Math.floor(this.state.width / 10) },
                    this.initBoard
                );
                this.draw();
            } else {
                this.setState({ tileSize: 5 }, this.initBoard);
                this.draw();
            }
        }
    };

    render() {
        return (
            <div
                className="mainContainer"
                ref={(divElement) => {
                    this.divElement = divElement;
                }}
                style={{ backgroundColor: "black" }}
            >
                <div className="canvasContainer">
                    <Slide
                        direction="left"
                        in={this.state.displayAlert}
                        mountOnEnter
                        unmountOnExit
                    >
                        <Alert
                            className="gameIsPaused"
                            sx={{
                                position: "absolute",
                                top: "4vw",
                                right: "1vw",
                            }}
                            severity="error"
                        >
                            <AlertTitle>Error</AlertTitle>
                            Can't interact while game is playing!
                        </Alert>
                    </Slide>
                    <canvas
                        id="mainCanvas"
                        onClick={this.onCanvasClick.bind(this)}
                        onMouseMove={this.onCanvasHover.bind(this)}
                        className={this.state.paused ? "" : "disabledCanvas"}
                        ref={this.canvas}
                        width={this.state.width}
                        height={this.state.height}
                    />
                    <div className="menuContainer">
                        <div className="mainPannel">
                            <Draggable backgroundColor="none" cancel=".cancel">
                                {/* cancel permet de spécifier que l'on ne peut pas déplacer le paneau lorsqu'on touche au slider */}
                                <Box
                                    sx={{
                                        p: "1vw",
                                    }}
                                >
                                    <label htmlFor="icon-button-toggle">
                                        <Button variant="outlined"
                                            aria-label="hide show pannel"
                                            component="span"
                                            onClick={this.handleCollapse}
                                            style={{
                                                backgroundColor: "transparent",
                                                color: "#8080ea",
                                                borderColor: "#00000000",
                                            }}
                                        >
                                            <KeyboardArrowDownIcon
                                                style={{
                                                    transform: `rotate(${this.state.arrowPoint}deg)`,
                                                    color: `blue`,
                                                }}
                                            />
                                            <button className="aNoStyle blue-text">
                                                {this.state.menuShowText} menu
                                            </button>
                                        </Button>
                                    </label>
                                    <Collapse in={this.state.menuCollapse}>
                                        <Box sx={{ p: "1vw" }}>
                                            {/* cancel permet de spécifier que l'on ne peut pas déplacer le paneau lorsqu'on touche au slider */}
                                            <div className="UIWrapper">
                                                <Grid container spacing={2}>
                                                    <Box display="flex">
                                                        <Typography variant="h6" color="#8080ea">
                                                            Commandes
                                                        </Typography>
                                                    </Box>
                                                    <Box
                                                        sx={{
                                                            width: "100%",
                                                            display: "flex",
                                                            justifyContent:
                                                                "space-evenly",
                                                            py: "10px",
                                                        }}
                                                    >
                                                        <Button variant="outlined"
                                                            className="cancel"
                                                            onMouseDown={
                                                                this.pause
                                                            }
                                                            sx={{
                                                                minWidth:
                                                                    "120px",
                                                                color: "green",
                                                                borderColor:
                                                                    "green",
                                                            }}
                                                        >
                                                            {this.state.btnText}
                                                        </Button>
                                                        <Box
                                                            onMouseDown={
                                                                this.state
                                                                    .paused
                                                                    ? null
                                                                    : this
                                                                          .alertPlaying
                                                            }
                                                        >
                                                            <Button variant="outlined"
                                                                
                                                                className={
                                                                    this.state
                                                                        .paused
                                                                        ? "cancel"
                                                                        : "disabledButton"
                                                                }
                                                                onMouseDown={this.seedBoard.bind(
                                                                    this
                                                                )}
                                                                sx={{
                                                                    minWidth:
                                                                        "120px",
                                                                    color: "red",
                                                                    borderColor:
                                                                        "red",
                                                                }}
                                                                disabled={
                                                                    !this.state
                                                                        .paused
                                                                }
                                                            >
                                                                Aléatoire
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                    <Box
                                                        sx={{
                                                            width: "100%",
                                                            display: "flex",
                                                            justifyContent:
                                                                "space-evenly",
                                                            alignItems:
                                                                "center",
                                                            py: "10px",
                                                        }}
                                                    >
                                                        <Button variant="outlined"
                                                            
                                                            className={
                                                                this.state
                                                                    .paused
                                                                    ? "cancel"
                                                                    : "disabledButton"
                                                            }
                                                            onMouseDown={
                                                                this.state
                                                                    .paused
                                                                    ? this
                                                                          .initBoard
                                                                    : this
                                                                          .alertPlaying
                                                            }
                                                            sx={{
                                                                minWidth:
                                                                    "120px",
                                                                maxHeight:
                                                                    "40px",
                                                                color: "red",
                                                                borderColor:
                                                                    "red",
                                                            }}
                                                            disabled={
                                                                !this.state
                                                                    .paused
                                                            }
                                                            xs={6}
                                                        >
                                                            Recommencer
                                                        </Button>
                                                        <div
                                                            className={
                                                                this.state
                                                                    .paused
                                                                    ? "fakeButton cancel"
                                                                    : "fakeButton disabledButton"
                                                            }
                                                        >
                                                            <TextField
                                                                variant="outlined"
                                                                type="number"
                                                                className={
                                                                    this.state
                                                                        .paused
                                                                        ? "cancel"
                                                                        : "disabledButton"
                                                                }
                                                                InputProps={{
                                                                    inputProps:
                                                                        {
                                                                            max: Math.floor(
                                                                                this
                                                                                    .state
                                                                                    .width /
                                                                                    10
                                                                            ),
                                                                            min: 5,
                                                                        },
                                                                }}
                                                                sx={{
                                                                    label: {
                                                                        color: "#8080ea",
                                                                    },
                                                                    input: {
                                                                        color: "#8080ea",
                                                                    },
                                                                    backgroundColor:
                                                                        "#d3d3d31c",
                                                                    borderRadius:
                                                                        "10px",
                                                                    color:'white'
                                                                }}
                                                                disabled={
                                                                    !this.state
                                                                        .paused
                                                                }
                                                                value={
                                                                    this.state
                                                                        .tileSize
                                                                }
                                                                onChange={() => {
                                                                    this.updateTileSize.bind(
                                                                        this
                                                                    );
                                                                }}
                                                                label="Taille des cellules"
                                                            />
                                                        </div>
                                                    </Box>
                                                    <Grid
                                                        container
                                                        sx={{
                                                            width: "100%",
                                                            display: "flex",
                                                            justifyContent:
                                                                "space-evenly",
                                                            py: "10px",
                                                        }}
                                                    >
                                                        <Box
                                                            xs={6}
                                                            sx={{
                                                                color: "#8080ea",
                                                                maxWidth:
                                                                    "200px",
                                                                borderRadius:
                                                                    "10px",
                                                            }}
                                                        >
                                                            <FormControlLabel
                                                                className="cancel"
                                                                control={
                                                                    <Checkbox
                                                                        checked={
                                                                            this
                                                                                .state
                                                                                .defaultChecked
                                                                        }
                                                                    />
                                                                }
                                                                label="Afficher la grille"
                                                                onChange={this.updateGridLines.bind(
                                                                    this
                                                                )}
                                                            />
                                                        </Box>
                                                        <Box
                                                            xs={6}
                                                            sx={{
                                                                color: "#8080ea",
                                                                maxWidth:
                                                                    "200px",
                                                                borderRadius:
                                                                    "10px",
                                                            }}
                                                        >
                                                            <FormControlLabel
                                                                className="cancel"
                                                                control={
                                                                    <Checkbox
                                                                        checked={
                                                                            this
                                                                                .state
                                                                                .darkMode
                                                                        }
                                                                    />
                                                                }
                                                                label="Thème Sombre"
                                                                onChange={this.updateMode.bind(
                                                                    this
                                                                )}
                                                            />
                                                        </Box>
                                                    </Grid>
                                                    <Grid
                                                        container
                                                        sx={{
                                                            width: "100%",
                                                            display: "flex",
                                                            justifyContent:
                                                                "space-evenly",
                                                            py: "10px",
                                                        }}
                                                    >
                                                        <Grid item xs={3} color="#8080ea">
                                                            <label className="floatRight">
                                                                Vitesse
                                                            </label>
                                                        </Grid>
                                                        <Grid item xs={6}>
                                                            <Slider
                                                                className="cancel"
                                                                id="iAmSpeed"
                                                                min={0}
                                                                max={9}
                                                                marks={
                                                                    this
                                                                        .sliderRanges
                                                                }
                                                                defaultValue={6}
                                                                step={null}
                                                                onChange={this.updateSpeed.bind(
                                                                    this
                                                                )}
                                                                valueLabelDisplay="auto"
                                                                valueLabelFormat={this.pickValue.bind(
                                                                    this
                                                                )}
                                                                xs={9}
                                                            />
                                                        </Grid>
                                                    </Grid>
                                                    <Box
                                                        display="flex"
                                                        flexDirection="column"
                                                    >
                                                        <Typography variant="h6" sx={{color:"#8080ea"}}>
                                                            Formes pré-définies
                                                        </Typography>
                                                        <Box
                                                            display="flex"
                                                            flexWrap="wrap"
                                                            flexDirection="row"
                                                            className={
                                                                this.state
                                                                    .paused
                                                                    ? ""
                                                                    : "disabledBox"
                                                            }
                                                            sx={{
                                                                alignItems:
                                                                    "center",
                                                            }}
                                                        >
                                                            {this.state.shapes.map(
                                                                (
                                                                    shape,
                                                                    index
                                                                ) => {
                                                                    return (
                                                                        <Tooltip
                                                                            title={
                                                                                !this
                                                                                    .state
                                                                                    .paused
                                                                                    ? ""
                                                                                    : shape.name
                                                                            }
                                                                            key={
                                                                                index
                                                                            }
                                                                        >
                                                                            <Box
                                                                                className={`cancel ${
                                                                                    this
                                                                                        .state
                                                                                        .selectedShapeName ===
                                                                                    shape.slug
                                                                                        ? "activeShape"
                                                                                        : this
                                                                                              .state
                                                                                              .paused
                                                                                        ? "clickableShape"
                                                                                        : ""
                                                                                }`}
                                                                                p={
                                                                                    1
                                                                                }
                                                                                id={
                                                                                    shape.slug
                                                                                }
                                                                                onClick={() => {
                                                                                    if (
                                                                                        this
                                                                                            .state
                                                                                            .paused
                                                                                    ) {
                                                                                        if (
                                                                                            shape.slug
                                                                                        ) {
                                                                                            this.setState(
                                                                                                {
                                                                                                    selectedShapeName:
                                                                                                        shape.slug,
                                                                                                    selectedShape:
                                                                                                        shape.grid,
                                                                                                }
                                                                                            );
                                                                                        } else {
                                                                                            this.setState(
                                                                                                {
                                                                                                    selectedShapeName:
                                                                                                        null,
                                                                                                    selectedShape:
                                                                                                        null,
                                                                                                }
                                                                                            );
                                                                                        }
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <ShapeCanvas
                                                                                    darkMode={
                                                                                        this
                                                                                            .state
                                                                                            .darkMode
                                                                                    }
                                                                                    shape={
                                                                                        shape.grid
                                                                                    }
                                                                                />
                                                                            </Box>
                                                                        </Tooltip>
                                                                    );
                                                                },
                                                                this
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                            </div>
                                        </Box>
                                    </Collapse>
                                </Box>
                            </Draggable>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Game;
