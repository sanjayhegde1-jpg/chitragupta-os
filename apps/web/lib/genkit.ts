// TODO: Configure Client SDK when Firebase App is initialized
// import { getFunctions, httpsCallable } from 'firebase/functions';

export const callAgent = async (flowName: string, data: unknown) => {
  console.log(`[Mock Genkit Call] Flow: ${flowName}`, data);
  // const functions = getFunctions();
  // const flow = httpsCallable(functions, flowName);
  // return await flow(data);
  return { status: 'mock_success' };
};
