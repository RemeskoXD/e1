import { imgUrl } from '../data';

export default function Hero() {
  return (
    <section className="bg-[#132333] relative overflow-hidden min-h-[75vh] flex items-center pt-10 pb-32">
      <div className="absolute inset-0 z-0">
        <img 
          src={imgUrl("Venkovní stínění/Screenové rolety/tara.jpg")} 
          alt="Qapi Banner" 
          className="w-full h-full object-cover object-left md:object-center opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F1D2B] via-[#0F1D2B]/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#132333] via-transparent to-transparent"></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl">
          <span className="inline-block py-1 md:py-1.5 px-3 md:px-4 rounded-full bg-[#CCAD8A]/20 border border-[#CCAD8A]/30 text-[#CCAD8A] text-xs md:text-sm font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
            Oficiální partner Shadeon
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6 tracking-tight">
            Designové stínění <br/>
            <span className="text-[#CCAD8A]">na míru vašemu domovu</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed font-light max-w-2xl">
            Nakonfigurujte si žaluzie, rolety a sítě proti hmyzu jednoduše online. 
            Garantujeme špičkovou kvalitu za příznivé ceny.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#/kategorie" className="bg-[#CCAD8A] hover:bg-[#b5997a] text-[#132333] font-bold px-8 py-5 rounded transition-colors text-lg text-center shadow-2xl">
              Nakonfigurovat stínění
            </a>
            <button className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white font-bold px-8 py-5 rounded transition-colors text-lg text-center">
              Zobrazit realizace
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
