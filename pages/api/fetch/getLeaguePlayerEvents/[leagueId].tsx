import { NextApiRequest, NextApiResponse } from 'next';
import { getLeague, getBootstrapStatic, getUserGWData, getManagersByUserIds } from '@/lib/utils/FPLFetch';
import { getPlayerDataById } from '@/lib/utils/FPLHelper';
import { Element } from '@/lib/types/FPLStatic';
import { log } from 'console';
import { Result } from '@/lib/types/FPLLeague';

type ManagerData ={
    managerData: Result;
    managerGWData: FPLUserGameweek;
}


/**
 * API handler to fetch and process captain picks for a given league.
 *
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 * @returns A JSON response containing captain picks data.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { leagueId} = req.query;
        if (!leagueId) {
            return res.status(400).json({ error: 'leagueId is required' });
        }

        let leagueData;
        try {
            leagueData = await getLeague(leagueId.toString());
        } catch (error) {
            console.error(`Error fetching league data for leagueId ${leagueId}:`, error);
            return res.status(500).json({ error: `Error fetching league data: ${error}` });
        }

        const userIds = leagueData.standings.results.map(result => result.entry);
        const leagueManagers: Result[] = leagueData.standings.results;

        let staticData;
        try {
            staticData = await getBootstrapStatic();
        } catch (error) {
            console.error('Error fetching static data:', error);
            return res.status(500).json({ error: `Error fetching static data: ${error}` });
        }

        const currentGameweek = staticData?.events?.find(event => event.is_current)?.id || 1;

         //loop through all userIds, and add the getUserGWdata to the object managerData
        const managerData: ManagerData[] = [];


        // call the refreshEvents api, inclduing currentGameweek and userIds 
        const updatedDataWithPlayerData: EventDatabase[]  = [];
        try {
            const updateData = await fetch('http://localhost:3000/api/refreshEvents', {
                method: 'POST',
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentGameweek: currentGameweek, 
                    userIds: userIds
                })
            });
        } catch (error) {
            console.error('Error:', error);
        }
        
        // now, get all data from the database api using the getEvent API from app/pages/api/getEvent/[gw]
        const updatedData = await fetch(`http://localhost:3000/api/getEvent/${currentGameweek}`, { cache: 'no-store' });
        const updatedDatabaseEventData: EventDatabase[] = await updatedData.json();

        
        // get the IDs of all players all the users in the league has
        //Loop through all userIds, get all the unique playerIds in their team, and add them to a list
        const allPlayerIds: number[] = [];

        //split userIds into arrays of 5, and only do promise.all on five users at the time. 
        
        for (const userId of userIds) {
            const userGWData = await getUserGWData(userId, currentGameweek);
            const playerIds = userGWData.picks.map((pick) => pick.element);

            allPlayerIds.push(...playerIds);
            const allManagerData: ManagerData = {
            managerData: leagueManagers.find((manager) => manager.entry === userId) as Result,
            managerGWData: userGWData
            };
            // Add userGWData to managerData
            managerData.push(allManagerData);
        }

        // create a set of all playerIds, to get all unique IDs
        const uniquePlayerIds = Array.from(new Set(allPlayerIds));

        var sortedSlicedPlayerData: EventDatabase[] = [];
        console.log(updatedDatabaseEventData,'updatedDatabaseEventData')
        if(updatedDatabaseEventData) {
            
            const slicedData: EventDatabase[] = updatedDatabaseEventData
                .filter((event) => uniquePlayerIds.includes(Number(event.playerId)))
                .sort((a, b) => a.eventDate - b.eventDate).reverse();


            // Add playerData to the slicedData object from the static data

            
            const slicedPlayerDataPromise = slicedData.map(async (event) => {
                if(event.playerId) {
                    const id: string = event.playerId;
                    const playerData: Element[] = staticData.elements
                    const playerIdData = await getPlayerDataById({id, playerData});
                    
                    
                    // loop through managerData, and see if id is in picks of the managaer
                    // if it is, add the manager data to the event object
                    const managersWithPlayer = managerData.filter((manager) => {
                        return manager.managerGWData.picks.some((pick) => pick.element.toString() === id.toString());
                    });
                    
                    if (managersWithPlayer.length > 0) {
                        event.managerInsights = managersWithPlayer.map((manager) => {
                            return manager.managerData;
                        });
                    }

                    return {
                        ...event,
                        playerIdData
                    };
                }
                return event; 
            });

            const slicedPlayerData: FPLLeagueEvents[] = await Promise.all(slicedPlayerDataPromise);

            
            sortedSlicedPlayerData = slicedPlayerData.sort((a: EventDatabase, b: EventDatabase) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .filter((event) => event.gw === currentGameweek)
            
            


        } else {

            
            sortedSlicedPlayerData = [];
        }




        return res.status(200).json(sortedSlicedPlayerData);
    } catch (error) {
        console.error('Unexpected error in handler:', error);
        return res.status(500).json({ error: `Unexpected error: ${error}` });
    }
}
