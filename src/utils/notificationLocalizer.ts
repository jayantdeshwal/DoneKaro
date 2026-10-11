import type { TFunction } from 'i18next'

export interface LocalizedNotificationContent {
  title: string
  body: string
  category: string
  timeAgo: string
}

/**
 * Format relative time for notification tiles bilingually (EN & HI)
 */
export function formatRelativeNotificationTime(isoString: string, language: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return ''

  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  const isHi = language === 'hi'

  if (diffMins < 1) {
    return isHi ? 'अभी' : 'Just now'
  }
  if (diffMins < 60) {
    return isHi ? `${diffMins} मिनट पहले` : `${diffMins}m ago`
  }
  if (diffHours < 24) {
    return isHi ? `${diffHours} घंटे पहले` : `${diffHours}h ago`
  }
  if (diffDays === 1) {
    return isHi ? 'कल' : 'Yesterday'
  }
  if (diffDays < 7) {
    return isHi ? `${diffDays} दिन पहले` : `${diffDays}d ago`
  }

  return date.toLocaleDateString(isHi ? 'hi-IN' : 'en-IN', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Extract person or category variables from standard backend notifications.
 * Examples:
 * - "Rahul Sharma sent you a new booking request for Electrician." -> { name: "Rahul Sharma", category: "Electrician" }
 * - "Vikas Kumar accepted your Plumbing booking request." -> { name: "Vikas Kumar", category: "Plumbing" }
 * - "Your Electrician booking has been cancelled." -> { category: "Electrician" }
 * - "Your service with Deepak Sharma is marked completed. Please share your rating and review." -> { name: "Deepak Sharma" }
 * - "Amit Verma submitted registration for Carpentry and is waiting for document verification and approval." -> { name: "Amit Verma", category: "Carpentry" }
 * - "Sunil Kumar uploaded an address/ID proof document for verification." -> { name: "Sunil Kumar" }
 */
function extractNotificationVariables(body: string): { name?: string; category?: string } {
  if (!body) return {}

  // 1. Worker registration: "... submitted registration for ... and is waiting..."
  const regMatch = body.match(/^(.+?)\s+submitted registration for\s+(.+?)\s+and is waiting/i)
  if (regMatch) {
    return { name: regMatch[1]?.trim(), category: regMatch[2]?.trim() }
  }

  // 2. ID upload: "... uploaded an address/ID proof document..."
  const docMatch = body.match(/^(.+?)\s+uploaded an address\/ID proof document/i)
  if (docMatch) {
    return { name: docMatch[1]?.trim() }
  }

  // 3. New booking: "... sent you a new booking request for ..."
  const newBookingMatch = body.match(/^(.+?)\s+sent you a new booking request for\s+(.+?)\.?$/i)
  if (newBookingMatch) {
    return { name: newBookingMatch[1]?.trim(), category: newBookingMatch[2]?.trim() }
  }

  // 4. Booking accepted: "... accepted your ... booking request."
  const acceptMatch = body.match(/^(.+?)\s+accepted your\s+(.+?)\s+booking request\.?$/i)
  if (acceptMatch) {
    return { name: acceptMatch[1]?.trim(), category: acceptMatch[2]?.trim() }
  }

  // 5. Booking declined: "... was unable to take your ... booking."
  const declineMatch = body.match(/^(.+?)\s+was unable to take your\s+(.+?)\s+booking\.?$/i)
  if (declineMatch) {
    return { name: declineMatch[1]?.trim(), category: declineMatch[2]?.trim() }
  }

  // 6. Booking cancelled: "... cancelled the booking for ..."
  const cancelByPartyMatch = body.match(/^(.+?)\s+cancelled the booking for\s+(.+?)\.?$/i)
  if (cancelByPartyMatch) {
    return { name: cancelByPartyMatch[1]?.trim(), category: cancelByPartyMatch[2]?.trim() }
  }

  // 7. Booking cancelled general: "Your ... booking has been cancelled."
  const cancelGenMatch = body.match(/^Your\s+(.+?)\s+booking has been cancelled\.?$/i)
  if (cancelGenMatch) {
    return { category: cancelGenMatch[1]?.trim() }
  }

  // 8. Service completed: "Your service with ... is marked completed. Please share your rating and review."
  const completeMatch = body.match(/^Your service with\s+(.+?)\s+is marked completed/i)
  if (completeMatch) {
    return { name: completeMatch[1]?.trim() }
  }

  return {}
}

/**
 * Returns localized title and body for any notification record based on its semantic type
 */
export function localizeNotification(
  item: {
    notification_type?: string
    title: string
    body: string
    created_at?: string
  },
  t: TFunction,
  language: string
): LocalizedNotificationContent {
  const isHi = language === 'hi'
  const type = (item.notification_type || '').toLowerCase().trim()
  const rawTitle = item.title || ''
  const rawBody = item.body || ''

  const vars = extractNotificationVariables(rawBody)
  const category = vars.category ? t(`category.${vars.category.toLowerCase()}`, vars.category) : ''
  const name = vars.name || ''

  let localizedTitle = rawTitle
  let localizedBody = rawBody
  let categoryLabel = isHi ? 'सिस्टम सूचना' : 'System Alert'

  // Map by semantic notification_type
  if (type === 'booking_created' || rawTitle.toLowerCase().includes('new booking')) {
    categoryLabel = isHi ? 'नई बुकिंग' : 'New Booking'
    localizedTitle = isHi ? 'नया बुकिंग अनुरोध' : 'New Booking Request'
    if (isHi && name && category) {
      localizedBody = `${name} ने ${category} सेवा के लिए नया बुकिंग अनुरोध भेजा है।`
    } else if (isHi && category) {
      localizedBody = `${category} सेवा के लिए नया बुकिंग अनुरोध प्राप्त हुआ है।`
    } else if (!isHi && name && category) {
      localizedBody = `${name} sent you a new booking request for ${category}.`
    }
  } else if (type === 'booking_accepted' || rawTitle.toLowerCase().includes('booking accepted')) {
    categoryLabel = isHi ? 'स्वीकृत' : 'Accepted'
    localizedTitle = isHi ? 'बुकिंग स्वीकार की गई' : 'Booking Accepted'
    if (isHi && name && category) {
      localizedBody = `${name} ने आपका ${category} बुकिंग अनुरोध स्वीकार कर लिया है।`
    } else if (isHi && name) {
      localizedBody = `${name} ने आपका बुकिंग अनुरोध स्वीकार कर लिया है।`
    } else if (!isHi && name && category) {
      localizedBody = `${name} accepted your ${category} booking request.`
    }
  } else if (type === 'booking_in_progress' || rawTitle.toLowerCase().includes('in progress')) {
    categoryLabel = isHi ? 'प्रगति पर' : 'In Progress'
    localizedTitle = isHi ? 'सेवा कार्य शुरू' : 'Job Started'
    localizedBody = isHi ? 'सेवा कार्य प्रगति पर है।' : 'Work is currently in progress.'
  } else if (type === 'booking_completed' || rawTitle.toLowerCase().includes('job completed')) {
    categoryLabel = isHi ? 'काम पूर्ण' : 'Job Completed'
    localizedTitle = isHi ? 'सेवा कार्य संपन्न' : 'Job Completed'
    if (isHi && name) {
      localizedBody = `${name} के साथ आपकी सेवा पूरी हो गई है। कृपया अपनी रेटिंग और समीक्षा साझा करें।`
    } else if (isHi) {
      localizedBody = 'आपकी सेवा पूरी हो गई है। कृपया अपनी रेटिंग और समीक्षा साझा करें।'
    } else if (!isHi && name) {
      localizedBody = `Your service with ${name} is marked completed. Please share your rating and review.`
    }
  } else if (type === 'booking_rejected' || rawTitle.toLowerCase().includes('booking declined')) {
    categoryLabel = isHi ? 'अस्वीकृत' : 'Declined'
    localizedTitle = isHi ? 'बुकिंग अस्वीकार की गई' : 'Booking Declined'
    if (isHi && name && category) {
      localizedBody = `${name} आपका ${category} बुकिंग अनुरोध लेने में असमर्थ रहे।`
    } else if (isHi) {
      localizedBody = 'कारीगर यह बुकिंग अनुरोध स्वीकार करने में असमर्थ रहे।'
    } else if (!isHi && name && category) {
      localizedBody = `${name} was unable to take your ${category} booking.`
    }
  } else if (type === 'booking_cancelled' || rawTitle.toLowerCase().includes('cancelled')) {
    categoryLabel = isHi ? 'रद्द' : 'Cancelled'
    localizedTitle = isHi ? 'बुकिंग रद्द की गई' : 'Booking Cancelled'
    if (isHi && name && category) {
      localizedBody = `${name} ने ${category} की बुकिंग रद्द कर दी है।`
    } else if (isHi && category) {
      localizedBody = `आपकी ${category} बुकिंग रद्द कर दी गई है।`
    } else if (isHi) {
      localizedBody = 'यह बुकिंग रद्द कर दी गई है।'
    } else if (!isHi && category) {
      localizedBody = `Your ${category} booking has been cancelled.`
    }
  } else if (type === 'profile_approved' || rawTitle.toLowerCase().includes('profile approved')) {
    categoryLabel = isHi ? 'सत्यापित' : 'Approved'
    localizedTitle = isHi ? 'कारीगर प्रोफ़ाइल स्वीकृत' : 'Worker Profile Approved'
    localizedBody = isHi
      ? 'बधाई! आपकी कारीगर प्रोफ़ाइल स्वीकृत हो गई है। अब आप बुकिंग प्राप्त करने के लिए तैयार हैं।'
      : 'Congratulations! Your worker profile has been approved. You are now active and ready to receive bookings.'
  } else if (type === 'profile_rejected' || rawTitle.toLowerCase().includes('profile needs changes')) {
    categoryLabel = isHi ? 'सुधार आवश्यक' : 'Changes Required'
    localizedTitle = isHi ? 'प्रोफ़ाइल सुधार आवश्यक' : 'Profile Needs Changes'
    if (isHi) {
      localizedBody = rawBody.replace(/^Your worker profile was rejected:\s*/i, 'आपकी कारीगर प्रोफ़ाइल अस्वीकृत की गई: ')
    }
  } else if (type === 'worker_registration_submitted' || rawTitle.toLowerCase().includes('registration pending')) {
    categoryLabel = isHi ? 'नया पंजीकरण' : 'Registration'
    localizedTitle = isHi ? 'कारीगर पंजीकरण समीक्षा लंबित' : 'Worker Registration Pending Review'
    if (isHi && name && category) {
      localizedBody = `${name} ने ${category} के लिए पंजीकरण जमा किया है और दस्तावेज़ सत्यापन लंबित है।`
    } else if (isHi && name) {
      localizedBody = `${name} ने कारीगर पंजीकरण जमा किया है और दस्तावेज़ सत्यापन लंबित है।`
    } else if (!isHi && name && category) {
      localizedBody = `${name} submitted registration for ${category} and is waiting for document verification and approval.`
    }
  } else if (type === 'worker_document_uploaded' || rawTitle.toLowerCase().includes('document uploaded') || rawTitle.toLowerCase().includes('proof uploaded')) {
    categoryLabel = isHi ? 'दस्तावेज़' : 'Document'
    localizedTitle = isHi ? 'पहचान दस्तावेज़ अपलोड हुआ' : 'Worker ID Proof Uploaded'
    if (isHi && name) {
      localizedBody = `${name} ने सत्यापन के लिए पहचान/पता प्रमाण दस्तावेज़ अपलोड किया है।`
    } else if (isHi) {
      localizedBody = 'कारीगर ने सत्यापन के लिए पहचान/पता प्रमाण दस्तावेज़ अपलोड किया है।'
    } else if (!isHi && name) {
      localizedBody = `${name} uploaded an address/ID proof document for verification.`
    }
  } else if (type === 'quote_request_created' || rawTitle.toLowerCase().includes('new quote request')) {
    categoryLabel = isHi ? 'कोटेशन अनुरोध' : 'Quote Request'
    localizedTitle = isHi ? 'नया कोटेशन अनुरोध' : 'New Quote Request'
    localizedBody = isHi
      ? 'एक ग्राहक ने आपसे सेवा के लिए कोटेशन जमा करने का अनुरोध किया है।'
      : 'A customer has asked you to submit a quote.'
  } else if (type === 'quote_submitted' || rawTitle.toLowerCase().includes('received a quote')) {
    categoryLabel = isHi ? 'कोटेशन प्राप्त' : 'Quote Received'
    localizedTitle = isHi ? 'कोटेशन प्राप्त हुआ' : 'You Received a Quote'
    localizedBody = isHi
      ? 'कारीगर ने आपके सेवा अनुरोध के लिए कोटेशन भेजा है।'
      : 'A provider submitted a quote for your service request.'
  } else if (type === 'quote_accepted' || rawTitle.toLowerCase().includes('quote accepted')) {
    categoryLabel = isHi ? 'कोटेशन स्वीकृत' : 'Quote Accepted'
    localizedTitle = isHi ? 'कोटेशन स्वीकार हुआ' : 'Quote Accepted'
    localizedBody = isHi
      ? 'ग्राहक ने आपका कोटेशन स्वीकार कर लिया है और बुकिंग बन गई है।'
      : 'The customer accepted your quote and a booking was created.'
  } else if (type === 'quote_request_rejected' || rawTitle.toLowerCase().includes('declined your quote')) {
    categoryLabel = isHi ? 'कोटेशन अस्वीकृत' : 'Quote Declined'
    localizedTitle = isHi ? 'कोटेशन अनुरोध अस्वीकार' : 'Provider Declined Quote Request'
    localizedBody = isHi
      ? 'कारीगर ने यह कोटेशन अनुरोध अस्वीकार कर दिया।'
      : 'The provider declined this quote request.'
  } else if (type === 'quote_request_cancelled' || rawTitle.toLowerCase().includes('quote request cancelled')) {
    categoryLabel = isHi ? 'कोटेशन रद्द' : 'Quote Cancelled'
    localizedTitle = isHi ? 'कोटेशन अनुरोध रद्द' : 'Quote Request Cancelled'
    localizedBody = isHi
      ? 'ग्राहक ने यह कोटेशन अनुरोध रद्द कर दिया है।'
      : 'The customer cancelled this quote request.'
  } else if (type === 'quote_request_expired' || rawTitle.toLowerCase().includes('quote request expired')) {
    categoryLabel = isHi ? 'समय समाप्त' : 'Expired'
    localizedTitle = isHi ? 'कोटेशन अनुरोध समाप्त' : 'Quote Request Expired'
    localizedBody = isHi
      ? 'समय सीमा समाप्त होने के कारण यह अनुरोध रद्द हो गया।'
      : 'This provider did not respond before the deadline.'
  } else if (type === 'payment_received' || rawTitle.toLowerCase().includes('payment received')) {
    categoryLabel = isHi ? 'भुगतान' : 'Payment'
    localizedTitle = isHi ? 'भुगतान प्राप्त हुआ' : 'Payment Received'
    localizedBody = isHi ? 'सेवा के लिए भुगतान सफलतापूर्वक दर्ज किया गया।' : rawBody
  } else if (type === 'review_received' || rawTitle.toLowerCase().includes('review received')) {
    categoryLabel = isHi ? 'समीक्षा' : 'Review'
    localizedTitle = isHi ? 'नई ग्राहक समीक्षा प्राप्त हुई' : 'New Review Received'
    localizedBody = isHi ? 'एक ग्राहक ने आपकी सेवा के लिए रेटिंग और समीक्षा दी है।' : rawBody
  } else {
    // Fallback: If not translated, keep clean original text
    localizedTitle = rawTitle || (isHi ? 'सूचना' : 'Notification')
    localizedBody = rawBody
  }

  const timeAgo = item.created_at ? formatRelativeNotificationTime(item.created_at, language) : ''

  return {
    title: localizedTitle,
    body: localizedBody,
    category: categoryLabel,
    timeAgo,
  }
}

/**
 * Localizes common notification action labels
 */
export function getLocalizedActionLabel(label: string, language: string): string {
  if (language !== 'hi') return label
  const map: Record<string, string> = {
    'View Request': 'अनुरोध देखें',
    'Review Quotes': 'कोटेशन देखें',
    'View Booking': 'बुकिंग देखें',
    'View Profile': 'प्रोफ़ाइल देखें',
    'Verify Worker': 'सत्यापित करें',
    'Review Registration': 'पंजीकरण जांचें',
    'Review Documents': 'दस्तावेज़ जांचें',
    'Mark as read': 'पढ़ा हुआ चिह्नित करें',
    'Mark all read': 'सभी पढ़ा हुआ करें',
    'Dismiss': 'हटाएं',
  }
  return map[label] || label
}
