export type NormalizedEnquiry = {
  id: string;
  source: string;
  content: string;
  sender: {
    name?: string;
    phone?: string;
    email?: string;
    username?: string;
  };
  timestamp: string;
  raw_payload: unknown;
};

export class SocialNormalizer {
  static normalize(source: string, event: unknown): NormalizedEnquiry {
    const payload = event as Record<string, unknown>;
    const id = (payload && typeof payload.id === 'string')
      ? payload.id
      : `evt_${Date.now()}`;

    const content =
      typeof payload.message === 'string'
        ? payload.message
        : typeof payload.text === 'string'
          ? payload.text
          : 'Message received';

    return {
      id,
      source,
      content,
      sender: {
        name: typeof payload.name === 'string' ? payload.name : undefined,
        phone: typeof payload.phone === 'string' ? payload.phone : undefined,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        username: typeof payload.username === 'string' ? payload.username : undefined,
      },
      timestamp: new Date().toISOString(),
      raw_payload: event,
    };
  }
}
