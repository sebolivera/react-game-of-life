import { createTheme } from "@mui/material/styles";
import { createContext } from "react";
import { red, indigo, yellow } from "@mui/material/colors";

const darkTheme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: "#ffff8d",
        },
        secondary: indigo,
        warning: yellow,
        info: {
            main: "#189b9b",
        },
        danger: {
            main: red[500],
        },
        success: {
            main: "#fffff",
        },
        error: {
            main: "#b7b7b7",
        },
    },
});

const lightTheme = createTheme({
    palette: {
        mode: "light",
        primary: red,
        secondary: indigo,
        warning: {
            main: "#200f44",
        },
        info: {
            main: "#189b9b",
        },
        danger: {
            main: red[500],
        },
        success: {
            main: "#111111",
        },
        error: {
            main: "#b7b7b7",
        },
    },
});


darkTheme.typography.h2 = {
    [darkTheme.breakpoints.up('xs')]: {
        fontSize: '3.5rem',
    },
    [darkTheme.breakpoints.up('lg')]: {
        fontSize: '1.5rem',
    },
    [darkTheme.breakpoints.up('xl')]: {
        fontSize: '3.5rem',
    },
};
darkTheme.typography.h3 = {
    [darkTheme.breakpoints.up('xs')]: {
        fontSize: '3rem',
    },
    [darkTheme.breakpoints.up('lg')]: {
        fontSize: '1.25rem',
    },
    [darkTheme.breakpoints.up('xl')]: {
        fontSize: '3rem',
    },
};

darkTheme.typography.h5 = {

    [darkTheme.breakpoints.up('xs')]: {
        fontSize: '1.5rem',
    },
    [darkTheme.breakpoints.up('lg')]: {
        fontSize: '0.75rem',
    },
    [darkTheme.breakpoints.up('xl')]: {
        fontSize: '1.5rem',
    },
};

lightTheme.typography = darkTheme.typography;

const Theme = createContext(darkTheme);
export default Theme;

export { lightTheme, darkTheme };
