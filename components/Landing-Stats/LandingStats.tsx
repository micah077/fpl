import React from 'react';
import {
    LeaderboardTwoTone,
    TransferWithinAStationTwoTone,
    MoveUpTwoTone,
    MoveDownTwoTone,
    EmojiEventsTwoTone,
    MoneyTwoTone,
    SportsSoccerTwoTone,
    AirlineSeatLegroomNormalTwoTone,
    ManageAccountsTwoTone,
  } from '@mui/icons-material'; // Import Two-Toned icons

type StatItem = {
  title: string;
  description: string;
  icon: React.ReactElement; // Icon component instead of a screenshot
};

const stats: StatItem[] = [
  {
    title: 'Live League Table',
    description: 'Overall league standings (live points, player used, average point per player)',
    icon: (
      <LeaderboardTwoTone
        fontSize="large"
        sx={{ color: '#37003C' }} // Primary color

      />
    ),
  },
  {
    title: 'Transfer Stats',
    description: 'Insight on each managers transfer',
    icon: (
      <TransferWithinAStationTwoTone
        fontSize="large"
        sx={{ color: '#37003C' }} // Primary color

      />
    ),
  },
  {
    title: 'Top Transfers In',
    description: 'Most transferred in players in the league the last 3 gameweeks',
    icon: (
      <MoveUpTwoTone
        fontSize="large"
        sx={{ color: '#37003C' }} // Primary color

      />
    ),
  },
  {
    title: 'Top Transfers Out',
    description: 'Most transferred out players in the league the last 3 gameweeks',
    icon: (
      <MoveDownTwoTone
        fontSize="large"
        sx={{ color: '#37003C' }} // Primary color

      />
    ),
  },
  {
    title: 'Most owned player & differential',
    description: 'The most owned players & differentials in the league',
    icon: (
      <EmojiEventsTwoTone
        fontSize="large"
        sx={{ color: '#37003C' }} // Primary color

      />
    ),
  },
  {
    title: 'Live Events',
    description: 'Live events for all the players in the league',
    icon: (
      <SportsSoccerTwoTone
        fontSize="large"
        sx={{ color: '#37003C' }} // Primary color

      />
    ),
  },
  {
    title: 'Team Value',
    description: 'Track the financials in the league (cash in bank & team value)',
    icon: (
      <MoneyTwoTone
        fontSize="large"
        sx={{ color: '#37003C' }} // Primary color

      />
    ),
  },
  {
    title: 'Points on the Bench & Autosub',
    description: 'Points on the bench and autosub for each manager',
    icon: (
      <AirlineSeatLegroomNormalTwoTone
        fontSize="large"
        sx={{ color: '#37003C' }} // Primary color

      />
    ),
  },
  {
    title: 'Chips',
    description: 'Stats about the chips-usage in the league',
    icon: (
      <ManageAccountsTwoTone
        fontSize="large"
        sx={{ color: '#37003C' }} // Primary color

      />
    ),
  },
];

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const LandingStats: React.FC = () => {
  return (
    <section className="h-screen py-8 bg-fifth-gradient bg-no-repeat bg-right-top">
        <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">All-in-one FPL insights for your League</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto px-4">
            {stats.map((statItem, index) => (
            <div key={index} className="bg-white p-2 rounded-lg shadow-md text-center">
                <div className="mb-2 text-primary">{statItem.icon}</div> {/* Render Material-UI Icon */}
                <h3 className="text-lg font-semibold mb-2">{statItem.title}</h3>
                <p className="text-gray-600 text-sm">{statItem.description}</p>
            </div>
            ))}
        </div>

        {/* Get Started Button */}
        <div className="text-center mt-4">
            <button
            onClick={scrollToTop}
            className="bg-primary-gradient text-gray-800 px-6 py-2 rounded-lg shadow hover:bg-primary-dark transition"
            >
            Get Started
            </button>
        </div>
        </section>

  );
};

export default LandingStats;
