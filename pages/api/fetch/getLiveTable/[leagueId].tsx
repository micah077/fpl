import { NextApiRequest, NextApiResponse } from 'next';
import { getLeague, getBootstrapStatic, getUserGWData, getManagersByUserIds, getGWEvents, getGWFixtures, getCountryImg, getTeamBadgeFromClubId } from '@/lib/utils/FPLFetch';
import { getPlayerDataById, calculateLivePointsFromGWEvents, getBPSScoreForFixtures, getPlayersAndBonusPoints } from '@/lib/utils/FPLHelper';
import { Element } from '@/lib/types/FPLStatic';
import { log } from 'console';
import { Result } from '@/lib/types/FPLLeague';
import { EventElement } from '@/lib/types/FPLEvents';

type ManagerData = {
    managerData: Result;
    managerGWData: FPLUserGameweek;
    userId: number;
    gwPoints: number;
    totalPoints: number;
    userBonusPlayers: { player: Element | undefined; playerId: number; value: number; }[];
    numberOfPlayersStarted: number;
    userGWEvents: EventElement[];
}

interface BonusScores {
    fixtureId: number;
    bonusScores: { playerId: number; value: number }[];
}

/**
 * Optimized API handler to fetch and process manager data for a given league.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { leagueId } = req.query;
        if (!leagueId) {
            return res.status(400).json({ error: 'leagueId is required' });
        }

        const [leagueData, staticData] = await Promise.all([
            getLeague(leagueId.toString()).catch(err => {
                console.error(`Error fetching league data for leagueId ${leagueId}:`, err);
                throw new Error('Error fetching league data');
            }),
            getBootstrapStatic().catch(err => {
                console.error('Error fetching static data:', err);
                throw new Error('Error fetching static data');
            })
        ]);

        const userIds = leagueData.standings.results.map(result => result.entry);
        const currentGameweek = staticData?.events?.find(event => event.is_current)?.id || 1;

        const [gwEvents, gwFixtures, managerInsights] = await Promise.all([
            getGWEvents(currentGameweek.toString()),
            getGWFixtures(currentGameweek.toString()),
            getManagersByUserIds(userIds)
        ]);

        const enrichedManagerInsights = managerInsights.map(manager => ({
            ...manager,
            countryImgSrc: getCountryImg(manager.player_region_iso_code_short.toString()),
            favourite_team_badge: getTeamBadgeFromClubId(Number(manager.favourite_team), staticData)
        }));

        const gwBPS = getBPSScoreForFixtures(gwFixtures);

        const gwBonusPoints = await Promise.all(gwFixtures.map(async fixture => {
            const gwFixtureBonusPoint = getPlayersAndBonusPoints(gwBPS, fixture.id);
            return gwFixtureBonusPoint as BonusScores;
        }));


        // fixed enrichedBonusScoresArray some bonusScores were null that's why it was crashing
        const enrichedBonusScoresArray = gwBonusPoints
            .filter(bonusScores => bonusScores !== null)
            .map(bonusScores =>
                bonusScores.bonusScores.map(score => ({
                    ...score,
                    player: staticData.elements.find(player => player.id === score.playerId),
                }))
            );



        const managerDataPromises = userIds.map(async userId => {
            const userGWdata = await getUserGWData(userId.toString(), currentGameweek.toString());

            const userGWEvents = gwEvents.elements.filter(event =>
                userGWdata.picks.map(pick => pick.element).includes(event.id)
            );

            const userPoints = await calculateLivePointsFromGWEvents(gwEvents, userGWdata, gwFixtures, staticData);
            const totalPoints = userGWdata.entry_history.total_points - userGWdata.entry_history.points + userPoints;

            const userBonusPlayers = enrichedBonusScoresArray.flat().filter(score =>
                userGWdata.picks.map(pick => pick.element).includes(score.playerId)
            );

            const playersStarted = userGWEvents.filter(event => {
                if (!event.explain || event.explain.length === 0) {
                    return false; 
                }

                const explainData = event.explain[0];

                const userGWDataStarting = userGWdata.picks.filter(pick =>
                    pick?.element === event.id && pick.position <= 11
                );

                const minutes = explainData.stats?.find(stat => stat.identifier === 'minutes');

                const fixtureStarted = gwBonusPoints.find(bonusPoint => bonusPoint?.fixtureId === explainData.fixture);

                return userGWDataStarting.length > 0 && fixtureStarted && minutes?.value !== 0;
            });

            const numberOfPlayersStarted = playersStarted.length;

            return {
                userGWEvents,
                managerData: leagueData.standings.results.find(manager => manager.entry === userId) as Result,
                userId,
                gwPoints: userPoints,
                totalPoints,
                managerGWData: userGWdata,
                userBonusPlayers,
                numberOfPlayersStarted
            };
        });

        const managerData = await Promise.all(managerDataPromises);

        const result = {
            managerData,
            gwEvents,
            gwFixtures,
            gwBonusPoints,
            currentGameweek,
            leagueData,
            staticData,
            enrichedManagerInsights
        };

        return res.status(200).json(result);

    } catch (error: any) {
        console.error('Unexpected error in handler:', error);
        return res.status(500).json({ error: `Unexpected error: ${error.message}` });
    }
}
