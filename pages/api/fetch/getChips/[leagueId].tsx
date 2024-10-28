import type { NextApiRequest, NextApiResponse } from 'next';
import {  getManagersByUserIds, getPlayerGWDataByPlayerId } from '@/lib/utils/FPLFetch';
import { getLeague, getBootstrapStatic, getUserGWData, getCurrentGameweek } from '@/lib/utils/FPLFetch';
import { getPlayerDataById, retryWithBackoff } from '@/lib/utils/FPLHelper';
import { get } from 'http';
import { UserGw } from '@/lib/types/FPLUserGW';
import { Manager } from '@/lib/types/Manager';
import { FPLHistory } from '@/lib/types/FPLPlayerHistory';
import { Element } from '@/lib/types/FPLStatic';
import { League, Result } from '@/lib/types/FPLLeague';


// calculate average points of users who played the chip 
const calculateChipPoint = (chipData: userChipData, chip: string) => {

    
    
    if (chip === "freehit" || chip === "wildcard" || chip === "bboost")  {
        
        return chipData?.userGW?.entry_history?.points || 0;        

    } 
    if (chip === "3xc") {
        return chipData?.playerGWData?.total_points || 0
    }
    else {
        
        return 0;
    }
  
}



/**
 * API handler to fetch and process captain picks for a given league.
 *
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 * @returns A JSON response containing captain picks data.
 */
interface userChipData {
    managerData: Manager;
    userGW: UserGw;
    playerGWData: FPLHistory | null;
    playerData: Element | null;
    userResults: Result;
}

interface chipData {
    userData: Record<string, userChipData[]>;
    gw: number;
    userIds: number[];
    leagueData: League, 
    graphData: GraphData 
}

interface GraphData {
    [key: string]: {
        name: string;
        point: number;
        status: string;
    }[];
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { leagueId } = req.query;
        const currentGameweek = await getCurrentGameweek();
        const staticData = await getBootstrapStatic();
    
        if (!leagueId) {
          return res.status(400).json({ error: 'Missing leagueId or InOut parameter' });
        }
    
        const leagueData: FPLLeague = await retryWithBackoff(() => getLeague(leagueId.toString()), 3, 1000).catch((error: Error) => {
          console.error(`Error fetching league data for league ID ${leagueId}:`, error);
          throw new Error('Error fetching league data. Please check the league ID and try again.');
        });

        // get userIds of users in league
        const userIds = leagueData.standings.results.map((result) => result.entry);
        // loop through each gw and userGWData
        const managersData = await getManagersByUserIds(userIds);
        const usersGWData = [] as UserGw[];
        await Promise.all(userIds.map(async (userId) => {
            for (let gw = 1; gw <= (currentGameweek || 3); gw++) {

                
                const userGWData = await getUserGWData(userId, gw);
                userGWData.userId = userId;
                
                usersGWData.push(userGWData);
            }
        }));
                
        //loop through userGWData and filter out all userGWs where there is a chip played
        const chipsPlayed = [] as userChipData[];
        await Promise.all(usersGWData.map(async (userGWData) => {
            
            if (userGWData.active_chip !== null) {
            if (userGWData.active_chip === '3xc') {
                const captainId = userGWData.picks.find((pick) => pick.is_captain)?.element;
                const captainData = await getPlayerGWDataByPlayerId(captainId as number, userGWData.entry_history.event);
                
                const userChipsInsights: userChipData = {
                    managerData: managersData.find((manager) => manager.id === userGWData.userId) as Manager,
                    userGW: userGWData,
                    playerGWData: captainData,
                    userResults: leagueData.standings.results.find(result => result.id === userGWData.userId) as Result,
                    playerData: staticData?.elements?.find((element) => element.id === captainId) as Element || null,
                }
                chipsPlayed.push(userChipsInsights);
            }
            else {
                const userChipsInsights: userChipData = {
                managerData: managersData.find((manager) => manager.id === userGWData.userId) as Manager,
                userGW: userGWData,
                userResults: leagueData.standings.results.find(result => result.id === userGWData.userId) as Result,
                playerGWData: null,
                playerData: null,
                }
                chipsPlayed.push(userChipsInsights);
            }
            }
        }));

        

        // I now want to sort the objects based on what chip was played
        // the updated object should have chip, and userChipData[]
        // sort through the chipsPlayed array and create a new object with the chip as the key and the userChipData[] as the value
        const chipDataObj: Record<string, userChipData[]> = {};
        
        chipsPlayed.forEach((chipPlayed) => {
            if (chipPlayed.userGW.active_chip !== null) {

              if (chipDataObj[chipPlayed.userGW.active_chip]) {
                chipDataObj[chipPlayed.userGW.active_chip].push(chipPlayed);
              } else {
                chipDataObj[chipPlayed.userGW.active_chip] = [chipPlayed];
              }
            }
          });


        // Create a variable called GraphData, that loops through each chip, and each 
        // user in the league (leagueData.standings.results). 
        // For each chip, and each user, create the name, points and status
        // name is the webname in the league.standings.results.player_name
        // points is: for that specific chip, review chipDataObj to see if there is user has points for that chip
        // status: IF points is = 0, "no", if user is in chipDataObj, and has used this chip this week, then status is "current", otherwise: "yes"
        // Sort each array per chip based on points
        const chips = ['wildcard', 'freehit', 'bboost', '3xc']
        const graphData: GraphData = {}
        
        chips.forEach((chip) => {
            graphData[chip] = leagueData.standings.results.map((result) => {
                const userChipData = chipDataObj[chip]?.find((data) => data.managerData.id.toString() === result.entry.toString());
                if (!userChipData) {
                    return {
                        name: result.player_name,
                        point: 0,
                        status: "No"
                    };
                }
                const point = calculateChipPoint(userChipData as userChipData, chip) || 0;
                const status = userChipData.userGW.entry_history.event === currentGameweek ? "Current" : "Yes";
                return {
                    name: result.player_name,
                    point,
                    status
                };
            }).sort((a, b) => b.point - a.point);
        });

        const chipData: chipData = {
            userData: chipDataObj,
            gw: currentGameweek as number,
            userIds: userIds as number[],
            leagueData: leagueData as League,
            graphData: graphData as GraphData

        }

        // return data
        return res.status(200).json(chipData);

    } catch (error) {
        console.error('Unexpected error in handler:', error);
        return res.status(500).json({ error: `Unexpected error: ${error}` });
    }
}
