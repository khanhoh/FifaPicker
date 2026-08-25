import React from 'react';

export const TeamLogos = {
  AMT: ({ className = "w-6 h-6" }) => (
    <img
      src="/logos/AMT.png"
      alt="AMITA FCO"
      className={`${className} object-contain`}
    />
  ),
  NK: ({ className = "w-6 h-6" }) => (
    <img
      src="/logos/NK.png"
      alt="NK FC ONLINE"
      className={`${className} object-contain`}
    />
  ),
  FFB: ({ className = "w-6 h-6" }) => (
    <img
      src="/logos/FFB.png"
      alt="FOR FUN BROTHER"
      className={`${className} object-contain`}
    />
  ),
  TAG: ({ className = "w-6 h-6" }) => (
    <img
      src="/logos/TAG.png"
      alt="TAG TEAM"
      className={`${className} object-contain`}
    />
  )
};

export const FCLogo = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 15H85L70 85L50 95L30 85L15 15Z" fill="#000000" stroke="#00ff66" strokeWidth="6"/>
    <path d="M28 32H65V42H40V49H60V59H40V72H28V32Z" fill="#ffffff"/>
    <path d="M72 42V62C72 68 68 72 62 72H56V62H60C61.5 62 62 61 62 60V44C62 43 61.5 42 60 42H56V32H62C68 32 72 36 72 42Z" fill="#00ff66"/>
  </svg>
);
