import { onFlow } from '@genkit-ai/firebase/functions';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { firebaseAuth } from '../lib/auth';

export const getDashboardMetrics = onFlow(
  {
    name: 'getDashboardMetrics',
    inputSchema: z.object({}), // No input needed
    outputSchema: z.object({
      leadsToday: z.number(),
      pendingApprovals: z.number(),
      pipelineValue: z.number(),
      systemHealth: z.string()
    }),
    authPolicy: firebaseAuth,
  },
  async () => {
    const db = admin.firestore();
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Parallel specific queries for performance
    const [leadsSnap, approvalsSnap, pipelineSnap] = await Promise.all([
      // 1. Leads Created Today
      db.collection('leads')
        .where('last_event_at', '>=', startOfDay) // Using last_event_at as proxy for activity/creation if created_at is inconsistent
        .count() // Use count aggregation for cost efficiency
        .get(),
      
      // 2. Pending Approvals
      db.collection('approvals')
        .where('status', '==', 'pending')
        .count()
        .get(),

      // 3. Pipeline Value (Negotiating + Won)
      // Note: count() doesn't sum. We need to fetch and reduce. 
      // Optimization: Limit to reasonable number or valid status.
      db.collection('leads')
        .where('status', 'in', ['negotiating', 'closed_won'])
        .select('value') // Only fetch value field
        .get()
    ]);

    const leadsToday = leadsSnap.data().count;
    const pendingApprovals = approvalsSnap.data().count;
    
    // Sum pipeline value
    let pipelineValue = 0;
    pipelineSnap.forEach(doc => {
       const v = doc.data().value;
       if (typeof v === 'number') {
           pipelineValue += v;
       }
    });

    return {
      leadsToday,
      pendingApprovals,
      pipelineValue,
      systemHealth: 'Healthy'
    };
  }
);
