import type { NextApiRequest, NextApiResponse } from 'next';
import { getLeague, getBootstrapStatic, getUserGWData, getCurrentGameweek } from '@/lib/utils/FPLFetch';
import { getPlayerDataById, retryWithBackoff } from '@/lib/utils/FPLHelper';

type Player = {
  id: number;
  ownership: number;
  entries: string[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.time("API RESPONSE MOST OWNED");

    const { leagueId } = req.query;
    if (!leagueId) {
      return res.status(400).json({ error: 'Missing leagueId' });
    }

    const currentGameweek = await getCurrentGameweek();
    const staticData = await getBootstrapStatic();

    const leagueData: FPLLeague = await retryWithBackoff(() => getLeague(leagueId.toString()), 3, 1000).catch((error: Error) => {
      console.error(`Error fetching league data for league ID ${leagueId}:`, error);
      throw new Error('Error fetching league data. Please check the league ID and try again.');
    });

    const playerDataMap = staticData?.elements.reduce((map, player) => {
      map[player.id] = player;
      return map;
    }, {} as Record<number, any>) || {};

    const userEntries = leagueData.standings.results.map(user => user.entry);
    const userDataPromises = userEntries.map((userId) => getUserGWData(userId, currentGameweek as number));
    const leagueUserData = await Promise.all(userDataPromises);

    const ownedPlayersMap: Record<number, Player> = {};

    leagueUserData.forEach((user: FPLUserGameweek) => {
      user.picks.forEach((pick: FPLPick) => {
        if (!ownedPlayersMap[pick.element]) {
          ownedPlayersMap[pick.element] = { id: pick.element, ownership: 0, entries: [] };
        }
        ownedPlayersMap[pick.element].ownership += 1;
        ownedPlayersMap[pick.element].entries.push(user?.entry?.toString()!);
      });
    });

    const ownedPlayers = Object.values(ownedPlayersMap).sort((a, b) => b.ownership - a.ownership);

    const modifiedMostOwnedPlayers = ownedPlayers.map((player) => {
      const currentPlayerData = playerDataMap[player.id]; 
      const ownedPlayers = leagueData.standings.results.filter((entry) => player.entries.includes(entry.entry.toString()));

      return {
        ...player,
        currentPlayerData,
        ownedPlayers,
      };
    });

    const result = {
      leagueData,
      mostOwnedPlayers: modifiedMostOwnedPlayers,
      gw: currentGameweek,
    };

    console.timeEnd("API RESPONSE MOST OWNED");
    return res.status(200).json(result);
  } catch (error:any) {
    console.error('Unexpected error in handler:', error);
    return res.status(500).json({ error: `Unexpected error: ${error.message}` });
  }
}
