import Dexie from 'dexie';

const db = new Dexie('PosOfflineDB');
db.version(1).stores({
  transactions: '++id, items, paymentType, total, date',
});

export const saveTransactionOffline = async (transaction) => {
  await db.transactions.add(transaction);
};

export const syncTransactions = async () => {
  const transactions = await db.transactions.toArray();
  // Send to back-end API
  for (const tx of transactions) {
    await fetch(`${process.env.REACT_APP_API_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx),
    });
  }
  await db.transactions.clear();
};