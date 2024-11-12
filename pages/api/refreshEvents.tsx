// pages/api/setEvent.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    getUserGWData,
    getGWEvents
  } from '@/lib/utils/FPLFetch';
import { log } from 'console';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { gw } = req.query; // Extract gameweek from query parameters
        const supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase URL or API key not provided');
        }
    
        const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

        // cheack if the request body is empty or undefined
        if (!req.body) {
            throw new Error('No data provided');
        }   
        const { currentGameweek, userIds } = req.body;
        

        // get the IDs of all players all the users in the league has
        //Loop through all userIds, get all the unique playerIds in their team, and add them to a list
        const allPlayerIds: number[] = [];
        await Promise.all(userIds.map(async (userId: number) => {
            const userGWData = await getUserGWData(userId, currentGameweek);
            const playerIds = userGWData.picks.map((pick) => pick.element);

            allPlayerIds.push(...playerIds);
        }));

        // create a set of all playerIds, to get all unique IDs
        const uniquePlayerIds = Array.from(new Set(allPlayerIds));

        // get all events from current gameweek from API
        const gwEvents = await getGWEvents(currentGameweek);

        // create an object for each explain object for each player. The obejct should contain:
        // gw, playerId, Identifier, value, points, fixture, totalPoints
        const playerEvents = gwEvents.elements.flatMap((event) => {
            //only add the explain object if the explain object is not empty. 
            const playerEvents = event.explain.flatMap((explain) => {
                return explain.stats.map((stat) => ({
                    gw: currentGameweek,
                    playerId: event.id,
                    identifier: stat.identifier,
                    value: stat.value,
                    points: stat.points,
                    fixture: explain.fixture,
                    minutes: event.stats.minutes,
                    totalPoints: event.stats.total_points,
                }))
            });
        return playerEvents;
        }); 
        
        // get the current playerEvents from the database to see if something has changed, using getEvent API 
        // from app/pages/api/getEvent/[gw]
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/getEvent/${currentGameweek}`, { cache: 'no-store' });
        
        const databaseEventData: EventDatabase[] = await response.json();
        
        // loop through playerEvents and check if all the events are in the databaseEventData. For the events that are not there
        // add it to missingEvents: an object that contains the missing event
        const missingEvents = playerEvents.filter((playerEvent) => {
            return !databaseEventData.some((event) => {
                return event.gw === playerEvent.gw && event.playerId === playerEvent.playerId && event.identifier === playerEvent.identifier;
            });
        });
        
        // loop through playerEvents and check if there are any updates needed in databaseEventData.
        // the updates needed are the events that have the same gw, playerId and identifier, but different value or points

        const updatesNeeded = playerEvents.flatMap((playerEvent) => {
            return databaseEventData.flatMap((event) => {
                if (
                    event.gw === playerEvent.gw &&
                    event.playerId === playerEvent.playerId &&
                    event.identifier === playerEvent.identifier &&
                    (event.value !== playerEvent.value && event.points !== playerEvent.points)
                ) {
                    // for an event that is minutes, but the number of points has not changed, DO NOT update the event
                    if (event.identifier === 'minutes' && event.points === playerEvent.points && playerEvent.value !== 90) {
                        return [];
                    }
                    return {
                        outdatedEvent: event,
                        updatedEvent: {
                            ...playerEvent
                        },
                    };
                }
                return [];
            });
        });

        // now lets review if there are any events that is in the database, but not in the playerEvents. 
        // if that is the case, we need to remove from DB, and add to missingEvents
        const eventsToRemove = databaseEventData.filter((event) => {
            return !playerEvents.some((playerEvent) => {
                return event.gw === playerEvent.gw && event.playerId === playerEvent.playerId && event.identifier === playerEvent.identifier;
            });
        });

        
        // remove the events using the removeEvent API from app/pages/api/removeEvent
        const removeData = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/removeEvent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventsToRemove),
        });


        

        // add the missing events to the databaseEventData using the setEvent API from app/pages/api/setEvent        
        const insertData = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/setEvent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(missingEvents),
        });
        
        const data = await insertData.json();
        
        // update the events in the databaseEventData using the updateEvent API from app/pages/api/updateEvent
        const updateData = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/updateEvent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatesNeeded.map((update) => update.updatedEvent))
        });

        res.status(200).json({ success: true });    
    } catch (error) {
        console.error('Error:', error);
        
        res.status(500).json({ error: 'Error fetching data' });
    }
}

