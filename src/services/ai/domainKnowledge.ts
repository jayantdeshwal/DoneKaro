import { AssistantConfig, AssistantPersona } from './types'

export const ASSISTANT_CONFIGS: Record<AssistantPersona, AssistantConfig> = {
  customer_booking: {
    id: 'customer_booking',
    nameEn: 'Booking Help',
    nameHi: 'बुकिंग सहायता',
    roleTitleEn: 'Sarathi · Customer Guide',
    roleTitleHi: 'सारथी · ग्राहक सहायक',
    badgeEn: '⚡ Sarathi AI',
    badgeHi: '⚡ सारथी AI',
    avatar: '🛠️',
    greetingEn: 'Namaste! I am Sarathi, your DoneKaro assistant. Ask me anything about booking a worker, cash payments, receipts, or support.',
    greetingHi: 'नमस्ते! मैं सारथी हूँ, आपका DoneKaro सहायक। कामगार बुक करने, कैश पेमेंट, रसीद या शिकायत के बारे में बेझिझक पूछें।',
    chips: [
      {
        id: 'cb_book_worker',
        labelEn: 'How do I book a worker?',
        labelHi: 'वर्कर कैसे बुक करें?',
        queryEn: 'How do I book a worker?',
        queryHi: 'वर्कर कैसे बुक करें?',
        icon: 'Search',
      },
      {
        id: 'cb_cash_payment',
        labelEn: 'How does cash payment work?',
        labelHi: 'कैश पेमेंट कैसे करना है?',
        queryEn: 'How does cash payment work?',
        queryHi: 'कैश पेमेंट कैसे करना है?',
        icon: 'Coins',
      },
      {
        id: 'cb_receipt',
        labelEn: 'Where can I download my receipt?',
        labelHi: 'अपनी रसीद कैसे डाउनलोड करें?',
        queryEn: 'Where can I download my receipt?',
        queryHi: 'अपनी रसीद कैसे डाउनलोड करें?',
        icon: 'FileText',
      },
      {
        id: 'cb_complaint',
        labelEn: 'How do I file a complaint?',
        labelHi: 'बुकिंग की शिकायत कैसे दर्ज करें?',
        queryEn: 'How do I file a complaint?',
        queryHi: 'बुकिंग की शिकायत कैसे दर्ज करें?',
        icon: 'AlertCircle',
      },
    ],
  },

  worker_sarathi: {
    id: 'worker_sarathi',
    nameEn: 'Work Advice',
    nameHi: 'काम व सेवा सलाह',
    roleTitleEn: 'Sarathi · Worker Guide',
    roleTitleHi: 'सारथी · कामगार सहायक',
    badgeEn: '💼 Sarathi AI',
    badgeHi: '💼 सारथी AI',
    avatar: '💼',
    greetingEn: 'Ram Ram! I am Sarathi, your DoneKaro work companion. Ask me about accepting bookings, additional charges, cash confirmation, or getting more 5-star reviews.',
    greetingHi: 'राम-राम! मैं सारथी हूँ, आपका DoneKaro कार्य सहायक। बुकिंग स्वीकार करने, अतिरिक्त चार्ज, कैश कन्फर्म या 5-स्टार रिव्यू के बारे में पूछें।',
    chips: [
      {
        id: 'ws_accept_complete',
        labelEn: 'How do I accept and complete a booking?',
        labelHi: 'बुकिंग कैसे स्वीकार और पूरी करें?',
        queryEn: 'How do I accept and complete a booking?',
        queryHi: 'बुकिंग कैसे स्वीकार और पूरी करें?',
        icon: 'Briefcase',
      },
      {
        id: 'ws_extra_charge',
        labelEn: 'How to request an additional charge?',
        labelHi: 'अतिरिक्त चार्ज की रिक्वेस्ट कैसे भेजें?',
        queryEn: 'How to request an additional charge?',
        queryHi: 'अतिरिक्त चार्ज की रिक्वेस्ट कैसे भेजें?',
        icon: 'Zap',
      },
      {
        id: 'ws_confirm_cash',
        labelEn: 'How to confirm cash received?',
        labelHi: 'कैश रिसीव कन्फर्म कैसे करें?',
        queryEn: 'How to confirm cash received?',
        queryHi: 'कैश रिसीव कन्फर्म कैसे करें?',
        icon: 'Coins',
      },
      {
        id: 'ws_five_star',
        labelEn: 'How can I get more 5-star reviews?',
        labelHi: 'ज्यादा 5-स्टार रिव्यू कैसे पाएं?',
        queryEn: 'How can I get more 5-star reviews?',
        queryHi: 'ज्यादा 5-स्टार रिव्यू कैसे पाएं?',
        icon: 'Sparkles',
      },
    ],
  },
}

export const MUZAFFARNAGAR_KNOWLEDGE = {
  supportedPincodes: ['251001', '251002'],
  keyAreas: [
    'New Mandi (नई मंडी)',
    'Civil Lines (सिविल लाइन्स)',
    'Roorkee Road (रुड़की रोड)',
    'Circular Road (सर्कुलर रोड)',
    'Gandhi Colony (गांधी कॉलोनी)',
    'Ansari Road (अंसारी रोड)',
    'Shiv Chowk / City (शिव चौक)',
    'Jansath Road (जानसठ रोड)',
    'Rampuram (रामपुरम)',
    'South Civil Lines (साउथ सिविल लाइन्स)',
    'Bharthal / Patel Nagar (पटेल नगर)',
  ],
  standardRates: {
    electrician: {
      visit: 'Provider-defined quote; DoneKaro does not set a fixed visiting price.',
      scope: 'Switchboard / MCB fixing, wiring diagnosis, fan/light installation.',
    },
    plumber: {
      visit: 'Provider-defined quote; DoneKaro does not set a fixed visiting price.',
      scope: 'Tap replacement, pipe leak repair, flush tank, motor pump priming.',
    },
    ac_repair: {
      visit: 'Provider-defined quote after reviewing the requested work.',
      scope: 'Inspection, filter deep wash, and gas pressure testing are quoted by the provider.',
    },
    part_time_maid: {
      visit: 'Provider-defined quote based on the requested work and property.',
      scope: 'Bathroom and full-home cleaning work are quoted by the provider.',
    },
    parlour_service: {
      visit: 'Provider-defined quote based on the requested service.',
      scope: 'Haircut, facial, grooming, nail care, mehendi and beauty care at home.',
    },
    carpenter: {
      visit: 'Provider-defined quote based on the requested work.',
      scope: 'Door lock fitting, hinge alignment, bed/wardrobe repair.',
    },
    painter: {
      visit: 'Provider-defined quote after reviewing the requested work.',
      scope: 'Interior wall painting, touch-up putty, waterproof coating quotation.',
    },
  },
}
