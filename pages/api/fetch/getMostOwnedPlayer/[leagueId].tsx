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

    if (!leagueId) {
      return res.status(400).json({ error: 'Missing leagueId or InOut parameter' });
    }

    const leagueData: FPLLeague = await retryWithBackoff(() => getLeague(leagueId.toString()), 3, 1000).catch((error: Error) => {
      console.error(`Error fetching league data for league ID ${leagueId}:`, error);
      throw new Error('Error fetching league data. Please check the league ID and try again.');
    });

    // Loop through users in league and return all the user's picks
    const leagueUserData = await Promise.all(
      leagueData.standings.results.map(async (user) => {
          const userData = await getUserGWData(user.entry, currentGameweek as number);
          return {
              ...userData,
              entry: user.entry,
          };
      })
  );


  // loop through each user's picks (picks array) and return the most owned players.
  const ownedPlayers: Player[] = leagueUserData.reduce((players: Player[], user: FPLUserGameweek) => {
        
    user.picks.forEach((pick: FPLPick) => {
        const existingPlayer = players.find((player) => player.id === pick.element);
        if (existingPlayer) {
            existingPlayer.ownership += 1;
            existingPlayer.entries.push(user.entry !== undefined ? user.entry.toString() : '');
        } else {
            players.push({
                id: pick.element,
                ownership: 1,
                entries: [user.entry !== undefined ? user.entry.toString() : ''],
            });
        }
    });
    return players;
  }, []);

  

  ownedPlayers.sort((a, b) => b.ownership - a.ownership);
  


  const modifiedMostOwnedPlayers = ownedPlayers.map((player) => {
    const currentPlayerData = staticData?.elements
        .find((playerData) => playerData.id === player.id) 
    const ownedPlayers = leagueData.standings.results.filter((entry) => player.entries.includes(entry.entry.toString()));
    
    return {
        ...player,
        currentPlayerData,
        ownedPlayers,
    };
  });



  console.timeEnd('MostOwnedPlayers');

  // include leagueData as a separate part of the returned object, so that the object has
  // top level keys of 'leagueData' and 'mostOwnedPlayers'
  const result = {
    leagueData,
    mostOwnedPlayers: modifiedMostOwnedPlayers,
    gw: currentGameweek
  };

    return res.status(200).json(result);
  } catch (error) {
    console.error('Unexpected error in handler:', error);
    return res.status(500).json({ error: `Unexpected error: ${error}` });
  }
}
