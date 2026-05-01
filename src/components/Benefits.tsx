import { Truck, Award, ShieldCheck, Headphones } from 'lucide-react';

export default function Benefits() {
  return (
    <div className="relative z-20">
      <div className="container mx-auto px-6 -mt-20">
        <div className="bg-white rounded-xl shadow-2xl p-8 lg:p-10 border border-gray-100 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 gap-y-8">
          <div className="flex-1 flex flex-col md:flex-row items-center gap-5 justify-center group lg:justify-start lg:pl-0">
            <div className="w-14 h-14 rounded-full bg-[#132333]/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Truck size={28} className="text-[#CCAD8A]" />
            </div>
            <div className="text-center md:text-left">
              <h4 className="font-bold text-[#132333] text-lg">Doprava zdarma</h4>
              <p className="text-sm text-gray-500">Od 5 000 Kč</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col md:flex-row items-center gap-5 justify-center group pt-8 md:pt-0 lg:pl-8">
            <div className="w-14 h-14 rounded-full bg-[#132333]/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Award size={28} className="text-[#CCAD8A]" />
            </div>
            <div className="text-center md:text-left">
              <h4 className="font-bold text-[#132333] text-lg">Certifikovaný dodavatel</h4>
              <p className="text-sm text-gray-500">Oficiální partner</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col md:flex-row items-center gap-5 justify-center group pt-8 md:pt-0 lg:pl-8">
            <div className="w-14 h-14 rounded-full bg-[#132333]/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Headphones size={28} className="text-[#CCAD8A]" />
            </div>
            <div className="text-center md:text-left">
              <h4 className="font-bold text-[#132333] text-lg">Odborná podpora</h4>
              <p className="text-sm text-gray-500">Vždy k dispozici</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col md:flex-row items-center gap-5 justify-center group pt-8 md:pt-0 lg:pl-8">
            <div className="w-14 h-14 rounded-full bg-[#132333]/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <ShieldCheck size={28} className="text-[#CCAD8A]" />
            </div>
            <div className="text-center md:text-left">
              <h4 className="font-bold text-[#132333] text-lg">Kvalitní materiály</h4>
              <p className="text-sm text-gray-500">Které dlouho vydrží</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
