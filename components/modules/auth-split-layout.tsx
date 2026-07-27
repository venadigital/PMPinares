import Image from "next/image";

export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen grid-cols-1 overflow-hidden lg:grid-cols-[1fr_1fr]">
      <section className="relative flex min-h-[40rem] flex-col justify-between overflow-hidden bg-ink p-7 text-white lg:p-10">
        <Image
          src="/assets/fondo-home.jpg"
          alt=""
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink/82 via-ink/66 to-ink/46" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_82%,rgba(255,199,18,0.20),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(64,132,255,0.28),transparent_30%)]" />
        <div className="relative z-10 flex items-center gap-4">
          <Image
            src="/assets/logo-pinares-project-control.png"
            alt="Pinares Project Control"
            width={120}
            height={60}
            className="h-12 w-auto object-contain"
            priority
          />
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-sun">Vena Digital</p>
            <p className="font-display text-lg font-bold">Pinares Project Control</p>
          </div>
        </div>
        <div className="relative z-10 max-w-xl">
          <p className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-sun">
            Consultoria digital
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Control claro para decisiones criticas.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Gestion documental, cronograma, inventario TI, hallazgos, riesgos y trazabilidad en una experiencia premium para Pinares.
          </p>
        </div>
        <Image
          src="/assets/mascota-home.png"
          alt="Mascota Pinares Project Control"
          width={190}
          height={190}
          className="absolute bottom-8 right-8 hidden opacity-90 lg:block"
        />
      </section>
      <section className="flex items-center justify-center p-6 lg:p-10">{children}</section>
    </main>
  );
}
