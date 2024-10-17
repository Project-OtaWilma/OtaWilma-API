const { MongoClient } = require('mongodb');
const { user, password, host, port } = require('../database/secret.json');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');

const width = 900; //px
const height = 600; //px
const backgroundColour = 'white'; // Uses https://www.w3schools.com/tags/canvas_fillstyle.asp
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour });

const url = `mongodb://${user}:${password}@${host}:${port}/?authMechanism=DEFAULT`;
//const url = `mongodb://127.0.0.1:27017`;

const fetchTotalUserBase = () => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, (err, database) => {
            if (err) return reject({ err: 'Failed to connect to database', status: 500 });

            const db = database.db('OtaWilma');
            const query = {}
            const projection = {
                '_id': 0,
                'joinDate': 1,
                'login-history': 1,
                'current-theme': 1,
                'public': 1,
            }

            db.collection('user-schema').find(query).project(projection).toArray((err, res) => {
                if (err) return reject({ err: 'Failed to connect to database', status: 500 });
                database.close();

                return resolve(res);
            });
        })
    });
}

const equalDate = (d1 = new Date(), d2 = new Date()) => {
    return d1.getFullYear() == d2.getFullYear() && d1.getMonth() == d2.getMonth() && d1.getDate() == d2.getDate()
}

const constructActivityMap = () => {
    return new Promise((resolve, reject) => {
        const result = [];
        fetchTotalUserBase()
        .then(async list => {
            const first = new Date(list.at(0).joinDate);
            first.setHours(0, 0, 0, 0);
            
            const last = new Date(list.at(-1).joinDate);
            last.setHours(0, 0, 0, 0);

            while (!equalDate(first, last)) {
                first.setDate(first.getDate() + 1);
                const date = new Date(first.getTime());

                const totalUsers = list.filter(user => user.joinDate <= date.getTime()).length;
                const activeUsers = list.filter(user => (user.joinDate <= date.getTime()) && (user.public || (user['current-theme'] != 'light' && user['current-theme'] != 'dark') || !user['login-history'].includes(user.joinDate))).length;
                const trulyActiveUsers = list.filter(user => (user.joinDate <= date.getTime()) && (!user['login-history'].includes(user.joinDate))).length;
                const activityPercentage = +(activeUsers / totalUsers).toFixed(2);
                const trueActivityPercentage = +(trulyActiveUsers / totalUsers).toFixed(2);

                result.push([date, totalUsers, activeUsers, trulyActiveUsers, activityPercentage, trueActivityPercentage, 1, 1]);
            }
            //compressData(result);
            await chartData(compressData(result, 5));
        })
    });
}

const compressData = (dataList = [], chunkSize = 2) => {
    const result = [];
    var tmp = [];

    for (let i = 0; i < dataList.length; i++) {
        const data = dataList[i];
        if (i == 0) continue;
        
        if (i % chunkSize == 0) {
            result.push([
                tmp.at(-1)[0],
                tmp.reduce((a, n) => (a + n[1]), 0) / tmp.length,
                tmp.reduce((a, n) => (a + n[2]), 0) / tmp.length,
                tmp.reduce((a, n) => (a + n[3]), 0) / tmp.length,
                tmp.reduce((a, n) => (a + n[4]), 0) / tmp.length,
                tmp.reduce((a, n) => (a + n[5]), 0) / tmp.length,
                tmp.reduce((a, n) => (a + n[6]), 0) / tmp.length,
                tmp.reduce((a, n) => (a + n[7]), 0) / tmp.length,
            ]);
            tmp = [];
        } else {
            tmp.push(data);
        }
    }

    if (tmp.length > 0) {
        result.push([
            tmp.at(-1)[0],
            tmp.at(-1)[1],
            tmp.at(-1)[2],
            tmp.at(-1)[3],
            tmp.at(-1)[4],
            tmp.at(-1)[5],
            tmp.at(-1)[6],
            tmp.at(-1)[7],
        ]);
        tmp = [];
    }

    return result;
}

const chartData = async (data = []) => {
    console.log(data.at(0))
    const config = { 
        type: "line",
        data: {
            labels: data.map(d => d.at(0).toLocaleDateString('Fi-fi', {
                'month': 'short',
                'year': 'numeric'
            })),
            datasets: [
                {
                    label: "Total users",
                    borderColor: "rgb(61, 135, 255)",
                    backgroundColor: "rgba(61, 135, 255,0.5)",
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    data: data.map(d => d.at(1)),
                    tension: 0.4,
                    yAxisID: "yAxis1"
                },
                {
                    label: "Active users",
                    borderColor: "rgba(243, 57, 250)",
                    backgroundColor: "rgba(243, 57, 250,0.5)",
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    data: data.map(d => d.at(2)),
                    tension: 0.4,
                    yAxisID: "yAxis1"
                },
                {
                    label: "Truly active users",
                    borderColor: "rgba(250, 108, 57)",
                    backgroundColor: "rgba(250, 108, 57,0.5)",
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    data: data.map(d => d.at(3)),
                    tension: 0.4,
                    yAxisID: "yAxis1"
                },
                {
                    label: "Activity percentage",
                    borderColor: "rgba(243, 57, 250, 0.1)",
                    backgroundColor: "rgba(243, 57, 250, 0.1)",
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: true,
                    data: data.map(d => d.at(4)),
                    yAxisID: "yAxis2"
                },
                {
                    label: "True activity percentage",
                    borderColor: "rgba(250, 108, 5, 0.1)",
                    backgroundColor: "rgba(250, 108, 5, 0.1)",
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: true,
                    data: data.map(d => d.at(5)),
                    yAxisID: "yAxis2"
                },
            ]
        },
        options: {
            scales: {
                yAxis1: {
                    position: 'left',
                    suggestedMin: 0,
                },
                yAxis2: {
                    position: 'right',
                    min: 0,
                    max: 1,
                    ticks: {
                        callback: (val) => (`${val * 100}%`)
                    }
                }
            }
        }
    }

    const dataUrl = await chartJSNodeCanvas.renderToDataURL(config);
    const base64Image = dataUrl;

    var base64Data = base64Image.replace(/^data:image\/png;base64,/, "");

    fs.writeFile("out.png", base64Data, 'base64', function (err) {
        if (err) {
            console.log(err);
        }
    });
}

const runAnalytics = () => {
    constructActivityMap()
}

runAnalytics();