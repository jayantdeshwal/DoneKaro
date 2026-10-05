import { AssistantConfig, AssistantPersona } from './types'

export const ASSISTANT_CONFIGS: Record<AssistantPersona, AssistantConfig> = {
  customer_booking: {
    id: 'customer_booking',
    nameEn: 'Booking Help',
    nameHi: 'बुकिंग सहायता',
    roleTitleEn: 'Service Finder & Booking Guide',
    roleTitleHi: 'सेवा खोज व बुकिंग मार्गदर्शक',
    badgeEn: '⚡ Booking Help',
    badgeHi: '⚡ बुकिंग सहायता',
    avatar: '🛠️',
    greetingEn: 'Namaste! I am Booking Help, your Muzaffarnagar service guide. What household repair or service can I help you find today?',
    greetingHi: 'नमस्ते! मैं बुकिंग सहायता हूँ, आपका मुज़फ़्फ़रनगर सेवा मार्गदर्शक। आज आपको घर में किस मरम्मत या सेवा के लिए कारीगर चाहिए?',
    chips: [
      {
        id: 'cb_mcb',
        labelEn: '⚡ MCB Tripping / Fan Issue',
        labelHi: '⚡ MCB ट्रिप या पंखे की समस्या',
        query: 'My fan is sparking and MCB trips repeatedly. Which electrician service should I request in Muzaffarnagar?',
        icon: 'Zap',
      },
      {
        id: 'cb_leak',
        labelEn: '🚰 Water Pipe / Tank Leakage',
        labelHi: '🚰 पानी पाइप या टंकी लीकेज',
        query: 'I have a water leakage from my overhead tank or pipe in Civil Lines. How do I request a verified plumber?',
        icon: 'Droplet',
      },
      {
        id: 'cb_clean',
        labelEn: '✨ Deep Home Cleaning',
        labelHi: '✨ पूरे घर की डीप क्लीनिंग',
        query: 'How does deep home cleaning and kitchen cleaning booking work on DoneKaro?',
        icon: 'Sparkles',
      },
      {
        id: 'cb_salon',
        labelEn: '✂️ Salon & Grooming at Home',
        labelHi: '✂️ घर पर सैलून व ग्रूमिंग सेवा',
        query: 'How can I book grooming or parlour services at home in Muzaffarnagar?',
        icon: 'Scissors',
      },
      {
        id: 'cb_pincode',
        labelEn: '📍 Coverage in Muzaffarnagar',
        labelHi: '📍 मुज़फ़्फ़रनगर में उपलब्धता',
        query: 'Which areas and pincodes are currently covered by DoneKaro in Muzaffarnagar?',
        icon: 'MapPin',
      },
      {
        id: 'cb_ac',
        labelEn: '❄️ AC Servicing & Cooling',
        labelHi: '❄️ AC सर्विसिंग व कूलिंग',
        query: 'My split AC needs filter cleaning and cooling check. How do I request a technician quote?',
        icon: 'Wind',
      },
    ],
  },

  worker_sarathi: {
    id: 'worker_sarathi',
    nameEn: 'Work Advice',
    nameHi: 'काम व सेवा सलाह',
    roleTitleEn: 'Artisan Business & Work Advice',
    roleTitleHi: 'कारीगर कार्य व सेवा सलाह',
    badgeEn: '💼 Work Advice',
    badgeHi: '💼 सेवा सलाह',
    avatar: '💼',
    greetingEn: 'Ram Ram! I am your Work Advice companion. How can I assist you with quoting, customer communication, or job completion guidelines?',
    greetingHi: 'राम-राम! मैं आपकी कार्य व सेवा सलाह में सहायक हूँ। आज मैं आपको उचित कोटेशन, सम्मानजनक बातचीत या काम पूरा करने के नियमों में कैसे मदद करूँ?',
    chips: [
      {
        id: 'ws_more_jobs',
        labelEn: '🔔 Tips for Submitting Winning Quotes',
        labelHi: '🔔 सटीक कोटेशन देने के सुझाव',
        query: 'What are best practices for submitting accurate quotes to customers on DoneKaro?',
        icon: 'TrendingUp',
      },
      {
        id: 'ws_wa_arrival',
        labelEn: '💬 Message: "I am On My Way"',
        labelHi: '💬 मैसेज: "मैं रास्ते में हूँ"',
        query: 'Give me a polite Hindi message to inform the customer that I am departing for the job location.',
        icon: 'MessageSquare',
      },
      {
        id: 'ws_payment',
        labelEn: '💵 Cash Payment & Completion Rules',
        labelHi: '💵 नकद भुगतान व काम पूरा करने के नियम',
        query: 'How should I verify work and collect payment directly from the customer?',
        icon: 'Coins',
      },
      {
        id: 'ws_badge',
        labelEn: '⭐ Artisan Profile & Verification',
        labelHi: '⭐ प्रोफ़ाइल और सत्यापन',
        query: 'How does artisan document verification work to build customer trust?',
        icon: 'Award',
      },
      {
        id: 'ws_dispute',
        labelEn: '⚠️ Additional Charges on Site',
        labelHi: '⚠️ साइट पर अतिरिक्त काम व शुल्क',
        query: 'What is the correct procedure if extra unexpected parts or repairs are required on-site?',
        icon: 'ShieldAlert',
      },
      {
        id: 'ws_rules',
        labelEn: '📜 Platform Standards & Safety',
        labelHi: '📜 प्लेटफ़ॉर्म नियम व सुरक्षा',
        query: 'What are the safety and professionalism standards expected of DoneKaro artisans?',
        icon: 'CheckCircle',
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
