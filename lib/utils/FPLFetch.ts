import { log } from "console";
import { FPLHistory, PlayerHistory } from "../types/FPLPlayerHistory";

// Constants
const REVALIDATION = 60 * 60; // seconds
const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';
const FPL_IMG_BASE_URL = 'https://resources.premierleague.com/premierleague/photos/players/250x250/p';

/**
 * Fetches FPL bootstrap static data.
 * @returns {Promise<FPLBootstrapStatic>} The FPL bootstrap static data.
 */
export async function getBootstrapStatic(): Promise<FPLStatic> {
  const res = await fetch(`${FPL_BASE_URL}/bootstrap-static/`, {
    next: { revalidate: REVALIDATION },
  });
  const data = (await res.json()) as FPLStatic;
  return data;
}

/**
 * Fetches the current gameweek.
 * @returns {Promise<number | undefined>} The current gameweek number.
 */
export async function getCurrentGameweek(): Promise<number | undefined> {
  const res = await fetch(`${FPL_BASE_URL}/bootstrap-static/`, {
    next: { revalidate: REVALIDATION },
  });
  const data = (await res.json()) as FPLStatic;
  const currentGameweekObject = data.events.find(event => event.is_current);
  return currentGameweekObject?.id;
}

/**
 * Fetches FPL manager data by ID.
 * @param {number | string} id - The manager's ID.
 * @returns {Promise<FPLManager | null>} The FPL manager data.
 */
export async function getManager(id: string): Promise<FPLManager | null> {
  try {
    const res = await fetch(`${FPL_BASE_URL}/entry/${id}/`, {
      next: { revalidate: REVALIDATION },
    });
    if (!res.ok) {
      throw new Error(`Error fetching manager data for ID: ${id}`);
    }
    const data = await res.json() as FPLManager;
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

/**
 * Fetches FPL league standings by ID.
 * @param {number | string} id - The league's ID.
 * @returns {Promise<FPLLeague>} The FPL league standings data.
 */
export async function getLeague(id: number | string): Promise<FPLLeague> {
  try {
    const res = await fetch(`${FPL_BASE_URL}/leagues-classic/${id}/standings`, {
      next: { revalidate: REVALIDATION },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch league data for league ID ${id}: ${text}`);
    }

    return await res.json() as FPLLeague;
  } catch (error) {
    console.error(`Error fetching league data for league ID ${id}:`, error);
    throw new Error('Error fetching league data');
  }
}

/**
 * Fetches transfers data for a list of user IDs.
 * @param {string[] | number[]} userIds - An array of user IDs.
 * @returns {Promise<FPLTransfers[]>} An array of transfer data for each user.
 */
export async function getTransfersFromListOfIds(userIds: string[] | number[]): Promise<FPLTransfers[]> {
  const transfers: FPLTransfers[] = [];

  for (const id of userIds) {
    try {
      const url = `${FPL_BASE_URL}/entry/${id}/transfers`;
      const res = await fetch(url, {
        next: { revalidate: REVALIDATION },
      });

      if (!res.ok) {
        const text = await res.text(); // Read the response body as text
        throw new Error(`Failed to fetch transfers for user ID ${id}: ${text}`);
      }

      const data = await res.json() as FPLTransfers[];
      transfers.push(...data);
    } catch (error) {
      console.error(`Error fetching transfers for user ID ${id}:`, error);
      // Skip this user's transfers and continue with the next user
    }
  }

  return transfers;
}

/**
 * Fetches player gameweek data by player ID and gameweek.
 * @param {number | string} id - The player's ID.
 * @param {number | string} gw - The gameweek number.
 * @returns {Promise<History>} The player's gameweek data.
 */
export async function getPlayerGWDataByPlayerId(id: number | string, gw: number | string): Promise<FPLHistory | null> {
  try {
    console.log(id,'id')
    const res = await fetch(`${FPL_BASE_URL}/element-summary/${id}/`, {
      next: { revalidate: REVALIDATION },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch player gameweek data for player ID ${id} and gameweek ${gw}: ${text}`);
    }

    const data = (await res.json()) as FPLPlayerHistory;

    const gameweekData = data.history.find(data => data.round == Number(gw) && data.element == id);

    if (!gameweekData) {
      console.log(gameweekData,'gameweekData')
      console.log(`Gameweek data not found for player ID ${id} and gameweek ${gw}`)
      return null; 
      // throw new Error(`Gameweek data not found for player ID ${id} and gameweek ${gw}`);
    }

    return gameweekData;
  } catch (error) {
    console.error(`Error fetching player gameweek data for player ID ${id} and gameweek ${gw}:`, error);
    throw new Error('Error fetching player gameweek data');
  }
}

/**
 * Fetches user gameweek data by player ID and gameweek.
 * @param {number | string} playerId - The player's ID.
 * @param {number | string} gw - The gameweek number.
 * @returns {Promise<UserGw>} The user's gameweek data.
 */
export async function getUserGWData(playerId: number | string, gw: number | string): Promise<FPLUserGameweek> {
  try {
    const res = await fetch(`${FPL_BASE_URL}/entry/${playerId}/event/${gw}/picks`, {
      next: { revalidate: REVALIDATION },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch user gameweek data for player ID ${playerId} and gameweek ${gw}: ${text}`);
    }

    return await res.json() as FPLUserGameweek;
  } catch (error) {
    console.error(`Error fetching user gameweek data for player ID ${playerId} and gameweek ${gw}:`, error);
    throw new Error('Error fetching user gameweek data');
  }
}

/**
 * Constructs and returns the image link for a player by image ID.
 * @param {string} imgId - The image ID.
 * @returns {string} The full image URL.
 */
export function getImageLink(imgId?: string): string {

  if (!imgId) {
    return '/player-loading.svg';
  }
  const imgPrefix = imgId?.slice(0, -3);
  const fullImgUrl = `${FPL_IMG_BASE_URL}${imgPrefix}png`;
  return fullImgUrl;
}

/**
 * Constructs and returns the team badge URL by team code.
 * @param {number} teamCode - The team code.
 * @returns {string} The full team badge URL.
 */
export function getTeamBadge(teamCode: number): string {
  return `https://resources.premierleague.com/premierleague/badges/100/t${teamCode}.png`;
}

export function getTeamBadgeFromClubId(clubId: number, staticData: FPLStatic): string {
  const teamCode = staticData.teams.find(team => team.id === clubId)?.code;
  return `https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png`;
}


export function getCountryImg(countryCode: string): string {
  return `https://fantasy.premierleague.com/img/flags/${countryCode}.gif`;
}

/**
 * Fetches gameweek events data by gameweek.
 * @param {number | string} gw - The gameweek number.
 * @returns {Promise<FPLEvents>} The gameweek events data.
 */
export async function getGWEvents(gw: number | string): Promise<FPLEvents> {
  try {
    const res = await fetch(`${FPL_BASE_URL}/event/${gw}/live`, {
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch gameweek events data for gameweek ${gw}: ${text}`);
    }

    return await res.json() as FPLEvents;
  } catch (error) {
    console.error(`Error fetching gameweek events data for gameweek ${gw}:`, error);
    throw new Error('Error fetching gameweek events data');
  }
}

/**
 * Fetches fixtures data.
 * @returns {Promise<FPLFixtures[]>} The fixtures data.
 */
export async function getFixtures(): Promise<FPLFixtures[]> {
  try {
    const res = await fetch(`${FPL_BASE_URL}/fixtures`, {
      next: { revalidate: REVALIDATION },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch fixtures data: ${text}`);
    }

    return await res.json() as FPLFixtures[];
  } catch (error) {
    console.error('Error fetching fixtures data:', error);
    throw new Error('Error fetching fixtures data');
  }
}

/**
 * Fetches fixtures data for a specific gameweek.
 * @param {number | string} gw - The gameweek number.
 * @returns {Promise<FPLFixtures[]>} The fixtures data.
 */
export async function getGWFixtures(gw: number | string): Promise<FPLFixtures[]> {
  try {
    const res = await fetch(`${FPL_BASE_URL}/fixtures/?event=${gw}`, {
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch fixtures data for gameweek ${gw}: ${text}`);
    }

    return await res.json() as FPLFixtures[];
  } catch (error) {
    console.error(`Error fetching fixtures data for gameweek ${gw}:`, error);
    throw new Error('Error fetching fixtures data');
  }
}

/**
 * Fetches manager data for a list of user IDs sequentially.
 * 
 * This function retrieves manager data for each user ID in the provided list, processing each request sequentially
 * to ensure that all requests are handled one after the other. It handles errors by logging them and continuing
 * to the next ID.
 * 
 * ### Example:
 * ```typescript
 * const managers = await getManagersByUserIds([1, 2, 3]);
 * ```
 * 
 * @param {string[] | number[]} userIds - An array of user IDs for which to fetch manager data.
 * @returns {Promise<FPLManager[]>} A promise that resolves to an array of manager data, excluding any failed requests.
 * 
 * ### Example Return:
 * ```json
 * [
 *   {
 *     "id": 1,
 *     "player_first_name": "John",
 *     "player_last_name": "Doe",
 *     ...
 *   },
 *   ...
 * ]
 * ```
 */
export async function getManagersByUserIds(userIds: string[] | number[]): Promise<FPLManager[]> {
  const managers: FPLManager[] = [];

  for (const id of userIds) {
    try {
      const url = `${FPL_BASE_URL}/entry/${id}/`;
      const res = await fetch(url, {
        next: { revalidate: REVALIDATION },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch manager data for user ID ${id}: ${text}`);
      }

      const managerData = await res.json() as FPLManager;
      managers.push(managerData);
    } catch (error) {
      console.error(`Error fetching manager data for user ID ${id}:`, error);
    }
  }

  return managers;
}
