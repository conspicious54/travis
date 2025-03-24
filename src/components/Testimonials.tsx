import React from 'react';
import { Trophy } from '@phosphor-icons/react';
import { CustomVideoPlayer } from './CustomVideoPlayer';
import { CTAButton } from './CTAButton';

interface TestimonialsProps {
  theme?: 'light' | 'dark';
}

export const Testimonials: React.FC<TestimonialsProps> = ({ theme = 'dark' }) => {
  const isLight = theme === 'light';
  
  const testimonials = [
    {
      avatar: "https://cdn.prod.website-files.com/66fefebbdd3ababfcd16bca4/677d8940dd0e6c60fb389b1b_Juliana.webp",
      name: "Julianna R",
      amount: "$112k",
      text: "Travis has been instrumental to my success on Amazon... if you're looking to sell on Amazon, there is no better way!",
      video: "https://pub-cda2548da4a2411a995b49fb5416f4ca.r2.dev/julianna's_testimonial%20(720p).mp4",
      poster: "https://cdn.prod.website-files.com/66fefebbdd3ababfcd16bca4/677d8940dd0e6c60fb389b1b_Juliana.webp",
      likes: 156,
      comments: 42
    },
    {
      avatar: "https://cdn.prod.website-files.com/66fefebbdd3ababfcd16bca4/677d8940ad48e4dec0fb9e4b_Screenshot%202025-01-07%20at%2011.31.06%E2%80%AFAM.webp",
      name: "Michael S",
      amount: "$25,389",
      text: "Joining the Passion Product Formula was the best business decision I could have made.",
      video: "https://pub-cda2548da4a2411a995b49fb5416f4ca.r2.dev/michael's_story%20(720p).mp4",
      poster: "https://cdn.prod.website-files.com/66fefebbdd3ababfcd16bca4/677d8940ad48e4dec0fb9e4b_Screenshot%202025-01-07%20at%2011.31.06%E2%80%AFAM.webp",
      likes: 203,
      comments: 67
    },
    {
      avatar: "https://cdn.prod.website-files.com/66fefebbdd3ababfcd16bca4/677d8940f0e2518b1fc0afc7_thisguy.webp",
      name: "Cory T",
      rating: "9.7/10",
      text: "Probably one of the best courses I've seen for those looking to sell on Amazon",
      video: "https://pub-cda2548da4a2411a995b49fb5416f4ca.r2.dev/cory's_story%20(720p).mp4",
      poster: "https://cdn.prod.website-files.com/66fefebbdd3ababfcd16bca4/677d8940f0e2518b1fc0afc7_thisguy.webp",
      likes: 187,
      comments: 84
    },
    {
      avatar: "https://cdn.prod.website-files.com/66fefebbdd3ababfcd16bca4/677d7519befd324ec14d84be_677d70999ffc3ba242d8ed89_66ff0ab3ac2c8e55c331a54a_Mina-p-500%20copy.webp",
      name: "Mina R",
      amount: "$1.83M",
      text: "Travis is one of the best coaches out there, and the program is undoubtedly worth the price.",
      video: "https://pub-cda2548da4a2411a995b49fb5416f4ca.r2.dev/mina's_story%20(540p).mp4",
      poster: "https://cdn.prod.website-files.com/66fefebbdd3ababfcd16bca4/677d7519befd324ec14d84be_677d70999ffc3ba242d8ed89_66ff0ab3ac2c8e55c331a54a_Mina-p-500%20copy.webp",
      likes: 245,
      comments: 91
    },
    {
      avatar: "https://cdn.prod.website-files.com/66fefebbdd3ababfcd16bca4/677d894063844c7da9e9a54b_Jeremy.webp",
      name: "Jeremy L",
      amount: "$150k",
      text: "I don't think my product would be nearly the success it is today without the help from the Passion Product Formula.",
      video: "https://pub-cda2548da4a2411a995b49fb5416f4ca.r2.dev/jeremy's_story%20(720p).mp4",
      poster: "https://cdn.prod.website-files.com/66fefebbdd3ababfcd16bca4/677d894063844c7da9e9a54b_Jeremy.webp",
      likes: 278,
      comments: 95
    },
    {
      avatar: "https://cdn.prod.website-files.com/66fefebbdd3ababfcd16bca4/677d8940371ae287aa0dfb62_Troy.webp",
      name: "Troy A",
      amount: "$521.6K",
      text: "I don't think I could have done it without Travis & the program. The biggest shortcut to my success.",
      video: "https://pub-cda2548da4a2411a995b49fb5416f4ca.r2.dev/troy's_story%20(720p).mp4",
      poster: "https://cdn.prod.website-files.com/66fefebbdd3ababfcd16bca4/677d8940371ae287aa0dfb62_Troy.webp",
      likes: 312,
      comments: 104
    },
    {
      avatar: "https://cdn.prod.website-files.com/66fefebbdd3ababfcd16bca4/677d8940c3281ee1aaa58b8b_Carla.webp",
      name: "Carla M",
      amount: "$124.5k",
      text: "The $997 I paid for the course saved me so much money I would have lost otherwise... Travis is a A+ coach!",
      video: "https://pub-cda2548da4a2411a995b49fb5416f4ca.r2.dev/carla's_story%20(720p).mp4",
      poster: "https://cdn.prod.website-files.com/66fefebbdd3ababfcd16bca4/677d8940c3281ee1aaa58b8b_Carla.webp",
      likes: 198,
      comments: 73
    },
    {
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
      name: "David P",
      amount: "$245.5k",
      text: "It's an amazing feeling to finally hold my product in my hand... I couldn't have done it without you.",
      video: "https://pub-cda2548da4a2411a995b49fb5416f4ca.r2.dev/david's_story%20(540p).mp4",
      poster: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
      likes: 267,
      comments: 89
    },
    {
      avatar: "https://cdn.prod.website-files.com/66fefebbdd3ababfcd16bca4/677d8940754208aefd65c5a5_Refund.webp",
      name: "Ben K",
      amount: "Refunded",
      text: "I didn't get the chance to get started and Travis gave me a full refund.",
      video: "https://pub-cda2548da4a2411a995b49fb5416f4ca.r2.dev/ben's_story%20(720p).mp4",
      poster: "https://cdn.prod.website-files.com/66fefebbdd3ababfcd16bca4/677d8940754208aefd65c5a5_Refund.webp",
      likes: 156,
      comments: 234
    }
  ];

  return (
    <div className={isLight ? 'bg-gray-50 py-20' : 'bg-[#0A0A0A] py-20'}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy size={32} weight="fill" className={isLight ? 'text-blue-500' : 'text-[#39FF14]'} />
            <h2 className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              PASSION PRODUCT WINS
            </h2>
          </div>
          <h3 className={`text-4xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>
            OUR STUDENTS ARE SUCCEEDING
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className={`${
                isLight 
                  ? 'bg-white shadow-lg border border-gray-100' 
                  : 'bg-[#111111] border border-white/10'
              } rounded-xl overflow-hidden`}
            >
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      {testimonial.name}
                    </h4>
                    <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                      Yesterday at 9:43 PM
                    </p>
                  </div>
                </div>
                <p className={`${isLight ? 'text-gray-600' : 'text-gray-300'} mb-4`}>
                  {testimonial.text}
                </p>
                <div className="mb-4 rounded-lg overflow-hidden">
                  <CustomVideoPlayer
                    src={testimonial.video}
                    poster={testimonial.poster}
                    theme={theme}
                  />
                </div>
                <div className={`flex items-center gap-4 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                  <div className="flex items-center gap-1">
                    <span>👍</span>
                    <span>{testimonial.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>💬</span>
                    <span>{testimonial.comments}</span>
                  </div>
                </div>
              </div>
              <div className={`${
                isLight 
                  ? 'bg-blue-50 border-t border-gray-100' 
                  : 'bg-[#39FF14]/10 border-t border-white/10'
              } p-4`}>
                <div className={`text-2xl font-bold ${
                  isLight ? 'text-blue-600' : 'text-[#39FF14]'
                }`}>
                  {testimonial.rating || testimonial.amount}
                </div>
                <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                  {testimonial.rating ? 'Program Rating' : testimonial.amount === 'Refunded' ? 'Program Status' : 'Total Earnings'}
                </div>
              </div>
            </div>
          ))}
        </div>
        <CTAButton className="mt-16" theme={theme} />
      </div>
    </div>
  );
};