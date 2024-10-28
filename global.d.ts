import type { FPLBootstrapStatic } from '@/lib/types/FPLStatic';
import type { Manager } from '@/lib/types/Manager';
import type { League, Result } from '@/lib/types/FPLLeague';
import type { Transfer } from '@/lib/types/FPLTransfer';
import type { PlayerHistory } from './lib/types/FPLPlayerHistory';
import type { UserGw, UserDatabase, Pick } from './lib/types/FPLUserGW';
import type { Events, LeaguePlayerEvents } from './lib/types/FPLEvents';
import type { Fixtures } from './lib/types/FPLFixtures'
import type { PoBAutoSubs } from './lib/types/FPLPoBAutosub';
import { type } from 'os';


declare global {
  type FPLStatic = FPLBootstrapStatic;
  type FPLManager = Manager;
  type FPLLeague = League
  type FPLTransfers = Transfer;
  type FPLPlayerHistory = PlayerHistory;
  type FPLUserGameweek = UserGw;
  type UserTransfer = UserTransfer;
  type FPLEvents = Events;
  type FPLFixtures = Fixtures;
  type EventDatabase = EventDatabase;
  type UserDatabase = UserDatabase;
  type FPLPick = Pick;
  type FPLResult = Result;
  type FPLLeagueEvents = LeaguePlayerEvents;
  type FPLPoBAutosub = PoBAutosub;
}

