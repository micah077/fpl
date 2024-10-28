import { NextApiRequest, NextApiResponse } from 'next';
import { getLeague, getBootstrapStatic, getUserGWData, getManagersByUserIds, getGWEvents, getGWFixtures, getCountryImg, getTeamBadgeFromClubId } from '@/lib/utils/FPLFetch';
import { getPlayerDataById, calculateLivePointsFromGWEvents, getBPSScoreForFixtures, getPlayersAndBonusPoints } from '@/lib/utils/FPLHelper';
import { Element } from '@/lib/types/FPLStatic';
import { log } from 'console';
import { Result } from '@/lib/types/FPLLeague';
import { EventElement } from '@/lib/types/FPLEvents';



type ManagerData ={
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
    bonusScores: {
      playerId: number;
      value: number;
    }[];
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
        const { leagueId} = req.query;
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
        const leagueManagers: Result[] = leagueData.standings.results;

        let staticData;
        try {
            staticData = await getBootstrapStatic();
        } catch (error) {
            console.error('Error fetching static data:', error);
            return res.status(500).json({ error: `Error fetching static data: ${error}` });
        }
        

        const currentGameweek = staticData?.events?.find(event => event.is_current)?.id || 1;
        const gwEvents = await getGWEvents(currentGameweek.toString());

        const gwFixtures = await getGWFixtures(currentGameweek.toString());

        const managerInsights = await getManagersByUserIds(userIds);

        const enrichedManagerInsights = managerInsights.map(manager => {
            // get the teamBadge based on the favorite team
            const teamBadge = getTeamBadgeFromClubId(Number(manager.favourite_team), staticData);
            const managerTeamBadge = getCountryImg(manager.player_region_iso_code_short.toString());
            return {
                ...manager,
                countryImgSrc: managerTeamBadge, 
                favourite_team_badge: teamBadge,
            }

        });
        
        const gwBPS = getBPSScoreForFixtures(gwFixtures);

        
            
        const gwBonusPoints: BonusScores[] = [];
        gwFixtures.forEach(fixture => {
            const gwFixtureBonusPoint = getPlayersAndBonusPoints(gwBPS, fixture.id);
            gwBonusPoints.push(gwFixtureBonusPoint as BonusScores);
        }); 

        
        // enrich gwBonusPoints with player data
        const enrichedBonusScoresArray: { player: Element | undefined; playerId: number; value: number; }[][] = [];
        gwBonusPoints.forEach(bonusScores => {
            const enrichedBonusScores = bonusScores?.bonusScores.map(score => {
                const player = staticData.elements.find(player => player.id === score.playerId);
                return {
                    ...score,
                    player: player,
                };
            });
            enrichedBonusScores && enrichedBonusScoresArray.push(enrichedBonusScores);
        });

        
        
        // loop through all userIds, and add the getUserGWdata to the object managerData
        const managerData: ManagerData[] = [];

        for (const userId of userIds) {
            const userGWdata = await getUserGWData(userId.toString(), currentGameweek.toString())
            
            const userPoints = await calculateLivePointsFromGWEvents(gwEvents, userGWdata, gwFixtures, staticData);
            const totalPoints = userGWdata.entry_history.total_points - userGWdata.entry_history.points + userPoints;
            
            
            const userBonusPlayers = enrichedBonusScoresArray.flat().filter(score => userGWdata.picks.map(pick => pick.element).includes(score.playerId));

            // get all the events from picks where the player is in getUserGWData pick
            const userGWEvents = gwEvents.elements.filter(event => userGWdata.picks.map(pick => pick.element).includes(event.id));
            
            // count number of players that has started (where explain.stat is not empty)
            const playersStarted2 = userGWEvents.filter(event => event.explain[0].stats.length > 0);
            const playersStarted3 = userGWEvents.filter((event) => {
                // loop through if Identifier "minutes" is not 0

                const userGWDataStarting = userGWdata.picks.filter(pick => pick.position <= 11);
                const minutes = event.explain[0].stats.find(stat => stat.identifier === 'minutes');
                
                return minutes?.value !== 0;
                
                
            });
            const playersStarted = userGWEvents.filter((event) => {
                // loop through if Identifier "minutes" is not 0

                const userGWDataStarting = userGWdata.picks.filter(pick => {
                    const pickInStarting = pick?.element === event.id && pick.position <= 11;
                    //check if event.explain[0].fixture is in gwBonusPoints - if not, the match has not started. 
                    const fixtureStarted = gwBonusPoints.find(bonusPoint => bonusPoint?.fixtureId === event.explain[0].fixture);
                    return pickInStarting && fixtureStarted;
                });

                return userGWDataStarting.length > 0;
                
                
            });

            const numberOfPlayersStarted = playersStarted.length;
            
            const managerDataObj: ManagerData = {
                userGWEvents: userGWEvents,
                managerData: leagueManagers.find(manager => manager.entry === userId) as Result,
                userId: userId,
                gwPoints: userPoints,
                totalPoints: totalPoints,
                managerGWData: userGWdata,
                userBonusPlayers: userBonusPlayers,
                numberOfPlayersStarted: numberOfPlayersStarted,
            };

            managerData.push(managerDataObj);
        }

        const result = {
            managerData: managerData,
            gwEvents: gwEvents,
            gwFixtures: gwFixtures,
            gwBonusPoints: gwBonusPoints,
            currentGameweek: currentGameweek,
            leagueData: leagueData,
            staticData: staticData,
            enrichedManagerInsights: enrichedManagerInsights,
        }
        

        return res.status(200).json(result);
    } catch (error) {
        console.error('Unexpected error in handler:', error);
        return res.status(500).json({ error: `Unexpected error: ${error}` });
    }
}
