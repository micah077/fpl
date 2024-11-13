import { NextApiRequest, NextApiResponse } from 'next';
import { getLeague, getBootstrapStatic, getUserGWData, getManagersByUserIds } from '@/lib/utils/FPLFetch';
import { getPlayerDataById } from '@/lib/utils/FPLHelper';
import { Element } from '@/lib/types/FPLStatic';
import { log } from 'console';
import { Result } from '@/lib/types/FPLLeague';

type ManagerData = {
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
        const { leagueId } = req.query;
        if (!leagueId) {
            return res.status(400).json({ error: 'leagueId is required' });
        }

        const [leagueData, staticData] = await Promise.all([
            getLeague(leagueId.toString()).catch(error => {
                console.error(`Error fetching league data for leagueId ${leagueId}:`, error);
                throw new Error(`Error fetching league data: ${error}`);
            }),
            getBootstrapStatic().catch(error => {
                console.error('Error fetching static data:', error);
                throw new Error('Error fetching static data: ' + error);
            })
        ]);

        // Destructure data immediately after fetching
        const { standings } = leagueData;
        const userIds = standings.results.map(result => result.entry);
        const leagueManagers: Result[] = standings.results;


        const currentGameweek = staticData?.events?.find(event => event.is_current)?.id || 1;

        //loop through all userIds, and add the getUserGWdata to the object managerData


        // call the refreshEvents api, inclduing currentGameweek and userIds 
        try {
            await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/refreshEvents`, {
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
        const updatedData = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/getEvent/${currentGameweek}`, { cache: 'no-store' });
        const updatedDatabaseEventData: EventDatabase[] = await updatedData.json();

        
        // get the IDs of all players all the users in the league has
        //Loop through all userIds, get all the unique playerIds in their team, and add them to a list
        const allPlayerIds = new Set<number>();

        const leagueManagersMap = new Map(leagueManagers.map(manager => [manager.entry, manager]));

        const managerDataPromises = userIds.map(async (userId) => {
            try {
                const userGWData = await getUserGWData(userId, currentGameweek);
                const playerIds = userGWData.picks.map((pick) => pick.element);
        
                // Add player IDs to the Set (no duplicates)
                playerIds.forEach(id => allPlayerIds.add(id));
        
                // Use the leagueManagersMap for quick lookup instead of find()
                const manager = leagueManagersMap.get(userId);
        
                if (manager) {
                    return {
                        managerData: manager,
                        managerGWData: userGWData
                    };
                }
            } catch (error) {
                console.error(`Error fetching GW data for userId ${userId}:`, error);
            }
        
            return null;
        });

        const resolvedManagerData = await Promise.all(managerDataPromises);

        const validManagerData = resolvedManagerData.filter((data) => data !== null);
        
        const managerData = validManagerData as ManagerData[]; // Type assertion since we filtered null
        
        const uniquePlayerIds = Array.from(allPlayerIds);

        var sortedSlicedPlayerData: EventDatabase[] = [];

        if (updatedDatabaseEventData) {
            const slicedData: EventDatabase[] = updatedDatabaseEventData
                .filter((event) => uniquePlayerIds.includes(Number(event.playerId)))
                .sort((a, b) => a.eventDate - b.eventDate).reverse();

            const slicedPlayerDataPromise = slicedData.map(async (event) => {
                if (event.playerId) {
                    const id: string = event.playerId;
                    const playerData: Element[] = staticData.elements
                    const playerIdData = await getPlayerDataById({ id, playerData });
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
