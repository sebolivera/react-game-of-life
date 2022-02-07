import React, { createRef, Component } from "react";
import {
    getRandomInt,
    getRandomBMInt,
    proximityIndex,
    neighbors,
} from "./Utils.js";
import "./Game.css";
import ReactDOM from "react-dom";
import update from "react-addons-update";
import Slider, { SliderTooltip } from "rc-slider";
import "rc-slider/assets/index.css";
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
    IconButton,
    ThemeProvider,
    Box,
    Button,
} from "@mui/material/";
import { createTheme } from "@mui/material/styles";
import { grey, blue, red, green } from "@mui/material/colors";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Draggable from "react-draggable";

const { Handle } = Slider;
const theme = createTheme({
    palette: {
        primary: {
            main: grey[500],
        },
        secondary: {
            main: blue[500],
        },
        danger: {
            main: red[500],
        },
        warning: {
            main: green[500],
        },
    },
});

class Game extends Component {
    constructor(props) {
        super(props);
        this.canvas = createRef();
        this.divElement = createRef();
        this.clusterStarterPercentage = 0.1;
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
            9: 100,
        };
        this.ticks = 1000;
    }
    state = {
        board: [],
        width: 0,
        height: 0,
        context: null,
        paused: true,
        btnText: "Play",
        notRestarted: true,
        gameSpeed: 1,
        gridLines: true,
        darkMode: true,
        tileSize: 10,
        arrowPoint: 180,
        menuShowText: "Show",
    };

    printLog = (
        arg //literally just a console.log callback, don't remember why I made that
    ) => {
        console.log("arg:", arg);
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
            context.fillStyle = "black";
            context.strokeStyle = "white";
        } else {
            context.fillStyle = "white";
            context.strokeStyle = "black";
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
            this.setState({ btnText: "Play" });
            this.setState({ paused: true });
        }
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

    onClick(e) {
        var rect = ReactDOM.findDOMNode(this).getBoundingClientRect();
        let i = e.pageX - rect.left;
        let j = e.pageY - rect.top;
        const [x, y] = this.getCell(i, j);
        if (
            this.state.board !== undefined &&
            x < this.state.board.length &&
            y < this.state.board[0].length
        ) {
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
        this.setState({ gameSpeed: this.sliderRanges[e] }, this.setSpeed);
    };

    updateGridLines = (e) => {
        this.setState({ gridLines: !this.state.gridLines }, this.draw);
    };

    updateMode = (e) => {
        if (this.state.darkMode) {
            document.body.style.backgroundColor = "white";
        } else {
            document.body.style.backgroundColor = "black";
        }
        this.setState({ darkMode: !this.state.darkMode }, this.draw);
    };

    handleCollapse = (e) => {
        let nval = (this.state.arrowPoint + 180) % 360;
        let menuTextVal;
        if (this.state.menuShowText === "Show") {
            menuTextVal = "Hide";
        } else {
            menuTextVal = "Show";
        }
        this.setState({
            menuCollapse: !this.state.menuCollapse,
            arrowPoint: nval,
            menuShowText: menuTextVal,
        });
    };

    handle(props) {
        const { value, dragging, index, ...restProps } = props;
        let txtValues = {
            0: "Ultra Slow",
            1: "Super Slow",
            2: "Slow",
            3: "Normal",
            4: "Slightly Faster",
            5: "Faster",
            6: "Fast",
            7: "Very Fast",
            8: "Stupid Fast",
            9: "Why",
        };
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
    };

    render() {
        return (
            <ThemeProvider theme={theme}>
                <div
                    className="mainContainer"
                    ref={(divElement) => {
                        this.divElement = divElement;
                    }}
                >
                    <div className="canvasContainer">
                        <canvas
                            onClick={this.onClick.bind(this)}
                            ref={this.canvas}
                            width={this.state.width}
                            height={this.state.height}
                        />
                        <div className="menuContainer">
                            <div className="mainPannel">
                                <Draggable cancel=".rc-slider">
                                    {/* cancel permet de spécifier que l'on ne peut pas déplacer le paneau lorsqu'on touche au slider */}
                                    <Box
                                        sx={{
                                            bgcolor: "text.secondary",
                                            p: "1vw"
                                        }}
                                    >
                                        <label htmlFor="icon-button-toggle">
                                            <IconButton
                                                color="primary"
                                                aria-label="hide show pannel"
                                                component="span"
                                                onClick={this.handleCollapse}
                                            >
                                                <KeyboardArrowDownIcon
                                                    style={{
                                                        transform: `rotate(${this.state.arrowPoint}deg)`,
                                                        color: `white`,
                                                    }}
                                                />
                                                <button className="aNoStyle white-text">
                                                    {this.state.menuShowText}{" "}
                                                    menu
                                                </button>
                                            </IconButton>
                                        </label>
                                        <Collapse in={this.state.menuCollapse}>
                                            <Box sx={{ p: "1vw" }}>
                                                {/* cancel permet de spécifier que l'on ne peut pas déplacer le paneau lorsqu'on touche au slider */}
                                                <div className="UIWrapper">
                                                    <Grid container spacing={2}>
                                                        <Box
                                                            sx={{
                                                                width: "100%",
                                                                display: "flex",
                                                                justifyContent:
                                                                    "space-evenly",
                                                                py: "10px",
                                                            }}
                                                        >
                                                            <Button
                                                                variant="contained"
                                                                color="warning"
                                                                onMouseDown={
                                                                    this.pause
                                                                }
                                                                sx={{
                                                                    minWidth:
                                                                        "120px",
                                                                }}
                                                            >
                                                                {
                                                                    this.state
                                                                        .btnText
                                                                }
                                                            </Button>
                                                            <Button
                                                                variant="contained"
                                                                color="secondary"
                                                                onMouseDown={this.seedBoard.bind(
                                                                    this
                                                                )}
                                                                sx={{
                                                                    minWidth:
                                                                        "120px",
                                                                }}
                                                            >
                                                                Clusterize
                                                            </Button>
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
                                                            <Button
                                                                variant="contained"
                                                                color="danger"
                                                                onMouseDown={
                                                                    this
                                                                        .initBoard
                                                                }
                                                                sx={{
                                                                    minWidth:
                                                                        "120px",
                                                                }}
                                                                xs={6}
                                                            >
                                                                Restart
                                                            </Button>
                                                            <div className="fakeButton">
                                                                <TextField
                                                                    variant="outlined"
                                                                    type="number"
                                                                    InputProps={{
                                                                        inputProps:
                                                                            {
                                                                                max: Math.floor(
                                                                                    this
                                                                                        .state
                                                                                        .width /
                                                                                        10
                                                                                ),
                                                                                min: 1,
                                                                            },
                                                                    }}
                                                                    sx={{
                                                                        label: {
                                                                            color: "white",
                                                                        },
                                                                        input: {
                                                                            color: "white",
                                                                        },
                                                                        backgroundColor:
                                                                            "#d3d3d31c",
                                                                        borderRadius:
                                                                            "10px",
                                                                    }}
                                                                    value={
                                                                        this
                                                                            .state
                                                                            .tileSize
                                                                    }
                                                                    onChange={this.updateTileSize.bind(
                                                                        this
                                                                    )}
                                                                    label="Tile Size"
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
                                                                    color: "white",
                                                                    maxWidth:
                                                                        "200px",
                                                                    borderRadius:
                                                                        "10px",
                                                                }}
                                                            >
                                                                <FormControlLabel
                                                                    control={
                                                                        <Checkbox
                                                                            defaultChecked
                                                                        />
                                                                    }
                                                                    label="Show Grid"
                                                                    onChange={this.updateGridLines.bind(
                                                                        this
                                                                    )}
                                                                />
                                                            </Box>
                                                            <Box
                                                                xs={6}
                                                                sx={{
                                                                    color: "white",
                                                                    maxWidth:
                                                                        "200px",
                                                                    borderRadius:
                                                                        "10px",
                                                                }}
                                                            >
                                                                <FormControlLabel
                                                                    control={
                                                                        <Checkbox
                                                                            defaultChecked
                                                                        />
                                                                    }
                                                                    label="DarkMode"
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
                                                            <Grid item xs={3}>
                                                                <label className="floatRight">
                                                                    Speed
                                                                </label>
                                                            </Grid>
                                                            <Grid item xs={6}>
                                                                <Slider
                                                                    id="iAmSpeed"
                                                                    min={0}
                                                                    max={9}
                                                                    marks={
                                                                        this
                                                                            .sliderRanges
                                                                    }
                                                                    defaultValue={
                                                                        3
                                                                    }
                                                                    step={null}
                                                                    onChange={this.updateSpeed.bind(
                                                                        this
                                                                    )}
                                                                    xs={9}
                                                                    handle={this.handle.bind(
                                                                        this
                                                                    )}
                                                                />
                                                            </Grid>
                                                        </Grid>
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
            </ThemeProvider>
        );
    }
}

export default Game;
