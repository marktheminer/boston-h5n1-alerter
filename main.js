const {app, Tray, Menu, Notification, nativeImage} = require('electron');
const path = require('path');

const axios = require("axios");
let tray = null;

async function getWastewaterLevel() {
    const data = (await axios.get('https://storage.googleapis.com/wastewater-dev-data/json/b50c6424.json')).data;
    const h5n1 = [];
    data.samples.forEach((sample) => {
        if (sample.targets.InfA_H5 && sample.targets.InfA_H5.gc_g_dry_weight_trimmed5_pmmov !== undefined) {
            h5n1.push({
                date: sample.collection_date,
                value: sample.targets.InfA_H5.gc_g_dry_weight_trimmed5_pmmov * 1000000
            });
        }
    });
    // return the last element of h5n1
    if (h5n1.length > 0) {
        return h5n1[h5n1.length - 1];
    }
    return null;
}

async function showMostRecent() {
    const value = await getWastewaterLevel();
    if (value !== null) {
        const n = new Notification({
            urgency: 'normal',
            title: 'Alert',
            body: `${value.date}: ${value.value} PMMMoV Normalized (x1 million)`
        });
        n.show();
    }
    setTimeout(() => {
        showMostRecent();
    }, 6 * 1000 * 60 * 60)
}

app.whenReady().then(() => {
    const icon = nativeImage.createFromPath(path.join(app.getAppPath(), 'icons', 'flu.png'));
    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Exit', type: 'normal', click: () => {
                app.quit();
            }
        },
    ]);
    app.setAppUserModelId('H5N1 Alerter');
    tray.setToolTip('H5N1 Alerter');
    tray.setContextMenu(contextMenu);
    showMostRecent();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
