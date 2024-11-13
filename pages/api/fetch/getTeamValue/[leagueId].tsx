import type { NextApiRequest, NextApiResponse } from 'next';
import { getLeague, getBootstrapStatic, getUserGWData, getCurrentGameweek } from '@/lib/utils/FPLFetch';
import { getPlayerDataById, retryWithBackoff } from '@/lib/utils/FPLHelper';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.time("API RESPONSE TEAM VALUE");

    const { leagueId } = req.query;
    if (!leagueId) {
      return res.status(400).json({ error: 'Missing leagueId parameter' });
    }

    const currentGameweek:any = await getCurrentGameweek();
    const staticData = await getBootstrapStatic();
    
    const TREND_SINCE_GW = 5;
    const trendGW = Math.max(currentGameweek - TREND_SINCE_GW + 1, 1); // Ensure trendGW is at least 1

    const leagueData: FPLLeague = await retryWithBackoff(() => getLeague(leagueId.toString()), 3, 1000).catch((error: Error) => {
      console.error(`Error fetching league data for league ID ${leagueId}:`, error);
      throw new Error('Error fetching league data. Please check the league ID and try again.');
    });

    const userIds = leagueData.standings.results.map(result => result.entry);
    const userNameMap = leagueData.standings.results.reduce((acc, result) => {
      acc[result.entry] = result.player_name;
      return acc;
    }, {} as { [key: number]: string });

    const usersTeamValue = await Promise.all(
      userIds.map(async (userId) => {
        // Fetch current and trend data for the user
        const [currentGWData, trendGWData] = await Promise.all([
          getUserGWData(userId, currentGameweek),
          getUserGWData(userId, trendGW)
        ]);

        const teamValue = currentGWData.entry_history.value;
        const trendValue = trendGWData.entry_history.value;
        const trend = teamValue - trendValue;

        return {
          userId,
          userName: userNameMap[userId], 
          teamValue,
          trendValue,
          trend,
          bank: currentGWData.entry_history.bank
        };
      })
    );

    usersTeamValue.sort((a, b) => b.teamValue - a.teamValue);

    console.timeEnd('API RESPONSE TEAM VALUE');
    return res.status(200).json(usersTeamValue);
    
  } catch (error) {
    console.error('Unexpected error in handler:', error);
    return res.status(500).json({ error: `Unexpected error: ${error}` });
  }
}
