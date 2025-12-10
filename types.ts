export interface GasBlock {
  number: number;
  gasUsed: number;
  baseFeePerGas: number; // In Gwei
  timestamp: number;
}

export interface NftMetadata {
  name: string;
  description: string;
  image: string; // SVG data URI
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
}

export type MusicStyle = 'CYBERPUNK' | 'ETHEREAL' | 'RETRO';
