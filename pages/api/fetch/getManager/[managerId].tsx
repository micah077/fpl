// pages/api/fetch/getCaptainView/[leagueId].ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { getManager } from '@/lib/utils/FPLFetch';


/**
 * API handler to fetch and process captain picks for a given league.
 *
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 * @returns A JSON response containing captain picks data.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { managerId } = req.query;
        const data = await getManager(managerId?.toString() || '');
        return res.status(200).json(data);
    } catch (error) {
        console.error('Unexpected error in handler:', error);
        return res.status(500).json({ error: `Unexpected error: ${error}` });
    }
}
