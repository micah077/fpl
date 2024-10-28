import { useScrollTrigger } from '@mui/material';
import { EventElement, Events } from '../types/FPLEvents';
import { use } from 'react';
import { getCurrentGameweek, getGWFixtures } from './FPLFetch';
import { log } from 'console';
import { A } from '../types/FPLFixtures';
import { Element } from '../types/FPLStatic';

interface FPLFixturesBPS {
  fixtureId: number;
  bpsScores: A[];
  topBonusPointScore: number;
  secondBonusPointScore: number;
  thirdBonusPointScore: number;
}

interface BonusScores {
  fixtureId: number;
  bonusScores: {
    playerId: number;
    value: number;
  }[];
}


export async function getPlayerDataById ({ id, playerData }: { id: number | string, playerData: FPLStatic['elements'] }){
    const player = playerData.find(player => player.id === id);
    return player ? player : null;
}
/**
 * Retries a given async function with exponential backoff.
 * @param {Function} fn - The async function to retry.
 * @param {number} retries - The number of retry attempts.
 * @param {number} delay - The initial delay between retries in milliseconds.
 * @returns {Promise<any>} The result of the async function.
 */
export async function retryWithBackoff(fn: () => Promise<any>, retries: number, delay: number): Promise<any> {
    try {
      return await fn();
    } catch (error: unknown) {
      if (retries === 0) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Retrying after error: ${errorMessage}. Retries left: ${retries}`);
      if (errorMessage.includes('429')) {
        // Apply exponential backoff for 429 errors
        await new Promise(res => setTimeout(res, delay));
        return retryWithBackoff(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  export function getPlayersAndBonusPoints(bpsScoresPerFixture: FPLFixturesBPS[], fixtureId: number): BonusScores | null {
    const fixtureData = bpsScoresPerFixture.find(fixture => fixture.fixtureId === fixtureId);
    if (!fixtureData) return null; // Handle case where fixture data isn't found

    // Sort the BPS scores in descending order
    const sortedScores = fixtureData.bpsScores.sort((a, b) => b.value - a.value);

    const bonusScores: { playerId: number; value: number }[] = [];
  
    // Determine the highest, second-highest, and third-highest scores
    const topScore = sortedScores[0].value;
    const topScorers = sortedScores.filter(player => player.value === topScore);

    // Assign 3 points to all top scorers
    topScorers.forEach(player => bonusScores.push({ playerId: player.element, value: 3 }));

    // If there are still spots left for bonus points
    if (bonusScores.length < 3) {
        const secondScore = sortedScores.find((player, index) => index >= topScorers.length && player.value < topScore)?.value;
        const secondScorers = secondScore !== undefined
            ? sortedScores.filter(player => player.value === secondScore)
            : [];

        if(bonusScores.length === 2) {
          secondScorers.forEach(player => bonusScores.push({ playerId: player.element, value: 1 }));  
        } else {
          // Assign 2 points to second scorers
          secondScorers.forEach(player => bonusScores.push({ playerId: player.element, value: 2 }));
        }
        
        // If there are still spots left for bonus points
        if (bonusScores.length < 3) {
            const thirdScore = sortedScores.find((player, index) => index >= topScorers.length + secondScorers.length && player.value < (secondScore || topScore))?.value;
            const thirdScorers = thirdScore !== undefined
                ? sortedScores.filter(player => player.value === thirdScore)
                : [];

            // Assign 1 point to third scorers
            thirdScorers.forEach(player => bonusScores.push({ playerId: player.element, value: 1 }));
        }
    }

    

    return {
        fixtureId: fixtureId,
        bonusScores: bonusScores
    };
}
export function getBPSScoreForFixtures(gwFixtures: FPLFixtures[]): FPLFixturesBPS[] {
  const bpsScoresPerFixture: FPLFixturesBPS[] = [];


  try {
    gwFixtures.forEach((fixture, index) => {

      const BPSArray: A[] = [];

      //loop through each fixture.stats and add the a, and h, values to a separate array that is flat. 
      fixture.stats.forEach(stat => {
        if (stat.identifier === 'bps') {
          // loop through stat.h and stat.a and add to BPSArray
          stat.h.forEach(stat => {
            BPSArray.push(stat);
          });
          stat.a.forEach(stat => {
            BPSArray.push(stat);
          });
        }
      });

      
      if (BPSArray.length !== 0) {
        bpsScoresPerFixture.push({ fixtureId: fixture.id, bpsScores: BPSArray, topBonusPointScore: BPSArray[0].value, secondBonusPointScore: BPSArray[1].value, thirdBonusPointScore: BPSArray[2].value });
      }

      
    });

  } catch (error) {
    console.error("Error in getBPSScoreForFixtures:", error);
    throw error;
  }

  return bpsScoresPerFixture;
} 

export async function calculateLiveBonusPointsForUser(userGWData: FPLUserGameweek, events: Events, gwFixtures: FPLFixtures[], staticData: FPLStatic): 
Promise<{ userBonusPoints: number, enrichedBonusScores: { player: Element | undefined; playerId: number; value: number;}[]}> {
  // loop through the picks again and create a key-value relationship with fixture as key and list of playerIds as value
  
  const playerFixtureMap: Record<number, number[]> = {};
  userGWData.picks.forEach(pick => {
    const playerEvents = events.elements.find(event => event.id === pick.element);
    if (playerEvents) {
    playerEvents.explain.forEach(fixture => {
      const { fixture: fixtureId } = fixture;
      if (playerFixtureMap[fixtureId]) {
      playerFixtureMap[fixtureId].push(pick.element);
      } else {
      playerFixtureMap[fixtureId] = [pick.element];
      }
    });
    }
  });

const bpsScoresPerFixture = getBPSScoreForFixtures(gwFixtures);



// set up array to include all bonus array, with enriched data
const enrichedBonusScoresArray: { player: Element | undefined; playerId: number; value: number; }[][] = [];

// for each player in playerFixtureMap, calculate the users bonus-points
const userBonusPoints = Object.entries(playerFixtureMap).reduce((acc, [fixtureId, playerIds]) => {
  const bonusPoints = playerIds.reduce((totalBonusPoints, playerId) => {
    const bonusScores = getPlayersAndBonusPoints(bpsScoresPerFixture, Number(fixtureId));

    // Add insights about the elements that has bonus points
    const enrichedBonusScores = bonusScores?.bonusScores.map(score => {
      const player = staticData.elements.find(player => player.id === score.playerId);
      return {
        ...score,
        player: player,
      };
    });

    enrichedBonusScores && enrichedBonusScoresArray.push(enrichedBonusScores);
    


    
    const playerBonusPoints = bonusScores?.bonusScores.find(score => score.playerId === playerId)?.value || 0;
    const playerBonusPointsMultiplied = (playerBonusPoints * (userGWData?.picks?.find(pick => pick.element === playerId)?.multiplier ?? 1));
    return totalBonusPoints + playerBonusPointsMultiplied;
  }, 0);
  return acc + bonusPoints;
}, 0);
  const result = {
    userBonusPoints: userBonusPoints,
    enrichedBonusScores: enrichedBonusScoresArray.flat(),
  };

return result;

}

export async function calculateLivePointsFromGWEvents(events: Events, userGWData: FPLUserGameweek, gwFixtures: FPLFixtures[], staticData: FPLStatic ): Promise<number> {


  // loop through each pick in the userGWData and calculate the points per player from events. 
  const userPoints = userGWData.picks.reduce((acc, pick) => {
    if(pick.position < 12) {
      const playerEvents = events.elements.find(event => event.id === pick.element);

    
      if (!playerEvents) return acc;
    
      const points = playerEvents.explain.reduce((fixtureAcc, fixture) => {
        
        const pointsPerFixture: number = fixture.stats.reduce((statAcc, stat) => {
            if(stat.identifier.toString()  === 'bonus') {
              return statAcc; 

            } else {
              return statAcc + (stat.points * pick.multiplier);
            }

        }, 0); // Initial value for statAcc
        return fixtureAcc + pointsPerFixture;
      }, 0); // Initial value for fixtureAcc
    
      return acc + points;
    } else {
      return acc;
    }
    
  }, 0); //

  const calculateBonusPointsForUser = await calculateLiveBonusPointsForUser(userGWData, events, gwFixtures, staticData);
  const userBonusPoints = calculateBonusPointsForUser.userBonusPoints;
  const fullUserPoints = calculateBonusPointsForUser.userBonusPoints + userPoints
  

  return fullUserPoints;
  
} 


export function calculateLiveGWPointsForPlayer(events: Events, playerId: number ): number {
  const playerEvents = events.elements.find(event => event.id === playerId);

  if (!playerEvents) return 0;
  const points = playerEvents.explain.reduce((acc, fixture) => {
    return acc + fixture.stats.reduce((statAcc, stat) => {
      return statAcc + stat.points;
    }, 0);
  }, 0);
  return points;
 }