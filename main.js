const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');

async function PlayerData(teams) {
    try {
        const response = await fetch("http://localhost:3001/stats?region=na&timespan=all");
        const data = await response.json();
        const segments = data.data.segments;
        const t1Teams = ["SEN", "NRG", "100T", "LOUD", "Furia", "EG", "MIBR", "LEV", "C9", "KRU", "G2", "2G"];
        
        // Create a player-to-team map with lowercase player names
        const playerToTeamMap = new Map();
        teams.forEach(team => {
            const teamName = Object.keys(team)[0];
            team[teamName].forEach(player => {
                playerToTeamMap.set(player.toLowerCase(), teamName);
            });
        });

        // Filter and transform segments
        const sortedData = segments
            .filter(segment => t1Teams.includes(segment.org))
            .map(segment => {
                const teamName = playerToTeamMap.get(segment.player.toLowerCase()) || "Other";
                return { ...segment, team: teamName };
            });

        return sortedData;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}


async function read() {
    fs.readFile("./output.json", "utf8", (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }
        let highestRating = 0.0;
        let tRating = 0.0;
        let tRatingCount = 0;
        data = JSON.parse(data);
        data.forEach(element => {
            if (element.rating === "") {
                return;
            } else {
                const rating = parseFloat(element.rating);
                tRating += rating * 100;
                tRatingCount += 1;
                if (highestRating < rating) {
                    highestRating = rating;
                }
            }
        });
    });
}

async function readTeam(team) {
    try {
        const data = await fsp.readFile("./output.json", "utf8");
        if (!data) {
            throw new Error('File is empty');
        }

        const parsedData = JSON.parse(data);

        // Extract team name and players
        const teamName = Object.keys(team)[0];
        const playersList = team[teamName];

        const { players, totalRating } = parsedData.reduce((acc, element) => {
            if (playersList.includes(element.player.toLowerCase())) {
                acc.totalRating += parseFloat(element.rating);
                acc.players.push(element.player);
            }
            return acc;
        }, { players: [], totalRating: 0.0 });

        const avgRating = players.length > 0 ? (totalRating / players.length).toFixed(2) : 0;
        return [players, avgRating];
    } catch (err) {
        console.error('Error:', err);
        throw err;
    }
}

// async function assignPlayer(data, team) {
//     const findInList = (list, player) => {
//         return Object.keys(list).find(key => list[key].includes(player));
//     }
//     let teamName = (Object.getOwnPropertyNames(team)[0]).toString();
//     if (findInList(team, data.player)) {
//         data.team = teamName;
//     } else {
//         data.team = "Other";
//     }
//     return data;
// }

async function readCSV(teamName) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('File reading timed out'));
        }, 5000); // 5 seconds timeout

        fs.readFile(teamName + ".csv", "utf8", (err, data) => {
            clearTimeout(timeout); // Clear the timeout if file reading completes

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

            let returnData = {};
            let players = [];
            parsedData.forEach(element => {
                if (element) {
                    players.push(element);
                }
            });
            returnData[teamName] = players;
            resolve(returnData);
        });
    });
}

async function readAllTeams(teams) {
    const output = [];

    // Log the structure of each team object
    teams.forEach(team => {
        console.log('Team:', JSON.stringify(team));
    });

    for (const team of teams) {
        try {
            let teamName;
            const data = await readTeam(team);
            
            // Check if team name exists
            if (Object.keys(team)[0]) {
                teamName = Object.keys(team)[0];
            } else {
                console.warn(`No team name found for team: ${JSON.stringify(team)}`);
                teamName = 'Unknown Team'; // Set a default name
            }

            // Log team details
            // console.log('Team Details:', JSON.stringify({ teamName, data }));

            const rating = parseFloat(data[1]); // Assuming this is already a number
            
            
            // Check if rating is a valid number
            if (typeof rating !== 'number') {
                throw new Error(`Invalid rating type for ${teamName}: ${rating}`);
            }
            
            output.push({ name: teamName, rating });
            
            console.log(`${teamName} players: ${data[0]}`);
        } catch (err) {
            console.error('Error:', err);
        }
    }

    // Check if all ratings are valid numbers
    const invalidRatings = output.filter(item => typeof item.rating !== 'number');
    if (invalidRatings.length > 0) {
        console.error('Invalid rating data detected:', invalidRatings);
        throw new Error(`Found ${invalidRatings.length} invalid ratings`);
    }

    // Sort the output
    const sortedOutput = [...output].sort((a, b) => b.rating - a.rating);

    // Print formatted output
    console.log('| Name                 | Rating |');
    console.log('|----------------------|--------|');

    sortedOutput.forEach(({ name, rating }) => {
        console.log(`| ${name.padEnd(21)}|${rating.toFixed(2).padEnd(8)}|`);
    });

    console.log('-'.repeat(35));
}


async function write() {
    try {
        const anson = await readCSV("anson");
        const lucas = await readCSV("lucas");
        const jeff = await readCSV("jeff");
        const ethan = await readCSV("ethan");
        
        const teams = [anson, lucas, jeff, ethan];
        const allPlayers = await PlayerData(teams);

        // console.log('Anson CSV Data:', anson);
        // console.log('All Players Data:', allPlayers);

        await fsp.writeFile("./output.json", JSON.stringify(allPlayers, null, 2));
        console.log('File written successfully');
    } catch (err) {
        console.error('Error:', err);
    }
}

async function main() {
    const anson = await readCSV("anson");
    const lucas = await readCSV("lucas");
    const jeff = await readCSV("jeff");
    const ethan = await readCSV("ethan");
    
    const teams = [anson, lucas, jeff, ethan];

    readAllTeams(teams);
    
}

main().catch(error => console.error("Error:", error));