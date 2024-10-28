// pages/api/fetch/getCaptainView/[leagueId].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import {
    getLeague,
    getTransfersFromListOfIds,
    getBootstrapStatic,
    getUserGWData, 
    getPlayerGWDataByPlayerId
  } from '@/lib/utils/FPLFetch';
  
  import {
    getPlayerDataById
  } from '@/lib/utils/FPLHelper';
import { Transfer } from '@/lib/types/FPLTransfer';


  /**
 * Enriches transfer data with additional details such as player names, photos, 
 * and gameweek points.
 * 
 * This function enhances the given user transfer data by fetching additional player 
 * information like their web names, photos, and points for the current gameweek. It handles 
 * cases where players have not played in the current gameweek by looking at the previous gameweek data.
 * 
 * ### Example:
 * ```typescript
 * const enrichedTransfer = await enrichTransfer(userTransfer, staticData, currentGameweek);
 * ```
 * 
 * @param {FPLTransfers} userTransfer - The user transfer data containing basic transfer details.
 * @param {FPLStatic} staticData - Static data of the league, including player information.
 * @param {number} currentGameweek - The current gameweek number.
 * @returns {Promise<UserTransfer>} A promise that resolves to the enriched transfer data.
 * 
 * ### Example Return:
 * ```json
 * {
 *   "element_in": 101,
 *   "element_in_cost": 9.5,
 *   "element_out": 102,
 *   "element_out_cost": 8.0,
 *   "entry": 1234,
 *   "event": 20,
 *   "time": "2024-06-25T14:48:00.000Z",
 *   "element_in_web_name": "Player In",
 *   "element_out_web_name": "Player Out",
 *   "element_in_point": 7,
 *   "element_out_point": 5,
 *   "pointDifference": 2,
 *   "element_in_id": 101,
 *   "element_out_id": 102,
 *   "element_in_photo": "path_to_in_photo",
 *   "element_out_photo": "path_to_out_photo"
 * }
 * ```
 */
const enrichTransfer = async (userTransfer: FPLTransfers, staticData: FPLStatic, currentGameweek: number): Promise<UserTransfer> => {
    try {
        const playerData = staticData?.elements;
        
        // Fetch player data for the elements involved in the transfer
        const elementIn = await getPlayerDataById({ id: userTransfer.element_in, playerData });
        const elementOut = await getPlayerDataById({ id: userTransfer.element_out, playerData });

        // Fetch gameweek data for the elements involved in the transfer
        const elementInGWData = await getPlayerGWDataByPlayerId(userTransfer.element_in, currentGameweek);
        let elementOutGWData = await getPlayerGWDataByPlayerId(userTransfer.element_out, currentGameweek);

        // Handle the case where a player hasn't played in the current gameweek
        if (!elementOutGWData) {
            elementOutGWData = await getPlayerGWDataByPlayerId(userTransfer.element_out, currentGameweek - 1);
            if (elementOutGWData) {
                elementOutGWData.total_points = 0;
            }
        }

        // Calculate the point difference between the transferred in and out players
        const pointDifference = (elementInGWData?.total_points || 0) - (elementOutGWData?.total_points || 0);

        // Update the cost if it's 0, using the current price from the gameweek data
        if (userTransfer.element_in_cost === 0) {
            userTransfer.element_in_cost = elementInGWData?.value || 0;
        }
        if (userTransfer.element_out_cost === 0) {
            userTransfer.element_out_cost = elementOutGWData?.value || 0;
        }

        return {
            ...userTransfer,
            elementIn: elementIn,
            elementOut: elementOut,
            elementInGWData: elementInGWData,
            elementOutGWData: elementOutGWData,
            element_in_web_name: elementIn?.web_name,
            element_out_web_name: elementOut?.web_name,
            element_in_point: elementInGWData?.total_points,
            element_out_point: elementOutGWData?.total_points,
            pointDifference: pointDifference,
            element_in_id: userTransfer.element_in,
            element_out_id: userTransfer.element_out,
            element_in_photo: elementIn?.photo,
            element_out_photo: elementOut?.photo,
        };
    } catch (error) {
        console.error('Error enriching transfer:', error);
        return userTransfer; // Return original transfer data on error
    }
};


/**
 * Generates a list of transfers by comparing the players selected in the current gameweek
 * with those selected in the previous gameweek for a given user.
 * 
 * This function handles special cases where goalkeepers can only be transferred with other goalkeepers.
 * It ensures the number of players transferred in matches the number of players transferred out.
 * 
 * ### Example:
 * ```typescript
 * const transfers = await getTransfersByMatch('1234', currentGWUserData, 20);
 * ```
 * 
 * @param {string} userId - The ID of the user.
 * @param {FPLUserGameweek} currentGWUserData - The user's gameweek data for the current gameweek.
 * @param {number} currentGameweek - The current gameweek number.
 * @returns {Promise<FPLTransfers[]>} A promise that resolves to a list of matched transfers.
 * 
 * ### Example Return:
 * ```json
 * [
 *   {
 *     "element_in": 101,
 *     "element_in_cost": 0,
 *     "element_out": 102,
 *     "element_out_cost": 0,
 *     "entry": 1234,
 *     "event": 20,
 *     "time": "2024-06-25T14:48:00.000Z"
 *   },
 *   ...
 * ]
 * ```
 */
const getTransfersByMatch = async (userId: string, currentGWUserData: FPLUserGameweek, currentGameweek: number): Promise<FPLTransfers[]> => {
    try {
        // Fetch the user's data for the last gameweek
        const lastGWUserData = await getUserGWData(userId, currentGameweek - 1);

        // Map player picks to their elements and positions for both gameweeks
        const lastGWPlayerIds = lastGWUserData?.picks.map(pick => ({ element: pick.element, position: pick.position }));
        const currentGWPlayerIds = currentGWUserData?.picks.map(pick => ({ element: pick.element, position: pick.position }));

        // Identify players transferred in and out
        const inPlayers = currentGWPlayerIds.filter(playerId => !lastGWPlayerIds.some(p => p.element === playerId.element));
        const outPlayers = lastGWPlayerIds.filter(playerId => !currentGWPlayerIds.some(p => p.element === playerId.element));

        // Ensure that the number of in and out players match
        if (inPlayers.length !== outPlayers.length) {
            console.error('Different number of inPlayers and outPlayers');
            return [];
        }

        const matchGWTransfers: FPLTransfers[] = [];

        // Identify and process goalkeeper transfers
        const keeperTransfersIn = inPlayers.filter(player => player.position === 1 || player.position === 12);
        const keeperTransfersOut = outPlayers.filter(player => player.position === 1 || player.position === 12);

        for (let i = 0; i < 2; i++) {
            if (keeperTransfersIn.length > i && keeperTransfersOut.length > i) {
                matchGWTransfers.push({
                    element_in: keeperTransfersIn[i].element,
                    element_in_cost: 0,
                    element_out: keeperTransfersOut[i].element,
                    element_out_cost: 0,
                    entry: parseInt(userId),
                    event: currentGameweek,
                    time: new Date().toISOString(),
                });
            }
        }

        // Identify and process outfield player transfers
        const outfieldTransfersIn = inPlayers.filter(player => player.position !== 1 && player.position !== 12);
        const outfieldTransfersOut = outPlayers.filter(player => player.position !== 1 && player.position !== 12);

        for (let i = 0; i < outfieldTransfersIn.length; i++) {
            matchGWTransfers.push({
                element_in: outfieldTransfersIn[i].element,
                element_in_cost: 0,
                element_out: outfieldTransfersOut[i].element,
                element_out_cost: 0,
                entry: parseInt(userId),
                event: currentGameweek,
                time: new Date().toISOString(),
            });
        }

        return matchGWTransfers;
    } catch (error) {
        console.error('Error getting transfers by match:', error);
        return [];
    }
};

/**
 * API handler to fetch and process captain view data for a given league.
 * 
 * This function retrieves league data, static data, and user gameweek data, then processes
 * and enriches the transfer data for each user in the league for the current gameweek.
 * It handles special cases where users have used chips like 'wildcard' or 'freehit'.
 * 
 * ### Example:
 * ```
 * GET /api/fetch/getCaptainView/1234
 * ```
 * 
 * @param {NextApiRequest} req - The API request object, containing query parameters.
 * @param {string} req.query.leagueId - The ID of the league to fetch data for.
 * @param {NextApiResponse} res - The API response object used to send back the JSON response.
 * @returns {Promise<void>} Sends a JSON response with processed transfer data or an error message.
 * 
 * ### Example Response:
 * ```json
 * [
 *   {
 *     "user_team_name": "Team A",
 *     "user_full_name": "John Doe",
 *     "user_transfer_result": 10,
 *     "event_transfers": 2,
 *     "event_transfers_cost": 4,
 *     "transfers": [...],
 *     "totalTransferResult": 6
 *   },
 *   ...
 * ]
 * ```
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    try {
        const { leagueId } = req.query;
        if (!leagueId) {
            return res.status(400).json({ error: 'League ID is required' });
        }

        // Fetch league data
        const leagueData = await getLeague(leagueId.toString());
        const userIds = leagueData.standings.results.map(result => result.entry);
        
        // Fetch static data
        const staticData = await getBootstrapStatic();
        const currentGameweek = staticData?.events?.find(event => event.is_current)?.id || 1;

        // Fetch user data for the current gameweek
        const userDataPromises = userIds.map(async (userId) => {
            const userData = await getUserGWData(userId, currentGameweek);
            return { ...userData, userId: userId };
        });
        const userData = await Promise.all(userDataPromises);
        

        // Aggregate active chips data
        const allPlayerChips: { userId: string | number | undefined, active_chip: string | null }[] = [];
        userData.forEach((user) => {
            allPlayerChips.push({ userId: user.userId, active_chip: user.active_chip });
        });

        // Fetch transfers for all users in the league
        const allTransfers = await getTransfersFromListOfIds(userIds);
        const gwTransfers = allTransfers.filter((transfer) => transfer.event === currentGameweek);

        // Enrich transfer data
        const enrichedGWTransfers: UserTransfer[] = (await Promise.all(allPlayerChips.map(async (userChips) => {
            if (userChips.active_chip === 'wildcard' || userChips.active_chip === 'freehit') {
                const currentGWUserData = userData.find(user => user.userId?.toString() === userChips.userId?.toString());
                if (!currentGWUserData) {
                    console.error(`User data not found for user ID: ${userChips.userId}`);
                    return [];
                }
                const transferMatch = await getTransfersByMatch(userChips.userId?.toString() || "", currentGWUserData, currentGameweek);
                const enrichedTransfers = await Promise.all(transferMatch.map(transfer => enrichTransfer(transfer, staticData, currentGameweek)));
                return enrichedTransfers;
            } else {
                const userGWTransfer = gwTransfers.filter((transfer) => transfer?.entry === userChips.userId);
                const enrichedTransfers = await Promise.all(userGWTransfer.map(transfer => enrichTransfer(transfer, staticData, currentGameweek)));
                return enrichedTransfers;
            }
        }))).flat();

        // Prepare the final response data
        const transfersData = await Promise.all(userIds.map(async (userId) => {
            const userGwData = userData.find(user => user.userId === userId);
            if (!userGwData) {
                console.error(`User GW data not found for user ID: ${userId}`);
                return null;
            }
            const userTransfers = enrichedGWTransfers.filter((transfer) => transfer?.entry === userId);
            const leagueUser = leagueData.standings.results.find(result => result.entry === userId);

            const totalTransferResult = userTransfers.reduce((total, transfer) => {
                const pointDifference = transfer?.pointDifference ?? 0;
                return total + pointDifference;
            }, 0) - (userGwData?.entry_history?.event_transfers_cost ?? 0);

            return {
                user_team_name: leagueUser?.entry_name,
                user_full_name: leagueUser?.player_name,
                user_transfer_result: totalTransferResult,
                event_transfers: userGwData?.entry_history?.event_transfers,
                event_transfers_cost: userGwData?.entry_history?.event_transfers_cost,
                transfers: userTransfers,
                totalTransferResult: totalTransferResult,
            };
        }).filter(data => data !== null));
        
        return res.status(200).json(transfersData);
    } catch (error) {
        console.error('Error in handler:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
