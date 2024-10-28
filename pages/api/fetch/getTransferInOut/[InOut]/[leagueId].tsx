import type { NextApiRequest, NextApiResponse } from 'next';
import { getLeague, getBootstrapStatic, getTransfersFromListOfIds, getManagersByUserIds } from '@/lib/utils/FPLFetch';
import { getPlayerDataById, retryWithBackoff } from '@/lib/utils/FPLHelper';


interface PlayerData {
  id: number;
  web_name: string;
  photo: string;
}

interface Transfer {
  element_in: number;
  element_out: number;
  entry: number;
  event: number;
}

interface ManagerData {
  id: number;
  player_first_name: string;
  player_last_name: string;
}

interface TransferData {
  position: number;
  statusIcon: React.ReactNode;
  playerName: string;
  userInOut: number;
  playerImage: string;
}

interface TransferDataProps {
  inOut: string;
  transfers: {
    playerName: string;
    playerImage: string;
    users: string[];
  }[];
}

interface AccType {
  in: { [key: string]: { photo: string, users: string[] } };
  out: { [key: string]: { photo: string, users: string[] } };
}



const fetchAllPlayerData = async (transfers: Transfer[], playerData: PlayerData[], staticData: FPLStatic): Promise<{ [key: number]: PlayerData }> => {
  const playerIds: Set<number> = new Set<number>(transfers.flatMap(transfer => [transfer.element_in, transfer.element_out]));
  const playerDataMap: { [key: number]: PlayerData } = {};

  await Promise.all(Array.from(playerIds).map(async (playerId) => {
    try {
      const playerInfo = await getPlayerDataById({ id: playerId, playerData: staticData.elements });
      if (playerInfo) {
        playerDataMap[playerId] = playerInfo;
      }
    } catch (error) {
      console.error(`Error fetching player data for player ID ${playerId}:`, error);
    }
  }));

  return playerDataMap;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const numberOfGameweeks = 3;
    const { leagueId, InOut } = req.query;

    if (!leagueId || !InOut) {
      return res.status(400).json({ error: 'Missing leagueId or InOut parameter' });
    }

    const leagueData: FPLLeague = await retryWithBackoff(() => getLeague(leagueId.toString()), 3, 1000).catch((error: Error) => {
      console.error(`Error fetching league data for league ID ${leagueId}:`, error);
      throw new Error('Error fetching league data. Please check the league ID and try again.');
    });

    const userIds = leagueData.standings.results.map(result => result.entry);

    const staticData: FPLStatic = await retryWithBackoff(getBootstrapStatic, 3, 1000).catch((error: Error) => {
      console.error('Error fetching bootstrap static data:', error);
      throw new Error('Error fetching static data. Please try again later.');
    });

    const currentGameweek = staticData?.events?.find(event => event.is_current)?.id || 1;
    const playerData = staticData.elements;

    const userTransfers: FPLTransfers[] = await retryWithBackoff(() => getTransfersFromListOfIds(userIds), 3, 1000).catch((error: Error) => {
      console.error('Error fetching user transfers:', error);
      throw new Error('Error fetching user transfers. Please try again later.');
    });

    const userTransfersPerGW = userTransfers.filter((transfer: Transfer) => {
      return transfer.event >= currentGameweek - numberOfGameweeks + 1 && transfer.event <= currentGameweek;
    });

    const managersData: FPLManager[] = await retryWithBackoff(() => getManagersByUserIds(userIds), 3, 1000).catch((error: Error) => {
      console.error('Error fetching managers data:', error);
      throw new Error('Error fetching managers data. Please try again later.');
    });

    const allPlayerData = await fetchAllPlayerData(userTransfersPerGW, playerData, staticData).catch((error: Error) => {
      console.error('Error fetching all player data:', error);
      throw new Error('Error fetching all player data. Please try again later.');
    });

    const transferCount = userTransfersPerGW.reduce((acc: AccType, transfer: Transfer) => {
      const playerInData = allPlayerData[transfer.element_in];
      const playerOutData = allPlayerData[transfer.element_out];
      const manager = managersData.find(manager => manager.id === transfer.entry);
      const userName = manager ? `${manager.player_first_name} ${manager.player_last_name}` : 'Unknown User';

      if (playerInData && playerInData.web_name) {
        const usersSetIn = new Set(acc.in[playerInData.web_name]?.users || []);
        usersSetIn.add(userName);
        acc.in[playerInData.web_name] = {
          photo: playerInData.photo,
          users: Array.from(usersSetIn)
        };
      }

      if (playerOutData && playerOutData.web_name) {
        const usersSetOut = new Set(acc.out[playerOutData.web_name]?.users || []);
        usersSetOut.add(userName);
        acc.out[playerOutData.web_name] = {
          photo: playerOutData.photo,
          users: Array.from(usersSetOut)
        };
      }

      return acc;
    }, { in: {}, out: {} } as AccType);

    const transferedIn = Object.entries(transferCount.in).sort((a, b) => b[1].users.length - a[1].users.length);
    const transferedOut = Object.entries(transferCount.out).sort((a, b) => b[1].users.length - a[1].users.length);

    const transfers = InOut === 'In' ? transferedIn : transferedOut;

    return res.status(200).json(transfers);
  } catch (error) {
    console.error('Unexpected error in handler:', error);
    return res.status(500).json({ error: `Unexpected error: ${error}` });
  }
}
