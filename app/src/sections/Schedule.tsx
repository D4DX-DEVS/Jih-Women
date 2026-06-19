import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type ScheduleSession = {
  stage: string;
  title: string;
  description: string;
  tag?: string;
};

type ScheduleItem = {
  time: string;
  sessions: ScheduleSession[];
  isBreak?: boolean;
};

const scheduleItems: ScheduleItem[] = [
  {
    time: '9:30 AM – 10:00 AM',
    sessions: [
      {
        stage: 'Main Stage',
        title: 'Networking over Tea',
        description: 'Kick off the summit with warm conversations, new connections, and a welcoming atmosphere over tea.',
      },
    ],
  },
  {
    time: '10:00 AM – 11:00 AM',
    sessions: [
      {
        stage: 'Main Stage',
        title: 'Inaugural Session',
        description: 'Opening reflections featuring P. Mujeebu Rahman (Ameer, Jamaat-e-Islami Hind Kerala), Sajitha PTP, Rajeena Beegum, and Ruksana Moosa — setting the tone for a day centred on women, enterprise, and impact.',
      },
    ],
  },
  // {
  //   time: '11:00 AM – 11:10 AM',
  //   isBreak: true,
  //   sessions: [
  //     {
  //       stage: '',
  //       title: 'Short Break',
  //       description: 'A brief pause to refresh before the next session.',
  //     },
  //   ],
  // },
  {
    time: '11:10 AM – 12:00 PM',
    sessions: [
      {
        stage: 'Main Stage',
        title: 'Panel Discussion',
        description: 'An insightful conversation on running businesses with integrity and purpose — featuring PV Rahmabi, Sameer Kalikavu, P.A Shameel Sajjad, and Dr. Nasreena KK.',
        tag: 'Ethical And Value Based Business',
      },
    ],
  },
  {
    time: '12:00 PM – 1:00 PM',
    sessions: [
      {
        stage: 'Main Stage',
        title: 'Women Identity & Leadership',
        description: 'A session with P. Ruksana (Vice President, JIH Women\'s Wing Kerala) on self-belief, leadership presence, and building with clarity across different life and business stages.',
      },
    ],
  },
  {
    time: '1:00 PM – 2:00 PM',
    isBreak: true,
    sessions: [
      {
        stage: '',
        title: 'Break & Networking',
        description: 'A relaxed midpoint to build connections, continue discussions, and meet peers from across sectors.',
      },
    ],
  },
  {
    time: '2:00 PM – 3:00 PM',
    sessions: [
      {
        stage: 'Main Stage',
        title: 'Trailblazers\' Talk: Real Stories, Real Success',
        description: 'Honest accounts from Abida Rasheed, Dr. Aysha Ruby, Mumthas KK, and Shamla Ismail — turning points, resilience, and practical wisdom from leading entrepreneurs.',
        tag: 'Panel Discussion',
      },
    ],
  },
  {
    time: '3:00 PM – 4:00 PM',
    sessions: [
      {
        stage: 'Main Stage',
        title: 'Digital Marketing & Branding',
        description: 'Sharper thinking on messaging, online presence, audience connection, and digital visibility for your business — with Rifath Rahman, Co-Founder of Capio Interactive.',
      },
      {
        stage: 'Sub Stage',
        title: 'Business Design Thinking',
        description: 'Creative tools to refine offers, solve business problems, and build more intentional growth paths — with Aisha Sameeha, Founder of Koderfin.',
      },
    ],
  },
  {
    time: '4:00 PM – 5:00 PM',
    sessions: [
      {
        stage: 'Main Stage',
        title: 'Closing Ceremony',
        description: 'Closing reflections with Sajitha PTP, Dr. Nahas Mala, Shifana K, Naseema K.T, and Sahira Manayath — celebrating the spirit and energy of the day.',
      },
    ],
  },
];

const consultationCounters = [
  {
    title: 'Startup Ecosystem',
    speaker: 'Dr. Nishad V.M',
    description: 'Insights on launching, scaling, and connecting within the broader startup and entrepreneurship landscape.',
  },
  {
    title: 'Creating Impact through Ethical Business',
    speaker: 'Faris OK',
    description: 'Explore how values-driven enterprises can generate meaningful change while building sustainable businesses.',
  },
  {
    title: 'Crisis Management & Business Growth',
    speaker: 'Dr. Muhammad Shafi',
    description: 'Practical strategies for navigating challenges, building resilience, and sustaining growth under pressure.',
  },
];

export default function Schedule() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Label and heading
      gsap.fromTo(
        [labelRef.current, headingRef.current],
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            once: true,
          },
        }
      );

      // Timeline line draws downward
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 1.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: itemsRef.current,
            start: 'top 80%',
            once: true,
          },
        }
      );

      // Timeline items
      if (itemsRef.current) {
        const items = itemsRef.current.querySelectorAll('.timeline-item');
        items.forEach((item, i) => {
          const isLeft = i % 2 === 0;
          gsap.fromTo(
            item,
            { x: isLeft ? -50 : 50, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.8,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: item,
                start: 'top 85%',
                once: true,
              },
            }
          );
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="schedule"
      ref={sectionRef}
      className="relative overflow-hidden py-20 sm:py-24 lg:py-32"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <span
          ref={labelRef}
          className="section-label text-primary block text-center mb-4 sm:mb-6 opacity-0"
        >
          Program Flow
        </span>

        <h2
          ref={headingRef}
          className="font-['Syne'] text-3xl sm:text-5xl lg:text-[56px] font-bold text-white text-center mb-12 sm:mb-16 opacity-0 leading-[1.05] tracking-tight"
        >
          A full-day journey built to keep energy, insight, and connection moving.
        </h2>

        <div ref={itemsRef} className="relative">
          <div
            ref={lineRef}
            className="absolute left-4 top-0 bottom-0 w-[2px] origin-top bg-gradient-to-b from-[#ff77bd] via-[#d52fb2] to-transparent lg:left-1/2 lg:-translate-x-px"
          />

          <div className="space-y-8 sm:space-y-10 lg:space-y-12">
            {scheduleItems.map((item, i) => {
              const isLeft = i % 2 === 0;
              const isParallel = item.sessions.length > 1;

              return (
                <div
                  key={i}
                  className={`timeline-item relative flex items-start gap-4 sm:gap-6 lg:gap-0 opacity-0 ${
                    isParallel ? 'lg:flex-row' : isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-4 z-10 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#ff7abd] bg-[#1a0727] shadow-[0_0_15px_rgba(255,97,170,0.45)] animate-pulse-dot lg:left-1/2 lg:h-5 lg:w-5">
                    <div className="w-1.5 h-1.5 bg-[#ff7abd] rounded-full"></div>
                  </div>

                  {isParallel ? (
                    /* Parallel sessions: show both cards side by side on desktop, stacked on mobile */
                    <div className="ml-10 sm:ml-14 lg:ml-0 w-full flex flex-col lg:flex-row gap-4 lg:gap-6">
                      {item.sessions.map((session, si) => (
                        <div
                          key={si}
                          className={`flex-1 ${si === 0 ? 'lg:pr-4' : 'lg:pl-4'}`}
                        >
                          <div
                            className={`glass-card relative overflow-hidden p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 h-full border-t-2 ${
                              si === 0 ? 'border-[#ff7abd]' : 'border-[#a78bfa]'
                            }`}
                          >
                            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/10 blur-2xl -mr-16 -mt-16 transition-all duration-500" />

                            {/* Stage badge */}
                            {session.stage && (
                              <span
                                className={`relative z-10 mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ${
                                  si === 0
                                    ? 'bg-[#ff7abd]/20 text-[#ff7abd] border border-[#ff7abd]/40'
                                    : 'bg-[#a78bfa]/20 text-[#c4b5fd] border border-[#a78bfa]/40'
                                }`}
                              >
                                {session.stage}
                              </span>
                            )}

                            <span className="relative z-10 mb-3 ml-2 inline-block rounded-full border border-white/14 bg-white/10 px-3 py-1 text-xs font-semibold text-[#ffd0e8] backdrop-blur-md">
                              {item.time}
                            </span>

                            {session.tag && (
                              <div className="relative z-10 mb-2">
                                <span className="inline-block rounded-full bg-primary/20 border border-primary/40 px-3 py-0.5 text-xs font-semibold text-primary">
                                  {session.tag}
                                </span>
                              </div>
                            )}

                            <h3 className="relative z-10 font-['Syne'] text-lg sm:text-xl font-bold text-white mb-2 tracking-tight">
                              {session.title}
                            </h3>
                            <p className="text-sm text-white/70 leading-relaxed">
                              {session.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Single session */
                    <>
                      <div
                        className={`ml-10 sm:ml-14 lg:ml-0 lg:w-[45%] ${
                          isLeft ? 'lg:pr-12' : 'lg:pl-12'
                        }`}
                      >
                        <div
                          className={`glass-card relative overflow-hidden p-5 sm:p-8 transition-all duration-300 hover:-translate-y-1 ${
                            item.isBreak ? 'border-l-2 border-white/20' : ''
                          }`}
                        >
                          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/10 blur-2xl -mr-16 -mt-16 transition-all duration-500" />

                          {item.sessions[0].stage && !item.isBreak && (
                            <span className="relative z-10 mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase bg-[#ff7abd]/20 text-[#ff7abd] border border-[#ff7abd]/40 mr-2">
                              {item.sessions[0].stage}
                            </span>
                          )}

                          <span className="relative z-10 mb-4 inline-block rounded-full border border-white/14 bg-white/10 px-4 py-1.5 text-sm font-semibold text-[#ffd0e8] backdrop-blur-md">
                            {item.time}
                          </span>

                          {item.sessions[0].tag && (
                            <div className="relative z-10 mb-2 mt-1">
                              <span className="inline-block rounded-full bg-primary/20 border border-primary/40 px-3 py-0.5 text-xs font-semibold text-primary">
                                {item.sessions[0].tag}
                              </span>
                            </div>
                          )}

                          <h3 className="relative z-10 font-['Syne'] text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
                            {item.sessions[0].title}
                          </h3>
                          <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                            {item.sessions[0].description}
                          </p>
                        </div>
                      </div>

                      <div className="hidden lg:block lg:w-[45%]" />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Consultation Counters */}
        <div className="mt-16 sm:mt-20 lg:mt-24">
          <div className="text-center mb-8 sm:mb-10">
            <span className="inline-block rounded-full border border-white/14 bg-white/10 px-4 py-1.5 text-sm font-semibold text-[#ffd0e8] backdrop-blur-md mb-3">
              2:00 PM – 4:00 PM
            </span>
            <h3 className="font-['Syne'] text-2xl sm:text-3xl font-bold text-white mt-2">
              Consultation Counters
            </h3>
            <p className="text-white/60 text-sm sm:text-base mt-2">Near Main Stage — Open during afternoon sessions</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {consultationCounters.map((counter, i) => (
              <div
                key={i}
                className="glass-card relative overflow-hidden p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 border-t-2 border-primary/50"
              >
                <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl -mr-12 -mt-12" />
                <span className="relative z-10 mb-3 inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 border border-primary/40 text-primary font-bold text-sm">
                  {i + 1}
                </span>
                <h4 className="relative z-10 font-['Syne'] text-lg font-bold text-white mb-1 tracking-tight">
                  {counter.title}
                </h4>
                {counter.speaker && (
                  <p className="relative z-10 text-xs font-semibold text-primary/90 mb-2">{counter.speaker}</p>
                )}
                <p className="relative z-10 text-sm text-white/70 leading-relaxed">
                  {counter.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
