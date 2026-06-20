import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star, CheckCircle2, Send } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

type FormState = {
  name: string;
  whatsappNumber: string;
  email: string;
  overallRating: number;
  sessionQuality: number;
  venueRating: number;
  liked: string;
  improvements: string;
  recommend: string;
  comments: string;
};

const DEFAULT_FORM: FormState = {
  name: '',
  whatsappNumber: '',
  email: '',
  overallRating: 0,
  sessionQuality: 0,
  venueRating: 0,
  liked: '',
  improvements: '',
  recommend: '',
  comments: '',
};

function StarRating({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  error?: string;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/68 mb-2.5">{label}</p>
      <div className="flex gap-1.5" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= (hovered || value);
          return (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHovered(star)}
              onClick={() => onChange(star)}
              className="transition-transform duration-150 hover:scale-115 focus:outline-none"
              aria-label={`Rate ${star} out of 5`}
            >
              <Star
                size={26}
                className={`transition-colors duration-150 ${
                  filled ? 'fill-yellow-400 text-yellow-400' : 'fill-transparent text-white/28'
                }`}
              />
            </button>
          );
        })}
        {value > 0 && (
          <span className="self-center ml-2 text-xs text-white/50">
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][value]}
          </span>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export default function Feedback() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        labelRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
        }
      );
      gsap.fromTo(
        headingRef.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true },
        }
      );
      gsap.fromTo(
        cardRef.current,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: cardRef.current, start: 'top 85%', once: true },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = 'Please enter your name';
    if (!form.whatsappNumber.trim()) next.whatsappNumber = 'Please enter your WhatsApp number';
    else if (!/^\+?[\d\s\-()]{7,20}$/.test(form.whatsappNumber.trim()))
      next.whatsappNumber = 'Enter a valid phone number';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = 'Enter a valid email address';
    if (!form.overallRating) next.overallRating = 'Please rate your overall experience';
    if (!form.sessionQuality) next.sessionQuality = 'Please rate the session quality';
    if (!form.venueRating) next.venueRating = 'Please rate the venue';
    if (!form.recommend) next.recommend = 'Please select an option';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError(data.error || 'Failed to submit feedback. Please try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl bg-white/[0.06] border border-white/12 text-white placeholder-white/30 px-4 py-3 outline-none transition focus:border-primary/60 focus:bg-white/[0.1] text-sm';

  const labelClass = 'block text-xs font-semibold uppercase tracking-[0.12em] text-white/68 mb-2';

  return (
    <section
      id="feedback"
      ref={sectionRef}
      className="relative py-20 sm:py-24 lg:py-32"
    >
      {/* Background ambient blobs */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -left-32 top-1/4 w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(230,25,128,0.35) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute -right-32 bottom-1/4 w-[400px] h-[400px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(111,25,212,0.4) 0%, transparent 70%)',
            filter: 'blur(70px)',
          }}
        />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <div className="mb-10 sm:mb-12 text-center">
          <span
            ref={labelRef}
            className="section-label text-primary block mb-3 opacity-0"
          >
            Share Your Experience
          </span>
          <h2
            ref={headingRef}
            className="font-['Syne'] text-2xl sm:text-3xl lg:text-[2.4rem] font-bold text-white leading-[1.12] tracking-tight opacity-0"
          >
            How was WES 2026 for you?
          </h2>
          <p className="mt-4 text-sm text-white/58 max-w-xl mx-auto leading-relaxed">
            Your feedback helps us improve future editions and serves as a guiding light for the
            women entrepreneurship community. It only takes a couple of minutes.
          </p>
        </div>

        {/* Card */}
        <div
          ref={cardRef}
          className="overflow-hidden rounded-[32px] border border-white/12 bg-white/[0.06] shadow-[0_24px_70px_rgba(7,2,20,0.28)] backdrop-blur-xl p-6 sm:p-8 lg:p-10 opacity-0"
        >
          {submitted ? (
            /* Success state */
            <div className="flex flex-col items-center justify-center py-12 text-center gap-6">
              <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-400/30 flex items-center justify-center">
                <CheckCircle2 className="text-green-400" size={32} />
              </div>
              <div>
                <h3 className="font-['Syne'] text-xl font-bold text-white mb-2">
                  Thank you for your feedback!
                </h3>
                <p className="text-sm text-white/60 max-w-sm mx-auto">
                  Your response has been recorded. We deeply appreciate you taking the time to
                  share your thoughts on WES 2026.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setForm(DEFAULT_FORM);
                  setErrors({});
                }}
                className="pill-button pill-button-outline text-sm px-6 py-2.5"
              >
                Submit another response
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-7">
              {/* Personal info */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40 mb-4">
                  Your Details
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="fb-name">Full Name *</label>
                    <input
                      id="fb-name"
                      type="text"
                      className={inputClass}
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      maxLength={120}
                    />
                    {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="fb-whatsapp">WhatsApp Number *</label>
                    <input
                      id="fb-whatsapp"
                      type="tel"
                      className={inputClass}
                      placeholder="+91 98765 43210"
                      value={form.whatsappNumber}
                      onChange={(e) => set('whatsappNumber', e.target.value)}
                      maxLength={20}
                    />
                    {errors.whatsappNumber && (
                      <p className="mt-1.5 text-xs text-red-400">{errors.whatsappNumber}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="fb-email">
                      Email Address <span className="normal-case font-normal text-white/40">(optional)</span>
                    </label>
                    <input
                      id="fb-email"
                      type="email"
                      className={inputClass}
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      maxLength={200}
                    />
                    {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/8" />

              {/* Ratings */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40 mb-4">
                  Rate Your Experience
                </p>
                <div className="grid gap-5 sm:grid-cols-3">
                  <StarRating
                    label="Overall Experience *"
                    value={form.overallRating}
                    onChange={(v) => set('overallRating', v)}
                    error={errors.overallRating}
                  />
                  <StarRating
                    label="Session Quality *"
                    value={form.sessionQuality}
                    onChange={(v) => set('sessionQuality', v)}
                    error={errors.sessionQuality}
                  />
                  <StarRating
                    label="Venue & Logistics *"
                    value={form.venueRating}
                    onChange={(v) => set('venueRating', v)}
                    error={errors.venueRating}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/8" />

              {/* Written feedback */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40 mb-4">
                  Tell Us More
                </p>
                <div className="grid gap-4">
                  <div>
                    <label className={labelClass} htmlFor="fb-liked">
                      What did you enjoy most?{' '}
                      <span className="normal-case font-normal text-white/40">(optional)</span>
                    </label>
                    <textarea
                      id="fb-liked"
                      rows={3}
                      className={inputClass + ' resize-none'}
                      placeholder="The panel discussion, networking, speakers..."
                      value={form.liked}
                      onChange={(e) => set('liked', e.target.value)}
                      maxLength={2000}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="fb-improvements">
                      What could be improved?{' '}
                      <span className="normal-case font-normal text-white/40">(optional)</span>
                    </label>
                    <textarea
                      id="fb-improvements"
                      rows={3}
                      className={inputClass + ' resize-none'}
                      placeholder="More networking time, better seating, earlier schedule..."
                      value={form.improvements}
                      onChange={(e) => set('improvements', e.target.value)}
                      maxLength={2000}
                    />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/8" />

              {/* Recommend */}
              <div>
                <p className={labelClass}>Would you recommend WES to someone you know? *</p>
                <div className="flex flex-wrap gap-3">
                  {['Yes', 'No', 'Maybe'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => set('recommend', opt)}
                      className={`px-5 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                        form.recommend === opt
                          ? 'bg-primary border-primary text-white shadow-[0_0_20px_rgba(230,25,128,0.35)]'
                          : 'bg-white/[0.06] border-white/14 text-white/70 hover:border-white/30 hover:bg-white/[0.1]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {errors.recommend && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.recommend}</p>
                )}
              </div>

              {/* Additional comments */}
              <div>
                <label className={labelClass} htmlFor="fb-comments">
                  Any other thoughts?{' '}
                  <span className="normal-case font-normal text-white/40">(optional)</span>
                </label>
                <textarea
                  id="fb-comments"
                  rows={3}
                  className={inputClass + ' resize-none'}
                  placeholder="Anything else you'd like to share with the organising team..."
                  value={form.comments}
                  onChange={(e) => set('comments', e.target.value)}
                  maxLength={2000}
                />
              </div>

              {/* Server error */}
              {serverError && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-3 text-sm text-red-300">
                  {serverError}
                </div>
              )}

              {/* Submit */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="pill-button pill-button-primary w-full flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
