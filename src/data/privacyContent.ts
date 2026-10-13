export interface PrivacySection {
  id: number
  slug: string
  title: string
  paragraphs: string[]
  listItems?: string[]
}

export interface PrivacyDocument {
  title: string
  subtitle: string
  lastUpdated: string
  sections: PrivacySection[]
}

export const PRIVACY_EN: PrivacyDocument = {
  title: 'DoneKaro — Privacy Policy',
  subtitle: 'How we collect, use, protect, and delete your personal data. Transparent and 0% commission.',
  lastUpdated: '13 October 2026',
  sections: [
    {
      id: 1,
      slug: 'overview',
      title: '1. Overview & Platform Purpose',
      paragraphs: [
        'DoneKaro ("we", "us", or "our") operates the DoneKaro mobile application and the website https://done-karo.vercel.app. Our platform connects customers in Muzaffarnagar with verified local skilled artisans and technicians (electricians, plumbers, AC technicians, carpenters, and appliance repair specialists) with 0% commission.',
        'This Privacy Policy explains what personal information we collect, why we collect it, how it is secured, and your rights to manage or delete your data under applicable laws and Google Play User Data policies.',
      ],
    },
    {
      id: 2,
      slug: 'data-collected',
      title: '2. Personal Data We Collect',
      paragraphs: [
        'We collect only the minimum necessary information required to facilitate secure local services and authenticate users:',
      ],
      listItems: [
        'Mobile Number: Used for passwordless authentication via MSG91 SMS OTP and booking communications between customers and artisans.',
        'Full Name: Used to identify you on booking receipts, quotation cards, and service requests.',
        'Service Locality & Address: Service area and locality in Muzaffarnagar (such as Pincode 251001 or 251002) to match nearby artisans with customers.',
        'Verification Documents (ID / Address Proof): Artisans and registered users upload documents for safety and address verification. These files are stored in private, access-controlled cloud storage buckets with strict Row-Level Security.',
        'Booking & Transaction Records: Details of requested services, quotes, appointment dates, and payment confirmations to maintain accurate transaction receipts.',
        'Device & Push Notification Data: When enabled, temporary push tokens are used solely to deliver real-time service alerts (such as quotation arrival or booking status updates).',
      ],
    },
    {
      id: 3,
      slug: 'data-usage',
      title: '3. How We Use Your Information',
      paragraphs: [
        'We use your data strictly for legitimate operational purposes:',
      ],
      listItems: [
        'To authenticate your account via verified one-time passwords (OTP).',
        'To facilitate direct service arrangements between customers and local artisans.',
        'To generate verifiable booking receipts and transaction summaries.',
        'To prevent platform abuse, impersonation, fraudulent profiles, and disputes.',
        'To deliver system notifications and service alerts regarding your bookings.',
      ],
    },
    {
      id: 4,
      slug: 'data-sharing',
      title: '4. Third-Party Services & Data Sharing',
      paragraphs: [
        'DoneKaro NEVER sells, rents, or commercializes your personal data to advertisers, brokers, or marketing networks.',
        'We share data only with essential infrastructure processors required to run the service:',
      ],
      listItems: [
        'Supabase Inc.: Cloud database, authentication engine, and private document storage with end-to-end encryption.',
        'MSG91 / Walkover Web Solutions: Telecommunications gateway used exclusively for transmitting transactional SMS OTP codes.',
        'Law Enforcement / Legal Compliance: Only when legally mandated by court order or competent government authority in connection with disputed incidents or fraud investigations.',
      ],
    },
    {
      id: 5,
      slug: 'security',
      title: '5. Data Security & Storage Architecture',
      paragraphs: [
        'All data in transit is encrypted using industry-standard TLS 1.3 / HTTPS encryption.',
        'Database records are protected by PostgreSQL Row-Level Security (RLS) policies, ensuring that users can only access their own profile and authorized booking participant records.',
        'Uploaded identification documents are stored in private, non-public storage buckets and are accessible only to the document owner and authorized administrators for verification purposes.',
      ],
    },
    {
      id: 6,
      slug: 'account-deletion',
      title: '6. Account Deletion & Data Erasure (Google Play Compliant)',
      paragraphs: [
        'In compliance with Google Play User Data policies, DoneKaro enables users to request permanent deletion of their account and associated personal data.',
        'Online Deletion Request: Users can submit an account and data erasure request at any time by opening the dedicated deletion route at https://done-karo.vercel.app/delete-account or https://done-karo.vercel.app/privacy#account-deletion, or by contacting our platform administrator through the in-app Help Center with their registered 10-digit mobile number.',
        'Processing & Administrative Verification: Because self-service immediate deletion is disabled to prevent accidental loss and verify active financial transactions, deletion requests are verified and processed by authorized administrators within 48 to 72 hours.',
        'Consequences of Deletion: Upon administrative execution, your user profile, authentication credentials, mobile number binding, uploaded verification documents, and active sessions will be permanently erased. Historical booking transaction receipts may be anonymized and retained only for the duration required by applicable accounting, financial, and dispute resolution legal requirements.',
      ],
    },
    {
      id: 7,
      slug: 'user-rights',
      title: '7. Your Rights & Grievance Contact',
      paragraphs: [
        'You have the right to access your stored profile details, correct inaccurate information, withdraw notification permissions, and request deletion of your account.',
        'For privacy questions, account deletion requests, or grievance redressal, please contact our administrative team via:',
        'Platform URL: https://done-karo.vercel.app | Support: Help Center & AI Assistant within the DoneKaro App | Muzaffarnagar, Uttar Pradesh, India',
      ],
    },
  ],
}

export const PRIVACY_HI: PrivacyDocument = {
  title: 'DoneKaro — गोपनीयता नीति (Privacy Policy)',
  subtitle: 'हम आपकी व्यक्तिगत जानकारी कैसे एकत्र, सुरक्षित और उपयोग करते हैं। पारदर्शी और 0% कमीशन प्लेटफ़ॉर्म।',
  lastUpdated: '13 अक्टूबर 2026',
  sections: [
    {
      id: 1,
      slug: 'overview',
      title: '1. अवलोकन एवं प्लेटफ़ॉर्म का उद्देश्य',
      paragraphs: [
        'DoneKaro ("हम" या "हमारा") DoneKaro मोबाइल एप्लिकेशन और वेबसाइट https://done-karo.vercel.app का संचालन करता है। हमारा उद्देश्य मुजफ्फरनगर में ग्राहकों को सीधे स्थानीय कुशल कारीगरों और तकनीशियनों (इलेक्ट्रीशियन, प्लंबर, एसी मैकेनिक, बढ़ई, उपकरण मरम्मत विशेषज्ञ) से 0% कमीशन पर जोड़ना है।',
        'यह गोपनीयता नीति बताती है कि हम क्या जानकारी एकत्र करते हैं, इसे कैसे सुरक्षित रखा जाता है, और Google Play की उपयोगकर्ता डेटा नीतियों के अनुसार आपका अपनी जानकारी पर क्या नियंत्रण है।',
      ],
    },
    {
      id: 2,
      slug: 'data-collected',
      title: '2. हम कौन सा डेटा एकत्र करते हैं',
      paragraphs: [
        'हम केवल वही जानकारी लेते हैं जो सेवा प्रदान करने और सुरक्षा के लिए अनिवार्य है:',
      ],
      listItems: [
        'मोबाइल नंबर: MSG91 SMS OTP के माध्यम से सुरक्षित लॉगिन और बुकिंग संपर्क के लिए।',
        'पूरा नाम: बुकिंग रसीद, कोटेशन और सेवा अनुरोधों पर पहचान के लिए।',
        'इलाका व पता: मुजफ्फरनगर में सेवा क्षेत्र (जैसे पिनकोड 251001 या 251002) ताकि निकटतम कामगार से संपर्क हो सके।',
        'सत्यापन दस्तावेज़ (आईडी / पता प्रमाण): कामगारों और उपयोगकर्ताओं द्वारा सुरक्षा सत्यापन के लिए अपलोड किए गए दस्तावेज़। ये केवल निजी, सुरक्षित क्लाउड स्टोरेज में रखे जाते हैं।',
        'बुकिंग व लेन-देन का रिकॉर्ड: सेवा विवरण, कोटेशन, तारीख और भुगतान पुष्टि की आधिकारिक रसीद के लिए।',
        'डिवाइस व पुश नोटिफिकेशन डेटा: बुकिंग की लाइव स्थिति और कोटेशन अलर्ट सीधे आपके फोन पर भेजने के लिए।',
      ],
    },
    {
      id: 3,
      slug: 'data-usage',
      title: '3. डेटा का उपयोग कैसे किया जाता है',
      paragraphs: [
        'आपकी जानकारी का उपयोग केवल वैध प्लेटफ़ॉर्म कार्यों के लिए होता है:',
      ],
      listItems: [
        'ओटीपी (OTP) द्वारा आपके खाते को सुरक्षित रूप से सत्यापित करने के लिए।',
        'ग्राहक और कामगार के बीच बिना बिचौलियों के सीधी सेवा व्यवस्था के लिए।',
        'सत्यापित डिजिटल बुकिंग रसीद तैयार करने के लिए।',
        'धोखाधड़ी, फर्जी प्रोफाइल और विवादों को रोकने के लिए।',
        'आपकी बुकिंग से संबंधित महत्वपूर्ण सूचनाएं (Notifications) भेजने के लिए।',
      ],
    },
    {
      id: 4,
      slug: 'data-sharing',
      title: '4. डेटा सुरक्षा एवं थर्ड-पार्टी सेवाएं',
      paragraphs: [
        'DoneKaro आपका व्यक्तिगत डेटा किसी भी विज्ञापनदाता, ब्रोकर या मार्केटिंग कंपनी को कभी नहीं बेचता है।',
        'डेटा केवल अनिवार्य तकनीकी प्रदाताओं के साथ साझा किया जाता है:',
      ],
      listItems: [
        'Supabase Inc.: सुरक्षित क्लाउड डेटाबेस और एन्क्रिप्टेड स्टोरेज के लिए।',
        'MSG91: केवल आधिकारिक एसएमएस ओटीपी भेजने के लिए।',
        'कानूनी आवश्यकता: केवल अदालत या सक्षम कानूनी अधिकारियों के आधिकारिक आदेश पर।',
      ],
    },
    {
      id: 5,
      slug: 'security',
      title: '5. डेटा सुरक्षा और एन्क्रिप्शन',
      paragraphs: [
        'सभी डेटा HTTPS / TLS 1.3 एन्क्रिप्शन के साथ स्थानांतरित किया जाता है।',
        'डेटाबेस रिकॉर्ड्स Row-Level Security (RLS) द्वारा सुरक्षित हैं, जिससे केवल अधिकृत व्यक्ति ही अपना डेटा देख सकता है।',
        'अपलोड किए गए दस्तावेज़ निजी बकेट में सुरक्षित रहते हैं और केवल सत्यापन के लिए उपयोग होते हैं।',
      ],
    },
    {
      id: 6,
      slug: 'account-deletion',
      title: '6. खाता व डेटा हटाने की प्रक्रिया (Account Deletion)',
      paragraphs: [
        'Google Play नीतियों के अनुपालन में, DoneKaro उपयोगकर्ताओं को अपना खाता और उससे जुड़ा व्यक्तिगत डेटा स्थायी रूप से हटाने का अनुरोध करने की पूरी सुविधा देता है।',
        'ऑनलाइन हटाने का अनुरोध: उपयोगकर्ता https://done-karo.vercel.app/delete-account या https://done-karo.vercel.app/privacy#account-deletion पर जाकर, या ऐप में सहायता केंद्र (Help Center) के माध्यम से अपने पंजीकृत 10 अंकों के मोबाइल नंबर के साथ खाता हटाने का अनुरोध जमा कर सकते हैं।',
        'सत्यापन और प्रशासनिक प्रक्रिया: आकस्मिक डेटा हानि को रोकने और सक्रिय लेन-देन की सुरक्षा के लिए ऐप में स्वचालित स्व-हटाने (self-deletion) की सुविधा बंद रखी गई है। व्यवस्थापक द्वारा अनुरोध की पुष्टि 48 से 72 घंटों के भीतर की जाती है।',
        'खाता हटाने के परिणाम: प्रशासनिक पुष्टि के बाद आपका प्रोफ़ाइल, मोबाइल लॉगिन, अपलोड किए गए दस्तावेज़ और सक्रिय सत्र पूरी तरह हटा दिए जाएंगे। वित्तीय और कानूनी ऑडिट के लिए आवश्यक न्यूनतम रसीद रिकॉर्ड्स को कानूनन आवश्यक समय तक अनाम रूप में सुरक्षित रखा जा सकता है।',
      ],
    },
    {
      id: 7,
      slug: 'user-rights',
      title: '7. आपके अधिकार व संपर्क',
      paragraphs: [
        'आपको अपना डेटा देखने, सुधारने, नोटिफिकेशन अनुमतियां वापस लेने और खाता हटाने का अनुरोध करने का पूरा अधिकार है।',
        'किसी भी गोपनीयता प्रश्न, डेटा अनुरोध या सहायता के लिए संपर्क करें:',
        'प्लेटफ़ॉर्म: https://done-karo.vercel.app | सहायता: DoneKaro ऐप के अंदर सहायता केंद्र (Help Center) व AI सहायक | मुजफ्फरनगर, उत्तर प्रदेश, भारत',
      ],
    },
  ],
}

export function getPrivacyContent(language: string): PrivacyDocument {
  return language === 'hi' ? PRIVACY_HI : PRIVACY_EN
}
