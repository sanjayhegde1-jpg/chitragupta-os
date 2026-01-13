import axios from 'axios';

type SendInput = {
  to: string;
  message: string;
};

type SendResult = {
  success: boolean;
  provider: 'mock' | 'meta';
  messageId?: string;
  error?: string;
};

const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

const hasMetaConfig = Boolean(metaToken && phoneNumberId);

export const sendWhatsAppMessage = async ({ to, message }: SendInput): Promise<SendResult> => {
  if (!hasMetaConfig) {
    if (process.env.NODE_ENV === 'production') {
      return {
        success: false,
        provider: 'mock',
        error: 'WhatsApp provider not configured',
      };
    }

    console.log(`[WhatsApp][Mock] to=${to} message=${message}`);
    return {
      success: true,
      provider: 'mock',
      messageId: `mock_${Date.now()}`,
    };
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const messageId = response.data?.messages?.[0]?.id;
    return {
      success: true,
      provider: 'meta',
      messageId,
    };
  } catch (error) {
    console.error('[WhatsApp][Meta] send failed', error);
    return {
      success: false,
      provider: 'meta',
      error: 'WhatsApp send failed',
    };
  }
};
