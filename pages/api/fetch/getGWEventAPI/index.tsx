import type { NextApiRequest, NextApiResponse } from 'next';
import {  getGWEvents, } from '@/lib/utils/FPLFetch';
import {  getBootstrapStatic } from '@/lib/utils/FPLFetch';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const staticData = await getBootstrapStatic();
        const currentGameweek =
          staticData?.events?.find((event) => event.is_current)?.id || 1;
        const gwEvents: any = await getGWEvents(currentGameweek);
        // return data
        return res.status(200).json(gwEvents);

    } catch (error) {
        console.error('Unexpected error in get gw event api handler:', error);
        return res.status(500).json({ error: `Unexpected error: ${error}` });
    }
}
