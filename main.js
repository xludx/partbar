const electron = require('electron');

const { app, BrowserWindow, TouchBar, Tray, session, ipcMain } = require('electron');
const { TouchBarLabel, TouchBarButton, TouchBarSpacer } = TouchBar;
const expandTilde = require('expand-tilde');
const fs = require('fs');
const path = require('path');
const url = require('url');
const fetch = require('electron-fetch');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;
let tray = null;
let openDevTools = false;
let partPrice = 0.0;
let refreshFn = null;

let config = {
    refresh: 60000*5,
    coins: [
        "particl",
        "bitcoin"
    ],
    currency: '€' // or '$'
};

function button(coinName, price) {
    let iconPath = path.join(__dirname, '/img/' + coinName + '.png');
    if (!fs.existsSync(iconPath)) {
        iconPath = path.join(__dirname, '/img/notfound.png');
    }

    return new TouchBarButton({
        // label: coinName + ' $' + price,
        label: config.currency + price,
        textColor: '#ABCDEF',
        icon: iconPath,
        iconPosition: 'left',
        click: () => {
            let win = new BrowserWindow({width: 900, height: 800});
            win.on('closed', () => {
                win = null
            });

            // Load a remote URL
            win.loadURL('https://coinmarketcap.com/currencies/' + coinName)
        }
    });
}

function touchBar(coinMarketData) {
    const buttons = coinMarketData.map( (coin) => {
        if( config.currency === '€' ){
            return button(coin.id, (coin.price_eur*1).toFixed(2));
        } else {
            return button(coin.id, (coin.price_usd*1).toFixed(2));
        }
    });

    return new TouchBar(buttons.filter((b) => b !== null));
}

/*
 ** initiates the Main Window
 */
function createWindow(config) {

    if (tray === null) {
        tray = makeTray();
    }

    console.log('config:', config);

    if (mainWindow === null){

        // Create the browser window.
        mainWindow = new BrowserWindow({
            width: 500,
            height: 260,
            icon: path.join(__dirname, '/img/logo.png'), // doesn't work on osx :/
            resizable: false,
            // titleBarStyle: 'hidden',
            frame: true
        });

        // and load the index.html of the app.
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file:',
            slashes: true
        }));

        // Open the DevTools.
        if (openDevTools || config.devtools) {
            mainWindow.webContents.openDevTools()
        }

        // Emitted when the window is closed.
        mainWindow.on('closed', () => {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            mainWindow = null;
        });
    }

    if( refreshFn === null ){
        refreshFn = () => {
            fetch('https://api.coinmarketcap.com/v1/ticker/?limit=200&convert=EUR')
                .then( (res) => {
                    return res.json();
                })
                .then( (json) => {
                    const coinMarketData = json.filter( (coin) => {
                        return config.coins.includes(coin.id);
                    });
                    if( mainWindow !== null ) {
                        mainWindow.setTouchBar(touchBar(coinMarketData));
                    }

                    const partMarketData = coinMarketData.filter( (coin) => {
                        return coin.id === 'particl';
                    });

                    if( config.currency === '€' ){
                        partPrice = partMarketData[0].price_eur;
                    } else {
                        partPrice = partMarketData[0].price_usd;
                    }

                    // console.log('partPrice: ', partPrice);
                    tray.setTitle( config.currency + (partPrice*1).toFixed(2));
                });
        };
        setInterval(refreshFn, config.refresh);
    }
    refreshFn();
}

/*
 ** creates the tray icon and menu
 */
function makeTray() {

    // Default tray image + icon
    let trayImage = path.join(__dirname, 'img/particl-tray.png');

    // The tray context menu
    const contextMenu = electron.Menu.buildFromTemplate([
        /*{
            label: 'View',
            submenu: [
                {
                    label: 'Reload',
                    click () { mainWindow.webContents.reloadIgnoringCache(); }
                },
                {
                    label: 'Open Dev Tools',
                    click () { mainWindow.openDevTools(); }
                }
            ]
        },*/
        {
            role: 'window',
            submenu: [
                {
                    label: 'Close',
                    click () { app.quit() }
                },
                {
                    label: 'Hide',
                    click () { mainWindow.hide(); }
                },
                {
                    label: 'Show',
                    click () { mainWindow.show(); }
                }
            ]
        },
        {
            role: 'help',
            submenu: [
                /*{
                    label: 'About ' + app.getName(),
                    click () { electron.shell.openExternal('https://particl.io/#about'); }
                },*/
                {
                    label: 'Visit Particl.io',
                    click () { electron.shell.openExternal('https://particl.io'); }
                },
                {
                    label: 'Visit Electron',
                    click () { electron.shell.openExternal('https://electron.atom.io'); }
                }
            ]
        }
    ]);

    // Create the tray icon
    tray = new electron.Tray(trayImage);

    // tray.setPressedImage(image);

    // Set the tray icon
    // tray.setToolTip('Particl');
    // tray.setContextMenu(contextMenu);

    // Always show window when tray icon clicked
    tray.on('click', (event, bounds) => {
        if (mainWindow === null) {
            createWindow(config);
        } else {
            mainWindow.show();
        }
    });

    tray.on('mouse-enter', (event, position) => {
        refreshFn();
    });

    return tray;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    const configPath = expandTilde('~/.partbar.json');
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath));
    }
    createWindow(config);
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow(config);
    } else {
        mainWindow.show();
    }
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
