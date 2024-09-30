const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');



async function getPlayerData() {
    // fetch("http://localhost:5000/api/players")
    fetch("http://localhost:3001/stats?region=na&timespan=all")
        .then(response => response.json())
        .then(data => {
            data = data.data.segments
            const sortedData = []
            const t1Teams = ["SEN", "NRG", "100T", "LOUD", "Furia", "EG", "MIBR", "LEV", "C9", "KRU", "G2","2G"]
            data.forEach(element => {
                if (t1Teams.includes(element.org)) {
                    sortedData.push(element)
                    console.log(element)
                    }
            });
            
            return sortedData
        }) 
        .catch(error => console.error('Error:', error));
    }


async function read() {
    fs.readFile("./output.json", "utf8", (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }
        let highestRating = 0.0
        let tRating = 0.0
        let tRatingCount = 0
        data = JSON.parse(data)
        data.forEach(element => {
            // console.log(element)
            if (element.rating === "") {
                // console.log("N/A")
                return
            } else {
                rating = parseFloat(element.rating)
                tRating += rating * 100
                tRatingCount += 1
                if (highestRating < rating) {
                    highestRating = rating
                }
            }
        })
        // let avgRating = tRating / tRatingCount
        // console.log("Highest Rating: " + highestRating)
        // console.log("Average Rating: " + avgRating)
        // console.log(data)
    })
}

async function readTeam(team) {
    return new Promise((resolve, reject) => {
        console.log("Reading team " + team)
        fs.readFile("./output.json", "utf8", (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                reject(err);
                return;
            }
            if (!data) {
                console.error('Error: File is empty');
                reject(new Error('File is empty'));
                return;
            }

            let parsedData;
            try {
                parsedData = JSON.parse(data);
            } catch (parseErr) {
                console.error('Error parsing JSON:', parseErr);
                reject(parseErr);
                return;
            }

            let returnData = []
            let players = []
            let totalRating = 0.0
            parsedData.forEach(element => {
                if (element.team === team) {
                    totalRating += parseFloat(element.rating)
                    players.push(element.player)
                }
            });
            let avgRating = players.length > 0 ? (totalRating / players.length).toFixed(2) : 0;
            returnData.push(players)
            returnData.push(avgRating)
            resolve(returnData)
        });
    });
}

async function assignPlayer(data, team) {
    data.team = ""
    const findInList = (list, player) => {
        return Object.keys(list).find(key => list[key].includes(player))
    }


    return data
}

async function readCSV(teamName) {
    return new Promise((resolve, reject) => {
        const results = [];
        // console.log("Reading " + teamName)
        fs.readFile(teamName + ".csv", "utf8", (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                reject(err);
                return;
            }
            if (!data) {
                console.error('Error: File is empty');
                reject(new Error('File is empty'));
                return;
            }

            let parsedData;
            try {
                parsedData = data.split(",");
            } catch (parseErr) {
                console.error('Error parsing JSON:', parseErr);
                reject(parseErr);
                return;
            }

            let returnData = {}
            let players = []
            parsedData.forEach(element => {
                if (element) {
                    players.push(element)
                }
            });
            returnData[teamName] = players
            resolve(returnData)
        })
    });
}


async function readAllTeams() {
    // let teams = ["Anson", "Lucas", "Jeff", "Ethan"]
    let teams = ["Anson"]
    for (const team of teams) {
        try {
            const data = await readTeam(team)
            console.log(team + " players: " + data[0])
            console.log(team + " average rating: " + data[1])
        } catch (err) {
                console.error(err)
        }
    };
}

async function main() {
    let anson = await readCSV("anson")

    let allPlayers = await getPlayerData()
    
    
}

main()