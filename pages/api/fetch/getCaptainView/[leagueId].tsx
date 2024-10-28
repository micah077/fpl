// pages/api/fetch/getCaptainView/[leagueId].ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { getLeague, getBootstrapStatic, getUserGWData, getPlayerGWDataByPlayerId, getImageLink } from '@/lib/utils/FPLFetch';
import { Result } from '@/lib/types/FPLLeague';
import { FPLHistory } from '@/lib/types/FPLPlayerHistory';
import { Element } from '@/lib/types/FPLStatic';

interface CaptainPicksPerGW {
    userId: number;
    userName: string | undefined;
    captainId: number;
    captainName: string | undefined;
    captainPhoto: string | undefined;
    captainPoints: number;
    gw: number;
    teamCode: number;
    team: number;
    managerLeagueData: Result;
    userGWData: FPLUserGameweek;
    captainData: FPLHistory;
    playerElement: Element;
}


interface CaptainPicksType {
    playerId: number;
    playerName: string;
    timesPicked: number;
    userIds: number[];
    userNames: string[];
    captainPoints: number;
    captainPhoto: string;
    teamCode: number;
    team: number;
    managerLeagueData: Result[];
    playerData: FPLHistory;
    playerElement: Element;

}

/**
 * API handler to fetch and process captain picks for a given league.
 *
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 * @returns A JSON response containing captain picks data.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { leagueId } = req.query;
        if (!leagueId) {
            return res.status(400).json({ error: 'leagueId is required' });
        }

        let leagueData;
        try {
            leagueData = await getLeague(leagueId.toString());
        } catch (error) {
            console.error(`Error fetching league data for leagueId ${leagueId}:`, error);
            return res.status(500).json({ error: `Error fetching league data: ${error}` });
        }

        const userIds = leagueData.standings.results.map(result => result.entry);

        let staticData;
        try {
            staticData = await getBootstrapStatic();
        } catch (error) {
            console.error('Error fetching static data:', error);
            return res.status(500).json({ error: `Error fetching static data: ${error}` });
        }

        const currentGameweek = staticData?.events?.find(event => event.is_current)?.id || 1;
        const captainPicksPerGW: CaptainPicksPerGW[] = [];

        for (let gw = currentGameweek; gw <= currentGameweek; gw++) {
            const captainPicksPromise = userIds.map(async (userId) => {
                try {
                    const userGWData = await getUserGWData(userId, gw);
                    const captainId = userGWData?.picks.find(pick => pick.is_captain)?.element || 0;

                    let captainData;
                    try {
                        captainData = await getPlayerGWDataByPlayerId(captainId, gw);
                    } catch (error) {
                        console.error(`Error fetching captain data for player ${captainId} in GW ${gw}:`, error);
                        return null;
                    }

                    const captainPoints = captainData?.total_points || 0;
                    const userName = leagueData.standings.results.find(result => result.entry === userId)?.player_name;
                    const captainElement = staticData.elements.find(player => player.id === captainId);
                    const captainName = captainElement ? `${captainElement.first_name} ${captainElement.second_name}` : undefined;
                    const captainPhoto = captainElement ? getImageLink(captainElement.photo) : undefined;
                    const teamCode = captainElement ? captainElement.team_code : 0;
                    const team = captainElement ? captainElement.team : 0;
                    const managerLeagueData = leagueData.standings.results.find(result => result.entry === userId);

                    return {
                        userId,
                        userName,
                        captainId,
                        captainName,
                        captainPhoto,
                        captainPoints,
                        gw,
                        teamCode,
                        team, 
                        managerLeagueData,
                        userGWData, 
                        captainData
                    };
                } catch (error) {
                    console.error(`Error fetching data for user ${userId} in GW ${gw}:`, error);
                    return null;
                }
            });

            const captainPicksData = await Promise.all(captainPicksPromise);
            captainPicksPerGW.push(...captainPicksData.filter(Boolean) as CaptainPicksPerGW[]);
        }

        captainPicksPerGW.sort((a, b) => b.captainPoints - a.captainPoints);
        

        const captainPicks: CaptainPicksType[] = [];
        captainPicksPerGW.forEach(captainPick => {
            const playerIndex = captainPicks.findIndex(player => player.playerId === captainPick.captainId);
            if (playerIndex === -1) {
                captainPicks.push({
                    playerId: captainPick.captainId,
                    playerName: captainPick.captainName || '',
                    timesPicked: 1,
                    userIds: [captainPick.userId],
                    userNames: [captainPick.userName || ''],
                    captainPoints: captainPick.captainPoints,
                    captainPhoto: captainPick.captainPhoto || '',
                    teamCode: captainPick.teamCode,
                    team: captainPick.team, 
                    managerLeagueData: [captainPick.managerLeagueData] , 
                    playerData: captainPick.captainData,
                    playerElement: staticData.elements.find(player => player.id === captainPick.captainId) as Element
                });
            } else {
                captainPicks[playerIndex].timesPicked++;
                captainPicks[playerIndex].userIds.push(captainPick.userId);
                captainPicks[playerIndex].userNames.push(captainPick.userName || '');
                captainPicks[playerIndex].captainPoints = captainPick.captainPoints;
                captainPicks[playerIndex].captainPhoto = captainPick.captainPhoto || '';
                captainPicks[playerIndex].managerLeagueData.push(captainPick.managerLeagueData);
            }
        });

        return res.status(200).json(captainPicks);
    } catch (error) {
        console.error('Unexpected error in handler:', error);
        return res.status(500).json({ error: `Unexpected error: ${error}` });
    }
}
