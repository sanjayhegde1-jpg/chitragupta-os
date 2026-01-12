import { configureGenkit } from '@genkit-ai/core';
import { firebase } from '@genkit-ai/firebase';
import { vertexAI } from '@genkit-ai/vertexai';

export default configureGenkit({
  plugins: [
    firebase(),
    vertexAI({ location: 'asia-south1' }), 
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
  traceStore: 'firebase',
  flowStateStore: 'firebase',
});
