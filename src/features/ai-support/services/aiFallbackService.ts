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

  if (persona === 'customer_care') {
    return matchCareRule(query, liveContext)
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
      textEn: `🚰 **Plumbing Services in Muzaffarnagar**\n\n- **Common repairs**: Tap leakage, overhead tank overflow, pipe fitting, and motor priming.\n- **How it works**: Post your request on Jugnu. Verified local plumbers submit quotes directly to you.\n- **Payment**: Direct payment in Cash upon job completion and verification.`,
      textHi: `🚰 **मुज़फ़्फ़रनगर में प्लंबर सेवाएँ**\n\n- **सामान्य मरम्मत**: नल लीकेज, पानी की टंकी, पाइप लीकेज और मोटर समस्याएँ।\n- **बुकिंग प्रक्रिया**: जुगनू पर अपना अनुरोध दर्ज करें। सत्यापित प्लंबर सीधे कोटेशन भेजेंगे।\n- **भुगतान**: कार्य पूरा होने और जाँच के बाद सीधे नकद (Cash) भुगतान।`,
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
    textEn: `🛠️ **Jugnu Booking Help**\n\n- Jugnu connects you with verified local artisans in Muzaffarnagar (PIN 251001 & 251002).\n- **How the quote marketplace works**:\n  1. Select a service category and post your requirement.\n  2. Available local artisans review your request and submit quotes.\n  3. You review quotes and choose the provider you prefer.\n  4. Pay directly in Cash after the work is completed and verified.\n- Browse available categories or search to get started.`,
    textHi: `🛠️ **जुगनू बुकिंग सहायता**\n\n- जुगनू आपको मुज़फ़्फ़रनगर (पिन 251001 और 251002) के सत्यापित स्थानीय कारीगरों से जोड़ता है।\n- **कोटेशन प्रणाली कैसे काम करती है**:\n  1. सेवा श्रेणी चुनें और अपनी समस्या दर्ज करें।\n  2. उपलब्ध कारीगर आपका अनुरोध देखकर कोटेशन भेजते हैं।\n  3. आप कोटेशन देखकर अपनी पसंद का कारीगर चुनते हैं।\n  4. काम पूरा और सत्यापित होने पर सीधे नकद (Cash) में भुगतान करें।`,
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

function matchCareRule(query: string, liveContext?: AILiveContext | null): FallbackResult {
  const pb = liveContext?.primaryBooking

  // 0. Check for multiple active bookings clarification (Ambiguity Rule)
  if (
    liveContext?.resolutionReason === 'multiple_active' ||
    (liveContext?.hasMultipleActiveBookings && !pb)
  ) {
    const isComplaintQuery =
      query.includes('complain') ||
      query.includes('issue') ||
      query.includes('dispute') ||
      query.includes('problem') ||
      query.includes('शिकायत') ||
      query.includes('समस्या') ||
      query.includes('विवाद')

    if (isComplaintQuery) {
      return {
        sourceType: 'application_data',
        textEn: `📋 **Which booking do you want to report an issue for?**\n\nYou currently have ${liveContext?.activeBookings?.length || 0} active service bookings:\n${(liveContext?.activeBookings || []).map((b, i) => `${i + 1}. **${b.categoryName}** (Status: ${b.status})`).join('\n')}\n\nPlease specify which service category you are referring to so we can open the correct support request form.`,
        textHi: `📋 **आप किस बुकिंग के संबंध में समस्या दर्ज करना चाहते हैं?**\n\nवर्तमान में आपकी ${liveContext?.activeBookings?.length || 0} सक्रिय बुकिंग्स हैं:\n${(liveContext?.activeBookings || []).map((b, i) => `${i + 1}. **${b.categoryName}** (स्थिति: ${b.status})`).join('\n')}\n\nकृपया बताएँ कि आप किस सेवा के बारे में पूछ रहे हैं ताकि सही सहायता फॉर्म खोला जा सके।`,
        actions: [
          {
            id: 'act_go_bookings',
            labelEn: 'View My Bookings',
            labelHi: 'मेरी बुकिंग्स देखें',
            type: 'navigate',
            payload: '/bookings',
            icon: 'Calendar',
          },
        ],
      }
    }

    return {
      sourceType: 'application_data',
      textEn: `📋 **Multiple Active Bookings**\n\nI need to know which booking you're referring to. You currently have ${liveContext?.activeBookings?.length || 0} active service bookings:\n${(liveContext?.activeBookings || []).map((b, i) => `${i + 1}. **${b.categoryName}** (Status: ${b.status})`).join('\n')}\n\nPlease specify which service category you need help with, or tap 'View My Bookings' below.`,
      textHi: `📋 **एक से अधिक सक्रिय बुकिंग्स**\n\nकृपया बताएँ कि आप किस बुकिंग के बारे में पूछ रहे हैं। वर्तमान में आपकी ${liveContext?.activeBookings?.length || 0} सक्रिय बुकिंग्स हैं:\n${(liveContext?.activeBookings || []).map((b, i) => `${i + 1}. **${b.categoryName}** (स्थिति: ${b.status})`).join('\n')}\n\nकृपया बताएँ कि आप किस सेवा के बारे में पूछ रहे हैं, या नीचे 'मेरी बुकिंग्स देखें' पर टैप करें।`,
      actions: [
        {
          id: 'act_go_bookings',
          labelEn: 'View My Bookings',
          labelHi: 'मेरी बुकिंग्स देखें',
          type: 'navigate',
          payload: '/bookings',
          icon: 'Calendar',
        },
      ],
    }
  }

  // 1. Worker Delay or Arrival Inquiry
  if (query.includes('delay') || query.includes('late') || query.includes('where') || query.includes('arrive') || query.includes('कहाँ') || query.includes('देरी') || query.includes('लेट') || query.includes('आगमन') || query.includes('आएगा')) {
    if (pb) {
      return {
        sourceType: 'application_data',
        textEn: `⏱️ **Artisan Arrival & Appointment Information**\n\n- **Service**: ${pb.categoryName}\n- **Assigned Artisan**: ${pb.counterpartyName}\n- **Booking Status**: ${pb.status.toUpperCase()}\n- **Scheduled Appointment Slot**: ${pb.scheduledAt ? new Date(pb.scheduledAt).toLocaleString('en-IN') : 'Flexible appointment'} *(Scheduled slot only; NOT a live transit ETA)*\n\n*(Notice: Live worker location or transit ETA is unavailable. Jugnu does not track real-time artisan GPS locations. Scheduled time represents the agreed appointment slot only, not a live transit ETA. To check exact arrival or communicate, please tap the Call Artisan or WhatsApp button directly on your active booking card in My Bookings. Jugnu platform support phone calls are not supported; support is managed in-app.)*`,
        textHi: `⏱️ **कारीगर आगमन व अपॉइंटमेंट जानकारी**\n\n- **सेवा**: ${pb.categoryName}\n- **निर्धारित कारीगर**: ${pb.counterpartyName}\n- **बुकिंग स्थिति**: ${pb.status}\n- **निर्धारित अपॉइंटमेंट स्लॉट**: ${pb.scheduledAt ? new Date(pb.scheduledAt).toLocaleString('hi-IN') : 'लचीला समय'} *(केवल निर्धारित स्लॉट; लाइव ट्रांजिट ETA नहीं)*\n\n*(सूचना: लाइव लोकेशन या ट्रांजिट ETA उपलब्ध नहीं है। जुगनू रियल-टाइम GPS ट्रैक नहीं करता है। निर्धारित समय केवल अपॉइंटमेंट स्लॉट दर्शाता है। आगमन का समय जानने या बातचीत के लिए कृपया My Bookings में अपने सक्रिय बुकिंग कार्ड पर 'कारीगर को कॉल करें' (Call Artisan) या WhatsApp विकल्प का उपयोग करें। जुगनू प्लेटफॉर्म सहायता के लिए फोन कॉल समर्थित नहीं है; सहायता केवल ऐप में दी जाती है।)*`,
        actions: [
          {
            id: 'act_go_bookings',
            labelEn: 'View Active Booking',
            labelHi: 'सक्रिय बुकिंग देखें',
            type: 'navigate',
            payload: '/bookings',
            icon: 'Calendar',
          },
        ],
      }
    }

    return {
      sourceType: 'unknown',
      textEn: `⏱️ **Worker Arrival & Status Information**\n\n- Live worker location or transit ETA is unavailable in this chat.\n- You do not currently have an active booking associated with this inquiry.\n- **How to contact your artisan**:\n  1. Go to your **My Bookings** page.\n  2. Tap the **Call Artisan** or **WhatsApp** button on your active booking card to contact your assigned artisan directly.\n  3. Note: Jugnu platform support phone calls are not supported; all support is managed in-app.\n  4. If the artisan is unreachable or cannot fulfill the job, you can choose another available provider from the booking details.`,
      textHi: `⏱️ **कारीगर के आगमन की जानकारी**\n\n- इस चैट में कारीगर की लाइव लोकेशन या ट्रांजिट ETA उपलब्ध नहीं है।\n- वर्तमान में इस पूछताछ के लिए कोई सक्रिय बुकिंग नहीं मिली है।\n- **कारीगर से संपर्क करने का तरीका**:\n  1. अपने **My Bookings** पेज पर जाएँ।\n  2. अपने सक्रिय बुकिंग कार्ड पर दिए गए **Call Artisan** या **WhatsApp** बटन पर टैप करके कारीगर से सीधे संपर्क करें।\n  3. ध्यान दें: जुगनू प्लेटफॉर्म सहायता के लिए फोन कॉल समर्थित नहीं है; सहायता केवल ऐप में उपलब्ध है।\n  4. यदि कारीगर संपर्क में नहीं है, तो आप बुकिंग विवरण से दूसरा कारीगर चुन सकते हैं।`,
      actions: [
        {
          id: 'act_go_bookings',
          labelEn: 'View My Bookings',
          labelHi: 'मेरी बुकिंग्स देखें',
          type: 'navigate',
          payload: '/bookings',
          icon: 'Calendar',
        },
      ],
    }
  }

  // 2. Receipt / Bill / Invoice inquiry
  if (query.includes('receipt') || query.includes('bill') || query.includes('invoice') || query.includes('रसीद') || query.includes('बिल')) {
    if (pb) {
      if (pb.isPaid && pb.receiptNumber) {
        return {
          sourceType: 'application_data',
          textEn: `📄 **Official Service Receipt**\n\n- **Receipt Number**: ${pb.receiptNumber}\n- **Receipt Date/Time**: ${pb.receiptPaidAt ? new Date(pb.receiptPaidAt).toLocaleString('en-IN') : 'Confirmed at job completion'}\n- **Service**: ${pb.categoryName}\n- **Total Amount Paid**: ₹${pb.finalPayableAmount !== null ? pb.finalPayableAmount.toFixed(2) : (pb.initialQuoteAmount !== null ? pb.initialQuoteAmount.toFixed(2) : '0.00')}\n- **Payment Method**: ${pb.paymentMethod || 'Cash'}\n- **Status**: PAID\n\nYou can view and download your complete digital receipt anytime in your My Bookings tab.`,
          textHi: `📄 **आधिकारिक सेवा रसीद**\n\n- **रसीद संख्या**: ${pb.receiptNumber}\n- **रसीद दिनांक/समय**: ${pb.receiptPaidAt ? new Date(pb.receiptPaidAt).toLocaleString('hi-IN') : 'काम पूरा होने पर प्रमाणित'}\n- **सेवा**: ${pb.categoryName}\n- **कुल भुगतान राशि**: ₹${pb.finalPayableAmount !== null ? pb.finalPayableAmount.toFixed(2) : (pb.initialQuoteAmount !== null ? pb.initialQuoteAmount.toFixed(2) : '0.00')}\n- **भुगतान माध्यम**: ${pb.paymentMethod || 'Cash'}\n- **स्थिति**: भुगतान पूर्ण (PAID)\n\nआप My Bookings टैब में अपनी पूरी डिजिटल रसीद कभी भी देख सकते हैं।`,
          actions: [
            {
              id: 'act_view_receipt',
              labelEn: 'View Receipt',
              labelHi: 'रसीद देखें',
              type: 'navigate',
              payload: '/bookings',
              icon: 'Calendar',
            },
          ],
        }
      }

      return {
        sourceType: 'application_data',
        textEn: `📄 **Receipt & Payment Status**\n\n- **Service**: ${pb.categoryName}\n- **Amount Payable**: ₹${pb.finalPayableAmount !== null ? pb.finalPayableAmount.toFixed(2) : (pb.initialQuoteAmount !== null ? pb.initialQuoteAmount.toFixed(2) : '0.00')}\n- **Current Payment Status**: ${pb.paymentStatus?.toUpperCase() || 'UNPAID'}\n- **Receipt Number**: None (Not yet generated)\n\nOfficial receipts are automatically generated in the app immediately after cash payment is confirmed upon service completion. No receipt is generated while payment is pending.`,
        textHi: `📄 **रसीद व भुगतान स्थिति**\n\n- **सेवा**: ${pb.categoryName}\n- **देय राशि**: ₹${pb.finalPayableAmount !== null ? pb.finalPayableAmount.toFixed(2) : (pb.initialQuoteAmount !== null ? pb.initialQuoteAmount.toFixed(2) : '0.00')}\n- **वर्तमान भुगतान स्थिति**: ${pb.paymentStatus || 'लंबित'}\n- **रसीद संख्या**: उपलब्ध नहीं (अभी जनरेट नहीं हुई)\n\nकाम पूरा होने और नकद भुगतान की पुष्टि होते ही ऐप में डिजिटल रसीद तुरंत जनरेट होती है। भुगतान लंबित रहने तक रसीद उपलब्ध नहीं होती।`,
        actions: [
          {
            id: 'act_go_bookings',
            labelEn: 'View Booking',
            labelHi: 'बुकिंग देखें',
            type: 'navigate',
            payload: '/bookings',
            icon: 'Calendar',
          },
        ],
      }
    }

    if (liveContext?.recentPastBooking?.isPaid && liveContext.recentPastBooking.receiptNumber) {
      const rb = liveContext.recentPastBooking
      return {
        sourceType: 'application_data',
        textEn: `📄 **Official Receipt for Previous Service**\n\n- **Service**: ${rb.categoryName}\n- **Receipt Number**: ${rb.receiptNumber}\n- **Receipt Date/Time**: ${rb.receiptPaidAt ? new Date(rb.receiptPaidAt).toLocaleString('en-IN') : 'Confirmed at job completion'}\n- **Amount Paid**: ₹${rb.finalPayableAmount !== null ? rb.finalPayableAmount.toFixed(2) : '0.00'}\n- **Payment Method**: ${rb.paymentMethod || 'Cash'}\n- **Status**: PAID\n\nYou can review this receipt in your My Bookings tab.`,
        textHi: `📄 **पिछली सेवा की आधिकारिक रसीद**\n\n- **सेवा**: ${rb.categoryName}\n- **रसीद संख्या**: ${rb.receiptNumber}\n- **रसीद दिनांक/समय**: ${rb.receiptPaidAt ? new Date(rb.receiptPaidAt).toLocaleString('hi-IN') : 'काम पूरा होने पर प्रमाणित'}\n- **भुगतान राशि**: ₹${rb.finalPayableAmount !== null ? rb.finalPayableAmount.toFixed(2) : '0.00'}\n- **भुगतान माध्यम**: ${rb.paymentMethod || 'Cash'}\n- **स्थिति**: भुगतान पूर्ण (PAID)\n\nआप My Bookings टैब में इस रसीद को देख सकते हैं।`,
        actions: [
          {
            id: 'act_view_receipt',
            labelEn: 'View Receipt',
            labelHi: 'रसीद देखें',
            type: 'navigate',
            payload: '/bookings',
            icon: 'Calendar',
          },
        ],
      }
    }

    return {
      sourceType: 'unknown',
      textEn: `📄 **Receipt Information**\n\nNo official receipt is found for your account. Receipts are generated only after cash payment is confirmed upon completion of a service booking.`,
      textHi: `📄 **रसीद जानकारी**\n\nआपके खाते के लिए कोई आधिकारिक रसीद नहीं मिली। रसीद केवल सेवा पूरी होने और नकद भुगतान की पुष्टि होने के बाद ही जनरेट होती है।`,
      actions: [
        {
          id: 'act_go_bookings',
          labelEn: 'View My Bookings',
          labelHi: 'मेरी बुकिंग्स देखें',
          type: 'navigate',
          payload: '/bookings',
          icon: 'Calendar',
        },
      ],
    }
  }

  // 3. Extra charges or pricing disputes
  if (query.includes('charge') || query.includes('price') || query.includes('money') || query.includes('extra') || query.includes('quote') || query.includes('ज़्यादा') || query.includes('पैसे') || query.includes('चार्ज') || query.includes('रेट')) {
    if (pb && (pb.initialQuoteAmount !== null || pb.finalPayableAmount !== null)) {
      const quoteStr = pb.initialQuoteAmount !== null ? `₹${pb.initialQuoteAmount.toFixed(2)}` : 'Awaiting quote'
      const finalStr = pb.finalPayableAmount !== null ? `₹${pb.finalPayableAmount.toFixed(2)}` : quoteStr
      const extraStr = pb.approvedAdditionalAmount && pb.approvedAdditionalAmount > 0
        ? `\n- **Approved Additional Work**: ₹${pb.approvedAdditionalAmount.toFixed(2)}`
        : ''
      const pendingStr = pb.pendingAdditionalCount > 0
        ? `\n- **Pending Change Requests**: ${pb.pendingAdditionalCount} request(s) totaling ₹${pb.pendingAdditionalAmount.toFixed(2)} (Awaiting your approval in the app)`
        : ''

      return {
        sourceType: 'application_data',
        textEn: `💰 **Authoritative Payment & Quote Details**\n\n- **Service**: ${pb.categoryName} (${pb.status})\n- **Initial Agreed Quote**: ${quoteStr}${extraStr}${pendingStr}\n- **Total Payable Amount**: ${finalStr}\n- **Payment Status**: ${pb.paymentStatus?.toUpperCase() || 'UNPAID'} (Paid directly in Cash)\n\n*(Rule: Never pay unapproved off-book cash. All additional work charges must be approved by you in the app before payment.)*`,
        textHi: `💰 **स्वीकृत भुगतान व कोटेशन विवरण**\n\n- **सेवा**: ${pb.categoryName} (${pb.status})\n- **प्रारंभिक स्वीकृत कोटेशन**: ${quoteStr}${extraStr}${pendingStr}\n- **कुल देय राशि**: ${finalStr}\n- **भुगतान स्थिति**: ${pb.paymentStatus || 'लंबित'} (सीधे नकद / Cash)\n\n*(नियम: बिना ऐप स्वीकृति के कोई अतिरिक्त नकद न दें। सभी अतिरिक्त चार्ज भुगतान से पहले ऐप में स्वीकृत होने चाहिए।)*`,
        actions: [
          {
            id: 'act_go_bookings',
            labelEn: 'Check Booking Payment',
            labelHi: 'भुगतान विवरण देखें',
            type: 'navigate',
            payload: '/bookings',
            icon: 'Calendar',
          },
        ],
      }
    }

    return {
      sourceType: 'jugnu_rule',
      textEn: `💰 **Pricing & Additional Charges Policy**\n\n- **Agreed Quote**: The initial accepted quote is fixed on your booking card.\n- **Additional Work**: If extra work or spare parts are needed, the artisan **must submit a change request in the app**.\n- **Customer Approval Required**: You will see the additional amount on your screen and must approve it before payment.\n- **Important**: Do not pay unapproved offline charges. Only pay the final amount confirmed in the application.`,
      textHi: `💰 **अतिरिक्त शुल्क और मूल्य निर्धारण नियम**\n\n- **स्वीकृत कोटेशन**: प्रारंभिक स्वीकृत राशि आपके बुकिंग कार्ड पर तय होती है।\n- **अतिरिक्त कार्य**: यदि अतिरिक्त काम या स्पेयर पार्ट्स की आवश्यकता हो, तो कारीगर को **ऐप में अतिरिक्त शुल्क अनुरोध** भेजना होगा।\n- **आपकी स्वीकृति आवश्यक**: आप अपनी स्क्रीन पर अतिरिक्त राशि देखेंगे और भुगतान से पहले उसे स्वीकृत करना होगा।\n- **महत्वपूर्ण**: बिना ऐप स्वीकृति के कोई अतिरिक्त नकद न दें। केवल ऐप में पुष्टि की गई राशि ही दें।`,
      actions: [
        {
          id: 'act_go_bookings',
          labelEn: 'Check Booking Details',
          labelHi: 'बुकिंग विवरण देखें',
          type: 'navigate',
          payload: '/bookings',
          icon: 'Calendar',
        },
      ],
    }
  }

  // 4. Booking status inquiry
  if (query.includes('status') || query.includes('booking') || query.includes('स्थिति') || query.includes('बुकिंग')) {
    if (pb) {
      return {
        sourceType: 'application_data',
        textEn: `📋 **Your Current Booking Status**\n\n- **Service**: ${pb.categoryName}\n- **Booking ID**: ${pb.id.slice(0, 8)}...\n- **Status**: ${pb.status.toUpperCase()}\n- **Assigned Artisan**: ${pb.counterpartyName}\n- **Scheduled Appointment Slot**: ${pb.scheduledAt ? new Date(pb.scheduledAt).toLocaleString('en-IN') : 'Flexible appointment'} *(Scheduled slot only; live transit ETA is unavailable)*\n- **Final Payable Amount**: ₹${pb.finalPayableAmount !== null ? pb.finalPayableAmount.toFixed(2) : (pb.initialQuoteAmount !== null ? pb.initialQuoteAmount.toFixed(2) : '0.00')} (${pb.paymentStatus?.toUpperCase() || 'UNPAID'})`,
        textHi: `📋 **आपकी वर्तमान बुकिंग स्थिति**\n\n- **सेवा**: ${pb.categoryName}\n- **बुकिंग ID**: ${pb.id.slice(0, 8)}...\n- **स्थिति**: ${pb.status}\n- **निर्धारित कारीगर**: ${pb.counterpartyName}\n- **निर्धारित अपॉइंटमेंट स्लॉट**: ${pb.scheduledAt ? new Date(pb.scheduledAt).toLocaleString('hi-IN') : 'लचीला समय'} *(केवल निर्धारित स्लॉट; लाइव ट्रांजिट ETA उपलब्ध नहीं)*\n- **देय राशि**: ₹${pb.finalPayableAmount !== null ? pb.finalPayableAmount.toFixed(2) : (pb.initialQuoteAmount !== null ? pb.initialQuoteAmount.toFixed(2) : '0.00')} (${pb.paymentStatus || 'लंबित'})`,
        actions: [
          {
            id: 'act_go_bookings',
            labelEn: 'View Booking Details',
            labelHi: 'बुकिंग विवरण देखें',
            type: 'navigate',
            payload: '/bookings',
            icon: 'Calendar',
          },
        ],
      }
    }

    return {
      sourceType: 'unknown',
      textEn: `📋 **Booking Status**\n\nI don't have enough context to answer for a specific booking because you do not have an active booking right now. You can browse categories to book a service or visit **My Bookings** to view past bookings.`,
      textHi: `📋 **बुकिंग स्थिति**\n\nवर्तमान में आपकी कोई सक्रिय बुकिंग नहीं होने के कारण मेरे पास विशिष्ट बुकिंग का विवरण नहीं है। आप सेवा बुक करने के लिए श्रेणियाँ देख सकते हैं या पिछली बुकिंग्स देखने के लिए **My Bookings** पर जा सकते हैं।`,
      actions: [
        {
          id: 'act_browse_categories',
          labelEn: 'Browse Categories',
          labelHi: 'श्रेणियाँ देखें',
          type: 'navigate',
          payload: '/categories',
          icon: 'Search',
        },
      ],
    }
  }

  // 5. Cancellation inquiry
  if (query.includes('cancel') || query.includes('रद्द')) {
    if (pb) {
      return {
        sourceType: 'application_data',
        textEn: `❌ **Booking Cancellation Guidance**\n\n- **Service**: ${pb.categoryName} (${pb.status.toUpperCase()})\n- **How to Cancel**: AI Support is read-only and cannot cancel bookings on your behalf. You can manage or cancel your booking directly from your active booking card in **My Bookings**.\n- Note: If an artisan has already been assigned and is en route, please also notify them via the Call Artisan option.`,
        textHi: `❌ **बुकिंग रद्द करने संबंधी दिशानिर्देश**\n\n- **सेवा**: ${pb.categoryName} (${pb.status})\n- **रद्द करने की प्रक्रिया**: AI सपोर्ट केवल जानकारी देने के लिए है और आपकी ओर से बुकिंग रद्द नहीं कर सकता। आप **My Bookings** में अपने बुकिंग कार्ड से सीधे बुकिंग रद्द कर सकते हैं।\n- ध्यान दें: यदि कारीगर असाइन हो चुका है, तो कृपया 'कारीगर को कॉल करें' (Call Artisan) विकल्प से उन्हें भी सूचित कर दें।`,
        actions: [
          {
            id: 'act_go_bookings',
            labelEn: 'Open Booking to Cancel',
            labelHi: 'रद्द करने हेतु बुकिंग खोलें',
            type: 'navigate',
            payload: '/bookings',
            icon: 'Calendar',
          },
        ],
      }
    }

    return {
      sourceType: 'unknown',
      textEn: `❌ **Cancellation Information**\n\nYou do not have an active booking to cancel right now. If you have questions about cancellation policies, bookings can be cancelled by customers from the booking card in **My Bookings**.`,
      textHi: `❌ **बुकिंग रद्द करने की जानकारी**\n\nवर्तमान में आपके पास रद्द करने के लिए कोई सक्रिय बुकिंग नहीं है। बुकिंग रद्द करने के नियम के अनुसार, ग्राहक **My Bookings** में अपने बुकिंग कार्ड से रद्द कर सकते हैं।`,
      actions: [
        {
          id: 'act_go_bookings',
          labelEn: 'View My Bookings',
          labelHi: 'मेरी बुकिंग्स देखें',
          type: 'navigate',
          payload: '/bookings',
          icon: 'Calendar',
        },
      ],
    }
  }

  // 6. Complaints, Quality issues, Disputes, or Ticket Inquiries
  if (
    query.includes('complaint') ||
    query.includes('quality') ||
    query.includes('bad') ||
    query.includes('issue') ||
    query.includes('dispute') ||
    query.includes('overcharge') ||
    query.includes('ticket') ||
    query.includes('escalat') ||
    query.includes('problem') ||
    query.includes('शिकायत') ||
    query.includes('समस्या') ||
    query.includes('विवाद') ||
    query.includes('खराब')
  ) {
    // A) If an active complaint already exists on primary booking:
    if (pb?.activeComplaint) {
      return {
        sourceType: 'application_data',
        textEn: `🛡️ **Existing Support Request on Record**\n\n- **Service**: ${pb.categoryName} (#JUG-${pb.id.slice(0, 8).toUpperCase()})\n- **Complaint Reference**: #CMP-${pb.activeComplaint.id.slice(0, 8).toUpperCase()}\n- **Current Status**: ${pb.activeComplaint.status.toUpperCase()}\n- **Filed On**: ${new Date(pb.activeComplaint.createdAt).toLocaleString('en-IN')}\n\nOur administration team reviews all submitted requests to maintain platform standards in Muzaffarnagar. Complaints are not automatically escalated. AI Support is strictly read-only and cannot alter complaint statuses. You can review all your submitted requests in Support History.`,
        textHi: `🛡️ **दर्ज सहायता अनुरोध विवरण**\n\n- **सेवा**: ${pb.categoryName} (#JUG-${pb.id.slice(0, 8).toUpperCase()})\n- **शिकायत संदर्भ संख्या**: #CMP-${pb.activeComplaint.id.slice(0, 8).toUpperCase()}\n- **वर्तमान स्थिति**: ${pb.activeComplaint.status.toUpperCase()}\n- **दर्ज दिनांक**: ${new Date(pb.activeComplaint.createdAt).toLocaleString('hi-IN')}\n\nहमारी व्यवस्थापक टीम सेवा मानकों की रक्षा हेतु सभी अनुरोधों की समीक्षा करती है। शिकायतें स्वतः एस्केलेट नहीं होती हैं। AI सपोर्ट केवल जानकारी प्रदान करता है और इसमें स्वतः बदलाव नहीं कर सकता। आप शिकायत इतिहास में अपने सभी अनुरोध देख सकते हैं।`,
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
            id: 'act_go_bookings',
            labelEn: 'View Booking',
            labelHi: 'बुकिंग देखें',
            type: 'navigate',
            payload: '/bookings',
            icon: 'Calendar',
          },
        ],
      }
    }

    // B) If primary booking exists without an active complaint, offer structured support confirmation flow:
    if (pb) {
      return {
        sourceType: 'application_data',
        textEn: `🛡️ **Report an Issue with ${pb.categoryName}**\n\n- **Booking ID**: #JUG-${pb.id.slice(0, 8).toUpperCase()}\n- **Assigned Artisan**: ${pb.counterpartyName}\n- **Booking Status**: ${pb.status.toUpperCase()}\n\nIf you experienced unauthorized charges, incomplete repair, conduct issues, or other disputes, you can submit an official support request for review by our moderation team.\n\n*(Note: The AI assistant cannot create complaints automatically. Please tap 'File Support Request' below to review the booking details and confirm your submission.)*`,
        textHi: `🛡️ **${pb.categoryName} सेवा संबंधी समस्या दर्ज करें**\n\n- **बुकिंग ID**: #JUG-${pb.id.slice(0, 8).toUpperCase()}\n- **निर्धारित कारीगर**: ${pb.counterpartyName}\n- **स्थिति**: ${pb.status}\n\nयदि आपको अतिरिक्त शुल्क, अधूरा काम, या सेवा गुणवत्ता संबंधी कोई समस्या है, तो आप मॉडरेशन टीम की समीक्षा हेतु आधिकारिक सहायता अनुरोध दर्ज कर सकते हैं।\n\n*(सूचना: AI सहायक स्वतः कोई शिकायत दर्ज नहीं करता है। बुकिंग विवरण की समीक्षा करने और सबमिट करने के लिए कृपया नीचे 'सहायता अनुरोध दर्ज करें' पर टैप करें।)*`,
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
            id: 'act_go_bookings',
            labelEn: 'View Booking',
            labelHi: 'बुकिंग देखें',
            type: 'navigate',
            payload: '/bookings',
            icon: 'Calendar',
          },
        ],
      }
    }

    // C) If recent past booking exists:
    if (liveContext?.recentPastBooking) {
      const rb = liveContext.recentPastBooking
      return {
        sourceType: 'application_data',
        textEn: `🛡️ **Support for Previous Booking**\n\nYou do not have an ongoing active booking, but you have a past booking on record:\n\n- **Service**: ${rb.categoryName} (#JUG-${rb.id.slice(0, 8).toUpperCase()})\n- **Status**: ${rb.status.toUpperCase()}\n\nWould you like to file a support request for this completed job? Tap 'File Support Request' below to review and submit.`,
        textHi: `🛡️ **पिछली बुकिंग हेतु सहायता**\n\nवर्तमान में कोई सक्रिय बुकिंग नहीं है, परंतु आपके रिकॉर्ड में पिछली बुकिंग उपलब्ध है:\n\n- **सेवा**: ${rb.categoryName} (#JUG-${rb.id.slice(0, 8).toUpperCase()})\n- **स्थिति**: ${rb.status}\n\nक्या आप इस काम के लिए सहायता अनुरोध दर्ज करना चाहते हैं? समीक्षा और सबमिट करने के लिए नीचे 'सहायता अनुरोध दर्ज करें' पर टैप करें।`,
        actions: [
          {
            id: 'act_support_request',
            labelEn: 'File Support Request',
            labelHi: 'सहायता अनुरोध दर्ज करें',
            type: 'create_support_request',
            payload: rb.id,
            icon: 'AlertCircle',
          },
          {
            id: 'act_go_bookings',
            labelEn: 'View My Bookings',
            labelHi: 'मेरी बुकिंग्स देखें',
            type: 'navigate',
            payload: '/bookings',
            icon: 'Calendar',
          },
        ],
      }
    }

    // E) No bookings on record:
    return {
      sourceType: 'unknown',
      textEn: `🛡️ **Service Quality & Support**\n\nOfficial support requests and complaints must be linked to a specific service booking. No bookings were found for your account.\n\n- If you need a home repair service in Muzaffarnagar, please browse available categories.\n- All registered artisans are verified local professionals.`,
      textHi: `🛡️ **सेवा गुणवत्ता एवं सहायता**\n\nआधिकारिक सहायता अनुरोध या शिकायत किसी विशिष्ट बुकिंग से जुड़ी होनी चाहिए। आपके खाते में कोई बुकिंग नहीं मिली।\n\n- यदि आपको मुज़फ़्फ़रनगर में किसी सेवा की आवश्यकता है, तो कृपया श्रेणियाँ देखें।\n- सभी पंजीकृत कारीगर सत्यापित स्थानीय पेशेवर हैं।`,
      actions: [
        {
          id: 'act_browse_categories',
          labelEn: 'Browse Categories',
          labelHi: 'श्रेणियाँ देखें',
          type: 'navigate',
          payload: '/categories',
          icon: 'Search',
        },
      ],
    }
  }

  // 7. Default Help & Support response
  return {
    sourceType: 'general_guidance',
    textEn: `🛡️ **Jugnu Help & Support**\n\n- We are here to help you navigate bookings, understand platform policies, and resolve concerns in Muzaffarnagar.\n- For active job updates, assigned worker contact, and receipts, please visit your **My Bookings** tab.\n- Note: Jugnu platform support phone calls are not supported; customer support is managed directly inside the app.\n- How else can we assist you with Jugnu services today?`,
    textHi: `🛡️ **जुगनू सहायता एवं सहयोग**\n\n- हम मुज़फ़्फ़रनगर में बुकिंग संबंधी जानकारी, नियमों और समस्याओं के समाधान में आपकी सहायता के लिए उपलब्ध हैं।\n- सक्रिय बुकिंग, कारीगर संपर्क और रसीद देखने के लिए कृपया **My Bookings** टैब पर जाएँ।\n- ध्यान दें: जुगनू प्लेटफॉर्म सहायता के लिए फोन कॉल समर्थित नहीं है; सहायता सीधे ऐप में दी जाती है।\n- आज हम आपकी किस प्रकार सहायता कर सकते हैं?`,
    actions: [
      {
        id: 'act_go_bookings',
        labelEn: 'My Bookings',
        labelHi: 'मेरी बुकिंग्स',
        type: 'navigate',
        payload: '/bookings',
        icon: 'Calendar',
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
      textEn: `💼 **Active Job Information**\n\n- **Service**: ${pb.categoryName}\n- **Customer**: ${pb.counterpartyName}\n- **Job Status**: ${pb.status.toUpperCase()}\n- **Agreed Initial Quote**: ₹${pb.initialQuoteAmount?.toFixed(2) || '0.00'}\n- **Final Amount**: ₹${pb.finalPayableAmount?.toFixed(2) || '0.00'}\n- **Payment Status**: ${pb.paymentStatus?.toUpperCase() || 'UNPAID'} (Cash upon completion)\n${pb.pendingAdditionalCount > 0 ? `- **Notice**: ${pb.pendingAdditionalCount} change request(s) awaiting customer approval.\n` : ''}${liveContext?.workerCompletedJobsCount !== undefined ? `- **Your Completed Jobs on Jugnu**: ${liveContext.workerCompletedJobsCount}\n` : ''}`,
      textHi: `💼 **सक्रिय काम की जानकारी**\n\n- **सेवा**: ${pb.categoryName}\n- **ग्राहक**: ${pb.counterpartyName}\n- **काम की स्थिति**: ${pb.status}\n- **स्वीकृत कोटेशन**: ₹${pb.initialQuoteAmount?.toFixed(2) || '0.00'}\n- **अंतिम राशि**: ₹${pb.finalPayableAmount?.toFixed(2) || '0.00'}\n- **भुगतान स्थिति**: ${pb.paymentStatus || 'लंबित'} (काम पूरा होने पर नकद)\n${pb.pendingAdditionalCount > 0 ? `- **सूचना**: ${pb.pendingAdditionalCount} अतिरिक्त शुल्क अनुरोध ग्राहक स्वीकृति के लिए लंबित है।\n` : ''}${liveContext?.workerCompletedJobsCount !== undefined ? `- **जुगनू पर पूरे किए गए काम**: ${liveContext.workerCompletedJobsCount}\n` : ''}`,
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
        textEn: `🛡️ **Support Request on Record**\n\n- **Service**: ${pb.categoryName} (#JUG-${pb.id.slice(0, 8).toUpperCase()})\n- **Complaint Reference**: #CMP-${pb.activeComplaint.id.slice(0, 8).toUpperCase()}\n- **Status**: ${pb.activeComplaint.status.toUpperCase()}\n- **Filed On**: ${new Date(pb.activeComplaint.createdAt).toLocaleString('en-IN')}\n\nOur administration team reviews all disputes between artisans and customers. AI Support is read-only and cannot alter complaint statuses. You can review your submitted requests in Support History.`,
        textHi: `🛡️ **दर्ज सहायता अनुरोध विवरण**\n\n- **सेवा**: ${pb.categoryName} (#JUG-${pb.id.slice(0, 8).toUpperCase()})\n- **शिकायत संदर्भ संख्या**: #CMP-${pb.activeComplaint.id.slice(0, 8).toUpperCase()}\n- **वर्तमान स्थिति**: ${pb.activeComplaint.status.toUpperCase()}\n- **दर्ज दिनांक**: ${new Date(pb.activeComplaint.createdAt).toLocaleString('hi-IN')}\n\nहमारी व्यवस्थापक टीम कारीगरों व ग्राहकों के बीच विवादों की समीक्षा करती है। AI सहायक स्वतः कोई बदलाव नहीं कर सकता। आप शिकायत इतिहास में अपने अनुरोध देख सकते हैं।`,
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
      textEn: `💬 **Polite Customer Message Template**\n\n"नमस्ते! मैं जुगनू (Jugnu) से आपका कारीगर बोल रहा हूँ। मुझे आपकी बुकिंग प्राप्त हुई है। मैं काम के लिए प्रस्थान कर रहा हूँ और जल्द ही आपके पते पर पहुँच रहा हूँ। धन्यवाद।"\n\n- Tip: Clear, polite communication builds strong ratings and repeat customers.`,
      textHi: `💬 **सम्मानजनक ग्राहक मैसेज टेम्पलेट**\n\n"नमस्ते! मैं जुगनू (Jugnu) से आपका कारीगर बोल रहा हूँ। मुझे आपकी बुकिंग प्राप्त हुई है। मैं काम के लिए प्रस्थान कर रहा हूँ और जल्द ही आपके पते पर पहुँच रहा हूँ। धन्यवाद।"\n\n- सुझाव: समय पर और स्पष्ट बातचीत से अच्छी रेटिंग और दोबारा काम मिलता है।`,
      actions: [
        {
          id: 'act_copy_template',
          labelEn: 'Copy Message Template',
          labelHi: 'मैसेज कॉपी करें',
          type: 'copy_text',
          payload: 'नमस्ते! मैं जुगनू से आपका कारीगर बोल रहा हूँ। मुझे आपकी बुकिंग प्राप्त हुई है और मैं आपके पते पर पहुँच रहा हूँ।',
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
    textEn: `💼 **Jugnu Work Advice**\n\n- Welcome to Jugnu Artisan Support. Here to help you build a reputable local service business in Muzaffarnagar.\n- Keep your status active during your working hours to receive local job quote requests.\n- Receive 100% of customer payments directly in Cash upon verified job completion.`,
    textHi: `💼 **जुगनू काम व सेवा सलाह**\n\n- जुगनू कारीगर सहायता में आपका स्वागत है। मुज़फ़्फ़रनगर में एक सफल सेवा व्यवसाय बनाने में हम आपके साथी हैं।\n- काम के समय अपनी ड्यूटी चालू रखें ताकि नए कोटेशन अनुरोध मिल सकें।\n- काम पूरा होने पर सीधे नकद (Cash) में पूरा भुगतान प्राप्त करें।`,
    actions: [],
  }
}
