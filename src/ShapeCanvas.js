import React, { Component, createRef } from "react";

class ShapeCanvas extends Component {
    constructor(props) {
        super(props);
        this.canvas = createRef();
        this.divElement = createRef();
    }

    fillCanvas = (props, context) => {
        let grid = props.shape;
        context.beginPath();
        if (props.darkMode) {
            context.fillStyle = "rgb(5, 5, 5)";
        } else {
            context.fillStyle = "white";
        }
        context.lineWidth = 0;
        if (props.darkMode) {
            context.fillStyle = "lightblue";
        } else {
            context.fillStyle = "red";
        }
        let height = grid.length;
        let width = grid[0].length;
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                if (grid[i][j] === 1) {
                    context.fillRect(j * 5, i * 5, 5, 5);
                }
            }
        }
    };

    componentDidMount() {
        let context = this.canvas.current.getContext("2d");
        this.fillCanvas(this.props, context);
    }

    render() {
        return (
                <canvas className={this.props.className} ref={this.canvas} 
                width={this.props.shape[0].length*5}
                height={this.props.shape.length*5}></canvas>
        );
    }
}

export default ShapeCanvas;
