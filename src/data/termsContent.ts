export interface TermsSection {
  id: number
  title: string
  paragraphs: string[]
}

export interface TermsDocument {
  title: string
  subtitle: string
  lastUpdated: string
  sections: TermsSection[]
}

export const TERMS_EN: TermsDocument = {
  title: 'DoneKaro — Terms & Conditions',
  subtitle: 'Official platform rules, user agreements, and service guidelines.',
  lastUpdated: '10 October 2026',
  sections: [
    {
      id: 1,
      title: '1. Use of DoneKaro',
      paragraphs: [
        'DoneKaro is a platform that helps customers connect with local service professionals (कामगार), request services, receive quotations, and manage bookings.',
        'By accessing or using DoneKaro and accepting these Terms & Conditions, you agree to comply with these terms and use the platform responsibly and only for lawful purposes.',
        'DoneKaro facilitates connections between customers and service professionals and helps maintain booking and transaction records. Unless expressly stated otherwise, DoneKaro does not directly perform the services arranged between customers and service professionals.',
        'Users are responsible for understanding the nature of the services they request or provide and for ensuring that their activities comply with applicable laws.',
      ],
    },
    {
      id: 2,
      title: '2. Bookings, Payments and Receipts',
      paragraphs: [
        'Customers and service professionals should arrange and manage their bookings through DoneKaro and maintain accurate records of the booking, agreed service, quotation, payment, and other relevant details.',
        'Before a booking is confirmed, customers should review the service details and quotation carefully and ensure that they understand the agreed price and scope of work.',
        'Once the work has been completed and the relevant payment has been properly recorded in accordance with the applicable payment process, users should obtain and retain the corresponding receipt through the app, where available.',
        'Booking records and receipts may help establish evidence of a transaction and reduce the risk of fraud, misunderstandings, or disagreements. Users should not rely solely on verbal agreements or payments that are not properly recorded.',
        'Users are responsible for ensuring that the information they provide regarding bookings and payments is accurate. Any payment confirmation or receipt issued through DoneKaro is subject to the actual transaction details and the applicable payment-recording process.',
      ],
    },
    {
      id: 3,
      title: '3. Service Agreements, Quotations and Payments',
      paragraphs: [
        "Customers should review and agree to a service professional's quotation before accepting a booking. Both parties should communicate clearly about the nature of the work, the agreed price, the expected scope of the service, and any additional work or charges.",
        'Any changes to the agreed work or price should be discussed and mutually agreed upon by the customer and the service professional before the additional work is undertaken, wherever reasonably practicable.',
        'Customers and service professionals are responsible for fulfilling their respective agreements, providing accurate information, and acting honestly in relation to the services and payments arranged through DoneKaro.',
        'DoneKaro provides a platform to facilitate these arrangements but does not guarantee that every user will fulfil their obligations or that every disagreement will be resolved.',
        'Users should promptly raise any concerns regarding the agreed service, price, work performed, or payment through the appropriate communication or support channels available on DoneKaro.',
      ],
    },
    {
      id: 4,
      title: '4. Safety, Responsibility and Limitation of Liability',
      paragraphs: [
        'Customers and service professionals are responsible for exercising reasonable care, following applicable laws, and maintaining a safe working environment.',
        'DoneKaro is a platform that facilitates connections between customers and service professionals and provides booking records and related transaction information. DoneKaro does not directly supervise every activity at a work site and does not guarantee the conduct of every user, the quality of every service, or that every work site will be free from risk.',
        "To the extent permitted by applicable law, DoneKaro shall not be responsible for injuries, theft, property damage, fraud, misconduct, disputes, financial losses, or other harm caused by the independent acts, omissions, negligence, or unlawful conduct of customers, service professionals, or other third parties, or arising from work performed at a site, except where such responsibility cannot legally be excluded or arises from DoneKaro's own acts or omissions.",
        'Users are responsible for assessing relevant risks, communicating clearly about the work and payment, and taking reasonable precautions before, during, and after a service.',
        'Nothing in these Terms excludes or limits any liability, duty, or responsibility that cannot be excluded or limited under applicable law.',
      ],
    },
    {
      id: 5,
      title: '5. Disputed Bookings, Records and Legal Matters',
      paragraphs: [
        'Users should complete bookings through DoneKaro and maintain accurate records of quotations, booking details, agreed prices, payments, receipts, messages, and other relevant transaction information.',
        'If a booking becomes disputed or an incident involving fraud, theft, damage, threats, harassment, non-payment, or other alleged misconduct occurs, DoneKaro may, subject to applicable law and its privacy obligations, provide available booking records, receipts, transaction details, communications, and other relevant documents or information to the affected parties or to competent legal authorities when legally permitted or required.',
        'Such records may be used by users to document a disputed booking, support a complaint, or pursue an appropriate legal remedy. Where legally permitted and reasonably available, DoneKaro may cooperate with lawful requests for relevant records or documentation.',
        'However, DoneKaro does not guarantee that such records will establish liability, resolve a dispute, result in the recovery of money or property, or lead to a particular legal outcome. Providing records does not mean that DoneKaro accepts responsibility for the underlying incident, loss, damage, or dispute, determines criminal or civil liability, or replaces the role of the police, courts, or other competent authorities.',
        'To the extent permitted by applicable law, DoneKaro is not responsible for losses arising from the independent actions or omissions of users or third parties merely because the disputed booking or transaction was arranged through the platform.',
        'Users should preserve relevant evidence and report serious incidents to the appropriate authorities where necessary. Nothing in this section prevents a user from exercising any right or remedy available under applicable law.',
      ],
    },
    {
      id: 6,
      title: '6. Accurate Information, Account Security and User Conduct',
      paragraphs: [
        'Users must provide accurate, complete, and up-to-date information when registering for or using DoneKaro. Users must not impersonate another person, misuse another person’s account, or provide false or misleading information about their identity, services, work, or payments.',
        'Users are responsible for maintaining the confidentiality of their account credentials and for taking reasonable steps to prevent unauthorized access to their accounts. Any suspected misuse or unauthorized access should be reported through the appropriate support channel.',
        'Users must treat one another respectfully and must not engage in fraud, theft, threats, harassment, discrimination, deliberate deception, or any other unlawful or abusive conduct through DoneKaro.',
        'DoneKaro may take appropriate action in response to suspected misuse, misconduct, inaccurate information, or violations of these Terms, subject to applicable law and the platform’s applicable policies.',
      ],
    },
    {
      id: 7,
      title: '7. Acceptance of These Terms',
      paragraphs: [
        'By accepting these Terms & Conditions or using DoneKaro where such acceptance is required, you acknowledge that you understand DoneKaro’s role as a platform that connects customers with service professionals and facilitates booking and transaction records.',
        'You acknowledge the importance of reviewing quotations, agreeing to service terms before proceeding, maintaining accurate booking and payment records, and exercising reasonable care when arranging or providing services.',
        'You agree to use DoneKaro responsibly and to comply with these Terms and applicable laws.',
        'These Terms do not remove or restrict any rights, protections, or remedies available to you under applicable law. If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue to apply to the extent permitted by law.',
      ],
    },
  ],
}

export const TERMS_HI: TermsDocument = {
  title: 'DoneKaro — नियम एवं शर्तें',
  subtitle: 'आधिकारिक प्लेटफ़ॉर्म नियम, उपयोगकर्ता अनुबंध एवं सेवा दिशानिर्देश।',
  lastUpdated: '10 अक्टूबर 2026',
  sections: [
    {
      id: 1,
      title: '1. DoneKaro का उपयोग',
      paragraphs: [
        'DoneKaro एक ऐसा प्लेटफ़ॉर्म है जो ग्राहकों को स्थानीय सेवा पेशेवरों (कामगारों) से जुड़ने, सेवाओं का अनुरोध करने, कोटेशन प्राप्त करने और बुकिंग प्रबंधित करने में मदद करता है।',
        'DoneKaro का उपयोग करके तथा इन नियमों एवं शर्तों को स्वीकार करके, आप इन शर्तों का पालन करने और प्लेटफ़ॉर्म का जिम्मेदारीपूर्वक तथा केवल कानूनी उद्देश्यों के लिए उपयोग करने के लिए सहमत होते हैं।',
        'DoneKaro ग्राहकों और सेवा पेशेवरों को जोड़ने तथा बुकिंग और लेन-देन से संबंधित रिकॉर्ड रखने में मदद करता है। जब तक स्पष्ट रूप से अन्यथा न बताया गया हो, DoneKaro ग्राहकों और सेवा पेशेवरों के बीच तय की गई सेवाओं को स्वयं सीधे प्रदान नहीं करता।',
        'उपयोगकर्ताओं की जिम्मेदारी है कि वे अपनी माँगी गई या प्रदान की जाने वाली सेवाओं की प्रकृति को समझें और सुनिश्चित करें कि उनकी गतिविधियाँ लागू कानूनों के अनुरूप हों।',
      ],
    },
    {
      id: 2,
      title: '2. बुकिंग, भुगतान और रसीदें',
      paragraphs: [
        'ग्राहकों और कामगारों को अपनी बुकिंग DoneKaro के माध्यम से करनी और प्रबंधित करनी चाहिए। उन्हें बुकिंग, सहमत सेवा, कोटेशन, भुगतान तथा अन्य संबंधित विवरणों का सही रिकॉर्ड सुरक्षित रखना चाहिए।',
        'बुकिंग की पुष्टि करने से पहले ग्राहकों को सेवा का विवरण और कोटेशन ध्यानपूर्वक देखना चाहिए तथा यह सुनिश्चित करना चाहिए कि वे तय कीमत और काम के दायरे को समझते हैं।',
        'काम पूरा होने और संबंधित भुगतान की जानकारी निर्धारित भुगतान प्रक्रिया के अनुसार सही तरीके से दर्ज होने के बाद, उपयोगकर्ताओं को ऐप से संबंधित रसीद प्राप्त करके सुरक्षित रखनी चाहिए, जहाँ यह सुविधा उपलब्ध हो।',
        'बुकिंग रिकॉर्ड और रसीदें लेन-देन के प्रमाण के रूप में काम आ सकती हैं और धोखाधड़ी, गलतफहमी या विवाद के जोखिम को कम करने में मदद कर सकती हैं। उपयोगकर्ताओं को केवल मौखिक समझौतों या ऐसे भुगतानों पर निर्भर नहीं रहना चाहिए जिनका सही रिकॉर्ड उपलब्ध नहीं है।',
        'बुकिंग और भुगतान से संबंधित जानकारी सही प्रदान करना उपयोगकर्ताओं की जिम्मेदारी है। DoneKaro के माध्यम से जारी भुगतान की पुष्टि या रसीद वास्तविक लेन-देन के विवरण और लागू भुगतान-रिकॉर्ड प्रक्रिया पर निर्भर करेगी।',
      ],
    },
    {
      id: 3,
      title: '3. सेवा संबंधी समझौते, कोटेशन और भुगतान',
      paragraphs: [
        'ग्राहकों को बुकिंग स्वीकार करने से पहले कामगार द्वारा दिए गए कोटेशन को ध्यानपूर्वक देखना और उस पर सहमति देना चाहिए। दोनों पक्षों को काम की प्रकृति, तय कीमत, सेवा के दायरे तथा किसी अतिरिक्त काम या शुल्क के बारे में स्पष्ट बातचीत करनी चाहिए।',
        'सहमत काम या कीमत में कोई बदलाव होने पर, जहाँ व्यावहारिक रूप से संभव हो, अतिरिक्त काम शुरू करने से पहले ग्राहक और कामगार को उस बदलाव पर आपसी सहमति बना लेनी चाहिए।',
        'DoneKaro के माध्यम से तय की गई सेवाओं और भुगतानों के संबंध में अपने-अपने समझौतों को पूरा करना, सही जानकारी देना और ईमानदारी से व्यवहार करना ग्राहकों तथा कामगारों की जिम्मेदारी है।',
        'DoneKaro इन व्यवस्थाओं को सुविधाजनक बनाने वाला प्लेटफ़ॉर्म है, लेकिन यह गारंटी नहीं देता कि प्रत्येक उपयोगकर्ता अपने सभी दायित्व पूरे करेगा या प्रत्येक विवाद का समाधान हो जाएगा।',
        'सेवा, तय कीमत, किए गए काम या भुगतान से संबंधित किसी भी समस्या को उपयोगकर्ताओं को DoneKaro पर उपलब्ध उपयुक्त संचार या सहायता माध्यम से समय रहते उठाना चाहिए।',
      ],
    },
    {
      id: 4,
      title: '4. सुरक्षा, जिम्मेदारी और दायित्व की सीमाएँ',
      paragraphs: [
        'ग्राहकों और कामगारों की जिम्मेदारी है कि वे उचित सावधानी बरतें, लागू कानूनों का पालन करें और कार्यस्थल पर सुरक्षित वातावरण बनाए रखने का प्रयास करें।',
        'DoneKaro एक ऐसा प्लेटफ़ॉर्म है जो ग्राहकों और सेवा पेशेवरों को जोड़ने तथा बुकिंग और लेन-देन से संबंधित जानकारी का रिकॉर्ड उपलब्ध कराने में मदद करता है। DoneKaro कार्यस्थल पर होने वाली प्रत्येक गतिविधि की प्रत्यक्ष निगरानी नहीं करता। यह प्रत्येक उपयोगकर्ता के व्यवहार, हर सेवा की गुणवत्ता या किसी कार्यस्थल के पूरी तरह जोखिम-मुक्त होने की गारंटी भी नहीं देता।',
        'लागू कानून द्वारा अनुमत सीमा तक, ग्राहकों, कामगारों या अन्य तीसरे पक्षों के स्वतंत्र कार्यों, चूक, लापरवाही या गैरकानूनी गतिविधियों के कारण होने वाली चोट, चोरी, संपत्ति के नुकसान, धोखाधड़ी, गलत व्यवहार, विवाद, आर्थिक हानि या अन्य नुकसान के लिए DoneKaro जिम्मेदार नहीं होगा। इसमें कार्यस्थल पर किए जाने वाले काम से उत्पन्न नुकसान भी शामिल हैं। हालाँकि, यह प्रावधान उन परिस्थितियों में लागू नहीं होगा जहाँ कानून के अनुसार DoneKaro की जिम्मेदारी को समाप्त नहीं किया जा सकता या नुकसान के लिए DoneKaro के अपने कार्य अथवा चूक से जिम्मेदारी उत्पन्न होती है।',
        'उपयोगकर्ताओं की जिम्मेदारी है कि वे काम और भुगतान के बारे में स्पष्ट बातचीत करें, संबंधित जोखिमों का आकलन करें और सेवा से पहले, सेवा के दौरान तथा उसके बाद उचित सावधानी बरतें।',
        'इन नियमों की कोई भी बात लागू कानून के अंतर्गत DoneKaro की ऐसी जिम्मेदारी, कानूनी बाध्यता या दायित्व को समाप्त या सीमित नहीं करती जिसे कानून के अनुसार समाप्त या सीमित नहीं किया जा सकता।',
      ],
    },
    {
      id: 5,
      title: '5. विवादित बुकिंग, रिकॉर्ड और कानूनी मामले',
      paragraphs: [
        'उपयोगकर्ताओं को DoneKaro के माध्यम से बुकिंग करनी चाहिए तथा कोटेशन, बुकिंग विवरण, तय कीमत, भुगतान, रसीद, संदेश और लेन-देन से संबंधित अन्य महत्वपूर्ण जानकारी का सही रिकॉर्ड सुरक्षित रखना चाहिए।',
        'यदि किसी बुकिंग को लेकर विवाद उत्पन्न होता है या धोखाधड़ी, चोरी, संपत्ति को नुकसान, धमकी, उत्पीड़न, भुगतान न करने या अन्य कथित गलत व्यवहार से संबंधित कोई घटना होती है, तो लागू कानून और गोपनीयता संबंधी दायित्वों के अधीन DoneKaro उपलब्ध बुकिंग रिकॉर्ड, रसीद, लेन-देन का विवरण, संबंधित संदेश तथा अन्य प्रासंगिक दस्तावेज़ या जानकारी प्रभावित पक्षों को या सक्षम कानूनी अधिकारियों को उपलब्ध करा सकता है, जहाँ ऐसा करना कानूनन अनुमत या आवश्यक हो।',
        'इन रिकॉर्ड और दस्तावेज़ों का उपयोग उपयोगकर्ता विवादित बुकिंग का विवरण प्रस्तुत करने, शिकायत दर्ज करने या उचित कानूनी उपाय अपनाने के लिए कर सकते हैं। कानून द्वारा अनुमत होने और संबंधित रिकॉर्ड उपलब्ध होने पर DoneKaro वैध अनुरोधों के अनुसार आवश्यक जानकारी या दस्तावेज़ उपलब्ध कराने में सहयोग कर सकता है।',
        'हालाँकि, DoneKaro इस बात की गारंटी नहीं देता कि उपलब्ध रिकॉर्ड किसी पक्ष की कानूनी जिम्मेदारी साबित करेंगे, विवाद का समाधान करेंगे, धन या संपत्ति की वापसी सुनिश्चित करेंगे या किसी विशेष कानूनी परिणाम तक पहुँचाएँगे। रिकॉर्ड उपलब्ध कराने का अर्थ यह नहीं है कि DoneKaro संबंधित घटना, नुकसान, क्षति या विवाद की जिम्मेदारी स्वीकार करता है, किसी व्यक्ति को दीवानी या आपराधिक रूप से दोषी घोषित करता है या पुलिस, न्यायालय अथवा अन्य सक्षम अधिकारियों की भूमिका निभाता है।',
        'लागू कानून द्वारा अनुमत सीमा तक, केवल इस कारण DoneKaro किसी नुकसान के लिए जिम्मेदार नहीं होगा कि विवादित बुकिंग या लेन-देन उसके प्लेटफ़ॉर्म के माध्यम से किया गया था, यदि नुकसान उपयोगकर्ताओं या अन्य तीसरे पक्षों के स्वतंत्र कार्यों या चूक के कारण हुआ हो।',
        'उपयोगकर्ताओं को संबंधित साक्ष्य सुरक्षित रखने चाहिए और आवश्यकता होने पर गंभीर घटनाओं की सूचना उचित अधिकारियों को देनी चाहिए। यह खंड किसी भी उपयोगकर्ता को लागू कानून के अंतर्गत उपलब्ध अधिकारों या कानूनी उपायों का उपयोग करने से नहीं रोकता।',
      ],
    },
    {
      id: 6,
      title: '6. सही जानकारी, खाते की सुरक्षा और उपयोगकर्ताओं का व्यवहार',
      paragraphs: [
        'उपयोगकर्ताओं को DoneKaro पर पंजीकरण करते समय और प्लेटफ़ॉर्म का उपयोग करते समय सही, पूर्ण तथा अद्यतन जानकारी प्रदान करनी चाहिए। किसी अन्य व्यक्ति की पहचान अपनाना, उसके खाते का दुरुपयोग करना या अपनी पहचान, सेवाओं, काम अथवा भुगतान के बारे में झूठी या भ्रामक जानकारी देना प्रतिबंधित है।',
        'उपयोगकर्ता अपने खाते की लॉगिन जानकारी गोपनीय रखने और खाते तक अनधिकृत पहुँच रोकने के लिए उचित सावधानी बरतने के जिम्मेदार हैं। खाते के संभावित दुरुपयोग या अनधिकृत पहुँच की सूचना उपयुक्त सहायता माध्यम से दी जानी चाहिए।',
        'उपयोगकर्ताओं को एक-दूसरे के साथ सम्मानपूर्वक व्यवहार करना चाहिए। DoneKaro के माध्यम से धोखाधड़ी, चोरी, धमकी, उत्पीड़न, भेदभाव, जानबूझकर गलत जानकारी देना या किसी अन्य प्रकार का गैरकानूनी अथवा अपमानजनक व्यवहार नहीं करना चाहिए।',
        'इन नियमों के उल्लंघन, गलत जानकारी या प्लेटफ़ॉर्म के संभावित दुरुपयोग की स्थिति में DoneKaro लागू कानून और अपनी संबंधित नीतियों के अधीन उचित कार्रवाई कर सकता है।',
      ],
    },
    {
      id: 7,
      title: '7. इन नियमों एवं शर्तों की स्वीकृति',
      paragraphs: [
        'इन नियमों एवं शर्तों को स्वीकार करके या ऐसी स्वीकृति आवश्यक होने पर DoneKaro का उपयोग करके, आप यह स्वीकार करते हैं कि आप DoneKaro की भूमिका को समझते हैं। DoneKaro ग्राहकों और सेवा पेशेवरों को जोड़ने तथा बुकिंग और लेन-देन का रिकॉर्ड रखने में मदद करने वाला प्लेटफ़ॉर्म है।',
        'आप समझते हैं कि कोटेशन की जाँच करना, काम शुरू होने से पहले सेवा की शर्तों पर सहमत होना, बुकिंग और भुगतान का सही रिकॉर्ड सुरक्षित रखना तथा सेवाएँ तय करते या प्रदान करते समय उचित सावधानी बरतना महत्वपूर्ण है।',
        'आप DoneKaro का जिम्मेदारीपूर्वक उपयोग करने और इन नियमों तथा लागू कानूनों का पालन करने के लिए सहमत हैं।',
        'ये नियम लागू कानून के अंतर्गत आपको प्राप्त किसी भी अधिकार, संरक्षण या कानूनी उपाय को समाप्त या सीमित नहीं करते। यदि इन नियमों का कोई प्रावधान कानूनन लागू करने योग्य नहीं पाया जाता है, तो शेष प्रावधान कानून द्वारा अनुमत सीमा तक प्रभावी रहेंगे।',
      ],
    },
  ],
}

export function getTermsContent(language: string): TermsDocument {
  return language === 'hi' ? TERMS_HI : TERMS_EN
}
