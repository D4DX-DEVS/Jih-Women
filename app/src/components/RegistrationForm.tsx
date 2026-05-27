import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, CheckCircle2, X, Copy, Upload, FileText, Check, Minus, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';

const INDUSTRY_OPTIONS = [
  'Manufacturing',
  'Services',
  'Retail/Wholesale',
  'Technology/Digital',
  'Food',
  'Hospitality',
  'Agriculture',
  'Clothing',
  'Others',
] as const;

const BUSINESS_STAGE_OPTIONS = [
  'Ideation (Concept only)',
  'Startup (0-1 year)',
  'Established (1+ years)',
  'Looking to Scale/Expand',
] as const;

const BUSINESS_SCALE_OPTIONS = ['Home based', 'Small scale', 'Large scale'] as const;

const KERALA_DISTRICTS = [
  'Thiruvananthapuram',
  'Kollam',
  'Pathanamthitta',
  'Alappuzha',
  'Kottayam',
  'Idukki',
  'Ernakulam',
  'Thrissur',
  'Palakkad',
  'Malappuram',
  'Kozhikode',
  'Wayanad',
  'Kannur',
  'Kasaragod',
] as const;

const COUNTRY_CODES = [
  { label: 'India', code: '+91' },
  { label: 'UAE', code: '+971' },
  { label: 'Saudi Arabia', code: '+966' },
  { label: 'Qatar', code: '+974' },
  { label: 'Kuwait', code: '+965' },
  { label: 'Bahrain', code: '+973' },
  { label: 'Oman', code: '+968' },
] as const;

const schema = z.object({
  fullName: z.string().min(2, 'Please enter your full name').max(120),
  age: z
    .number({ message: 'Please enter a valid age' })
    .int('Age must be a whole number')
    .min(12, 'Age must be at least 12')
    .max(120, 'Age must be 120 or less'),
  whatsappNumber: z
    .string()
    .min(5, 'Please enter a valid WhatsApp number')
    .max(15)
    .regex(/^\d+$/, 'Enter only digits without country code'),
  email: z.string().email('Please enter a valid email').max(200),
  district: z.enum(KERALA_DISTRICTS as unknown as [string, ...string[]], { message: 'Please select your district' }),
  ventureName: z.string().max(200).optional().or(z.literal('')),
  industry: z.enum(INDUSTRY_OPTIONS, { message: 'Select an industry' }),
  businessStage: z.enum(BUSINESS_STAGE_OPTIONS, { message: 'Select a stage' }),
  businessScale: z.enum(BUSINESS_SCALE_OPTIONS, { message: 'Select a scale' }),
});

type FormValues = z.infer<typeof schema>;

type ActiveQR = {
  qrImage: string;
  upiId: string;
  amount: number;
};

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

type Props = {
  trigger: React.ReactNode;
};

const inputClass =
  'w-full rounded-xl bg-black/[0.02] border border-black/10 text-foreground placeholder-foreground/40 px-4 py-3 outline-none transition focus:border-primary/50 focus:bg-black/[0.04]';

const labelClass = 'block text-xs font-medium uppercase tracking-[0.12em] text-foreground/70 mb-2';

const errorClass = 'mt-1.5 text-xs text-red-500';

export default function RegistrationForm({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [activeQR, setActiveQR] = useState<ActiveQR | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [accompanyingInfants, setAccompanyingInfants] = useState(0);
  const [accompanyingChildren, setAccompanyingChildren] = useState(0);
  const [accompanyingCompanions, setAccompanyingCompanions] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ventureName: 'N/A',
    },
  });

  const childFee = activeQR ? Math.round(activeQR.amount / 2) : 0;
  const companionFee = activeQR?.amount ?? 0;
  const totalAmount = (activeQR?.amount ?? 0) + accompanyingChildren * childFee + accompanyingCompanions * companionFee;

  // Fetch active QR on mount
  useEffect(() => {
    if (!open) return;
    let active = true;
    setQrLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/registrations/active-qr`);
        if (res.ok) {
          const data = await res.json();
          if (active) setActiveQR(data);
        } else {
          if (active) setActiveQR(null);
        }
      } catch {
        if (active) setActiveQR(null);
      } finally {
        if (active) setQrLoading(false);
      }
    })();
    return () => { active = false; };
  }, [open]);

  const handleCopyUPI = async () => {
    if (!activeQR?.upiId) return;
    try {
      await navigator.clipboard.writeText(activeQR.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setScreenshotError(null);

    if (!file) {
      setScreenshotFile(null);
      setScreenshotPreview(null);
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setScreenshotError('Only JPEG, PNG, WebP images and PDF files are allowed');
      setScreenshotFile(null);
      setScreenshotPreview(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setScreenshotError('File too large. Maximum size is 5MB.');
      setScreenshotFile(null);
      setScreenshotPreview(null);
      return;
    }

    setScreenshotFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setScreenshotPreview(url);
    } else {
      setScreenshotPreview(null);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);

    if (!screenshotFile) {
      setScreenshotError('Please upload your payment screenshot');
      return;
    }

    if (!API_URL) {
      setServerError('Registration is temporarily unavailable. Please try again later.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('fullName', values.fullName);
      formData.append('age', String(values.age));
      formData.append('whatsappNumber', countryCode + values.whatsappNumber);
      formData.append('email', values.email);
      formData.append('district', values.district);
      formData.append('ventureName', values.ventureName?.trim() || 'N/A');
      formData.append('industry', values.industry);
      formData.append('businessStage', values.businessStage);
      formData.append('businessScale', values.businessScale);
      formData.append('accompanyingInfants', String(accompanyingInfants));
      formData.append('accompanyingChildren', String(accompanyingChildren));
      formData.append('accompanyingCompanions', String(accompanyingCompanions));
      formData.append('paymentScreenshot', screenshotFile);

      const res = await fetch(`${API_URL}/api/registrations`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not submit registration');
      }
      setSubmitted(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setTimeout(() => {
        setSubmitted(false);
        setServerError(null);
        setScreenshotFile(null);
        setScreenshotPreview(null);
        setScreenshotError(null);
        setCopied(false);
        setCountryCode('+91');
        setAccompanyingInfants(0);
        setAccompanyingCompanions(0);
        setAccompanyingChildren(0);
        reset({ ventureName: 'N/A' });
      }, 250);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] max-w-[calc(100%-1rem)] overflow-hidden border-0 !bg-transparent p-0 sm:max-w-2xl"
      >
        <div
          className="light-surface-theme relative overflow-hidden rounded-[1.35rem] border border-black/5 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.15)] sm:rounded-2xl"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            aria-label="Close"
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-black/5 transition"
          >
            <X size={18} />
          </button>

          {submitted ? (
            <div className="px-5 py-12 text-center sm:px-8 sm:py-14">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-5">
                <CheckCircle2 size={36} className="text-emerald-600" />
              </div>
              <h3 className="font-['Syne'] text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Registration received
              </h3>
              <p className="text-foreground/70 max-w-md mx-auto">
                Thank you for registering for WES 2026. We've recorded your details and our team
                will reach out shortly with next steps.
              </p>
              <div className="flex flex-col items-center gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="pill-button bg-primary text-white hover:opacity-90 inline-flex items-center gap-2 shadow-sm"
                >
                  Done
                </button>

              </div>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[92vh] scrollbar-hide" data-lenis-prevent>
              <div className="border-b border-black/10 px-5 pb-5 pt-7 sm:px-9 sm:pb-6 sm:pt-8">
                <span className="section-label text-primary">Reserve your seat</span>
                <h3 className="mt-2 font-['Syne'] text-2xl font-bold leading-tight text-foreground sm:text-4xl">
                  Register for WES 2026
                </h3>
                <p className="text-foreground/60 text-sm mt-2">
                  Fill in your details below. Fields marked with an asterisk are required.
                </p>
              </div>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5 px-5 py-5 sm:px-9 sm:py-7"
                noValidate
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Full Name *</label>
                    <input
                      type="text"
                      autoComplete="name"
                      className={inputClass}
                      placeholder="e.g. Aysha Rahman"
                      {...register('fullName')}
                    />
                    {errors.fullName && <p className={errorClass}>{errors.fullName.message}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>Age *</label>
                    <input
                      type="number"
                      min={12}
                      max={120}
                      className={inputClass}
                      placeholder="28"
                      {...register('age', { valueAsNumber: true })}
                    />
                    {errors.age && <p className={errorClass}>{errors.age.message}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>WhatsApp Number *</label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-32 rounded-xl bg-black/[0.02] border border-black/10 text-foreground px-3 py-3 outline-none transition focus:border-primary/50 focus:bg-black/[0.04] shrink-0"
                      >
                        {COUNTRY_CODES.map(({ label, code }) => (
                          <option key={code} value={code}>
                            {code} {label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        autoComplete="tel-national"
                        className={`${inputClass} flex-1`}
                        placeholder="98xxxxxxxx"
                        {...register('whatsappNumber')}
                      />
                    </div>
                    {errors.whatsappNumber && (
                      <p className={errorClass}>{errors.whatsappNumber.message}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Email Address *</label>
                    <input
                      type="email"
                      autoComplete="email"
                      className={inputClass}
                      placeholder="you@example.com"
                      {...register('email')}
                    />
                    {errors.email && <p className={errorClass}>{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>District *</label>
                    <select
                      className={inputClass}
                      defaultValue=""
                      {...register('district')}
                    >
                      <option value="" disabled>Select district</option>
                      {KERALA_DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    {errors.district && <p className={errorClass}>{errors.district.message}</p>}
                  </div>

                  {/* Payment Section */}
                  <div className="sm:col-span-2">
                    <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4 sm:p-5 space-y-4">
                      <div className="text-center">
                        <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-primary bg-primary/10 px-3 py-1 rounded-full">
                          Payment
                        </span>
                      </div>

                      {qrLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <span className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                        </div>
                      ) : !activeQR ? (
                        <div className="text-center py-4 text-foreground/60 text-sm">
                          Payment information is currently unavailable. Please try again later.
                        </div>
                      ) : (
                        <>
                          {/* Children Accompanying */}
                          <div className="rounded-xl border border-black/10 bg-white/60 p-4 space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-foreground/60">
                              Children Accompanying <span className="normal-case font-normal text-foreground/40">(optional)</span>
                            </p>

                            {/* Infants 0-5 */}
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-foreground">Infants (0–5 yrs)</p>
                                <p className="text-xs text-emerald-600 font-medium">Free entry</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => setAccompanyingInfants((n) => Math.max(0, n - 1))}
                                  disabled={accompanyingInfants === 0}
                                  className="w-8 h-8 rounded-full border border-black/15 bg-white flex items-center justify-center text-foreground/70 hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-6 text-center text-sm font-semibold tabular-nums">{accompanyingInfants}</span>
                                <button
                                  type="button"
                                  onClick={() => setAccompanyingInfants((n) => n + 1)}
                                  className="w-8 h-8 rounded-full border border-black/15 bg-white flex items-center justify-center text-foreground/70 hover:bg-black/5 transition"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Children 5-12 */}
                            <div className="flex items-center justify-between border-t border-black/8 pt-3">
                              <div>
                                <p className="text-sm font-medium text-foreground">Children (5–12 yrs)</p>
                                <p className="text-xs text-foreground/50">
                                  ₹{childFee.toLocaleString('en-IN')} each <span className="text-foreground/40">(50%)</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => setAccompanyingChildren((n) => Math.max(0, n - 1))}
                                  disabled={accompanyingChildren === 0}
                                  className="w-8 h-8 rounded-full border border-black/15 bg-white flex items-center justify-center text-foreground/70 hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-6 text-center text-sm font-semibold tabular-nums">{accompanyingChildren}</span>
                                <button
                                  type="button"
                                  onClick={() => setAccompanyingChildren((n) => n + 1)}
                                  className="w-8 h-8 rounded-full border border-black/15 bg-white flex items-center justify-center text-foreground/70 hover:bg-black/5 transition"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Companions 12+ */}
                            <div className="flex items-center justify-between border-t border-black/8 pt-3">
                              <div>
                                <p className="text-sm font-medium text-foreground">Companions (12+ yrs)</p>
                                <p className="text-xs text-foreground/50">
                                  ₹{companionFee.toLocaleString('en-IN')} each <span className="text-foreground/40">(full fee)</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => setAccompanyingCompanions((n) => Math.max(0, n - 1))}
                                  disabled={accompanyingCompanions === 0}
                                  className="w-8 h-8 rounded-full border border-black/15 bg-white flex items-center justify-center text-foreground/70 hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-6 text-center text-sm font-semibold tabular-nums">{accompanyingCompanions}</span>
                                <button
                                  type="button"
                                  onClick={() => setAccompanyingCompanions((n) => n + 1)}
                                  className="w-8 h-8 rounded-full border border-black/15 bg-white flex items-center justify-center text-foreground/70 hover:bg-black/5 transition"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Total Amount */}
                          <div className="text-center">
                            <span className="text-2xl font-bold text-foreground">
                              ₹{totalAmount.toLocaleString('en-IN')}
                            </span>
                            {(accompanyingChildren > 0 || accompanyingCompanions > 0) ? (
                              <p className="text-xs text-foreground/50 mt-1">
                                ₹{activeQR.amount.toLocaleString('en-IN')}
                                {accompanyingCompanions > 0 && ` + ${accompanyingCompanions} × ₹${companionFee.toLocaleString('en-IN')}`}
                                {accompanyingChildren > 0 && ` + ${accompanyingChildren} × ₹${childFee.toLocaleString('en-IN')}`}
                              </p>
                            ) : (
                              <p className="text-xs text-foreground/50 mt-1">Total Payable</p>
                            )}
                          </div>

                          {/* QR Code Image */}
                          <div className="flex justify-center">
                            <div className="bg-white rounded-xl p-3 shadow-sm border border-black/5 inline-block">
                              <img
                                src={activeQR.qrImage}
                                alt="Payment QR Code"
                                className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                              />
                            </div>
                          </div>

                          {/* UPI ID with copy */}
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-sm text-foreground/70 font-mono bg-black/[0.04] px-3 py-1.5 rounded-lg border border-black/10">
                              {activeQR.upiId}
                            </span>
                            <button
                              type="button"
                              onClick={handleCopyUPI}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition"
                            >
                              {copied ? <Check size={14} /> : <Copy size={14} />}
                              {copied ? 'Copied!' : 'Copy UPI'}
                            </button>
                          </div>

                          <p className="text-xs text-foreground/50 text-center">
                            Scan the QR code or pay ₹{totalAmount.toLocaleString('en-IN')} via UPI
                          </p>
                        </>
                      )}

                      {/* Screenshot Upload */}
                      <div>
                        <label className={labelClass}>Payment Screenshot *</label>
                        <p className="text-xs text-foreground/50 mb-2">
                          Upload a screenshot or PDF of your payment confirmation
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        {screenshotFile ? (
                          <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3">
                            {screenshotPreview ? (
                              <img
                                src={screenshotPreview}
                                alt="Preview"
                                className="w-12 h-12 rounded-lg object-cover border border-black/10"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center">
                                <FileText size={20} className="text-red-500" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{screenshotFile.name}</p>
                              <p className="text-xs text-foreground/50">
                                {(screenshotFile.size / 1024).toFixed(0)} KB
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setScreenshotFile(null);
                                setScreenshotPreview(null);
                                setScreenshotError(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="text-foreground/40 hover:text-foreground transition"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-black/15 bg-black/[0.02] px-4 py-6 text-foreground/50 hover:border-primary/30 hover:bg-primary/[0.02] transition cursor-pointer"
                          >
                            <Upload size={24} />
                            <span className="text-sm">Click to upload screenshot</span>
                            <span className="text-xs">JPEG, PNG, WebP or PDF · Max 5MB</span>
                          </button>
                        )}
                        {screenshotError && <p className={errorClass}>{screenshotError}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>Name of Venture / Business</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Write 'N/A' if not started"
                      {...register('ventureName')}
                    />
                    <p className="mt-1.5 text-xs text-foreground/50">
                      Leave blank or write 'N/A' if you haven't started yet.
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>Industry / Sector *</label>
                    <select
                      className={inputClass + ' appearance-none pr-10 cursor-pointer'}
                      defaultValue=""
                      {...register('industry')}
                    >
                      <option value="" disabled className="bg-white">
                        Select industry
                      </option>
                      {INDUSTRY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt} className="bg-white">
                          {opt}
                        </option>
                      ))}
                    </select>
                    {errors.industry && <p className={errorClass}>{errors.industry.message}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>Business Stage *</label>
                    <select
                      className={inputClass + ' appearance-none pr-10 cursor-pointer'}
                      defaultValue=""
                      {...register('businessStage')}
                    >
                      <option value="" disabled className="bg-white">
                        Select stage
                      </option>
                      {BUSINESS_STAGE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt} className="bg-white">
                          {opt}
                        </option>
                      ))}
                    </select>
                    {errors.businessStage && (
                      <p className={errorClass}>{errors.businessStage.message}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>Business Scale *</label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {BUSINESS_SCALE_OPTIONS.map((opt) => (
                        <label
                          key={opt}
                          className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 transition hover:bg-black/[0.04] has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-white"
                        >
                          <input
                            type="radio"
                            value={opt}
                            className="accent-primary"
                            {...register('businessScale')}
                          />
                          <span className="text-sm font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                    {errors.businessScale && (
                      <p className={errorClass}>{errors.businessScale.message}</p>
                    )}
                  </div>
                </div>

                {serverError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    {serverError}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenChange(false)}
                    className="pill-button w-full text-foreground/70 hover:text-foreground sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="pill-button inline-flex w-full items-center justify-center gap-2 bg-primary text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        Submit Registration
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
