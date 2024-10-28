'use client';
import React from 'react';

interface WhiteCardProps {
    children?: React.ReactNode;
}

const WhiteCard: React.FC<WhiteCardProps> = ({ children }) => {
    return (
        <div className="bg-white shadow-md rounded-lg w-48 h-48 flex flex-col justify-center items-center">
            {children}
        </div>
    );
};

export default WhiteCard;
