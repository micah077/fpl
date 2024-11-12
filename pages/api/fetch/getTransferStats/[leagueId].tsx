// pages/api/fetch/getCaptainView/[leagueId].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import {
    getLeague,
    getTransfersFromListOfIds,
    getBootstrapStatic,
    getUserGWData, 
    getPlayerGWDataByPlayerId
} from '@/lib/utils/FPLFetch';
import { getPlayerDataById } from '@/lib/utils/FPLHelper';
import { Transfer } from '@/lib/types/FPLTransfer';

const enrichTransfer = async (userTransfer: FPLTransfers, staticData: FPLStatic, currentGameweek: number): Promise<UserTransfer> => {
    try {
        const playerData = staticData?.elements;
        
        const [elementIn, elementOut] = await Promise.all([
            getPlayerDataById({ id: userTransfer.element_in, playerData }),
            getPlayerDataById({ id: userTransfer.element_out, playerData })
        ]);

        let [elementInGWData, elementOutGWData]:any = await Promise.all([
            getPlayerGWDataByPlayerId(userTransfer.element_in, currentGameweek),
            getPlayerGWDataByPlayerId(userTransfer.element_out, currentGameweek)
        ]);

        if (!elementOutGWData) {
            const previousGWData = await getPlayerGWDataByPlayerId(userTransfer.element_out, currentGameweek - 1);
            elementOutGWData = previousGWData ? { ...previousGWData, total_points: 0 } : {};
        }

        const pointDifference = (elementInGWData?.total_points || 0) - (elementOutGWData?.total_points || 0);

        userTransfer.element_in_cost = userTransfer.element_in_cost || elementInGWData?.value || 0;
        userTransfer.element_out_cost = userTransfer.element_out_cost || elementOutGWData?.value || 0;

        return {
            ...userTransfer,
            elementIn,
            elementOut,
            elementInGWData,
            elementOutGWData,
            element_in_web_name: elementIn?.web_name,
            element_out_web_name: elementOut?.web_name,
            element_in_point: elementInGWData?.total_points,
            element_out_point: elementOutGWData?.total_points,
            pointDifference,
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

const getTransfersByMatch = async (userId: string, currentGWUserData: FPLUserGameweek, currentGameweek: number): Promise<FPLTransfers[]> => {
    try {
        const lastGWUserData = await getUserGWData(userId, currentGameweek - 1);

        const lastGWPlayerIds = lastGWUserData?.picks.map(pick => ({ element: pick.element, position: pick.position }));
        const currentGWPlayerIds = currentGWUserData?.picks.map(pick => ({ element: pick.element, position: pick.position }));

        const inPlayers = currentGWPlayerIds.filter(playerId => !lastGWPlayerIds.some(p => p.element === playerId.element));
        const outPlayers = lastGWPlayerIds.filter(playerId => !currentGWPlayerIds.some(p => p.element === playerId.element));

        if (inPlayers.length !== outPlayers.length) {
            console.error('Different number of inPlayers and outPlayers');
            return [];
        }

        const matchGWTransfers: FPLTransfers[] = [];

        const keeperTransfersIn = inPlayers.filter(player => player.position === 1 || player.position === 12);
        const keeperTransfersOut = outPlayers.filter(player => player.position === 1 || player.position === 12);
        
        for (let i = 0; i < Math.max(keeperTransfersIn.length, keeperTransfersOut.length); i++) {
            if (keeperTransfersIn[i] && keeperTransfersOut[i]) {
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

        const outfieldTransfersIn = inPlayers.filter(player => player.position !== 1 && player.position !== 12);
        const outfieldTransfersOut = outPlayers.filter(player => player.position !== 1 && player.position !== 12);

        outfieldTransfersIn.forEach((inPlayer, i) => {
            if (outfieldTransfersOut[i]) {
                matchGWTransfers.push({
                    element_in: inPlayer.element,
                    element_in_cost: 0,
                    element_out: outfieldTransfersOut[i].element,
                    element_out_cost: 0,
                    entry: parseInt(userId),
                    event: currentGameweek,
                    time: new Date().toISOString(),
                });
            }
        });

        return matchGWTransfers;
    } catch (error) {
        console.error('Error getting transfers by match:', error);
        return [];
    }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    try {
        console.time("API RESPONSE STATS");
        const { leagueId } = req.query;
        if (!leagueId) {
            return res.status(400).json({ error: 'League ID is required' });
        }

        const [leagueData, staticData] = await Promise.all([
            getLeague(leagueId.toString()),
            getBootstrapStatic()
        ]);
        const userIds = leagueData.standings.results.map(result => result.entry);
        const currentGameweek = staticData?.events?.find(event => event.is_current)?.id || 1;

        const userData = await Promise.all(userIds.map(async (userId) => {
            const userData = await getUserGWData(userId, currentGameweek);
            return { ...userData, userId };
        }));

        const allTransfers = await getTransfersFromListOfIds(userIds);
        const gwTransfers = allTransfers.filter((transfer) => transfer.event === currentGameweek);

        const enrichedGWTransfers = await Promise.all(userIds.map(async (userId) => {
            const userGWData = userData.find(user => user.userId === userId);
            if (!userGWData) return [];

            const transfers = gwTransfers.filter((transfer) => transfer.entry === userId);
            if (userGWData.active_chip === 'wildcard' || userGWData.active_chip === 'freehit') {
                const transferMatch = await getTransfersByMatch(userId.toString(), userGWData, currentGameweek);
                return Promise.all(transferMatch.map(transfer => enrichTransfer(transfer, staticData, currentGameweek)));
            } else {
                return Promise.all(transfers.map(transfer => enrichTransfer(transfer, staticData, currentGameweek)));
            }
        })).then(results => results.flat());

        const transfersData = await Promise.all(userIds.map(async (userId) => {
            const userGwData = userData.find(user => user.userId === userId);
            if (!userGwData) return null;
            const userTransfers = enrichedGWTransfers.filter((transfer:any) => transfer?.entry === userId);
            const leagueUser = leagueData.standings.results.find(result => result.entry === userId);

            const totalTransferResult = userTransfers.reduce((total:any, transfer:any) => total + (transfer?.pointDifference || 0), 0) - (userGwData?.entry_history?.event_transfers_cost || 0);

            return {
                user_team_name: leagueUser?.entry_name,
                user_full_name: leagueUser?.player_name,
                user_transfer_result: totalTransferResult,
                event_transfers: userGwData?.entry_history?.event_transfers,
                event_transfers_cost: userGwData?.entry_history?.event_transfers_cost,
                transfers: userTransfers,
                totalTransferResult
            };
        }));

        console.timeEnd("API RESPONSE STATS");
        return res.status(200).json(transfersData);
    } catch (error) {
        console.error('Error in handler:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
