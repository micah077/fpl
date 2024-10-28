import type { NextApiRequest, NextApiResponse } from 'next';
import { getLeague, getBootstrapStatic, getUserGWData, getCurrentGameweek } from '@/lib/utils/FPLFetch';
import { getPlayerDataById, retryWithBackoff } from '@/lib/utils/FPLHelper';
import { get } from 'http';

type Player = {
  id: number;
  ownership: number;
  entries: string[];
};


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { leagueId } = req.query;
    const currentGameweek = await getCurrentGameweek();
    const staticData = await getBootstrapStatic();

    const TREND_SINCE_GW = 5;

    let trendGW = 1; 

    if ((currentGameweek as number - TREND_SINCE_GW + 1) < 1 ) {
        trendGW = 1;
    } else {
        trendGW = currentGameweek as number - TREND_SINCE_GW + 1
    }

    if (!leagueId) {
      return res.status(400).json({ error: 'Missing leagueId or InOut parameter' });
    }

    const leagueData: FPLLeague = await retryWithBackoff(() => getLeague(leagueId.toString()), 3, 1000).catch((error: Error) => {
      console.error(`Error fetching league data for league ID ${leagueId}:`, error);
      throw new Error('Error fetching league data. Please check the league ID and try again.');
    });

    // get userIds of users in league
    const userIds = leagueData.standings.results.map((result) => result.entry);
    
  console.time('TeamValue');
    // get league data
   
    //get userIds of users in league

    const teamValuePerGW: { userId: number; teamValue: number; userName: string | undefined; }[] = [];
    //loop through each user and get their team value using UserGWData. The new object should store userId, TeamValue per GW
    // and the user's name
    const usersTeamValuePromise = userIds.map(async (userId) => {
    //creating a new object with each user id, user name, their latest gw value, and the difference between
    // the latest gw and the first gw in the array.
        const currentUsersGWData = await getUserGWData(userId, currentGameweek as number);
        
        const trendGwUserData = await getUserGWData(userId, trendGW);

        const userTeamValue = {
            userId: userId,
            userName: leagueData.standings.results.find(result => result.entry === userId)?.player_name,
            teamValue: currentUsersGWData.entry_history.value,
            trendValue: trendGwUserData.entry_history.value,
            trend: currentUsersGWData.entry_history.value - trendGwUserData.entry_history.value, 
            bank: currentUsersGWData.entry_history.bank
        }
        return userTeamValue;
    });

    const usersTeamValue = await Promise.all(usersTeamValuePromise);
    
    //Sort the array based on the trend variable in the object
    usersTeamValue.sort((a, b) => b.teamValue - a.teamValue);   
    
    console.timeEnd('TeamValue');


  

    return res.status(200).json(usersTeamValue);
  } catch (error) {
    console.error('Unexpected error in handler:', error);
    return res.status(500).json({ error: `Unexpected error: ${error}` });
  }
}
