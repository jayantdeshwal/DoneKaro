/**
 * AI Fallback Service
 * Conservative, safe local domain intelligence engine.
 * Adheres strictly to the 4-tier truth boundary:
 * - Never fabricates arrival times, prices, or live status.
 * - Never exposes phone numbers or tel: actions.
 * - Free of third-party competitor references.
 */

import { AssistantPersona, ChatAction, ChatMessage, AISourceType, AILiveContext } from '../types'

interface FallbackResult {
  textEn: string
  textHi: string
  sourceType: AISourceType
  actions: ChatAction[]
}

export function resolveLocalFallbackQuery(
  rawQuery: string,
  persona: AssistantPersona,
  liveContext?: AILiveContext | null
): ChatMessage {
  const query = rawQuery.toLowerCase().trim()
  const result = matchLocalRule(query, persona, liveContext)

  return {
    id: 'fallback_' + Date.now(),
    sender: 'assistant',
    persona,
    timestamp: new Date(),
    textEn: result.textEn,
    textHi: result.textHi,
    sourceType: result.sourceType,
    actions: result.actions,
  }
}

function matchLocalRule(
  query: string,
  persona: AssistantPersona,
  liveContext?: AILiveContext | null
): FallbackResult {
  if (persona === 'customer_booking') {
    return matchBookingRule(query)
  }

  return matchWorkerRule(query, liveContext)
}

function matchBookingRule(query: string): FallbackResult {
  // 1. Electrical Issues
  if (query.includes('electric') || query.includes('mcb') || query.includes('spark') || query.includes('fan') || query.includes('बिजली') || query.includes('पंखा')) {
    return {
      sourceType: 'jugnu_rule',
      textEn: `⚡ **Electrical Services in Muzaffarnagar**\n\n- **Common repairs**: MCB tripping, fan sparking, switchboard installation, and wiring diagnostics.\n- **How it works**: Submit a service request with your location and problem details. Local electricians will submit quotes for you to review and choose.\n- **Coverage**: Verified electricians available across PIN 251001 (New Mandi, Gandhi Colony) and 251002 (Civil Lines, Cantt).`,
      textHi: `⚡ **मुज़फ़्फ़रनगर में इलेक्ट्रीशियन सेवाएँ**\n\n- **सामान्य मरम्मत**: MCB ट्रिपिंग, पंखे में स्पार्किंग, स्विचबोर्ड और वायरिंग जाँच।\n- **बुकिंग प्रक्रिया**: अपनी आवश्यकता के साथ अनुरोध भेजें। स्थानीय इलेक्ट्रीशियन कोटेशन भेजेंगे जिन्हें आप चुन सकते हैं।\n- **उपलब्धता**: पिन 251001 और 251002 के सभी मुख्य क्षेत्रों में उपलब्ध।`,
      actions: [
        {
          id: 'act_find_electrician',
          labelEn: 'Find Electricians',
          labelHi: 'इलेक्ट्रीशियन खोजें',
          type: 'navigate',
          payload: '/search?category=electrician',
          icon: 'Zap',
        },
      ],
    }
  }

  // 2. Plumbing Issues
  if (query.includes('plumb') || query.includes('leak') || query.includes('pipe') || query.includes('tank') || query.includes('नल') || query.includes('पानी')) {
    return {
      sourceType: 'jugnu_rule',
      textEn: `🚰 **Plumbing Services in Muzaffarnagar**\n\n- **Common repairs**: Tap leakage, overhead tank overflow, pipe fitting, and motor priming.\n- **How it works**: Post your request on DoneKaro. Verified local plumbers submit quotes directly to you.\n- **Payment**: Direct payment in Cash upon job completion and verification.`,
      textHi: `🚰 **मुज़फ़्फ़रनगर में प्लंबर सेवाएँ**\n\n- **सामान्य मरम्मत**: नल लीकेज, पानी की टंकी, पाइप लीकेज और मोटर समस्याएँ।\n- **बुकिंग प्रक्रिया**: DoneKaro पर अपना अनुरोध दर्ज करें। सत्यापित प्लंबर सीधे कोटेशन भेजेंगे।\n- **भुगतान**: कार्य पूरा होने और जाँच के बाद सीधे नकद (Cash) भुगतान।`,
      actions: [
        {
          id: 'act_find_plumber',
          labelEn: 'Find Plumbers',
          labelHi: 'प्लंबर खोजें',
          type: 'navigate',
          payload: '/search?category=plumber',
          icon: 'Droplet',
        },
      ],
    }
  }

  // 3. AC & Appliance Issues
  if (query.includes('ac') || query.includes('cool') || query.includes('fridge') || query.includes('एसी')) {
    return {
      sourceType: 'jugnu_rule',
      textEn: `❄️ **AC & Appliance Repair**\n\n- **Services**: Split/Window AC servicing, filter cleaning, cooling diagnostics, and gas pressure checks.\n- **Pricing**: Artisans quote according to the work required (inspection vs full servicing).\n- **Area coverage**: Available across Civil Lines, New Mandi, and nearby localities.`,
      textHi: `❄️ **AC और उपकरण मरम्मत**\n\n- **सेवाएँ**: स्प्लिट/विंडो AC सर्विसिंग, फिल्टर सफाई, कूलिंग जाँच और गैस प्रेशर चेकिंग।\n- **दरें**: आवश्यक कार्य के आधार पर कारीगर सीधे कोटेशन देते हैं।\n- **क्षेत्र**: सिविल लाइन्स, नई मंडी और आसपास के क्षेत्रों में उपलब्ध।`,
      actions: [
        {
          id: 'act_find_ac',
          labelEn: 'Find AC Technicians',
          labelHi: 'AC मैकेनिक खोजें',
          type: 'navigate',
          payload: '/search?category=ac_repair',
          icon: 'Wind',
        },
      ],
    }
  }

  // 4. Salon & Grooming
  if (query.includes('salon') || query.includes('hair') || query.includes('spa') || query.includes('facial') || query.includes('सैलून') || query.includes('बाल')) {
    return {
      sourceType: 'jugnu_rule',
      textEn: `✂️ **Salon & Grooming at Home**\n\n- **Men's Grooming**: Haircut, beard styling, and head massage.\n- **Women's Salon & Spa**: Facial, cleanup, waxing, manicure/pedicure by verified professionals at your home.\n- **How it works**: Book your preferred service and receive transparent quotes from verified professionals.`,
      textHi: `✂️ **घर पर सैलून एवं ग्रूमिंग सेवा**\n\n- **पुरुष ग्रूमिंग**: हेयरकट, दाढ़ी स्टाइलिंग, हेड मसाज।\n- **महिला सैलून**: फेशियल, क्लीनअप, वैक्सिंग, मैनीक्योर/पेडीक्योर घर पर।\n- **प्रक्रिया**: अपनी सेवा चुनें और सत्यापित पेशेवरों से कोटेशन प्राप्त करें।`,
      actions: [
        {
          id: 'act_find_salon',
          labelEn: 'Explore Salon Services',
          labelHi: 'सैलून सेवाएँ देखें',
          type: 'navigate',
          payload: '/search?category=parlour_service',
          icon: 'Scissors',
        },
      ],
    }
  }

  // 5. Default General Booking Guide
  return {
    sourceType: 'general_guidance',
    textEn: `🛠️ **DoneKaro Booking Help**\n\n- DoneKaro connects you with verified local artisans in Muzaffarnagar (PIN 251001 & 251002).\n- **How the quote marketplace works**:\n  1. Select a service category and post your requirement.\n  2. Available local artisans review your request and submit quotes.\n  3. You review quotes and choose the provider you prefer.\n  4. Pay directly in Cash after the work is completed and verified.\n- Browse available categories or search to get started.`,
    textHi: `🛠️ **DoneKaro बुकिंग सहायता**\n\n- DoneKaro आपको मुज़फ़्फ़रनगर (पिन 251001 और 251002) के सत्यापित स्थानीय कारीगरों से जोड़ता है।\n- **कोटेशन प्रणाली कैसे काम करती है**:\n  1. सेवा श्रेणी चुनें और अपनी समस्या दर्ज करें।\n  2. उपलब्ध कारीगर आपका अनुरोध देखकर कोटेशन भेजते हैं।\n  3. आप कोटेशन देखकर अपनी पसंद का कारीगर चुनते हैं।\n  4. काम पूरा और सत्यापित होने पर सीधे नकद (Cash) में भुगतान करें।`,
    actions: [
      {
        id: 'act_browse_categories',
        labelEn: 'Browse Categories',
        labelHi: 'सेवा श्रेणियाँ देखें',
        type: 'navigate',
        payload: '/categories',
        icon: 'Search',
      },
    ],
  }
}

function matchWorkerRule(query: string, liveContext?: AILiveContext | null): FallbackResult {
  const pb = liveContext?.primaryBooking

  // 0. Active job inquiry
  if (pb && (query.includes('job') || query.includes('booking') || query.includes('kam') || query.includes('काम') || query.includes('कस्टमर') || query.includes('ग्राहक'))) {
    return {
      sourceType: 'application_data',
      textEn: `💼 **Active Job Information**\n\n- **Service**: ${pb.categoryName}\n- **Customer**: ${pb.counterpartyName}\n- **Job Status**: ${pb.status.toUpperCase()}\n- **Agreed Initial Quote**: ₹${pb.initialQuoteAmount?.toFixed(2) || '0.00'}\n- **Final Amount**: ₹${pb.finalPayableAmount?.toFixed(2) || '0.00'}\n- **Payment Status**: ${pb.paymentStatus?.toUpperCase() || 'UNPAID'} (Cash upon completion)\n${pb.pendingAdditionalCount > 0 ? `- **Notice**: ${pb.pendingAdditionalCount} change request(s) awaiting customer approval.\n` : ''}${liveContext?.workerCompletedJobsCount !== undefined ? `- **Your Completed Jobs on DoneKaro**: ${liveContext.workerCompletedJobsCount}\n` : ''}`,
      textHi: `💼 **सक्रिय काम की जानकारी**\n\n- **सेवा**: ${pb.categoryName}\n- **ग्राहक**: ${pb.counterpartyName}\n- **काम की स्थिति**: ${pb.status}\n- **स्वीकृत कोटेशन**: ₹${pb.initialQuoteAmount?.toFixed(2) || '0.00'}\n- **अंतिम राशि**: ₹${pb.finalPayableAmount?.toFixed(2) || '0.00'}\n- **भुगतान स्थिति**: ${pb.paymentStatus || 'लंबित'} (काम पूरा होने पर नकद)\n${pb.pendingAdditionalCount > 0 ? `- **सूचना**: ${pb.pendingAdditionalCount} अतिरिक्त शुल्क अनुरोध ग्राहक स्वीकृति के लिए लंबित है।\n` : ''}${liveContext?.workerCompletedJobsCount !== undefined ? `- **DoneKaro पर पूरे किए गए काम**: ${liveContext.workerCompletedJobsCount}\n` : ''}`,
      actions: [
        {
          id: 'act_worker_dash',
          labelEn: 'Open Worker Dashboard',
          labelHi: 'कारीगर डैशबोर्ड खोलें',
          type: 'navigate',
          payload: '/worker/dashboard',
          icon: 'Briefcase',
        },
      ],
    }
  }

  // 0.1 Worker Complaints, Payment Refusal, Conduct Issues, or Disputes
  if (
    query.includes('complaint') ||
    query.includes('dispute') ||
    query.includes('issue') ||
    query.includes('problem') ||
    query.includes('refuse') ||
    query.includes('शिकायत') ||
    query.includes('समस्या') ||
    query.includes('विवाद')
  ) {
    if (pb?.activeComplaint) {
      return {
        sourceType: 'application_data',
        textEn: `🛡️ **Support Request on Record**\n\n- **Service**: ${pb.categoryName} (#DK-${pb.id.slice(0, 8).toUpperCase()})\n- **Complaint Reference**: #CMP-${pb.activeComplaint.id.slice(0, 8).toUpperCase()}\n- **Status**: ${pb.activeComplaint.status.toUpperCase()}\n- **Filed On**: ${new Date(pb.activeComplaint.createdAt).toLocaleString('en-IN')}\n\nOur administration team reviews all disputes between artisans and customers. AI Support is read-only and cannot alter complaint statuses. You can review your submitted requests in Support History.`,
        textHi: `🛡️ **दर्ज सहायता अनुरोध विवरण**\n\n- **सेवा**: ${pb.categoryName} (#DK-${pb.id.slice(0, 8).toUpperCase()})\n- **शिकायत संदर्भ संख्या**: #CMP-${pb.activeComplaint.id.slice(0, 8).toUpperCase()}\n- **वर्तमान स्थिति**: ${pb.activeComplaint.status.toUpperCase()}\n- **दर्ज दिनांक**: ${new Date(pb.activeComplaint.createdAt).toLocaleString('hi-IN')}\n\nहमारी व्यवस्थापक टीम कारीगरों व ग्राहकों के बीच विवादों की समीक्षा करती है। AI सहायक स्वतः कोई बदलाव नहीं कर सकता। आप शिकायत इतिहास में अपने अनुरोध देख सकते हैं।`,
        actions: [
          {
            id: 'act_view_history',
            labelEn: 'View Support History',
            labelHi: 'शिकायत इतिहास देखें',
            type: 'create_support_request',
            payload: 'history',
            icon: 'FileText',
          },
          {
            id: 'act_worker_dash',
            labelEn: 'Worker Dashboard',
            labelHi: 'कारीगर डैशबोर्ड',
            type: 'navigate',
            payload: '/worker/dashboard',
            icon: 'Briefcase',
          },
        ],
      }
    }

    if (pb) {
      return {
        sourceType: 'application_data',
        textEn: `🛡️ **Report an Issue with Job #${pb.id.slice(0, 8).toUpperCase()}**\n\n- **Service**: ${pb.categoryName}\n- **Customer**: ${pb.counterpartyName}\n- **Job Status**: ${pb.status.toUpperCase()}\n\nIf you are experiencing payment refusal, safety concerns, or customer misconduct, you can submit an official support request for administrative review.\n\n*(Note: Tap 'File Support Request' below to review job details and confirm your submission.)*`,
        textHi: `🛡️ **कार्य #${pb.id.slice(0, 8).toUpperCase()} संबंधी समस्या दर्ज करें**\n\n- **सेवा**: ${pb.categoryName}\n- **ग्राहक**: ${pb.counterpartyName}\n- **काम की स्थिति**: ${pb.status}\n\nयदि ग्राहक भुगतान देने से इनकार कर रहा है या कोई सुरक्षा समस्या है, तो आप व्यवस्थापक टीम की समीक्षा हेतु आधिकारिक सहायता अनुरोध दर्ज कर सकते हैं।\n\n*(सूचना: विवरण की समीक्षा करने और सबमिट करने के लिए नीचे 'सहायता अनुरोध दर्ज करें' पर टैप करें।)*`,
        actions: [
          {
            id: 'act_support_request',
            labelEn: 'File Support Request',
            labelHi: 'सहायता अनुरोध दर्ज करें',
            type: 'create_support_request',
            payload: pb.id,
            icon: 'AlertCircle',
          },
          {
            id: 'act_worker_dash',
            labelEn: 'Worker Dashboard',
            labelHi: 'कारीगर डैशबोर्ड',
            type: 'navigate',
            payload: '/worker/dashboard',
            icon: 'Briefcase',
          },
        ],
      }
    }
  }

  // 1. Quoting Advice
  if (query.includes('quote') || query.includes('rate') || query.includes('price') || query.includes('कोट') || query.includes('रेट')) {
    return {
      sourceType: 'jugnu_rule',
      textEn: `💼 **Artisan Quoting Guidelines**\n\n- **Competitive Quotes**: Customers see quotes from up to 2 providers in active slots. Quoting accurately and promptly improves acceptance rates.\n- **Clear Breakdown**: When quoting, consider diagnostic effort, required tools, and estimated labor time.\n- **Transparency**: Never quote unrealistically low to get the job and then demand unexpected cash on-site.`,
      textHi: `💼 **कारीगर कोटेशन दिशानिर्देश**\n\n- **सटीक कोटेशन**: ग्राहक सक्रिय स्लॉट में 2 कारीगरों के कोटेशन देखते हैं। समय पर और उचित कोटेशन देने से काम मिलने की संभावना बढ़ती है।\n- **स्पष्टता**: कोटेशन में आवश्यक समय, मेहनत और उपकरणों का ध्यान रखें।\n- **पारदर्शिता**: काम पाने के लिए बहुत कम कोटेशन देकर बाद में अधिक नकद न माँगें।`,
      actions: [],
    }
  }

  // 2. Extra charges on-site
  if (query.includes('extra') || query.includes('charge') || query.includes('अतिरिक्त') || query.includes('ज़्यादा')) {
    return {
      sourceType: 'jugnu_rule',
      textEn: `📝 **Additional Charges Workflow**\n\n- If you find that the repair requires extra work or replacement parts:\n  1. Discuss it clearly with the customer first.\n  2. Tap **Request Extra Charge** on your job card in the dashboard.\n  3. Enter the amount and reason.\n  4. The customer must approve it in their app before you finalize the job.\n- This protects you and ensures customer trust.`,
      textHi: `📝 **अतिरिक्त शुल्क प्रक्रिया**\n\n- यदि मरम्मत में अतिरिक्त कार्य या नए पार्ट्स की आवश्यकता हो:\n  1. पहले ग्राहक को स्पष्ट रूप से समझाएँ।\n  2. डैशबोर्ड में जॉब कार्ड पर **अतिरिक्त शुल्क अनुरोध** पर टैप करें।\n  3. राशि और कारण दर्ज करें।\n  4. काम पूरा करने से पहले ग्राहक को अपने ऐप में इसे स्वीकृत करना होगा।\n- इससे आपका और ग्राहक दोनों का भरोसा बना रहता है।`,
      actions: [],
    }
  }

  // 3. WhatsApp arrival template
  if (query.includes('whatsapp') || query.includes('message') || query.includes('template') || query.includes('मैसेज')) {
    return {
      sourceType: 'general_guidance',
      textEn: `💬 **Polite Customer Message Template**\n\n"नमस्ते! मैं DoneKaro से आपका कारीगर बोल रहा हूँ। मुझे आपकी बुकिंग प्राप्त हुई है। मैं काम के लिए प्रस्थान कर रहा हूँ और जल्द ही आपके पते पर पहुँच रहा हूँ। धन्यवाद।"\n\n- Tip: Clear, polite communication builds strong ratings and repeat customers.`,
      textHi: `💬 **सम्मानजनक ग्राहक मैसेज टेम्पलेट**\n\n"नमस्ते! मैं DoneKaro से आपका कारीगर बोल रहा हूँ। मुझे आपकी बुकिंग प्राप्त हुई है। मैं काम के लिए प्रस्थान कर रहा हूँ और जल्द ही आपके पते पर पहुँच रहा हूँ। धन्यवाद।"\n\n- सुझाव: समय पर और स्पष्ट बातचीत से अच्छी रेटिंग और दोबारा काम मिलता है।`,
      actions: [
        {
          id: 'act_copy_template',
          labelEn: 'Copy Message Template',
          labelHi: 'मैसेज कॉपी करें',
          type: 'copy_text',
          payload: 'नमस्ते! मैं DoneKaro से आपका कारीगर बोल रहा हूँ। मुझे आपकी बुकिंग प्राप्त हुई है और मैं आपके पते पर पहुँच रहा हूँ।',
          icon: 'Copy',
        },
      ],
    }
  }

  // 4. Verification
  if (query.includes('verify') || query.includes('badge') || query.includes('गोल्ड') || query.includes('वेरिफ')) {
    return {
      sourceType: 'jugnu_rule',
      textEn: `⭐ **Artisan Verification**\n\n- To build trust, ensure your profile has your full name, trade categories, and government ID uploaded.\n- Verification documents are reviewed by our team as soon as they are submitted.\n- Verified artisans receive priority in customer service matching.`,
      textHi: `⭐ **कारीगर सत्यापन (Verification)**\n\n- ग्राहक विश्वास बढ़ाने के लिए अपने प्रोफ़ाइल में पूरा नाम, कार्य श्रेणी और पहचान पत्र सही दर्ज रखें।\n- सत्यापन दस्तावेज़ जमा होने के बाद हमारी टीम द्वारा जाँचे जाते हैं।\n- सत्यापित कारीगरों को ग्राहकों द्वारा प्राथमिकता दी जाती है।`,
      actions: [],
    }
  }

  // 5. Default Work Advice response
  return {
    sourceType: 'general_guidance',
    textEn: `💼 **DoneKaro Work Advice**\n\n- Welcome to DoneKaro Artisan Support. Here to help you build a reputable local service business in Muzaffarnagar.\n- Keep your status active during your working hours to receive local job quote requests.\n- Receive 100% of customer payments directly in Cash upon verified job completion.`,
    textHi: `💼 **DoneKaro काम व सेवा सलाह**\n\n- DoneKaro कारीगर सहायता में आपका स्वागत है। मुज़फ़्फ़रनगर में एक सफल सेवा व्यवसाय बनाने में हम आपके साथी हैं।\n- काम के समय अपनी ड्यूटी चालू रखें ताकि नए कोटेशन अनुरोध मिल सकें।\n- काम पूरा होने पर सीधे नकद (Cash) में पूरा भुगतान प्राप्त करें।`,
    actions: [],
  }
}
