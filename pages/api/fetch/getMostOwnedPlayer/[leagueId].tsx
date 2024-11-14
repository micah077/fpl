import type { NextApiRequest, NextApiResponse } from 'next';
import { getLeague, getBootstrapStatic, getUserGWData, getCurrentGameweek } from '@/lib/utils/FPLFetch';
import { retryWithBackoff } from '@/lib/utils/FPLHelper';

type Player = {
  id: number;
  ownership: number;
  entries: string[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { leagueId } = req.query;
    if (!leagueId) {
      return res.status(400).json({ error: 'Missing leagueId parameter' });
    }

    console.time('MostOwnedPlayers');
    const currentGameweek = await getCurrentGameweek();
    const staticData = await getBootstrapStatic();

    
    const leagueData = await retryWithBackoff(() => getLeague(leagueId.toString()), 3, 1000);
    
    
    const leagueUserData = await Promise.all(
      leagueData.standings.results.map(async (user:any) => {
        const userData = await getUserGWData(user.entry, currentGameweek as number);
        return { ...userData, entry: user.entry };
      })
    );

   
    const ownedPlayers: Player[] = leagueUserData.reduce((players, user) => {
      user.picks.forEach((pick:any) => {
        let existingPlayer = players.find((player:any) => player.id === pick.element);
        if (existingPlayer) {
          existingPlayer.ownership += 1;
          existingPlayer.entries.push(user.entry.toString());
        } else {
          players.push({
            id: pick.element,
            ownership: 1,
            entries: [user.entry.toString()],
          });
        }
      });
      return players;
    }, []);

   
    ownedPlayers.sort((a, b) => b.ownership - a.ownership);

    
    const modifiedMostOwnedPlayers = await Promise.all(
      ownedPlayers.map(async (player) => {
        const currentPlayerData = staticData?.elements.find((data) => data.id === player.id);
        const ownedPlayers = leagueData.standings.results.filter((entry:any) => player.entries.includes(entry.entry.toString()));
        return { ...player, currentPlayerData, ownedPlayers };
      })
    );

    console.timeEnd('MostOwnedPlayers');

    
    return res.status(200).json({
      leagueData,
      mostOwnedPlayers: modifiedMostOwnedPlayers,
      gw: currentGameweek,
    });

  } catch (error:any) {
    console.error('Unexpected error in handler:', error);
    return res.status(500).json({ error: `Unexpected error: ${error.message}` });
  }
}
