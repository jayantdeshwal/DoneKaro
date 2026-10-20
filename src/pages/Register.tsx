

import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, Button, Input } from '@kaamgar/ui'
import {
  User,
  Truck,
  Phone,
  Mail,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { openOtpWidget } from '@/services/otp'
import { checkPhoneRegistration } from '@/services/authCheck'
import { uploadCustomerAddressProof } from '@/services/storage'
import { getSupabaseClient } from '@/lib/supabase'
import { sanitizeErrorMessage } from '@/utils/errors'
import { normalizeIndianPhone, tryNormalizeIndianPhone, sanitizePhoneInput } from '@/utils/phone'
import { TermsModal } from '@/components/legal/TermsModal'
import { CustomerAddressProofUpload } from '@/components/customer/CustomerAddressProofUpload'

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialRole = searchParams.get('role') === 'worker' ? 'worker' : 'customer'
  const [activeTab, setActiveTab] = useState<'customer' | 'worker'>(initialRole)

  const { user, updateUser, verifyAndLoginWithOtp, setIsRegistering } = useAuth()

  const queryPhone = tryNormalizeIndianPhone(searchParams.get('phone') || '') ?? ''

  // ---------------- Customer State ----------------
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState(queryPhone)
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerAddressProof, setCustomerAddressProof] = useState<File | null>(null)
  const [customerTermsAccepted, setCustomerTermsAccepted] = useState(false)
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false)
  const [customerLoading, setCustomerLoading] = useState(false)
  const [customerError, setCustomerError] = useState('')
  const [uploadStatusMsg, setUploadStatusMsg] = useState('')
  const [pendingCustomerId, setPendingCustomerId] = useState<string | null>(null)

  const isIncompleteCustomer =
    searchParams.get('incomplete') === 'true' ||
    (user?.role === 'customer' && user?.registration_completed === false) ||
    Boolean(pendingCustomerId)

  // Sync incomplete customer state if user lands here with incomplete registration
  useState(() => {
    if (user?.role === 'customer' && user.registration_completed === false) {
      if (user.name) setCustomerName(user.name)
      if (user.phone) {
        const clean = tryNormalizeIndianPhone(user.phone)
        if (clean) setCustomerPhone(clean)
      }
      setCustomerTermsAccepted(true)
    }
  })

  // ---------------- Already Registered Notice ----------------
  const [alreadyRegisteredNotice, setAlreadyRegisteredNotice] = useState<{
    phone: string
    message?: string
  } | null>(null)

  // ---------------- Customer Sign Up Submit ----------------
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCustomerError('')
    setUploadStatusMsg('')
    setAlreadyRegisteredNotice(null)

    const formSnapshot = {
      name: customerName.trim(),
      phone: customerPhone,
      email: customerEmail.trim(),
      addressProof: customerAddressProof,
    }

    if (!customerTermsAccepted) {
      setCustomerError(t('registerPage.termsRequired', 'Please accept the Terms & Conditions before continuing.'))
      return
    }

    const addressProof = formSnapshot.addressProof
    if (!addressProof) {
      setCustomerError(
        t('registerPage.addressProofRequired', 'Address proof document is mandatory for customer registration.')
      )
      return
    }

    // 1. If this customer is already authenticated but registration is incomplete,
    // directly retry address-proof upload without requesting OTP again!
    const targetUserId =
      pendingCustomerId ||
      (user?.role === 'customer' && user.registration_completed === false ? user.id : null)

    if (targetUserId) {
      setIsRegistering(true)
      setCustomerLoading(true)
      setUploadStatusMsg(t('registerPage.uploadingAddressProof', 'Uploading address proof securely...'))
      try {
        const addressProofPath = await uploadCustomerAddressProof(addressProof, targetUserId)
        const supabase = getSupabaseClient()
        const { error: rpcErr } = await (supabase as any).rpc('complete_customer_registration', {
          p_address_proof_path: addressProofPath,
        })
        if (rpcErr) {
          const fnMissing =
            rpcErr.code === '42883' ||
            rpcErr.message?.toLowerCase().includes('does not exist') ||
            rpcErr.message?.toLowerCase().includes('not found')
          if (fnMissing) {
            const { data: updatedProfile, error: updateError } = await (supabase.from('profiles') as any)
              .update({
                address_proof_url: addressProofPath,
                registration_completed: true,
                updated_at: new Date().toISOString(),
              })
              .eq('id', targetUserId)
              .select('id')
              .maybeSingle()
            if (updateError) throw updateError
            if (!updatedProfile) throw new Error('Customer registration profile could not be updated')
          } else {
            throw new Error(rpcErr.message || 'Registration completion failed')
          }
        }

        updateUser({ address_proof_url: addressProofPath, registration_completed: true })
        navigate('/')
      } catch (err) {
        setCustomerError(
          sanitizeErrorMessage(
            err,
            'Address proof upload failed. Please verify the document format (JPG, PNG, PDF up to 10MB) and retry.'
          )
        )
      } finally {
        setCustomerLoading(false)
        setUploadStatusMsg('')
        setIsRegistering(false)
      }
      return
    }

    const cleanName = formSnapshot.name
    if (!cleanName || cleanName.length < 2) {
      setCustomerError('Full Name is mandatory (minimum 2 characters)')
      return
    }
    const normalizeResult = normalizeIndianPhone(formSnapshot.phone)
    if (!normalizeResult.ok) {
      setCustomerError(normalizeResult.error)
      return
    }
    const cleanPhone = normalizeResult.digits

    setCustomerLoading(true)
    try {
      // Check if phone is already registered
      const check = await checkPhoneRegistration(cleanPhone)
      if (check.isRegistered) {
        setCustomerLoading(false)
        setAlreadyRegisteredNotice({
          phone: cleanPhone,
          message: `An account is already registered with mobile number +91 ${cleanPhone}. Please sign in with OTP.`,
        })
        return
      }

      setIsRegistering(true)
      const widgetOpened = await openOtpWidget({
        identifier: cleanPhone,
        onSuccess: async (accessToken: string) => {
          try {
            setUploadStatusMsg(t('registerPage.uploadingAddressProof', 'Uploading address proof securely...'))

            // 1. Authoritative OTP login/signup creating authentic Supabase session
            const authResult = await verifyAndLoginWithOtp(
              cleanPhone,
              accessToken,
              cleanName,
              formSnapshot.email || undefined
            )

            const customerId = authResult.user.id
            setPendingCustomerId(customerId)

            // 2. Upload mandatory customer address proof to private bucket
            const addressProofPath = await uploadCustomerAddressProof(addressProof, customerId)

            // 3. Update profile authoritatively with address_proof_url reference and registration_completed: true
            const supabase = getSupabaseClient()
            const { error: rpcErr } = await (supabase as any).rpc('complete_customer_registration', {
              p_address_proof_path: addressProofPath,
            })
            if (rpcErr) {
              const fnMissing =
                rpcErr.code === '42883' ||
                rpcErr.message?.toLowerCase().includes('does not exist') ||
                rpcErr.message?.toLowerCase().includes('not found')
              if (fnMissing) {
                const { data: updatedProfile, error: updateError } = await (supabase.from('profiles') as any)
                  .update({
                    address_proof_url: addressProofPath,
                    registration_completed: true,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', customerId)
                  .select('id')
                  .maybeSingle()
                if (updateError) throw updateError
                if (!updatedProfile) throw new Error('Customer registration profile could not be updated')
              } else {
                throw new Error(rpcErr.message || 'Registration completion failed')
              }
            }

            updateUser({ address_proof_url: addressProofPath, registration_completed: true })
            navigate('/')
          } catch (err) {
            setCustomerError(
              sanitizeErrorMessage(
                err,
                'Mobile verification succeeded, but address proof upload failed. Please click below to retry uploading your document.'
              )
            )
          } finally {
            setCustomerLoading(false)
            setUploadStatusMsg('')
            setIsRegistering(false)
          }
        },
        onFailure: (err) => {
          setIsRegistering(false)
          setCustomerLoading(false)
          setUploadStatusMsg('')
          if (err && typeof err === 'object' && (err as any).cancelled) return
          const msg = typeof err === 'string' ? err : (err as any)?.message || 'OTP verification failed. Please verify to complete sign up.'
          setCustomerError(msg)
        },
      })

      if (!widgetOpened && !customerError) {
        setIsRegistering(false)
        setCustomerLoading(false)
        setCustomerError('OTP verification widget could not be loaded. Please ensure ad-blockers are disabled.')
      }
    } catch (err) {
      setIsRegistering(false)
      setCustomerLoading(false)
      setCustomerError('Unable to launch OTP verification. Please retry.')
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-xl w-full">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('registerPage.backToOptions', 'Back to Login / Sign Up options')}</span>
          </Link>
        </div>

        <Card className="p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xl relative">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {t('registerPage.title', 'New to DoneKaro? Join Today')}
            </h1>
            <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
              {t('registerPage.subtitle', 'Passwordless mobile registration with instant OTP verification')}
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex bg-slate-100 dark:bg-zinc-800/90 p-1.5 rounded-xl mb-6 border border-slate-200 dark:border-zinc-700 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('customer')
                setSearchParams({ role: 'customer' })
                setAlreadyRegisteredNotice(null)
                setCustomerError('')
              }}
              className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'customer'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <User className="w-4 h-4" />
              <span className="text-left leading-tight">
                <span className="block">{t('registerPage.customerChoiceEn', 'Register as Customer')}</span>
                <span className="block text-[11px] font-medium opacity-90">{t('registerPage.customerChoiceHi', 'ग्राहक के रूप में पंजीकरण करें')}</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('worker')
                setSearchParams({ role: 'worker' })
                setAlreadyRegisteredNotice(null)
              }}
              className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'worker'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Truck className="w-4 h-4" />
              <span className="text-left leading-tight">
                <span className="block">{t('registerPage.workerChoiceEn', 'Register as Worker')}</span>
                <span className="block text-[11px] font-medium opacity-90">{t('registerPage.workerChoiceHi', 'कामगार के रूप में पंजीकरण करें')}</span>
              </span>
            </button>
          </div>

          {/* ================= 1. CUSTOMER SIGN UP FORM ================= */}
          {activeTab === 'customer' && (
            <div>
              {alreadyRegisteredNotice && (
                <div className="mb-5 p-3.5 bg-gray-900 border border-red-800 rounded-xl shadow-md space-y-2.5">
                  <div className="flex items-start gap-2.5 text-red-300 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
                    <div>
                      <p className="font-semibold text-red-500 mb-0.5">
                        {t('auth.alreadyRegisteredTitle', 'Mobile Number Already Registered')}
                      </p>
                      <p className="text-red-300 leading-relaxed">
                        {alreadyRegisteredNotice.message}
                      </p>
                    </div>
                  </div>
                  <div className="pt-1">
                    <Link
                      to={`/login?role=customer&phone=${alreadyRegisteredNotice.phone}`}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold text-xs shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{t('auth.goToCustomerLogin', 'Sign In with OTP')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {customerError && (
                <div className="mb-5 p-3 bg-gray-900 border border-red-800 rounded-lg shadow-md flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                  <div>
                    <p className="font-semibold text-red-500 mb-0.5">
                      {t('registerPage.errorTitle', 'Registration Error')}
                    </p>
                    <p className="text-red-300 leading-relaxed">{customerError}</p>
                  </div>
                </div>
              )}

              {/* Incomplete registration recovery banner */}
              {isIncompleteCustomer && (
                <div className="mb-5 p-3.5 bg-gray-900 border border-red-800 rounded-xl shadow-md flex items-start gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
                  <div>
                    <p className="font-semibold text-red-500 mb-0.5">
                      {t('registerPage.incompleteNoticeTitle', 'Registration Incomplete: Address Verification Required')}
                    </p>
                    <p className="text-red-300 leading-relaxed">
                      {t(
                        'registerPage.incompleteNoticeDesc',
                        'Your mobile number is verified. Please upload your mandatory address proof below to complete registration and access DoneKaro.'
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Passwordless benefits notice */}
              {!isIncompleteCustomer && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl mb-5 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-900 leading-relaxed">
                    <strong className="text-blue-900 block font-semibold mb-0.5">
                      {t('registerPage.passwordlessNoticeTitle', '100% Passwordless & Secure')}
                    </strong>
                    {t(
                      'registerPage.passwordlessNoticeDesc',
                      'Verify your mobile number via OTP once. Your session stays permanently saved on this device—no passwords to remember or reset!'
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleCustomerSubmit} className="space-y-4">
                <Input
                  label={t('registerPage.fullName', 'Full Name (Mandatory) *')}
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Amit Kumar"
                  required
                  autoFocus
                  disabled={isIncompleteCustomer && !!customerName}
                />

                <div>
                  <Input
                    label={t('registerPage.phone', 'Mobile Number (10 digits) *')}
                    value={customerPhone}
                    onChange={e => setCustomerPhone(sanitizePhoneInput(e.target.value))}
                    placeholder="9876543210"
                    leftIcon={<span className="text-sm font-semibold text-slate-500 dark:text-zinc-400">+91</span>}
                    required
                    disabled={isIncompleteCustomer && !!customerPhone}
                  />
                  {!isIncompleteCustomer && (
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-500">
                      {t('registerPage.otpNotice', 'A 6-digit OTP will be dispatched to this number to verify your account.')}
                    </p>
                  )}
                </div>

                <Input
                  label={t('registerPage.emailOptional', 'Email Address (Optional)')}
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  leftIcon={<Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500" />}
                  disabled={isIncompleteCustomer && !!customerEmail}
                />

                <CustomerAddressProofUpload
                  selectedFile={customerAddressProof}
                  onFileSelect={file => {
                    setCustomerAddressProof(file)
                    if (customerError && !file) {
                      setCustomerError('')
                    }
                  }}
                  disabled={customerLoading}
                />

                <div className="rounded-xl border border-slate-200 dark:border-zinc-700 p-3.5 bg-slate-50/50 dark:bg-zinc-800/30">
                  <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-zinc-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customerTermsAccepted}
                      onChange={e => {
                        if (e.target.checked) {
                          // Force reading the terms
                          setIsTermsModalOpen(true)
                        } else {
                          setCustomerTermsAccepted(false)
                        }
                      }}
                      className="mt-0.5 h-5 w-5 accent-amber-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span>
                        {t('registerPage.termsAcceptancePrefix', 'I agree to the')}{' '}
                        <button
                          type="button"
                          onClick={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            setIsTermsModalOpen(true)
                          }}
                          className="font-semibold text-amber-600 dark:text-amber-400 hover:underline inline"
                        >
                          {t('registerPage.termsAcceptanceLink', 'Terms & Conditions')}
                        </button>
                      </span>
                      {!customerTermsAccepted && (
                        <p className="mt-1 rounded-md border border-red-800 bg-gray-900 px-2 py-1 text-[11px] text-red-300 shadow-md">
                          {t(
                            'registerPage.termsReviewPrompt',
                            'Click to read and accept the full Terms & Conditions'
                          )}
                        </p>
                      )}
                    </div>
                  </label>
                </div>

                {uploadStatusMsg && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 animate-pulse text-center font-medium">
                    {uploadStatusMsg}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-3 py-3 font-semibold shadow-lg shadow-brand-500/20"
                  size="lg"
                  loading={customerLoading}
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  {isIncompleteCustomer
                    ? t('registerPage.retryUploadBtn', 'Upload Address Proof & Complete Registration')
                    : t('registerPage.customerSubmitBtn', 'Verify Mobile via OTP & Create Account')}
                </Button>
              </form>

              {/* Authoritative Terms Reading Modal */}
              <TermsModal
                isOpen={isTermsModalOpen}
                onClose={() => setIsTermsModalOpen(false)}
                onAccept={() => {
                  setCustomerTermsAccepted(true)
                  setCustomerError('')
                }}
              />

              <div className="mt-6 text-center text-xs text-slate-500 dark:text-zinc-400">
                <span>{t('registerPage.haveAccount', 'Already have an account?')} </span>
                <Link
                  to="/login?role=customer"
                  className="font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  {t('registerPage.loginLink', 'Sign In with OTP')}
                </Link>
              </div>
            </div>
          )}

          {/* ================= 2. WORKER REGISTRATION CTA ================= */}
          {activeTab === 'worker' && (
            <div className="py-3 text-center space-y-5">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-left space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{t('auth.workerRegistration.becomeVerifiedPartner', 'Become a Verified DoneKaro Service Partner')}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                  {t(
                    'auth.workerRegistration.joinNetworkDesc',
                    "Join Muzaffarnagar's premier network of skilled local technicians and service experts. Register in 3 simple steps:"
                  )}
                </p>
                <ul className="text-xs space-y-1.5 text-slate-600 dark:text-zinc-300 pl-2">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>{t('auth.workerRegistration.step1Short', 'Verify your mobile number via OTP (no passwords required)')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>{t('auth.workerRegistration.step2Short', 'Select 1 or 2 trade services and your service areas in Muzaffarnagar')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>{t('auth.workerRegistration.step3Short', 'Upload government ID proof for fast admin verification')}</span>
                  </li>
                </ul>
              </div>

              <Link
                to={`/register/worker${customerPhone ? `?phone=${customerPhone}` : ''}`}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>{t('auth.workerRegistration.proceedToRegistration', 'Proceed to Service Partner Registration')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="text-xs text-slate-500 dark:text-zinc-400">
                <span>{t('auth.workerRegistration.alreadyRegisteredWorker', 'Already registered as a service provider?')} </span>
                <Link
                  to="/login?role=worker"
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {t('auth.workerRegistration.signInWorkerDashboard', 'Sign in to Worker Dashboard')}
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
