import * as admin from 'firebase-admin';

const dayKey = () => new Date().toISOString().slice(0, 10);

type MetricUpdates = {
  approvalsPending?: number;
};

export const updateDailyMetrics = async (updates: MetricUpdates) => {
  const db = admin.firestore();
  const id = dayKey();
  const docRef = db.collection('metrics_daily').doc(id);
  const data: Record<string, admin.firestore.FieldValue | string> = {
    id,
  };

  if (typeof updates.approvalsPending === 'number') {
    data.approvalsPending = admin.firestore.FieldValue.increment(updates.approvalsPending);
  }

  await docRef.set(data, { merge: true });
};
