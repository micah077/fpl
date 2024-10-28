import type { NextApiRequest, NextApiResponse } from 'next';
import { getLeague, getBootstrapStatic, getUserGWData, getCurrentGameweek, getPlayerGWDataByPlayerId } from '@/lib/utils/FPLFetch';
import { getPlayerDataById, retryWithBackoff } from '@/lib/utils/FPLHelper';
import { get } from 'http';

type Player = {
  id: number;
  ownership: number;
  entries: string[];
};


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    
    console.time('PoB&AutoSub');
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

  
    const usersGWDataPromises = userIds.map(async userId => {
    const userGWData = await getUserGWData(userId, currentGameweek as number);
    return {
        userId,
        userGWData
    };
    });

    const usersGWData = await Promise.all(usersGWDataPromises);
    
    // loop through the picks for each user, and add elementIn and elementOut to the picks object
    // using get GW data for the current gameweek
    const picksWithElementData = await Promise.all(usersGWData.map(async (data) => {
        const picks = data.userGWData.picks;
        const elementDataPromises = picks.map(async (pick) => {
            const elementData = staticData.elements.find((element) => element.id === pick.element);
            const elementGWdata = await getPlayerGWDataByPlayerId(pick.element, currentGameweek as number);

            return {
                ...pick,
                elementData: elementData,
                elementGWdata: elementGWdata
            };
        });

        return {
            userId: data.userId,
            entry_name: leagueData.standings.results.find((result) => result.entry === data.userId)?.entry_name,
            player_name: leagueData.standings.results.find((result) => result.entry === data.userId)?.player_name,
            autoSubs: data.userGWData.automatic_subs,
            picksWithElementData: await Promise.all(elementDataPromises),
        };
    }));

    // clean up the data: develop an object with the following structure: 
    // {pointsOnBench: Element[], autoSubs: AutoSub[]}
    const PoBAndAutoSub = picksWithElementData.map((data) => {
        const pointsOnBench = data.picksWithElementData.filter((pick) => pick.position > 11);
        const autoSubs = data.autoSubs.map((autoSub) => {
            const elementIn = data.picksWithElementData.find((pick) => pick.element === autoSub.element_in);
            const elementOut = data.picksWithElementData.find((pick) => pick.element === autoSub.element_out);
            return {
                elementIn: elementIn,
                elementOut: elementOut
            };
        });

        return {
            userId: data.userId,
            entry_name: data.entry_name,
            player_name: data.player_name,
            pointsOnBench: pointsOnBench,
            autoSubs: autoSubs
        };
    });
    

        
    console.timeEnd('PoB&AutoSub');
    return res.status(200).json(PoBAndAutoSub);
  } catch (error) {
    console.error('Unexpected error in handler:', error);
    return res.status(500).json({ error: `Unexpected error: ${error}` });
  }
}
