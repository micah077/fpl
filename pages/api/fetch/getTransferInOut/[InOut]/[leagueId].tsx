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

// Fetch all player data concurrently for both transfers

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.time("API RESPONSE TRANSFER");

    const { leagueId, InOut } = req.query;
    const numberOfGameweeks = 3;

    if (!leagueId || !InOut) {
      return res.status(400).json({ error: 'Missing leagueId or InOut parameter' });
    }

    // Fetch leagueData first since it's required for userIds
    const leagueData: FPLLeague = await retryWithBackoff(() => getLeague(leagueId.toString()), 3, 1000).catch((error: Error) => {
      console.error(`Error fetching league data for league ID ${leagueId}:`, error);
      throw new Error('Error fetching league data. Please check the league ID and try again.');
    });

    // Extract userIds from the league data
    const userIds = leagueData.standings.results.map(result => result.entry);

    // Fetch all other data concurrently, using the userIds obtained from leagueData
    const [staticData, userTransfers, managersData] = await Promise.all([
      retryWithBackoff(getBootstrapStatic, 3, 1000),
      retryWithBackoff(() => getTransfersFromListOfIds(userIds), 3, 1000),
      retryWithBackoff(() => getManagersByUserIds(userIds), 3, 1000),
    ]).catch((error: Error) => {
      console.error('Error fetching required data:', error);
      throw new Error('Error fetching required data. Please try again later.');
    });

    const currentGameweek = staticData?.events?.find((event:any) => event.is_current)?.id || 1;
    const userTransfersPerGW = userTransfers.filter((transfer: Transfer) => transfer.event >= currentGameweek - numberOfGameweeks + 1 && transfer.event <= currentGameweek);

    // Handle the transfer logic (remaining part of the code)
    const allPlayerData = await fetchAllPlayerData(userTransfersPerGW, staticData);

    const transferCount = userTransfersPerGW.reduce((acc: AccType, transfer: Transfer) => {
      const playerInData = allPlayerData[transfer.element_in];
      const playerOutData = allPlayerData[transfer.element_out];
      const manager = managersData.find((manager:any) => manager.id === transfer.entry);
      const userName = manager ? `${manager.player_first_name} ${manager.player_last_name}` : 'Unknown User';

      if (playerInData?.web_name) {
        if (!acc.in[playerInData.web_name]) {
          acc.in[playerInData.web_name] = { photo: playerInData.photo, users: [] };
        }
        acc.in[playerInData.web_name].users.push(userName);
      }

      if (playerOutData?.web_name) {
        if (!acc.out[playerOutData.web_name]) {
          acc.out[playerOutData.web_name] = { photo: playerOutData.photo, users: [] };
        }
        acc.out[playerOutData.web_name].users.push(userName);
      }

      return acc;
    }, { in: {}, out: {} });

    const transferedIn = Object.entries(transferCount.in).sort((a:any, b:any) => b[1].users.length - a[1].users.length);
    const transferedOut = Object.entries(transferCount.out).sort((a:any, b:any) => b[1].users.length - a[1].users.length);

    const transfers = InOut === 'In' ? transferedIn : transferedOut;

    console.timeEnd("API RESPONSE TRANSFER");

    return res.status(200).json(transfers);
  } catch (error:any) {
    console.error('Unexpected error in handler:', error);
    return res.status(500).json({ error: `Unexpected error: ${error.message}` });
  }
}

// The function `fetchAllPlayerData` should also be implemented, this is just an example
const fetchAllPlayerData = async (transfers: Transfer[], staticData: FPLStatic): Promise<{ [key: number]: PlayerData }> => {
  const playerIds = new Set<number>(transfers.flatMap(transfer => [transfer.element_in, transfer.element_out]));
  const playerDataMap: { [key: number]: PlayerData } = {};

  await Promise.all(
    Array.from(playerIds).map(async (playerId) => {
      try {
        const playerInfo = await getPlayerDataById({ id: playerId, playerData: staticData.elements });
        if (playerInfo) {
          playerDataMap[playerId] = playerInfo;
        }
      } catch (error) {
        console.error(`Error fetching player data for player ID ${playerId}:`, error);
      }
    })
  );

  return playerDataMap;
};
