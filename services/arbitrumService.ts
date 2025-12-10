import { GasBlock } from '../types';

const ARBITRUM_RPC = 'https://arb1.arbitrum.io/rpc';

// Arbitrum block time is approx 0.25s-0.26s.
// 1 hour = 3600s.
// 3600 / 0.25 = 14,400 blocks per hour.
const BLOCKS_PER_HOUR = 14400;
const HOURS_PER_DAY = 24;
const DAYS_TO_FETCH = 7;
const TOTAL_HOURS = DAYS_TO_FETCH * HOURS_PER_DAY; // 168 data points

// Helper to batch promises to avoid rate limiting
async function batchRequests<T>(items: any[], batchSize: number, fn: (item: any) => Promise<T>): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    // Small delay between batches
    await new Promise(r => setTimeout(r, 50)); 
  }
  return results;
}

export const fetch7DayGasData = async (): Promise<GasBlock[]> => {
  try {
    // 1. Get latest block number
    const latestBlockResponse = await fetch(ARBITRUM_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
    });
    
    const latestBlockData = await latestBlockResponse.json();
    const latestBlockHex = latestBlockData.result;
    const latestBlockNum = parseInt(latestBlockHex, 16);

    // 2. Prepare list of block numbers to fetch (Hourly for 7 days)
    const blockNumbersToFetch = [];
    for (let i = TOTAL_HOURS; i >= 0; i--) {
      const blockOffset = i * BLOCKS_PER_HOUR;
      const targetBlock = latestBlockNum - blockOffset;
      if (targetBlock > 0) {
        blockNumbersToFetch.push(targetBlock);
      }
    }

    // 3. Fetch in batches
    const fetchBlock = async (blockNum: number) => {
      const hex = '0x' + blockNum.toString(16);
      const res = await fetch(ARBITRUM_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params: [hex, false],
          id: blockNum,
        }),
      });
      return res.json();
    };

    // Batch size of 10 to be safe with public RPCs
    const rawResults = await batchRequests(blockNumbersToFetch, 10, fetchBlock);

    // 4. Process data
    const blocks: GasBlock[] = rawResults
      .map((res: any) => {
        const b = res.result;
        if (!b) return null;
        return {
          number: parseInt(b.number, 16),
          gasUsed: parseInt(b.gasUsed, 16),
          // Convert Wei to Gwei
          baseFeePerGas: parseInt(b.baseFeePerGas || '0', 16) / 1000000000, 
          timestamp: parseInt(b.timestamp, 16)
        };
      })
      .filter((b): b is GasBlock => b !== null)
      .sort((a, b) => a.number - b.number); 

    return blocks;

  } catch (error) {
    console.error("Failed to fetch Arbitrum data:", error);
    throw error;
  }
};