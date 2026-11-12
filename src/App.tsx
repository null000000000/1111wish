import React, { useState, useEffect, useRef } from 'react';

// Sound synthesis using Web Audio API (Zero external assets required)
class SoundFX {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playHeartbeat() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  playBoing() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {
      // ignore
    }
  }

  playBuzzer() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch {
      // ignore
    }
  }

  playFanfare() {
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [261.6, 329.6, 392.0, 523.25];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.12 + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.12);
        osc.stop(this.ctx.currentTime + idx * 0.12 + 0.45);
      });
    } catch {
      // ignore
    }
  }
}

const sfx = new SoundFX();

type Gender = 'male' | 'female';
type Stage = 'hook' | 'loading' | 'reveal' | 'certificate';

interface CaptchaItem {
  id: number;
  name: string;
  emoji: string;
  isValid: boolean;
}

const CAPTCHA_ITEMS: CaptchaItem[] = [
  { id: 1, name: 'شاشة تليفزيون', emoji: '📺', isValid: false },
  { id: 2, name: 'رغيف حواوشي', emoji: '🥙', isValid: true },
  { id: 3, name: 'صورة قطة', emoji: '🐱', isValid: false },
  { id: 4, name: 'بطانية دافية', emoji: '🛌', isValid: true },
  { id: 5, name: 'كوباية شاي بلبن', emoji: '☕', isValid: true },
  { id: 6, name: 'كيس شيبسي', emoji: '🍟', isValid: true },
];

export default function App() {
  const [stage, setStage] = useState<Stage>('hook');
  const [gender, setGender] = useState<Gender>('male');
  const [userName, setUserName] = useState<string>('');
  const [evadeCount, setEvadeCount] = useState<number>(0);
  const [evadeOffset, setEvadeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [evadeTaunt, setEvadeTaunt] = useState<string>('');
  const [showCaptcha, setShowCaptcha] = useState<boolean>(false);
  const [selectedCaptchaIds, setSelectedCaptchaIds] = useState<number[]>([]);
  const [captchaError, setCaptchaError] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStatusText, setProgressStatusText] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; icon: string; visible: boolean }>({
    message: '',
    icon: '💬',
    visible: false,
  });

  const certCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const playgroundRef = useRef<HTMLDivElement | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const maxEvades = 4;

  const evadeTauntsMale = [
    'بتجري ورا الاهتمام كده ليه؟ 🏃‍♂️',
    'اهدى مش طايرة هيه 😂',
    'هو الجري نص الجدعنة برضه؟ 🤔',
    'خلاص هقف مكاني اهو، دوس يا سيدي! 🛑',
  ];

  const evadeTauntsFemale = [
    'بتجري ورا الاهتمام كده ليه؟ 🏃‍♀️',
    'اهدَي مش طايرة هيه 😂',
    'هو الجري نص الجدعنة برضه؟ 🤔',
    'خلاص هقف مكاني اهو، دوسي يا ستي! 🛑',
  ];

  const evadeTaunts = gender === 'female' ? evadeTauntsFemale : evadeTauntsMale;

  const showToastMsg = (msg: string, icon = '💬') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message: msg, icon, visible: true });
    toastTimeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3200);
  };

  // Evasive Button movement - slowed down and smoother as requested
  const handleEvadeAction = (e?: React.MouseEvent) => {
    const trimmed = userName.trim();
    if (!trimmed) {
      showToastMsg(
        gender === 'female'
          ? 'اكتبي اسمك الأول عشان نتأكد من هويتك! 🤨'
          : 'اكتب اسمك الأول عشان نتأكد من هويتك! 🤨',
        '⚠️'
      );
      return;
    }

    if (evadeCount < maxEvades) {
      if (e) e.preventDefault();
      sfx.playBoing();
      const nextCount = evadeCount + 1;
      setEvadeCount(nextCount);

      const bounds = playgroundRef.current?.getBoundingClientRect();
      const maxX = bounds ? Math.min(130, bounds.width / 2 - 50) : 100;
      const randomX = (Math.random() * 2 - 1) * maxX;
      const randomY = Math.random() * 40 - 20;

      setEvadeOffset({ x: randomX, y: randomY });
      setEvadeTaunt(evadeTaunts[nextCount - 1] || '');
    } else {
      // Open captcha
      setEvadeOffset({ x: 0, y: 0 });
      setShowCaptcha(true);
    }
  };

  // Captcha selection
  const toggleCaptchaTile = (id: number) => {
    sfx.playBoing();
    setSelectedCaptchaIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleVerifyCaptcha = () => {
    if (selectedCaptchaIds.length === 0) {
      sfx.playBuzzer();
      setCaptchaError(
        gender === 'female'
          ? 'لازم تختاري على الأقل حاجة واحدة بتحبك بجد!'
          : 'لازم تختار على الأقل حاجة واحدة بتحبك بجد!'
      );
      return;
    }

    const selectedItems = CAPTCHA_ITEMS.filter((item) => selectedCaptchaIds.includes(item.id));
    const hasInvalid = selectedItems.some((item) => !item.isValid);
    const validCount = selectedItems.filter((item) => item.isValid).length;

    if (hasInvalid) {
      sfx.playBuzzer();
      setCaptchaError(
        gender === 'female'
          ? 'القطط والشاشات بتستغلك عشان وقتك وأكلك بس.. ركّزي في الأكل والبطانية!'
          : 'القطط والشاشات بتستغلك عشان وقتك وأكلك بس.. ركّز في الأكل والبطانية!'
      );
      return;
    }

    if (validCount < 2) {
      sfx.playBuzzer();
      setCaptchaError(
        gender === 'female'
          ? 'لسه مش حاسة بدفء الأكل والسرير؟ اختاري حاجتين على الأقل من اللي بيحبوكي فعلاً!'
          : 'لسه مش حاسس بدفء الأكل والسرير؟ اختار حاجتين على الأقل من اللي بيحبوك فعلاً!'
      );
      return;
    }

    // Success -> proceed to Stage 3 Loading
    setCaptchaError('');
    setShowCaptcha(false);
    startLongDramaticLoading();
  };

  // Longer dramatic loading bar as explicitly requested ("الدونلود بار ياخد وقت")
  const startLongDramaticLoading = () => {
    setStage('loading');
    setProgressPercent(0);

    const stepsMale = [
      { text: 'جاري فحص سجل المكالمات بحثاً عن أي بني آدم سأل عليك...', target: 15, duration: 2500 },
      { text: 'جاري مسح الـ DMs بحثاً عن مسجات غير عروض فودافون وأورنچ...', target: 35, duration: 2600 },
      { text: 'جاري مراجعة الـ Story Views والتأكد هل الكراش فتحها ولا لأ...', target: 55, duration: 2500 },
      { text: 'استنى.. لقينا إشعار حب حقيقي! لا ده طلع كود خصم من نون 🛍️', target: 75, duration: 2600 },
      { text: 'جاري فحص التروكولر بحثاً عن اسم رومانسي مسجلك بيه...', target: 90, duration: 2400 },
      { text: 'فشل الفحص الشامل: نسبة الاهتمام المسجلة 0.00% 💔', target: 100, duration: 2000 },
    ];

    const stepsFemale = [
      { text: 'جاري فحص سجل المكالمات بحثاً عن أي بني آدم سأل عليكي...', target: 15, duration: 2500 },
      { text: 'جاري مسح الـ DMs بحثاً عن مسجات غير عروض فودافون وأورنچ...', target: 35, duration: 2600 },
      { text: 'جاري مراجعة الـ Story Views والتأكد هل الكراش فتحها ولا لأ...', target: 55, duration: 2500 },
      { text: 'استني.. لقينا إشعار حب حقيقي! لا ده طلع كود خصم من نون 🛍️', target: 75, duration: 2600 },
      { text: 'جاري فحص التروكولر بحثاً عن اسم رومانسي مسجلك بيه...', target: 90, duration: 2400 },
      { text: 'فشل الفحص الشامل: نسبة الاهتمام المسجلة 0.00% 💔', target: 100, duration: 2000 },
    ];

    const steps = gender === 'female' ? stepsFemale : stepsMale;
    let stepIndex = 0;

    const heartInterval = setInterval(() => {
      sfx.playHeartbeat();
    }, 700);

    const runNextStep = () => {
      if (stepIndex < steps.length) {
        const current = steps[stepIndex];
        setProgressStatusText(current.text);
        setProgressPercent(current.target);
        stepIndex++;
        setTimeout(runNextStep, current.duration);
      } else {
        clearInterval(heartInterval);
        setTimeout(() => {
          setStage('reveal');
          sfx.playBoing();
        }, 1200);
      }
    };

    runNextStep();
  };

  // Render Certificate on Canvas with feminine or masculine text
  const renderCertificate = () => {
    const canvas = certCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const displayName = userName.trim() || (gender === 'female' ? 'صديقتنا البائسة' : 'صديقنا البائس');

    // Background paper gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#fffbf0');
    grad.addColorStop(1, '#ffedd5');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Vintage borders
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, w - 40, h - 40);

    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(32, 32, w - 64, h - 64);

    // Header Icon
    ctx.textAlign = 'center';
    ctx.font = '54px sans-serif';
    ctx.fillText('📜', w / 2, 110);

    // Title
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 48px Cairo, sans-serif';
    ctx.fillText('شهادة صمود 11/11', w / 2, 180);

    // Subtitle
    ctx.fillStyle = '#be123c';
    ctx.font = '800 30px Cairo, sans-serif';
    ctx.fillText(`تُمنح لـ: ${displayName}`, w / 2, 240);

    // Divider Line
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 280);
    ctx.lineTo(w - 100, 280);
    ctx.stroke();

    // Field: التصنيف
    ctx.fillStyle = '#475569';
    ctx.font = '700 24px Cairo, sans-serif';
    ctx.fillText('التصنيف المعتمد:', w / 2, 330);

    ctx.fillStyle = '#dc2626';
    ctx.font = '900 32px Cairo, sans-serif';
    ctx.fillText('جفاف عاطفي من الدرجة الرابعة 🌵', w / 2, 380);

    // Field: تقرير الحالة الميدانية
    ctx.fillStyle = '#475569';
    ctx.font = '700 24px Cairo, sans-serif';
    ctx.fillText('تقرير الحالة الميدانية:', w / 2, 450);

    ctx.fillStyle = '#1e293b';
    ctx.font = '700 23px Cairo, sans-serif';
    if (gender === 'female') {
      ctx.fillText('قضت اليوم كامل بدون أي رسالة، معتمدة كلياً', w / 2, 500);
      ctx.fillText('على السكرول اللانهائي والنوم بعد الفجر.', w / 2, 540);
    } else {
      ctx.fillText('قضى اليوم كامل بدون أي رسالة، معتمداً كلياً', w / 2, 500);
      ctx.fillText('على التعفن الدماغي والنوم بعد الفجر.', w / 2, 540);
    }

    // Decorative Quote
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 700 19px Cairo, sans-serif';
    if (gender === 'female') {
      ctx.fillText('«لو كان حد مهتم بيكي، كان نطق قبل ما السنة تخلص!»', w / 2, 620);
    } else {
      ctx.fillText('«لو كان حد مهتم بيك، كان نطق قبل ما السنة تخلص!»', w / 2, 620);
    }

    // Official Stamp
    ctx.save();
    ctx.translate(w / 2, 750);
    ctx.rotate((-8 * Math.PI) / 180);

    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 190, 75, 0, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#b91c1c';
    ctx.font = '900 22px Cairo, sans-serif';
    ctx.fillText('★ مُعتمد رسمياً ★', 0, -25);
    ctx.font = '800 17px Cairo, sans-serif';
    ctx.fillText('وزارة البطاطين والشاي بلبن', 0, 8);
    ctx.font = '700 15px Cairo, sans-serif';
    ctx.fillText('قطاع مكافحة المحن 2026', 0, 38);

    ctx.restore();

    // Watermark
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 14px Cairo, sans-serif';
    ctx.fillText('كود التوثيق: DRY-1111-FOREVER • صالح حتى 11/11 القادم', w / 2, 875);
  };

  useEffect(() => {
    if (stage === 'certificate') {
      renderCertificate();
      // Ensure canvas fonts render if font loads late
      if (document.fonts) {
        document.fonts.ready.then(renderCertificate);
      }
    }
  }, [stage, gender, userName]);

  const handleClaimCertificate = () => {
    sfx.playFanfare();
    setStage('certificate');
  };

  const handleDownloadImage = () => {
    const canvas = certCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    const safeName = userName.trim() || (gender === 'female' ? 'سنجلة' : 'سنجل');
    link.download = `شهادة_صمود_${safeName}_11_11.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToastMsg(
      gender === 'female'
        ? 'تم تنزيل الشهادة! شيريها في الستوري وفرحينا بيكي 📸'
        : 'تم تنزيل الشهادة! شيرها في الستوري وفرحنا بيك 📸',
      '🎉'
    );
  };

  const handleShareLink = () => {
    const shareText =
      gender === 'female'
        ? `في شخص مسجل رقمك بعتلك رسالة سرية بمناسبة 11/11 ومستنيكي تفتحيها 💌👀 ادخلي شوفيها من هنا: ${window.location.href}`
        : `في شخص مسجل رقمك بعتلك رسالة سرية بمناسبة 11/11 ومستنيك تفتحها 💌👀 ادخل شوفها من هنا: ${window.location.href}`;

    navigator.clipboard
      .writeText(shareText)
      .then(() => {
        showToastMsg(
          gender === 'female'
            ? 'تم نسخ رابط المقلب! ابعتيه لصحابك في جروب البنات 😈'
            : 'تم نسخ رابط المقلب! ابعته لصحابك في جروب الواتساب 😈',
          '📋'
        );
      })
      .catch(() => {
        showToastMsg('تم نسخ الرابط!', '📋');
      });
  };

  const handleRestart = () => {
    setEvadeCount(0);
    setEvadeOffset({ x: 0, y: 0 });
    setEvadeTaunt('');
    setUserName('');
    setSelectedCaptchaIds([]);
    setCaptchaError('');
    setStage('hook');
  };

  const displayName = userName.trim() || (gender === 'female' ? 'سنجلتنا العزيزة' : 'سنجلنا العزيز');

  return (
    <div className="text-slate-800 flex flex-col items-center justify-center p-4 relative min-h-screen">
      {/* Floating Background Hearts */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(16)].map((_, i) => (
          <span
            key={i}
            className="heart-particle text-xl sm:text-2xl select-none"
            style={{
              left: `${(i * 6.3 + 3) % 98}vw`,
              animationDelay: `${(i * 0.45) % 6}s`,
              animationDuration: `${5.5 + ((i * 1.3) % 4.5)}s`,
            }}
          >
            {['❤️', '💖', '💌', '🌸', '✨', '💕'][i % 6]}
          </span>
        ))}
      </div>

      {/* Notification Toast */}
      <div
        id="toast"
        className={`fixed top-5 z-50 transform transition-all duration-300 ${
          toast.visible ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0 pointer-events-none'
        } bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-2 text-sm md:text-base border border-slate-700`}
      >
        <span>{toast.icon}</span>
        <span>{toast.message}</span>
      </div>

      {/* Main App Wrapper */}
      <main className="w-full max-w-lg mx-auto relative z-10">
        {/* ================= STAGE 1: THE HOOK ================= */}
        {stage === 'hook' && (
          <section className="bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border-2 border-rose-200 text-center relative overflow-hidden transition-all duration-500">
            {/* Glowing 11:11 Clock Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-rose-100 text-rose-600 font-extrabold text-lg sm:text-xl border border-rose-300 shadow-sm animate-pulse-glow mb-3">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span>✨ 11:11 PM ✨</span>
            </div>

            <div className="text-5xl sm:text-6xl my-2 animate-floating">💌</div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 leading-snug mb-3 mt-1">
              في شخص مسجل رقمك بعتلك رسالة سرية بمناسبة{' '}
              <span className="text-rose-600 underline decoration-wavy decoration-rose-300">11/11</span>{' '}
              {gender === 'female' ? 'ومستنيكي تفتحيها!' : 'ومستنيك تفتحها!'}
            </h1>
            <p className="text-slate-600 text-sm sm:text-base mb-5 font-medium leading-relaxed">
              الرسالة متشفرة ومحفوظة مخصوص عشانك.. هل قلبك جاهز يشوف مين مهتم{' '}
              {gender === 'female' ? 'بيكي وبيفكر فيكي' : 'بيك وبيفكر فيك'} دلوقت؟
            </p>

            {/* Gender Selector: ولد / بنت */}
            <div className="mb-5 bg-rose-50/70 p-1.5 rounded-2xl border border-rose-200 flex items-center justify-between gap-1 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setGender('male');
                  sfx.playBoing();
                }}
                className={`flex-1 py-2.5 rounded-xl font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  gender === 'male'
                    ? 'bg-rose-500 text-white shadow-md scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-rose-100/50'
                }`}
              >
                <span>أنا ولد</span>
                <span className="text-lg">👦</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setGender('female');
                  sfx.playBoing();
                }}
                className={`flex-1 py-2.5 rounded-xl font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  gender === 'female'
                    ? 'bg-rose-500 text-white shadow-md scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-rose-100/50'
                }`}
              >
                <span>أنا بنت</span>
                <span className="text-lg">👧</span>
              </button>
            </div>

            {/* Name Input Field */}
            <div className="space-y-2 mb-6 text-right">
              <label htmlFor="user-name" className="block text-sm font-bold text-slate-700 mr-1">
                {gender === 'female' ? 'اكتبي اسمك الأول:' : 'اكتب اسمك الأول:'}
              </label>
              <input
                type="text"
                id="user-name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={gender === 'female' ? 'اسمك إيه يا قمر؟' : 'اسمك إيه يا بطل؟'}
                maxLength={25}
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-rose-200 focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-100 text-lg transition duration-200 text-slate-800 font-bold placeholder-slate-400 bg-pink-50/40"
              />
            </div>

            {/* Evasive / Trigger Button Area - slowed down drift transition */}
            <div
              ref={playgroundRef}
              className="relative w-full h-20 flex items-center justify-center"
            >
              <button
                type="button"
                onMouseEnter={() => handleEvadeAction()}
                onClick={(e) => handleEvadeAction(e)}
                style={{
                  transform: `translate(${evadeOffset.x}px, ${evadeOffset.y}px)`,
                  transition: 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)',
                }}
                className="px-8 py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-black text-lg sm:text-xl rounded-2xl shadow-xl hover:shadow-rose-300/80 active:scale-95 border-2 border-white flex items-center gap-2 cursor-pointer select-none"
              >
                <span>عرض رسالة الاهتمام</span>
                <span className="text-xl">💌</span>
              </button>
            </div>

            {/* Snarky Evade Counter / Bubble */}
            <div
              className={`h-6 text-xs sm:text-sm font-bold text-rose-600 transition-opacity duration-300 mt-3 ${
                evadeTaunt ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {evadeTaunt || ' '}
            </div>
          </section>
        )}

        {/* ================= STAGE 2: THE SATIRICAL CAPTCHA MODAL ================= */}
        {showCaptcha && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border-4 border-rose-300 transform transition-all duration-300 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  اختبار إنساني ساخر
                </span>
                <span className="text-xl">🤖❤️</span>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-slate-800 leading-snug mb-1">
                تأكيد عدم الجفاف العاطفي:
              </h3>
              <p className="text-sm text-slate-600 font-medium mb-4">
                {gender === 'female' ? 'اضغطي على' : 'اضغط على'}{' '}
                <span className="font-extrabold text-rose-600">كل الصور</span> التي تحتوي على{' '}
                <span className="underline">شخص بيحبك بجد</span>:
              </p>

              {/* Grid of 6 items */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {CAPTCHA_ITEMS.map((item) => {
                  const isSelected = selectedCaptchaIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleCaptchaTile(item.id)}
                      className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <span className="text-3xl sm:text-4xl mb-1">{item.emoji}</span>
                      <span className="text-xs font-bold text-slate-700">{item.name}</span>
                      {isSelected && (
                        <div className="absolute top-1 left-1 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Error notice in captcha */}
              {captchaError && (
                <div className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-200 rounded-xl p-2.5 mb-4 text-center">
                  {captchaError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleVerifyCaptcha}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-extrabold rounded-2xl text-base transition shadow-md cursor-pointer"
                >
                  تأكيد الإجابة وتفكيك التشفير 🔓
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STAGE 3: THE DRAMATIC FAKE PROGRESS ================= */}
        {stage === 'loading' && (
          <section className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border-2 border-rose-200 text-center transition-all duration-500">
            <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
              <div className="absolute inset-0 bg-rose-100 rounded-full animate-ping opacity-60"></div>
              <div className="w-24 h-24 bg-gradient-to-tr from-rose-500 to-pink-400 rounded-full flex items-center justify-center shadow-lg text-4xl text-white animate-pulse">
                ❤️
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-2">
              جاري استخراج رسالة 11/11...
            </h2>
            <div className="text-slate-600 font-bold text-sm sm:text-base min-h-[52px] flex items-center justify-center px-4 mb-5">
              {progressStatusText}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden border border-slate-200 p-0.5 mb-2 shadow-inner">
              <div
                className="bg-gradient-to-r from-rose-400 via-pink-500 to-rose-600 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-xs font-black text-slate-400 px-1">
              <span>فحص المشاعر العاطفية</span>
              <span>{progressPercent}%</span>
            </div>
          </section>
        )}

        {/* ================= STAGE 4: THE REVEAL (ENVELOPE) ================= */}
        {stage === 'reveal' && (
          <section className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border-2 border-rose-200 text-center transition-all duration-500">
            {/* Wax Envelope Graphic */}
            <div className="relative max-w-sm mx-auto mb-6 pt-2">
              <div className="bg-gradient-to-b from-amber-100 to-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-md relative text-right">
                {/* Red Stamp Top-Right */}
                <div className="absolute -top-3 -right-3 bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow border-2 border-white rotate-6">
                  سري وعاجل للغاية ⚠️
                </div>

                <div className="border-b-2 border-dashed border-amber-300 pb-3 mb-4 text-center">
                  <span className="text-3xl">📜</span>
                  <h3 className="text-lg font-black text-amber-900 mt-1">
                    الرسالة المنتظرة ليوم 11/11
                  </h3>
                </div>

                {/* Personalized letter content tailored to gender */}
                <p className="text-slate-800 text-base sm:text-lg font-bold leading-relaxed mb-4 text-justify">
                  {gender === 'female' ? (
                    <>
                      "عزيزتي{' '}
                      <span className="text-rose-600 font-black">{displayName}</span>، بمناسبة
                      11/11، حابين نفكرك إن باقة النت بتاعتك خلصت، وإن الشخص الوحيد اللي مهتم بوجودك
                      هو بتاع السوبر ماركت علشان انتي واكلة عليه 2 جنيه.. بتمنى لِك نومة دافية تحت
                      البطانية، لأن مفيش حد بيحبك في السر، ولو حد مهتم كان نطق من 2020. قومي نامي."
                    </>
                  ) : (
                    <>
                      "عزيزي <span className="text-rose-600 font-black">{displayName}</span>،
                      بمناسبة 11/11، حابين نفكرك إن باقة النت بتاعتك خلصت، وإن الشخص الوحيد اللي
                      مهتم بوجودك هو بتاع السوبر ماركت علشان انت واكل عليه 2 جنيه.. بتمنى لك نومة
                      دافية تحت البطانية، لأن مفيش حد بيحبك في السر، ولو حد مهتم كان نطق من 2020. قوم
                      نام."
                    </>
                  )}
                </p>

                <div className="text-left text-xs font-black text-amber-800 border-t border-amber-200 pt-3 flex justify-between items-center">
                  <span className="text-red-700">المرسل: الحقيقة المرة 🪓</span>
                  <span>الساعة: 11:11 م</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClaimCertificate}
              className="w-full py-4 bg-gradient-to-r from-amber-600 via-rose-600 to-rose-700 text-white font-black text-lg rounded-2xl shadow-xl hover:shadow-rose-400/50 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{gender === 'female' ? 'استلمي شهادة الصمود الرسمية' : 'استلم شهادة الصمود الرسمية'}</span>
              <span className="text-2xl">📜</span>
            </button>
          </section>
        )}

        {/* ================= STAGE 5: THE SHAREABLE CERTIFICATE ================= */}
        {stage === 'certificate' && (
          <section className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border-2 border-rose-200 text-center transition-all duration-500">
            <h2 className="text-2xl font-black text-slate-800 mb-1">
              {gender === 'female' ? 'مبروك التتويج يا بطلة! 🎖️' : 'مبروك التتويج يا بطل! 🎖️'}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-bold mb-4">
              {gender === 'female'
                ? 'تم اعتماد موقفكِ البطولي رسمياً في سجلات الجفاف العاطفي'
                : 'تم اعتماد موقفك البطولي رسمياً في سجلات الجفاف العاطفي'}
            </p>

            {/* Canvas Element for drawing and downloading high-res image */}
            <div className="w-full overflow-hidden rounded-2xl shadow-xl border-4 border-slate-800 bg-amber-50 mb-6 flex justify-center">
              <canvas
                ref={certCanvasRef}
                width={800}
                height={920}
                className="w-full max-w-sm h-auto block"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleDownloadImage}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>حفظ الكارت للستوري (Download PNG)</span>
                <span className="text-xl">📸</span>
              </button>

              <button
                type="button"
                onClick={handleShareLink}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-base rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {gender === 'female' ? 'ابعتي لصحابك (Copy Troll Link)' : 'ابعت لصحابك (Copy Troll Link)'}
                </span>
                <span className="text-xl">🔗</span>
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="w-full py-2.5 text-slate-600 hover:text-slate-900 font-bold text-sm rounded-xl transition cursor-pointer"
              >
                {gender === 'female'
                  ? '🔄 جرّبي باسم تاني واصطادي صاحبتك'
                  : '🔄 جرّب باسم تاني واصطاد صاحبك'}
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Footer Copyright / Satirical Disclaimer */}
      <footer className="mt-8 text-center text-xs text-slate-500 font-semibold relative z-10">
        يوم 11/11 الساخر • معمول بكل حب للسناجل والناس اللي نايمة تحت البطانية 🛋️
      </footer>
    </div>
  );
}
